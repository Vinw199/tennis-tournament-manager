import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";

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
        <Providers>
          <div className="min-h-screen bg-background text-foreground">{children}</div>
        </Providers>
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
