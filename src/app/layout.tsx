import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The ANTS — Academic Productivity Ecosystem",
  description:
    "The ANTS is a curriculum-focused productivity and learning platform for Myanmar students pursuing IGCSE, A Levels, IELTS, SAT, OSSD, and more. Timetables, flashcards, classrooms, clubs, grade calculators, and exam countdowns — all in one place.",
  keywords: [
    "ANTS",
    "study",
    "IGCSE",
    "A Level",
    "Myanmar",
    "timetable",
    "flashcards",
    "classrooms",
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
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
