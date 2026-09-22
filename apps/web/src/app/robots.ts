import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/team',
          '/calculator',
          '/countdown',
          '/past-papers',
          '/pomodoro',
          '/timetable',
          '/leaderboard',
          '/curriculum',
          '/login',
          '/signup',
        ],
        disallow: [
          '/student',
          '/dashboard',
          '/settings',
          '/api/',
          '/main-contributor',
          '/contributor',
          '/editor',
          '/workspace',
          '/org-activities',
        ],
      },
    ],
    sitemap: 'https://the-ants.org/sitemap.xml',
    host: 'https://the-ants.org',
  };
}
