import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The ANTs — Academic Productivity & Tutoring Platform',
    short_name: 'The ANTs',
    description:
      'Curriculum-aware academic productivity and tutoring platform for Myanmar students pursuing Cambridge IGCSE, A Levels, and Pearson Edexcel.',
    start_url: '/student',
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
    shortcuts: [
      {
        name: 'Student Dashboard',
        short_name: 'Dashboard',
        description: 'View your curriculum, timetable, and study streak',
        url: '/student',
        icons: [{ src: '/logo.png', sizes: '192x192' }],
      },
      {
        name: 'Pomodoro Timer',
        short_name: 'Pomodoro',
        description: 'Start a focused study or past paper session',
        url: '/pomodoro',
        icons: [{ src: '/logo.png', sizes: '192x192' }],
      },
      {
        name: 'Timetable',
        short_name: 'Timetable',
        description: 'Check today’s study schedule and tasks',
        url: '/timetable',
        icons: [{ src: '/logo.png', sizes: '192x192' }],
      },
      {
        name: 'Past Papers',
        short_name: 'Papers',
        description: 'Practice past exam papers and calculate grades',
        url: '/past-papers',
        icons: [{ src: '/logo.png', sizes: '192x192' }],
      },
    ],
  };
}
