// Public copy approved for WEB-02. Provenance and link checks are in the WEB-02 report.
export const profile = {
  name: 'Mitko Mitrov',
  email: 'mitkomitrov09@gmail.com',
  github: 'https://github.com/MitkoMitrov',
  linkedin: 'https://www.linkedin.com/in/mitko-mitrov-14aa3b191/',
};

// Section URLs remain useful until WEB-13, WEB-04 and WEB-10 introduce their pages.
export const navigation = [
  {label: 'Home', href: '/'},
  {label: 'Work', href: '/#work'},
  {label: 'Articles', href: '/#articles'},
  {label: 'About', href: '/#about'},
];

export const selectedWork = [
  {
    id: 'kiosk',
    title: 'Connected retail kiosks',
    category: 'Production work · Meta5Team',
    summary: 'Built a .NET MAUI application connecting kiosk software to thermal printers and bill acceptors. Added local files, SQLite and live SignalR logging to make production issues traceable.',
    outcome: '50+ kiosks across 25+ locations',
    stack: ['C#', '.NET MAUI', 'SQLite', 'SignalR'],
  },
  {
    id: 'whowinselections',
    title: 'WhoWinSelections.com',
    category: 'Past project · Feb–Nov 2024',
    summary: 'Built and operated an election news aggregator, from categorizing articles across 100+ sources to infrastructure, monetization and traffic acquisition. Used Nginx caching to improve backend performance.',
    outcome: 'About 1,000 daily users during operation',
    stack: ['News aggregation', 'Nginx', 'Operations'],
  },
  {
    id: 'imenologija',
    title: 'Imenologija.mk',
    category: 'In development · Personal product',
    summary: 'Building a Macedonian names encyclopedia with linked origins, sources and name variants. Each entry follows a draft, verified and published editorial workflow, backed by PostgreSQL on a Linux VPS.',
    outcome: 'Content model spanning 42 categories',
    stack: ['Next.js', 'Payload CMS', 'PostgreSQL', 'Docker'],
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
