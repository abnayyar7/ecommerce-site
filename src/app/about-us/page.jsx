// app/about-us/page.jsx
import { AboutUsComponent } from "@/components";
import { BRAND } from "@/config/brand";

export const metadata = {
  title: `About Us | ${BRAND.name}`,
  description: `Learn about ${BRAND.name}, ${BRAND.tagline.toLowerCase()} for the modern wardrobe.`,
};

export default function AboutUsPage() {
  return <AboutUsComponent />;
}
