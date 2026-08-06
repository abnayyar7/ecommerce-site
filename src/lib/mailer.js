import nodemailer from "nodemailer";

/**
 * Shared SMTP sender.
 *
 * The transporter is built lazily on first send rather than at module load.
 * A module-scoped createTransport() means a missing or malformed EMAIL_* var
 * throws at *import* time, which would take down any route that imports this
 * file — including routes whose main job has nothing to do with email.
 */
let transporter = null;

const REQUIRED_VARS = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS"];

// Hard ceiling on how long a send may hold up its caller. Nodemailer's own
// timeouts cover connect/greeting/socket, but not DNS — an unresolvable host
// stalled a COD order response for 9.4s in testing, so this bounds every
// failure mode.
//
// Sized against real SMTP, not optimism: Gmail's handshake + auth + send runs
// 3-6s for these templates, and a 5s ceiling failed legitimate newsletter
// sends. 15s clears real traffic while still capping a dead host.
const SEND_TIMEOUT_MS = 15000;

function getTransporter() {
  if (transporter) return transporter;

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Mail is not configured — missing ${missing.join(", ")}`);
  }

  const port = Number(process.env.EMAIL_PORT);

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: SEND_TIMEOUT_MS,
    greetingTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS,
  });

  return transporter;
}

/**
 * Sends an email. Throws on failure — callers decide whether that matters.
 *
 * Anything on a critical path (order creation) must wrap this in try/catch and
 * carry on; delivery is best-effort and must never take the operation down.
 */
export async function sendMail({ to, subject, html }) {
  if (!to) throw new Error("sendMail: `to` is required");

  const send = getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  // Covers DNS stalls, which nodemailer's transport timeouts do not.
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`sendMail timed out after ${SEND_TIMEOUT_MS}ms`)),
      SEND_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([send, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
