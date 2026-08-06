import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import { Newsletter } from "@/components";
import { getCategoriesCached } from "@/helper/Catalog";
import { BRAND } from "@/config/brand";

export default async function SiteFooter() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;
  const [categories] = await Promise.all([getCategoriesCached()]);
  return (
    <footer className="bg-[var(--color-bg)] text-white pt-12 pb-4 px-4 md:px-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-10 md:gap-0 items-center md:items-start text-center md:text-left">
        {/* Velaura brand & brief */}
        <div className="mb-8 md:mb-0 flex-1 min-w-[230px] flex flex-col items-center text-center mx-auto md:items-start md:text-left md:mx-0">
          <Link href="/" className="flex items-center mb-4">
            <Image
              src="/logo-inverted.png"
              alt={BRAND.name}
              width={413}
              height={289}
              className="h-16 w-auto"
            />
          </Link>
          <p className="text-white/80 mb-2 max-w-[300px]">{BRAND.description}</p>
          <div className="flex flex-col gap-1 text-white/70 text-sm mt-3 md:items-start items-center">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> {BRAND.email}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" />{" "}
              <p>
                <a href={BRAND.phoneHref}>{BRAND.phone}</a>
              </p>
            </span>
            {/* Area-level and unlinked: a street address on a demo brand would
                pin a real building that has nothing to do with it. */}
            <address className="flex items-center gap-2 not-italic text-center md:text-left">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {BRAND.address.line2}, {BRAND.address.state}{" "}
              {BRAND.address.pincode}
            </address>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 md:mb-0 flex-1 min-w-[150px]">
          <h3 className="font-semibold text-lg mb-3 text-white">Categories</h3>
          <ul className="space-y-2 text-white/80">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/${cat.slug}`} className="hover:underline">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Useful Links */}
        <div className="mb-8 md:mb-0 flex-1 min-w-[150px]">
          <h3 className="font-semibold text-lg mb-3 text-white">
            Useful Links
          </h3>
          <ul className="space-y-2 text-white/80">
            <li>
              <Link href="/cart" className="hover:underline">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/terms-and-conditions" className="hover:underline">
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/shipping-delivery-policy"
                className="hover:underline"
              >
                Shipping and Delivery Policy
              </Link>
            </li>
            <li>
              <Link href="/return-and-refund" className="hover:underline">
                Return and Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/about-us" className="hover:underline">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact-us" className="hover:underline">
                Contact Us
              </Link>
            </li>
            {isLoggedIn && (
              <>
                <li>
                  <Link href="/wishlist" className="hover:underline">
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:underline">
                    My Account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <Newsletter isFooter={true} />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/20 mt-10 pt-5 text-center text-white/70 text-sm tracking-wide">
        &copy; {new Date().getFullYear()} {BRAND.legalName}. All rights
        reserved.
      </div>
    </footer>
  );
}
