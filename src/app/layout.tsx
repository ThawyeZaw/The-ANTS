import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import "./katex-local.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";


const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The ANTs — Academic Productivity Ecosystem",
  description:
    "The ANTs is a curriculum-focused productivity and learning platform for Myanmar students pursuing IGCSE, A Levels, IELTS, SAT, OSSD, and more. Timetables, flashcards, classrooms, clubs, grade calculators, and exam countdowns — all in one place.",
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
      className={`${quicksand.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
