import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Jorhat Tennis Club – Tournament Manager",
  description: "Administer tournaments, rosters, matches, and live scores.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-background text-foreground">{children}</div>
      </body>
    </html>
  );
}
