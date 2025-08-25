import { Geist, Geist_Mono } from "next/font/google";
import { Poppins, Lato } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import AppLayout from "@/components/layout/AppLayout";
import { ToastContainer } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

export const metadata = {
  title: "PG Manager - Professional PG Management System",
  description: "Complete solution for managing paying guest accommodations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${lato.variable} antialiased bg-gray-50`}
      >
        <ReduxProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <ToastContainer />
        </ReduxProvider>
      </body>
    </html>
  );
}
