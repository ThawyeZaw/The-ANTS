import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The ANTs — Academic Productivity & Tutoring Platform',
    short_name: 'The ANTs',
    description:
      'Curriculum-aware academic productivity and tutoring platform for Myanmar students pursuing Cambridge IGCSE, A Levels, and Pearson Edexcel.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#d97706',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192 512x512',
        type: 'image/png',
      },
    ],
  };
}
