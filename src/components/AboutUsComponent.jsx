"use client";

import { useEffect } from "react";
import { BRAND } from "@/config/brand";

export default function AboutUsComponent() {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-8 md:p-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">
            About{" "}
            <span className="text-[var(--color-inverted-text)]">
              {BRAND.name}
            </span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Fine tailoring and honest textiles, crafted for everyday elegance.
            We believe getting dressed well shouldn’t be complicated — just
            considered.
          </p>
        </section>

        {/* Our Story */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Our Story</h2>
          <p className="text-gray-700 leading-relaxed">
            Founded in {BRAND.foundedYear} in Mumbai, <strong>{BRAND.name}</strong>{" "}
            began with a simple conviction — that clothing built from honest
            materials and careful construction outlasts every trend. We set out
            to bring fine tailoring, once reserved for made-to-measure
            ateliers, to everyday wardrobes across India.
          </p>
          <p className="text-gray-700 leading-relaxed">
            What started as a small collection of tailored shirts and
            considered basics has grown into a full range for men, women and
            kids — each piece cut from quality fabric and finished by hand
            where it matters most.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Today, we continue to build {BRAND.name} around the same idea we
            started with: fewer, better things, made to be worn for years, not
            seasons.
          </p>
        </section>

        {/* Mission & Values */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Our Mission &amp; Values
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Our mission is to make fine tailoring and honest textiles
            accessible, without cutting corners on fabric, fit, or craft.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-disc list-inside text-gray-700">
            <li>Premium, responsibly sourced fabrics</li>
            <li>Tailored, timeless silhouettes</li>
            <li>Careful, small-batch construction</li>
            <li>Fair pricing for honest quality</li>
            <li>Customer-first service</li>
            <li>Transparency in how our garments are made</li>
          </ul>
        </section>

        {/* Customer Commitment */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Our Promise to You
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We stand behind every garment we make. From fabric selection to
            final stitching, each piece passes through a rigorous quality
            check before it reaches you.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Enjoy seamless shopping with secure payments, easy returns, and a
            support team based in India that’s always ready to help.
          </p>
        </section>

        {/* Contact Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
          <div className="max-w-xl">
            {/* Contact Details */}
            <div className="space-y-3 text-gray-700">
              <p>
                {/* Area-level only — see Footer/Contact: no street address, no
                    map pin, because the brand is fictional. */}
                <strong>Address:</strong> {BRAND.address.line2},{" "}
                {BRAND.address.state} {BRAND.address.pincode}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href={`mailto:${BRAND.email}`}
                  className="text-[var(--color-inverted-text)] underline"
                >
                  {BRAND.email}
                </a>
              </p>
              <p>
                <strong>Phone:</strong> {BRAND.phone}
              </p>
              <p>
                <strong>Business Hours:</strong> Mon–Fri, 10 AM – 6 PM
              </p>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
