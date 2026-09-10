import type { Metadata } from "next";
import { Bangers, Bebas_Neue, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import CosmicBackground from "@/components/CosmicBackground";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-geist-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bangers = Bangers({
  variable: "--font-comic",
  weight: "400",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spidey-Tracker",
  description:
    "A HUD-style tracker for 18 months of reported sightings of a masked vigilante swinging across a New York-inspired city.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark scroll-smooth ${plexSans.variable} ${jetbrainsMono.variable} ${bangers.variable} ${bebasNeue.variable}`}
    >
      <body className="min-h-full flex flex-col md:flex-row text-foreground">
        <CosmicBackground />
        <Sidebar />
        <div className="relative z-10 min-h-screen min-w-0 w-full flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
