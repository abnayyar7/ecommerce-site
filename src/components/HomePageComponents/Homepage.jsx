import {
  CategoryShowcase,
  FeaturedProduct,
  HeroCarousel,
  Newsletter,
  PromoStrip,
} from "@/components";

const Homepage = () => {
  return (
    <div>
      <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <HeroCarousel />
      </section>
      <PromoStrip />
      <CategoryShowcase />
      <FeaturedProduct />
      <Newsletter />
    </div>
  );
};

export default Homepage;
