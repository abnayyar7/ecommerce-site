import Link from "next/link";
import Image from "next/image";

// Borderless editorial showcase. Desktop is a 12-column asymmetric grid:
// Men (hero, 5 cols) and Women (4 cols) run full height, while the right-most
// 3-col column is split horizontally — Kids on top, Footwear on the bottom.
// Tablet collapses to an even 2x2 grid; mobile becomes a horizontal snap-scroll.
// Each image is scaled slightly (scale-[1.04] origin-top) and clipped by the
// card's overflow-hidden, which pushes the bottom-right watermark off-screen
// without cropping the source files. Labels live in a caption strip beneath the
// image, so the photography itself stays clean and unobstructed.
const categories = [
  {
    name: "Men",
    num: "01",
    href: "/men",
    src: "/images/categories/category-men.jpg",
    object: "object-top",
    // Slight top-anchored zoom, clipped by overflow, drops the corner watermark.
    crop: "origin-top scale-[1.10] md:scale-[1.04] group-hover:scale-[1.13] md:group-hover:scale-[1.07]",
    area: "lg:col-start-1 lg:row-start-1 lg:col-span-5 lg:row-span-2",
    sizes: "(min-width:1024px) 42vw, (min-width:768px) 50vw, 82vw",
  },
  {
    name: "Women",
    num: "02",
    href: "/women",
    src: "/images/categories/category-women.jpg",
    object: "object-top",
    crop: "origin-top scale-[1.10] md:scale-[1.04] group-hover:scale-[1.13] md:group-hover:scale-[1.07]",
    area: "lg:col-start-6 lg:row-start-1 lg:col-span-4 lg:row-span-2",
    sizes: "(min-width:1024px) 34vw, (min-width:768px) 50vw, 82vw",
  },
  {
    name: "Kids",
    num: "03",
    href: "/kids",
    src: "/images/categories/category-kids.jpg",
    object: "object-top",
    crop: "origin-top scale-[1.10] md:scale-[1.04] group-hover:scale-[1.13] md:group-hover:scale-[1.07]",
    area: "lg:col-start-10 lg:row-start-1 lg:col-span-3 lg:row-span-1",
    sizes: "(min-width:1024px) 25vw, (min-width:768px) 50vw, 82vw",
  },
  {
    name: "Footwear",
    num: "04",
    // Shoes sit low in the frame, so anchor to the bottom edge. object-bottom
    // re-pins the image bottom, so a top-only zoom can't reach the bottom-right
    // watermark; a stronger top-left-anchored zoom clips it off the right/bottom
    // while the (centred, higher) shoes stay fully in frame.
    href: "/footwear",
    src: "/images/categories/category-footwear.jpg",
    object: "object-bottom",
    crop: "origin-top-left scale-[1.13] group-hover:scale-[1.16]",
    area: "lg:col-start-10 lg:row-start-2 lg:col-span-3 lg:row-span-1",
    sizes: "(min-width:1024px) 25vw, (min-width:768px) 50vw, 82vw",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="w-full max-w-7xl mx-auto my-10 md:my-14 px-4 md:px-0">
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory
          [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          md:grid md:grid-cols-2 md:overflow-visible
          lg:grid-cols-12 lg:grid-rows-2 lg:h-[560px]"
      >
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            aria-label={cat.name}
            className={`group flex flex-col
              w-[82vw] flex-shrink-0 snap-start
              md:w-auto
              lg:h-full ${cat.area}`}
          >
            {/* Image area — scaled + clipped to crop the corner watermark. */}
            <div className="relative overflow-hidden h-[420px] md:h-[380px] lg:h-auto lg:flex-1 lg:min-h-0">
              <Image
                src={cat.src}
                alt={cat.name}
                fill
                sizes={cat.sizes}
                className={`object-cover ${cat.object} ${cat.crop} transition-transform duration-[600ms] ease-in-out`}
              />
            </div>

            {/* Caption strip below the image — catalog numeral + category name. */}
            <div className="bg-[#F4F1EB] border-t border-black/[0.08] py-3 px-1">
              <span className="block whitespace-pre text-xs font-light uppercase tracking-[0.2em] text-[#1A1A1A]">
                {`${cat.num}  ${cat.name}`}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
