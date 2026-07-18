import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cadence — one board for every client",
  description: "Plan, approve, and publish every client's month from one board.",
};

// Apply the saved theme before first paint to avoid a flash.
const themeInit = `try{var s=JSON.parse(localStorage.getItem("cadence-ui")||"{}");if(s.state&&s.state.theme==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        {/* Runs before hydration so the saved theme is applied without a flash. */}
        <Script id="cadence-theme-init" strategy="beforeInteractive">
          {themeInit}
        </Script>
        {children}
      </body>
    </html>
  );
}
