import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ModalProvider } from "@/components/providers/modal"
import { ToasterProvider } from '@/components/providers/toaster'
import { CrispProvider } from '@/components/providers/crisp'
import AuthProvider from './context/AuthProvider'
import Script from "next/script";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rapidly',
  description: 'Rapidy AI Search',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
              strategy="lazyOnload"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
            />
      <Script strategy="lazyOnload" id="gtag">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
          page_path: window.location.pathname,
          });`}
      </Script>
      <html lang="en">
        <CrispProvider />
        <body className={inter.className}>
          <AuthProvider>
          <ModalProvider />
          <ToasterProvider />
          {children}
          </AuthProvider>
        </body>
      </html>
    </>
      
  )
}
