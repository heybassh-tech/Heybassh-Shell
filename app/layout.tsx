
import "antd/dist/reset.css"
import "./globals.css"
import { ReactNode } from "react"
import Providers from "./providers"
import HeaderMenu from "./components/HeaderMenu"

export const metadata = { 
  title: " Heybassh Business Suite", 
  description: "Unified workspace",
  icons: {
    icon: "/heybasshlogo.png",
    shortcut: "/heybasshlogo.png",
    apple: "/heybasshlogo.png",
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <HeaderMenu />
          {children}
        </Providers>
      </body>
    </html>
  )
}
