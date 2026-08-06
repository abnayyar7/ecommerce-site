import { BRAND } from "@/config/brand";

/**
 * COD order-confirmation email.
 *
 * Field selection mirrors OrderConfirmation.jsx, but the markup is
 * inline-styled tables — email clients do not support Tailwind or <style>
 * blocks reliably.
 *
 * Copy deliberately promises only what exists: the order is placed and will be
 * paid on delivery. There is no tracking number and no payment-confirmation
 * email in this system, so neither is mentioned.
 */

const TEAL = "#24747C";
const INK = "#1a3c40";
const PAPER = "#f8faf7";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

export function shortOrderId(id) {
  return id ? id.slice(0, 8).toUpperCase() : "";
}

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// Email HTML is assembled from database values, so anything interpolated is
// escaped — a product title or address line containing < or & must not be able
// to break the markup.
const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function itemRows(products = []) {
  return products
    .map((item) => {
      const size = [item.selectedSize, item.sizeMetric].filter(Boolean).join(" ");
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${LINE};font-family:sans-serif;color:${INK};">
            <div style="font-size:15px;font-weight:600;">${esc(item.title)}</div>
            <div style="font-size:13px;color:${MUTED};padding-top:3px;">
              ${size ? `Size: ${esc(size)} &nbsp;·&nbsp; ` : ""}Qty: ${esc(item.quantity)}
            </div>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid ${LINE};font-family:sans-serif;color:${INK};font-size:15px;font-weight:600;white-space:nowrap;">
            ${money(item.price * item.quantity)}
          </td>
        </tr>`;
    })
    .join("");
}

function totalRow(label, value, { bold = false } = {}) {
  return `
    <tr>
      <td style="padding:4px 0;font-family:sans-serif;font-size:${bold ? "16px" : "14px"};color:${bold ? INK : MUTED};font-weight:${bold ? "700" : "400"};">${esc(label)}</td>
      <td align="right" style="padding:4px 0;font-family:sans-serif;font-size:${bold ? "16px" : "14px"};color:${bold ? INK : MUTED};font-weight:${bold ? "700" : "400"};white-space:nowrap;">${value}</td>
    </tr>`;
}

export function buildCodOrderEmail(order) {
  const siteUrl = process.env.NEXT_BASE_URL_FULL || BRAND.siteUrl;
  const ref = shortOrderId(order.id);
  const addr = order.address || {};
  const total = order.finalAmount ?? order.amount;

  const orderDate = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const subject = `Your ${BRAND.name} order is confirmed — #${ref}`;

  const html = `<!DOCTYPE html>
<html>
  <body style="background:${PAPER};margin:0;padding:0;">
    <table cellpadding="0" cellspacing="0" width="100%" style="background:${PAPER};margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;box-shadow:0 4px 24px 0 #e9f5e0;padding:32px 24px;">

            <tr>
              <td align="center" style="padding-bottom:18px;">
                <a href="${siteUrl}" target="_blank">
                  <img src="${siteUrl}/logo-header.png" alt="${esc(BRAND.name)}" style="width:119px;height:84px;display:block;border:0;">
                </a>
              </td>
            </tr>

            <tr>
              <td align="center" style="font-family:sans-serif;color:${INK};padding-bottom:6px;">
                <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:.5px;">Order Received</h1>
                <p style="margin:10px 0 0 0;font-size:15px;color:#3e5335;">
                  Thanks for shopping with <span style="color:${TEAL};font-weight:700;">${esc(BRAND.name)}</span>. We're preparing your order now.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:18px 0 6px 0;">
                <div style="display:inline-block;background:${TEAL};color:#ffffff;padding:10px 26px;font-size:16px;letter-spacing:1.5px;font-weight:700;border-radius:32px;">
                  #${esc(ref)}
                </div>
                <div style="font-family:sans-serif;font-size:13px;color:${MUTED};padding-top:10px;">
                  Placed on ${esc(orderDate)}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding-top:24px;">
                <div style="font-family:sans-serif;font-size:13px;font-weight:700;color:${INK};text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Items</div>
                <table cellpadding="0" cellspacing="0" width="100%">${itemRows(order.products)}</table>
              </td>
            </tr>

            <tr>
              <td style="padding-top:16px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  ${order.originalAmount ? totalRow("Subtotal", money(order.originalAmount)) : ""}
                  ${order.discountAmount ? totalRow(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, `− ${money(order.discountAmount)}`) : ""}
                  ${totalRow("Shipping", order.shippingAmount ? money(order.shippingAmount) : "Free")}
                  <tr><td colspan="2" style="border-top:1px solid ${LINE};padding-top:8px;"></td></tr>
                  ${totalRow("Total", money(total), { bold: true })}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding-top:26px;">
                <div style="font-family:sans-serif;font-size:13px;font-weight:700;color:${INK};text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Delivering to</div>
                <div style="font-family:sans-serif;font-size:14px;color:#3e5335;line-height:1.6;">
                  <strong style="color:${INK};">${esc(addr.name)}</strong><br>
                  ${esc(addr.address1)}${addr.address2 ? `,<br>${esc(addr.address2)}` : ""}<br>
                  ${esc(addr.city)}, ${esc(addr.state)} — ${esc(addr.pincode)}<br>
                  ${esc(addr.country)}
                  ${addr.landmark ? `<br><span style="color:${MUTED};">Landmark: ${esc(addr.landmark)}</span>` : ""}
                  ${order.phone ? `<br><span style="color:${MUTED};">Phone: ${esc(order.phone)}</span>` : ""}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding-top:26px;">
                <div style="font-family:sans-serif;font-size:13px;font-weight:700;color:${INK};text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Payment</div>
                <div style="font-family:sans-serif;font-size:14px;color:#3e5335;line-height:1.6;">
                  Cash on Delivery — please keep <strong style="color:${INK};">${money(total)}</strong> ready when your order arrives.
                </div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-top:28px;">
                <a href="${siteUrl}/order-status/${encodeURIComponent(order.id)}" style="color:#ffffff;background:${INK};padding:12px 30px;border-radius:24px;text-decoration:none;font-family:sans-serif;font-weight:600;display:inline-block;font-size:15px;">
                  View your order
                </a>
              </td>
            </tr>

            <tr>
              <td align="center" style="font-family:sans-serif;font-size:12px;color:#999999;padding-top:24px;">
                <hr style="border:0;border-top:1px solid ${LINE};margin-bottom:10px;">
                Questions? Reply to this email or contact us at ${esc(BRAND.email)}.<br>
                &copy; ${BRAND.name} ${new Date().getFullYear()}
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
