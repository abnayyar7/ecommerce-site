import { Footer, HeaderServer } from "@/components";
import "./globals.css";
import AuthProvider from "@/provider/SessionProvider";
import { getServerSession } from "next-auth";
import Providers from "@/provider/Providers";
import CartHydrator from "@/provider/CartHydrator";
import "keen-slider/keen-slider.min.css";

export const metadata = {
  metadataBase: new URL("https://example.com/"),
  title: {
    default: "Example Store — Modern E-commerce Boilerplate",
    template: "%s | Example Store",
  },
  description:
    "Launch a modern, customizable online storefront with this e-commerce boilerplate.",
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://example.com/",
    siteName: "Example Store",
    title: "Example Store — Modern E-commerce Boilerplate",
    description:
      "A clean starter template for online shops, ready for your own branding.",
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
      </body>
    </html>
  );
}
