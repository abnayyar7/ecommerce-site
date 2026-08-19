// Test-data helpers. All test users use the *@example.invalid pattern so the
// purge can find and remove everything they created via FK-linked rows.
require("dotenv").config({ quiet: true });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = global.__testPrisma || new PrismaClient();
if (!global.__testPrisma) global.__testPrisma = prisma;

const TEST_DOMAIN = "@example.invalid";
const PASSWORD = "TestPassw0rd!";

function uniqueTestEmail(prefix = "pw") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}${TEST_DOMAIN}`;
}

// Remove one user and every row FK-linked to it, in dependency-safe order.
async function deleteUserCascade(userId) {
  const orders = await prisma.order.findMany({
    where: { userId },
    select: { id: true },
  });
  for (const o of orders) {
    await prisma.paymentAttempt.deleteMany({ where: { payment: { orderId: o.id } } });
    await prisma.payment.deleteMany({ where: { orderId: o.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
  }
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.couponUsage.deleteMany({ where: { userId } });
  const carts = await prisma.cart.findMany({ where: { userId }, select: { id: true } });
  for (const c of carts) await prisma.cartItem.deleteMany({ where: { cartId: c.id } });
  await prisma.cart.deleteMany({ where: { userId } });
  await prisma.wishlist.deleteMany({ where: { userId } });
  await prisma.address.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

// Purge ALL *@example.invalid users and their data. Idempotent — safe to run
// before a run (clears orphans from a prior crash) and after (clears this run).
async function purgeTestData() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: TEST_DOMAIN } },
    select: { id: true },
  });
  let ordersRemoved = 0;
  let addressesRemoved = 0;
  for (const u of users) {
    ordersRemoved += await prisma.order.count({ where: { userId: u.id } });
    addressesRemoved += await prisma.address.count({ where: { userId: u.id } });
    await deleteUserCascade(u.id);
  }
  return { users: users.length, orders: ordersRemoved, addresses: addressesRemoved };
}

// Whole-table counts, for the net-zero before/after report.
async function snapshotCounts() {
  const [users, orders, addresses] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.address.count(),
  ]);
  return { users, orders, addresses };
}

// Create a test user, optionally with an active cart of N items and/or addresses.
async function createTestUser({ email, cartItems = 0, addresses = [] } = {}) {
  const mail = email || uniqueTestEmail();
  const user = await prisma.user.create({
    data: {
      name: "PW Test",
      email: mail,
      password: await bcrypt.hash(PASSWORD, 10),
      phone: "9876543210",
    },
  });

  if (cartItems > 0) {
    const products = await prisma.product.findMany({ take: cartItems });
    const cart = await prisma.cart.create({ data: { userId: user.id, status: "active" } });
    for (const p of products) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: p.id,
          quantity: 1,
          selectedSize: p.defaultSize || "",
          unitPriceSnapshot: p.price,
        },
      });
    }
  }

  for (const a of addresses) {
    await prisma.address.create({
      data: {
        userId: user.id,
        name: "PW Test",
        phone: "9876543210",
        address1: a.address1,
        city: a.city || "Mumbai",
        state: a.state || "Maharashtra",
        pincode: a.pincode || "400050",
        country: "India",
        label: a.label || "HOME",
        isDefault: !!a.isDefault,
      },
    });
  }

  return { id: user.id, email: mail };
}

module.exports = {
  prisma,
  PASSWORD,
  TEST_DOMAIN,
  uniqueTestEmail,
  createTestUser,
  purgeTestData,
  snapshotCounts,
};
