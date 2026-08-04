"use client";
import Image from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/images/product_placeholder.jpg";

// Stored paths are relative to /public/images (e.g. "/men/shirts/foo-front.jpg").
const resolve = (path) => (path ? `/images${path}` : PLACEHOLDER);

const PDPProductImages = ({ mainImage, images = [], title = "Product" }) => {
  const [selectedImage, setSelectedImage] = useState(mainImage);

  // mainImage leads the strip so the hero shot stays reachable after the
  // shopper clicks away from it. Deduped in case it is also stored as a
  // ProductImage row.
  const gallery = [
    ...new Set([mainImage, ...images.map((img) => img.url)]),
  ].filter(Boolean);

  return (
    <div className="flex flex-col items-center">
      <Image
        src={resolve(selectedImage)}
        width={500}
        height={500}
        alt={title}
        className="w-full h-auto rounded-lg shadow-lg"
        priority
      />

      {gallery.length > 1 && (
        <div className="flex justify-start mt-5 gap-2 flex-wrap max-[500px]:justify-center">
          {gallery.map((url, idx) => {
            const isSelected = selectedImage === url;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setSelectedImage(url)}
                aria-label={`Show image ${idx + 1} of ${gallery.length}`}
                aria-pressed={isSelected}
                className={`border rounded-lg p-1 cursor-pointer transition-transform transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bg)] ${
                  isSelected ? "border-[var(--color-bg)]" : "border-gray-200"
                }`}
              >
                <Image
                  src={resolve(url)}
                  width={80}
                  height={80}
                  alt=""
                  className="h-20 w-auto rounded-md"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PDPProductImages;
