// app/api/cod/create/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import { waitUntil } from "@vercel/functions";
import { sendMail } from "@/lib/mailer";
import { buildCodOrderEmail } from "@/lib/orderEmail";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        // Verify the order belongs to this user and exists. The include covers
        // the confirmation email's payload too, so the route reads the order
        // once rather than fetching it again after the writes below.
        //
        // This snapshot predates the status/paymentMethod update further down,
        // which is fine: the email template reads items, address, totals and
        // contact details, and states COD from the route it fires in — it never
        // reads order.status or order.paymentMethod.
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { products: true, address: true },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Create / upsert Payment record for COD
        const payment = await prisma.payment.upsert({
            where: { orderId },
            update: {
                method: "COD",
                status: "pending",
                amount: order.finalAmount ?? order.amount,
            },
            create: {
                orderId,
                method: "COD",
                status: "pending",
                amount: order.finalAmount ?? order.amount,
            },
        });

        // Update order: mark as cod_pending and link payment + method
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "cod_pending",
                paymentMethod: "COD",
                paymentId: payment.id,
            },
        });

        // Log a payment attempt for audit trail
        await prisma.paymentAttempt.create({
            data: {
                paymentId: payment.id,
                direction: "internal",
                endpoint: "cod-confirm",
                statusCode: 200,
                request: { orderId },
                response: { status: "cod_pending" },
                note: "COD order confirmed",
            },
        });

        // Order confirmation email — BEST EFFORT, OFF THE RESPONSE PATH.
        //
        // waitUntil hands the send to the platform so the customer gets their
        // confirmation immediately instead of waiting on SMTP, which runs 5-7s
        // against Gmail. Plain fire-and-forget would risk the function being
        // frozen before the send completes; waitUntil keeps it alive.
        //
        // The try/catch still matters: the order and payment are already
        // committed, so an SMTP outage must never surface as a failed order or
        // prompt a customer to place it twice.
        waitUntil(
            (async () => {
                try {
                    if (!order.email) {
                        console.error(
                            `COD confirmation email skipped for ${orderId}: no email on order`
                        );
                        return;
                    }
                    const { subject, html } = buildCodOrderEmail(order);
                    await sendMail({ to: order.email, subject, html });
                } catch (mailErr) {
                    console.error(
                        `COD confirmation email failed for ${orderId}:`,
                        mailErr?.message || mailErr
                    );
                }
            })()
        );

        return NextResponse.json({
            success: true,
            orderId,
            paymentId: payment.id,
            status: "cod_pending",
        });
    } catch (err) {
        console.error("COD CREATE ERROR:", err);
        return NextResponse.json({ error: "internal" }, { status: 500 });
    }
}
