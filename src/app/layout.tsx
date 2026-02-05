import type { Metadata } from "next";
import { Inter, Playfair_Display, Source_Serif_4, Merriweather, Source_Sans_3, Roboto_Slab, Lora, DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: '--font-source-serif' });
const merriweather = Merriweather({ subsets: ["latin"], weight: ['400', '700'], variable: '--font-merriweather' });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: '--font-source-sans' });
const robotoSlab = Roboto_Slab({ subsets: ["latin"], variable: '--font-roboto-slab' });
const lora = Lora({ subsets: ["latin"], variable: '--font-lora' });
const dmSans = DM_Sans({ subsets: ["latin"], variable: '--font-dm-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: "News Portal",
  description: "Premium news articles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${sourceSerif.variable} ${merriweather.variable} ${sourceSans.variable} ${robotoSlab.variable} ${lora.variable} ${dmSans.variable} ${spaceGrotesk.variable} font-sans antialiased min-h-screen bg-background`}>
        {children}
      </body>
    </html>
  );
}
