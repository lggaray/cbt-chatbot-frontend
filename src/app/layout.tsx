import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { ChatProvider } from "@/lib/chat-context";
import { Navigation } from "@/components/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CBT Chatbot - Your Digital Therapeutic Companion",
  description: "A cognitive behavioral therapy chatbot designed to help you manage your mental health.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <AuthProvider>
          <ChatProvider>
            <Navigation />
            <main className="min-h-[calc(100vh-64px)]">
              {children}
            </main>
            <Toaster />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
