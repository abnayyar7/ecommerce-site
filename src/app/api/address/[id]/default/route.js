import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import prisma from "@/lib/prisma";

// Dedicated "Set as default" action, separate from a full address edit.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) {
    return Response.json({ error: "Address not found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.update({ where: { id }, data: { isDefault: true } });
  });

  return Response.json(updated);
}
