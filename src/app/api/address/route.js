import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import prisma from "@/lib/prisma";

// Read-only: the logged-in user's saved addresses, default first.
// Used by the checkout address step to offer a saved-address selector.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      address1: true,
      address2: true,
      city: true,
      state: true,
      pincode: true,
      country: true,
      landmark: true,
      label: true,
      isDefault: true,
    },
  });

  return Response.json(addresses);
}

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

// Shape the persisted columns; optional fields normalise to null.
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

// Create a new address for the logged-in user.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const body = await req.json();

  const fieldErrors = validateAddress(body);
  if (Object.keys(fieldErrors).length) {
    return Response.json(
      { error: "Missing required fields", fieldErrors },
      { status: 400 },
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.address.count({ where: { userId } });
    // First address is always the default; otherwise honour the flag.
    const isDefault = existingCount === 0 ? true : !!body.isDefault;
    if (isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: { ...addressData(body), userId, isDefault },
    });
  });

  return Response.json(created, { status: 201 });
}
