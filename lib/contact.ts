// Developer contact details shown in the footer.
// Set these in Vercel (Project → Settings → Environment Variables) or in .env.local:
//   NEXT_PUBLIC_CONTACT_WHATSAPP  — phone in international format, digits only (e.g. 77011234567)
//   NEXT_PUBLIC_CONTACT_TELEGRAM  — Telegram username without "@" (e.g. my_username)
// The fallbacks below are PLACEHOLDERS — replace them or set the env vars.
export const CONTACT_WHATSAPP = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "YOUR_PHONE_NUMBER").replace(/\D/g, "") || "YOUR_PHONE_NUMBER";
export const CONTACT_TELEGRAM = (process.env.NEXT_PUBLIC_CONTACT_TELEGRAM || "YOUR_TELEGRAM_USERNAME").replace(/^@/, "");

export const WHATSAPP_URL = `https://wa.me/${CONTACT_WHATSAPP}`;
export const TELEGRAM_URL = `https://t.me/${CONTACT_TELEGRAM}`;
