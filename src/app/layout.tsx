import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.shopthecuratedcart.com"),
  title: {
    default: "The Curated Cart | Pretty finds. Practical buys.",
    template: "%s | The Curated Cart"
  },
  description: "A feminine lifestyle affiliate blog and shopping guide that curates the best Amazon finds in home decor, clothing, skincare, and everyday life.",
  openGraph: {
    title: "The Curated Cart",
    description: "Pretty finds. Practical buys.",
    url: "https://www.shopthecuratedcart.com",
    siteName: "The Curated Cart",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Curated Cart",
    description: "Pretty finds. Practical buys.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'The Curated Cart',
              url: 'https://www.shopthecuratedcart.com',
              description: 'Pretty finds. Practical buys.',
              publisher: { '@type': 'Organization', name: 'The Curated Cart', url: 'https://www.shopthecuratedcart.com' },
            }),
          }}
        />
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
