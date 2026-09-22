import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PersonaProvider } from "@/context/PersonaContext";
import QueryProvider from "@/components/QueryProvider";
import { validateEnv } from "@/lib/validateEnv";

validateEnv();

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090a0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://the-ants.org"),
  title: {
    default: "The ANTs — Academic Productivity & Tutoring Platform",
    template: "%s | The ANTs",
  },
  description:
    "Curriculum-aware productivity and tutoring platform for Myanmar students pursuing Cambridge IGCSE, A Levels, and Pearson Edexcel. Free past paper trackers, timetable, pomodoro, grade calculators, and official exam countdowns.",
  keywords: [
    "The ANTS",
    "Myanmar IGCSE",
    "Cambridge CAIE",
    "Pearson Edexcel IAL",
    "A Level Myanmar",
    "past paper tracker",
    "grade calculator",
    "exam countdown",
    "study timetable",
    "pomodoro timer",
  ],
  authors: [{ name: "The ANTs Academic Community", url: "https://the-ants.org" }],
  creator: "The ANTs",
  publisher: "The ANTs",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://the-ants.org",
    siteName: "The ANTs",
    title: "The ANTs — Academic Productivity & Tutoring Platform",
    description:
      "Curriculum-aware academic productivity and tutoring platform for Myanmar students pursuing Cambridge IGCSE, A Levels, and Pearson Edexcel.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "The ANTs Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "The ANTs — Academic Productivity & Tutoring Platform",
    description:
      "Curriculum-aware academic productivity and tutoring platform for Myanmar students pursuing Cambridge IGCSE, A Levels, and Pearson Edexcel.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PersonaProvider>
              <QueryProvider>{children}</QueryProvider>
            </PersonaProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
