// Homepage copy based on the supplied CV; operational counts are intentionally omitted.
export const profile = {
  name: 'Mitko Mitrov',
  email: 'mitkomitrov09@gmail.com',
  github: 'https://github.com/MitkoMitrov',
  linkedin: 'https://www.linkedin.com/in/mitko-mitrov-14aa3b191/',
  bio: [
    'I’m a full-stack software engineer building products with C#, ASP.NET Core and React. I work across APIs, databases and user interfaces, connecting technical decisions to how a product is actually used.',
    'My experience spans modernizing legacy systems, designing multi-tenant web platforms and integrating software with hardware. I value maintainable architecture, thoughtful interfaces and reliable releases—and share the lessons I learn through my articles.',
  ],
};

// Primary navigation points to content pages and the experience timeline.
export const navigation = [
  {label: 'Articles', href: '/articles/'},
  {label: 'Experience', href: '/#experience'},
  {label: 'Projects', href: '/work/'},
];

export const experience = [
  {
    company: 'Meta5Team', role: 'Software Engineer',
    start: '2022-03', startLabel: 'Mar 2022', end: null, endLabel: 'Present',
    highlights: [
      'Modernized a legacy product with modular ASP.NET Core APIs and a shared React/Redux Toolkit frontend, keeping tenant-specific behavior separate.',
      'Built complete product workflows, from deposits and withdrawals to a .NET MAUI kiosk app with payment and printing hardware.',
      'Made releases and production support more reliable through regression testing, structured logging and real-time diagnostics; mentored fellow developers.',
    ],
  },
  {
    company: 'Freelance', role: 'Full-Stack Developer',
    start: '2021-10', startLabel: 'Oct 2021', end: '2026-03', endLabel: 'Mar 2026', durationLabel: '4 yrs 6 mos',
    highlights: [
      'Delivered a sports booking platform end to end, shaping the Vue.js interface, booking flows and relational database.',
      'Extended .NET business logic and reusable frontend components as client requirements evolved.',
    ],
  },
  {
    company: 'SPD Computing', role: 'Full-Stack Developer · Part-time',
    start: '2019-10', startLabel: 'Oct 2019', end: '2021-05', endLabel: 'May 2021',
    highlights: [
      'Helped modernize banking software and replace manual reporting and branch printing with automated workflows.',
    ],
  },
];

export const selectedWork = [
  {
    id: 'marketagent',
    title: 'MarketAgent',
    category: 'Market intelligence · Python & AI',
    summary: 'Built a market intelligence platform that turns Finnhub data into filtered, ranked and categorized news, company insights and daily OpenAI briefings. Implemented duplicate-story grouping, API rate limiting and caching, with automated publishing to a live dashboard.',
    href: 'https://mitko.mk/MarketAgent/',
  },
  {
    id: 'imenologija',
    title: 'Imenologija.mk',
    category: 'In development · 2026–present',
    summary: 'A Macedonian names encyclopedia with linked sources and an editorial workflow. Built with Next.js, Payload CMS and PostgreSQL.',
  },
  {
    id: 'whowinselections',
    title: 'WhoWinSelections.com',
    category: 'Past project · Feb–Nov 2024',
    summary: 'Built and operated an election news aggregator with article categorization and Nginx caching. Owned the infrastructure, monetization and traffic acquisition.',
  },
];

export {articles} from './articles.mjs';
