import { Footer, HeaderServer } from "@/components";
import "./globals.css";
import AuthProvider from "@/provider/SessionProvider";
import { getServerSession } from "next-auth";
import Providers from "@/provider/Providers";
import CartHydrator from "@/provider/CartHydrator";
import { BRAND } from "@/config/brand";
import { Analytics } from "@vercel/analytics/next";
import "keen-slider/keen-slider.min.css";

export const metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: BRAND.siteUrl,
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
};

export default async function RootLayout({ children }) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <AuthProvider session={session}>
          <HeaderServer />
          <CartHydrator>
            <Providers>
              <main>{children}</main>
            </Providers>
          </CartHydrator>
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
