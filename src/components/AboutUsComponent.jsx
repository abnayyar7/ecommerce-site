"use client";

import { useEffect } from "react";

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
              Example Store
            </span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Where quality meets comfort. We’re dedicated to crafting clothing
            that blends effortless style, perfect fit, and timeless confidence —
            designed for every day, for everyone.
          </p>
        </section>

        {/* Our Story */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Our Story</h2>
          <p className="text-gray-700 leading-relaxed">
            Founded in 2025, <strong>Example Store</strong> was born out of a
            simple idea — that a great shopping experience should feel as good
            as it looks. We started with a passion for building a clean,
            adaptable storefront that works for any brand.
          </p>
          <p className="text-gray-700 leading-relaxed">
            What began with a few classic pieces has grown into a full
            collection of everyday essentials — from casual jackets to timeless
            shirts — all crafted with premium fabrics and attention to detail.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Today, we continue our journey to redefine wardrobe staples by
            combining contemporary design with sustainable thinking and honest
            craftsmanship.
          </p>
        </section>

        {/* Mission & Values */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Our Mission &amp; Values
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Our mission is simple — to make high-quality, comfortable fashion
            accessible to everyone while keeping sustainability and customer
            satisfaction at our core.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-disc list-inside text-gray-700">
            <li>Premium quality materials</li>
            <li>Timeless, modern design</li>
            <li>Responsible manufacturing</li>
            <li>Affordable everyday wear</li>
            <li>Customer-first approach</li>
            <li>Transparency and trust</li>
          </ul>
        </section>

        {/* Customer Commitment */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Our Promise to You
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We stand behind every product we make. From fabric selection to
            final stitching, each piece goes through a rigorous quality check to
            ensure it meets our standards of comfort and durability.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Enjoy seamless shopping with secure payments, easy returns, and
            responsive support that’s always ready to help.
          </p>
        </section>

        {/* Contact Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Contact Details */}
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Address:</strong> 123 Main Street, Your City, Your
                State, 12345
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:support@example.com"
                  className="text-[var(--color-inverted-text)] underline"
                >
                  support@example.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong> +1 555-555-5555
              </p>
              <p>
                <strong>Business Hours:</strong> Mon–Fri, 10 AM – 6 PM
              </p>
            </div>

            {/* Right: Embedded Google Map */}
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <iframe
                title="Store Location"
                src="https://maps.google.com/maps?q=123+Main+Street,+Your+City,+Your+State&output=embed"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
