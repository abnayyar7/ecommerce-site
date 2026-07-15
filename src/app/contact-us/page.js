import ContactUsComponent from "@/components/ContactUsComponent";
import { BRAND } from "@/config/brand";

export const metadata = {
  title: `Contact Us - ${BRAND.name}`,
  description:
    "Reach out to our team for support, questions, or sales inquiries.",
  keywords: `contact, customer support, ${BRAND.name.toLowerCase()}, ecommerce`,
};

export default function ContactUsPage() {
  return <ContactUsComponent />;
}
