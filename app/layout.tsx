import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000";

  return {
    title: "Приглашение на свадьбу — Дмитрий и Анастасия",
    description: "Свадебное приглашение Дмитрия и Анастасии",
    icons: {
      icon: "/favicon.svg",
    },
    openGraph: {
      title: "Дмитрий и Анастасия — 26 сентября 2026",
      description: "Приглашаем вас разделить с нами этот особенный день.",
      images: [
        {
          url: `${baseUrl}/og-dmitriy-anastasia.webp`,
          width: 1536,
          height: 1024,
          alt: "Дмитрий и Анастасия — свадебное приглашение",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Дмитрий и Анастасия — 26 сентября 2026",
      description: "Приглашаем вас разделить с нами этот особенный день.",
      images: [`${baseUrl}/og-dmitriy-anastasia.webp`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
