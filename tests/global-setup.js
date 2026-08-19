// Pre-run purge: clear any *@example.invalid orphans left by a prior crashed
// run, then snapshot whole-table counts as the net-zero baseline.
require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const { purgeTestData, snapshotCounts } = require("./helpers/db");

module.exports = async () => {
  const removed = await purgeTestData();
  const baseline = await snapshotCounts();
  fs.writeFileSync(
    path.join(__dirname, ".baseline.json"),
    JSON.stringify(baseline)
  );
  console.log(
    `\n[global-setup] pre-run purge removed ${removed.users} test user(s). ` +
      `Baseline — users:${baseline.users} orders:${baseline.orders} addresses:${baseline.addresses}\n`
  );
};
