// Full-page screenshot: attached to the HTML report (shown per project =
// per breakpoint) and also written to a predictable ./screenshots folder.
const fs = require("fs");
const path = require("path");

async function shot(page, testInfo, name) {
  const buf = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body: buf, contentType: "image/png" });
  const dir = path.join(process.cwd(), "screenshots", testInfo.project.name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.png`), buf);
}

module.exports = { shot };
