// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ServerNavbar from "@/components/ServerNavbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReservationApp",
  description: "Reservation & Reminder App",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* SSR nav prevents auth flicker */}
        <ServerNavbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
