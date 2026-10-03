import type { Metadata } from 'next';
import AboutView from '@/components/about/AboutView';

export const metadata: Metadata = {
  title: 'About The ANTS — Academic Productivity & Guidance',
  description:
    'Founded by Myanmar scholars for Myanmar scholars. Learn our story, explore our mission, and discover free Cambridge CAIE & Pearson Edexcel study tools.',
  openGraph: {
    title: 'About The ANTS — Academic Productivity & Guidance',
    description:
      'Founded by Myanmar scholars for Myanmar scholars. Learn our story, explore our mission, and discover free Cambridge CAIE & Pearson Edexcel study tools.',
    url: 'https://the-ants.org/about',
    siteName: 'The ANTs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'About The ANTS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About The ANTS — Academic Productivity & Guidance',
    description:
      'Founded by Myanmar scholars for Myanmar scholars. Free Cambridge CAIE & Pearson Edexcel study tools.',
    images: ['/og-image.png'],
  },
};

export default function AboutPage() {
  return <AboutView />;
}
