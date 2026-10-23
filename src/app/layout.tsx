import type { Metadata, Viewport } from "next";
import { Luckiest_Guy, Nunito } from "next/font/google";
import "./globals.css";

const cartoon = Luckiest_Guy({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cartoon",
  display: "swap",
});

const body = Nunito({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cantarolá",
  description: "Cantarole a música sem falar a letra e faça seu time acertar.",
  applicationName: "Cantarolá",
  appleWebApp: {
    capable: true,
    title: "Cantarolá",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#512664",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${cartoon.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
