import { HomepageClient } from "@/components";

export const metadata = {
  title: "Home | Example Store",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <HomepageClient />;
}
