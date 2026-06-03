import type { Metadata } from "next";
import { Noto_Sans_Thai, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { IngressProvider } from "@/lib/ingress-utils";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-geist-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BJP Keep",
  description: "Where are my stuff!",
  icons: {
    icon: [
      { url: "favicons/favicon.ico" },
      { url: "favicons/favicon.svg", type: "image/svg+xml" },
      { url: "favicons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],

    apple: "favicons/apple-touch-icon.png",
  },

  manifest: "favicons/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const ingressPath = headerList.get("x-ingress-path") || "";
  // Create a proper base URL for the <base> tag
  const baseUrl = ingressPath ? `${ingressPath}/` : "/";

  return (
    <html lang="en" className={`${notoSansThai.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <base href={baseUrl} />
      </head>
      <body className="min-h-full flex flex-col">
        <IngressProvider path={ingressPath}>
          {children}
        </IngressProvider>
      </body>
    </html>
  );
}
