import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteUrl } from "@/lib/site-url";

const pinterestDomainVerification = process.env.PINTEREST_DOMAIN_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "The Curated Cart | Pretty finds. Practical buys.",
  description: "A feminine lifestyle affiliate blog and shopping guide that curates the best Amazon finds in home decor, clothing, skincare, and everyday life.",
  ...(pinterestDomainVerification
    ? {
        other: {
          "p:domain_verify": pinterestDomainVerification,
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <Script id="pinterest-base-tag" strategy="afterInteractive">
          {`
            !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[];n.version="3.0";var t=document.createElement("script");t.async=true;t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
            pintrk('load', '2613330333982');
            pintrk('page');
          `}
        </Script>
      </body>
    </html>
  );
}
