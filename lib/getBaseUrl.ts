export function getBaseUrl(): string {
  const explicit: string | undefined = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel: string | undefined = process.env.VERCEL_URL;
  if (vercel) {
    return `https://${vercel}`;
  }
  return "http://localhost:3000";
}
