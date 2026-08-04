export const categoryMenuList = [
  {
    id: 1,
    title: "Smart Phones",
    src: "/smart phone icon.png",
    href: "/shop/smart-phones",
  },
  {
    id: 2,
    title: "Tablets",
    src: "/tablet icon.png",
    href: "/shop/tablets",
  },
  {
    id: 3,
    title: "Mouses",
    src: "/mouse icon.png",
    href: "/shop/mouses",
  },
  {
    id: 4,
    title: "Cameras",
    src: "/camera icon.png",
    href: "/shop/cameras",
  },
  {
    id: 5,
    title: "Smart Watches",
    src: "/smart watch.png",
    href: "/shop/watches",
  },
  {
    id: 6,
    title: "Laptops",
    src: "/laptop icon.png",
    href: "/shop/laptops",
  },
  {
    id: 7,
    title: "PCs",
    src: "/pc icon.png",
    href: "/shop/computers",
  },
  {
    id: 8,
    title: "Printers",
    src: "/printers icon.png",
    href: "/shop/printers",
  },
  {
    id: 9,
    title: "Earbuds",
    src: "/ear buds icon.png",
    href: "/shop/earbuds",
  },
  {
    id: 10,
    title: "Head Phones",
    src: "/headphone icon.png",
    href: "/shop/headphones",
  },
];

export const isValidNameOrLastname = (input) => {
  // Simple name or lastname regex format check
  const regex = /^[a-zA-Z\s]+$/;
  return regex.test(input);
};

export function isValidEmailAddressFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone) {
  const phoneRegex = /^\d{10}$/; // Adjust if international numbers are needed
  return phoneRegex.test(phone);
}

export const isValidCardNumber = (input) => {
  // Remove all non-digit characters
  const cleanedInput = input.replace(/[^0-9]/g, "");
  // test for credit card number between 13 and 19 characters
  const regex = /^\d{13,19}$/;
  return regex.test(cleanedInput);
};

export const isValidCreditCardExpirationDate = (input) => {
  // simple expiration date format check
  const regex = /^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/;
  return regex.test(input);
};

export const isValidCreditCardCVVOrCVC = (input) => {
  // simple CVV or CVC format check
  const regex = /^[0-9]{3,4}$/;
  return regex.test(input);
};

export const parseDateFromDDMMYYYY = (dateStr) => {
  const [day, month, year] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}`);
};
