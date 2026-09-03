import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import prisma from "@/lib/prisma";

const REQUIRED = ["name", "phone", "address1", "city", "state", "pincode", "country"];

function validateAddress(body) {
  const fieldErrors = {};
  for (const key of REQUIRED) {
    if (!body?.[key] || !String(body[key]).trim()) {
      fieldErrors[key] = `${key} is required`;
    }
  }
  return fieldErrors;
}

function addressData(body) {
  return {
    name: body.name,
    phone: body.phone,
    address1: body.address1,
    address2: body.address2 || null,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
    country: body.country || "India",
    landmark: body.landmark || null,
    label: body.label || null,
  };
}

// Resolve the session user and confirm the address belongs to them.
async function requireOwned(id) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  const userId = session.user.id;
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) {
    // 404 whether it doesn't exist or belongs to another user — don't leak.
    return {
      error: Response.json({ error: "Address not found" }, { status: 404 }),
    };
  }
  return { userId, address };
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const { error, userId, address } = await requireOwned(id);
  if (error) return error;

  const body = await req.json();
  const fieldErrors = validateAddress(body);
  if (Object.keys(fieldErrors).length) {
    return Response.json(
      { error: "Missing required fields", fieldErrors },
      { status: 400 },
    );
  }

  // Turning off the default is only allowed if another default remains.
  if (body.isDefault === false && address.isDefault) {
    const otherDefaults = await prisma.address.count({
      where: { userId, isDefault: true, NOT: { id } },
    });
    if (otherDefaults === 0) {
      return Response.json(
        { error: "You must have at least one default address." },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (body.isDefault === true) {
      await tx.address.updateMany({
        where: { userId, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id },
      data: {
        ...addressData(body),
        ...(body.isDefault !== undefined ? { isDefault: !!body.isDefault } : {}),
      },
    });
  });

  return Response.json(updated);
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const { error, userId, address } = await requireOwned(id);
  if (error) return error;

  // Option B: never delete an address referenced by an order.
  const linkedOrders = await prisma.order.count({ where: { addressId: id } });
  if (linkedOrders > 0) {
    return Response.json(
      { error: "This address is linked to an existing order and cannot be deleted." },
      { status: 409 },
    );
  }

  // The sole address may only be removed if the user has no order history at all.
  const totalAddresses = await prisma.address.count({ where: { userId } });
  if (totalAddresses === 1) {
    const userOrders = await prisma.order.count({ where: { userId } });
    if (userOrders > 0) {
      return Response.json(
        { error: "You must have at least one saved address." },
        { status: 400 },
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    // A user must always have a default — promote the newest remaining address.
    if (address.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  });

  return Response.json({ success: true });
}
