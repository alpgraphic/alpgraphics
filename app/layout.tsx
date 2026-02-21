import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AgencyProvider } from "@/context/AgencyContext";
import { ToastProvider } from "@/components/ui/Toast";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "900"],
  variable: "--font-montserrat",
});

import { getSiteSettingsCollection } from "@/lib/mongodb";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const collection = await getSiteSettingsCollection();
    const settings = await collection.findOne({ key: 'scene' });

    return {
      title: settings?.seoTitle || "alpgraphics | Studio",
      description: settings?.seoDescription || "Digital Experience Boundaries",
      keywords: settings?.seoKeywords || "design, digital experience, studio",
      robots: {
        index: true,
        follow: true,
      }
    };
  } catch (error) {
    return {
      title: "alpgraphics | Studio",
      description: "Digital Experience Boundaries",
    };
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <ToastProvider>
          <AgencyProvider>
            {children}
          </AgencyProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
