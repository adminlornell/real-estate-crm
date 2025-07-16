import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Real Estate CRM",
  description: "Comprehensive real estate customer relationship management system",
};

import SafeRootLayout from "@/components/layout/SafeRootLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SafeRootLayout>
          {children}
        </SafeRootLayout>
      </body>
    </html>
  );
}
