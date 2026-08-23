import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PersonaProvider } from "@/context/PersonaContext";
import QueryProvider from "@/components/QueryProvider";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  title: "The ANTs — Academic Productivity & Tutoring Platform",
  icons: [{ rel: "icon", url: "/logo.png" }],
  description:
    "The ANTs is a curriculum-aware productivity and tutoring platform for Myanmar students pursuing Cambridge IGCSE, A Levels, Edexcel, IELTS, and Matriculation.",
  keywords: [
    "ANTS",
    "study",
    "IGCSE",
    "A Level",
    "Myanmar",
    "timetable",
    "flashcards",
    "tutors",
    "pomodoro",
    "exam countdown",
    "grade calculator",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} h-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col antialiased"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-background-card focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <PersonaProvider>
            <QueryProvider>{children}</QueryProvider>
          </PersonaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
