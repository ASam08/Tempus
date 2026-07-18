import type { Metadata } from "next";
import { geistSans, geistMono } from "@/app/ui/fonts";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "./ui/darkmode";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Tempus",
  description: "Your Week, At A Glance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body
        className={`${geistSans.className} ${geistMono.className} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          {/* <div className="flex"> */}
          {/* <div className="fixed top-2 left-2 justify-start md:top-2"></div> */}
          <div className="fixed right-2 bottom-2 justify-end md:right-4 md:bottom-4">
            <ModeToggle />
          </div>
          {/* </div> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
