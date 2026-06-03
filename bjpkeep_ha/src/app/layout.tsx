import type { Metadata } from "next";
import { headers } from "next/headers";
import { IngressProvider } from "@/lib/ingress-utils";
import "./globals.css";

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

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="bjpkeep-ingress-path" content={ingressPath} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__BJPKEEP_INGRESS_PATH__=${JSON.stringify(ingressPath)};`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <IngressProvider path={ingressPath}>
          {children}
        </IngressProvider>
      </body>
    </html>
  );
}
