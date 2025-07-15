import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientLayout from "@/components/layout/ClientLayout";
import ErrorBoundary from "@/components/layout/ErrorBoundary";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Real Estate CRM",
  description: "Comprehensive real estate customer relationship management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
