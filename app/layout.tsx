import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000";

  return {
    title: "Приглашение на свадьбу — Сергей и Наталия",
    description: "Свадебное приглашение Сергея и Наталии",
    icons: {
      icon: "/favicon.svg",
    },
    openGraph: {
      title: "Сергей и Наталия — 14 сентября 2025",
      description: "Приглашаем вас разделить с нами этот особенный день.",
      images: [
        {
          url: `${baseUrl}/og.png`,
          width: 1536,
          height: 1024,
          alt: "Сергей и Наталия — свадебное приглашение",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Сергей и Наталия — 14 сентября 2025",
      description: "Приглашаем вас разделить с нами этот особенный день.",
      images: [`${baseUrl}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
