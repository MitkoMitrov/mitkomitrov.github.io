// Homepage copy based on the supplied CV; operational counts are intentionally omitted.
export const profile = {
  name: 'Mitko Mitrov',
  email: 'mitkomitrov09@gmail.com',
  github: 'https://github.com/MitkoMitrov',
  linkedin: 'https://www.linkedin.com/in/mitko-mitrov-14aa3b191/',
  bio: [
    'I’m a .NET software engineer working across C#, ASP.NET Core and React. I turn legacy applications into maintainable APIs, build multi-tenant web platforms, and connect desktop software with real-world hardware.',
    'I enjoy owning the path from requirements to production, with a focus on clean architecture, regression testing and useful observability. Alongside product development, I mentor developers and write about practical engineering.',
  ],
};

// Section URLs remain useful until WEB-13, WEB-04 and WEB-10 introduce their pages.
export const navigation = [
  {label: 'Articles', href: '/#articles'},
  {label: 'Experience', href: '/#experience'},
  {label: 'Projects', href: '/#work'},
];

export const experience = [
  {
    company: 'Meta5Team', role: 'Software Engineer',
    start: '2022-03', startLabel: 'Mar 2022', end: null, endLabel: 'Present',
    highlights: [
      'Led the migration of legacy functionality to modular ASP.NET Core REST APIs using Clean Architecture, improving testability, maintainability and deployment safety.',
      'Built NUnit regression tests to compare legacy and replacement API responses and catch breaking changes before release.',
      'Own the cashier module for deposits and withdrawals, built with C# and .NET.',
      'Built and deployed a .NET MAUI kiosk application with thermal printer and bill acceptor integrations.',
      'Redesigned the React frontend with Redux Toolkit to isolate tenants within a shared codebase.',
      'Designed structured logging across local files, SQLite and real-time SignalR streams to trace production issues.',
      'Mentored junior developers and a UI/UX developer on C#, SOLID principles and .NET architecture.',
    ],
  },
  {
    company: 'Freelance', role: 'Full-Stack Developer',
    start: '2021-09', startLabel: 'Sep 2021', end: null, endLabel: 'Present',
    highlights: [
      'Owned delivery of a sports booking platform for the Canadian market, from requirements to production, with a Vue.js frontend.',
      'Designed booking flows, the relational database schema and a library of reusable frontend components.',
      'Delivered business-logic changes in the platform’s .NET services while adapting to changing client requirements.',
    ],
  },
  {
    company: 'SPD Computing', role: 'Full-Stack Developer · Part-time',
    start: '2019-10', startLabel: 'Oct 2019', end: '2021-05', endLabel: 'May 2021',
    highlights: [
      'Contributed to banking software modernization, including a migration from VB.NET to PHP and PL/SQL.',
      'Automated financial report generation in CSV, PDF and Excel, replacing manual processing.',
      'Implemented automated printing for payment and foreign-exchange forms across bank branches.',
    ],
  },
];

export const selectedWork = [
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
  {
    id: 'stock-reports',
    title: 'AI Daily Stock Reports',
    category: 'Past project · Sep 2024–Feb 2025',
    summary: 'Built a pipeline that aggregates market data, filters key events and generates daily reports through the OpenAI API. Optimized prompts and data processing to reduce operating costs.',
  },
];

// Real published articles, linked to LinkedIn; no CMS drafts or fixture posts.
export const articles = [
  {
    title: 'When to Use Redis—and When Not To',
    date: '2026-10-01',
    dateLabel: '1 Oct 2026',
    part: '03',
    summary: 'Where caching earns its place, when it adds complexity, and how to plan for a Redis outage.',
    href: 'https://www.linkedin.com/pulse/when-use-redisand-mitko-mitrov-09cxf',
  },
  {
    title: 'Redis in Practice: Cache-Aside, TTL, and Eviction',
    date: '2026-09-10',
    dateLabel: '10 Sep 2026',
    part: '02',
    summary: 'The read and write flow, freshness decisions, and race conditions behind a shared cache.',
    href: 'https://www.linkedin.com/pulse/redis-practice-cache-aside-ttl-eviction-mitko-mitrov-ilqlf',
  },
  {
    title: 'Why Redis? What problem does it actually solve?',
    date: '2026-09-01',
    dateLabel: '1 Sep 2026',
    part: '01',
    summary: 'A practical starting point: repeated work, multiple application instances, and the limits of local memory.',
    href: 'https://www.linkedin.com/pulse/why-redis-what-problem-does-actually-solve-mitko-mitrov-zaepf',
  },
];
