import { HomepageClient } from "@/components";
import { BRAND } from "@/config/brand";

export const metadata = {
  title: `Home | ${BRAND.name}`,
  alternates: { canonical: "/" },
};

export default function Home() {
  return <HomepageClient />;
}
