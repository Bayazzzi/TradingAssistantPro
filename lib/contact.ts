// Developer contact details shown in the footer.
// Set these in Vercel (Project → Settings → Environment Variables) or in .env.local:
//   NEXT_PUBLIC_CONTACT_WHATSAPP  — phone in international format, digits only (e.g. 77011234567)
//   NEXT_PUBLIC_CONTACT_TELEGRAM  — Telegram username without "@" (e.g. my_username)
// Defaults below are the developer's real contacts; env vars override them.
export const CONTACT_WHATSAPP = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "77082233322").replace(/\D/g, "") || "77082233322";
export const CONTACT_TELEGRAM = (process.env.NEXT_PUBLIC_CONTACT_TELEGRAM || "mr_bayazi").replace(/^@/, "");

export const WHATSAPP_URL = `https://wa.me/${CONTACT_WHATSAPP}`;
export const TELEGRAM_URL = `https://t.me/${CONTACT_TELEGRAM}`;
