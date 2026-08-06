// app/api/cod/create/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
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

        // Verify the order belongs to this user and exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
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

        // Order confirmation email — BEST EFFORT.
        //
        // Everything below this point must not be able to fail the order. The
        // order and its payment record are already committed; an SMTP outage
        // is not a reason to tell the customer their order failed, or to have
        // them retry and place it twice. Failures are logged and swallowed.
        try {
            const fullOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { products: true, address: true, payment: true },
            });

            if (fullOrder?.email) {
                const { subject, html } = buildCodOrderEmail(fullOrder);
                await sendMail({ to: fullOrder.email, subject, html });
            } else {
                console.error(
                    `COD confirmation email skipped for ${orderId}: no email on order`
                );
            }
        } catch (mailErr) {
            console.error(
                `COD confirmation email failed for ${orderId}:`,
                mailErr?.message || mailErr
            );
        }

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
