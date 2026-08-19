// Programmatic NextAuth credentials login. Uses the browser context's own
// request client so the session cookies land in that context — pages opened
// from it are then authenticated, with the project's viewport applied.
const { PASSWORD } = require("./db");

async function loginViaApi(context, email, password = PASSWORD) {
  const base = process.env.BASE_URL || "http://localhost:3000";
  const csrf = await (await context.request.get(`${base}/api/auth/csrf`)).json();
  await context.request.post(`${base}/api/auth/callback/credentials`, {
    form: { csrfToken: csrf.csrfToken, email, password, json: "true" },
  });
  const session = await (await context.request.get(`${base}/api/auth/session`)).json();
  if (!session?.user?.id) throw new Error(`login failed for ${email}`);
  return session.user.id;
}

module.exports = { loginViaApi };
