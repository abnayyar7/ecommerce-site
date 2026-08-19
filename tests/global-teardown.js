// Post-run purge + net-zero verification against the baseline captured in setup.
require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const { purgeTestData, snapshotCounts } = require("./helpers/db");

module.exports = async () => {
  const removed = await purgeTestData();
  const after = await snapshotCounts();
  let baseline = null;
  try {
    baseline = JSON.parse(fs.readFileSync(path.join(__dirname, ".baseline.json"), "utf8"));
  } catch {}

  console.log(`\n[global-teardown] post-run purge removed ${removed.users} test user(s), ${removed.orders} order(s), ${removed.addresses} address(es).`);
  if (baseline) {
    const netZero =
      baseline.users === after.users &&
      baseline.orders === after.orders &&
      baseline.addresses === after.addresses;
    console.log(`[global-teardown] before -> after`);
    console.log(`    users     : ${baseline.users} -> ${after.users}`);
    console.log(`    orders    : ${baseline.orders} -> ${after.orders}`);
    console.log(`    addresses : ${baseline.addresses} -> ${after.addresses}`);
    console.log(`[global-teardown] NET-ZERO: ${netZero ? "YES" : "NO — investigate"}\n`);
  }
};
