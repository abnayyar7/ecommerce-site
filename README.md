# Velaura — Fine Tailoring & Textiles

A fashion e-commerce storefront built for the Indian market with a cash-on-delivery checkout.

**Live:** [velauraecom.vercel.app](https://velauraecom.vercel.app)

---

## The build story

This project didn't start clean. It started as a working-but-rough e-commerce
template that scored **52/100** in a self-audit — the kind of codebase that
demos fine and falls apart under inspection. The interesting part of this
repository isn't the finished storefront; it's the paper trail of closing that
gap, one verified change at a time, across 45 focused commits.

The audit surfaced the usual things a rushed build hides. The identity was
placeholder — a cropped logo, a fictional competitor's brand name still in the
nav, eight Lorem-ipsum products. Checkout looked complete but wasn't: a
prominent "Pay Now" button was wired to a no-op, the cart's primary and
secondary actions were styled backwards, and the order-confirmation page showed
customers a raw database enum (`cod_pending`) instead of "Order Placed." A
coupon entered in lowercase showed a discount at the cart and then silently
charged full price at checkout. There was no SEO metadata on any product or
category page, and the sitemap advertised routes that 404'd. Underneath it all
sat a layer of dead code — half-finished components, duplicate checkout
implementations, unused dependencies, orphaned config.

It was closed out in deliberate passes rather than one sweep:

- **Branding and content** — real brand config, a repaired logo across header,
  footer and email, and a 66-product catalog spanning all four categories and
  every subcategory, seeded so existing cart and order rows stayed valid.
- **Features and correctness** — the coupon case-sensitivity bug and usage
  limits, cart state unified to one source of truth, COD-aware messaging that
  never leaks an enum, and a transactional address/order write.
- **SEO** — per-page metadata with Open Graph and Twitter tags, canonical URLs,
  and a sitemap trimmed to only indexable pages (including a special-cased
  `/footwear` view that wasn't a real category row).
- **Honesty in copy** — legal pages were rewritten to promise only what the
  demo actually does: no fake tracking numbers, no refund mechanism that
  doesn't exist, free shipping stated consistently across banner, policy and
  checkout.
- **Dead code and repo hygiene** — roughly a dozen `chore` commits removing
  unreferenced components, unused exports, an unreachable invoice generator, and
  vulnerable transitive dependencies, each verified to touch nothing live.
- **Cosmetic polish** — gradients flattened, marketplace-yellow badges toned
  down, exclamation-mark and emoji copy removed, to match a premium brand.

Every change was scoped to one concern, verified, and committed on its own. The
commit log reads as the audit being paid down in public.

---

## Screenshots

> Placeholders — real images are supplied separately.

![Homepage](./docs/screenshots/homepage.png)

![Product detail](./docs/screenshots/product-detail.png)

![Checkout](./docs/screenshots/checkout.png)

---

## Stack

- **Next.js 15** (App Router) + **React 19** — server components for data-bound
  pages, client components only where the UI is interactive.
- **Prisma 6** over **Neon (serverless Postgres)** — Neon's connection pooling
  suits a serverless deployment where each function invocation may open its own
  connection.
- **NextAuth** — credentials-based auth with JWT sessions.
- **Zustand** for cart state — the cart is a small, self-contained store shared
  across header, mini-cart and the cart page; it didn't warrant Redux's
  boilerplate.
- **Tailwind CSS 4** with a small set of brand tokens.
- Deployed on **Vercel**, with Web Analytics wired in.

---

## Notable engineering decisions

**Verify-then-commit on hydrated pages.** Most of the storefront hydrates its
data client-side, so a passing build proves almost nothing about what a user
actually sees. Changes to those pages were verified by driving a real headless
Chrome session — logging in, placing orders, reading the rendered DOM — before
each commit, not on build success alone. Several bugs (a raw enum on the
confirmation page, an inverted CTA hierarchy) were only visible that way.

**Transactional invariants.** Order creation, coupon usage, and address
defaults are written in a single database transaction. A user with at least one
saved address always has exactly one default — the demotion of other defaults
happens atomically with the order write, so a failed order can never leave the
account in a two-default or zero-default state. Coupon usage is keyed on
`(couponId, orderId)` so retrying an order is idempotent and can't double-count.

**Non-blocking side effects.** The COD confirmation email used to be awaited on
the response path, adding 5–7s of SMTP before the customer saw anything. Moving
it to Vercel's `waitUntil` — so the platform keeps the send alive after the
response returns — took a warm order-placement round trip from **8569ms to
2390ms (~72% faster)**. The send is best-effort and bounded by a timeout;
verified against a dead SMTP host, the order still completes and returns 200.

**Removing the app's calls to itself.** The product page fetched its own API
over HTTP to render — an internal round trip, plus a hardcoded `http://` base
URL that would break behind TLS. It now queries the database directly through a
`React.cache`-wrapped helper shared between metadata generation and the page
body, so a product render costs one query instead of two HTTP hops.

---

## Known scope and what's next

This is a live portfolio piece, not a claim of "finished" — the honest state:

- **Payments:** cash-on-delivery only. A real gateway is the next major piece.
- **Product imagery:** 9 of 66 products have real photography; the rest share
  placeholders, pending a decision on category art direction.
- **Profile:** saved-address *selection* at checkout just landed; full address
  management (add/edit/delete from a profile page) is not built yet.
- **Known debt:** no linter is configured; the checkout page has some duplicate
  data fetches on load; a few files still use a raw Tailwind blue awaiting a
  palette decision. These are tracked, not forgotten.
- **Add-to-cart before hydration:** an "Add to cart" (or wishlist / coupon) click
  that lands before the page finishes hydrating can silently no-op — no request,
  no confirmation, no error prompting a retry. A quick click on a freshly loaded
  product page can do nothing. The e2e suite works around it; the app-side fix
  (disable the control until interactive, or queue the intent) is a post-release
  reliability item.
