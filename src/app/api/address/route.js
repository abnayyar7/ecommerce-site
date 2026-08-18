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
