import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta
          name="description"
          content="Türkiye'deki son depremleri gerçek zamanlı olarak takip edin. Interaktif harita, istatistikler ve detaylı deprem verileri."
        />
        <meta name="theme-color" content="#0a0f1e" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
