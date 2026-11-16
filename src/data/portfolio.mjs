// Public copy approved for WEB-02. Provenance and link checks are in the WEB-02 report.
export const profile = {
  name: 'Mitko Mitrov',
  email: 'mitkomitrov09@gmail.com',
  github: 'https://github.com/MitkoMitrov',
  linkedin: 'https://www.linkedin.com/in/mitko-mitrov-14aa3b191/',
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
    summary: 'Migrated 50–100 legacy endpoints to ASP.NET Core. Own cashier software serving 5,000–10,000 daily users and a MAUI app deployed on 50+ kiosks.',
  },
  {
    company: 'Freelance', role: 'Full-Stack Developer',
    start: '2021-09', startLabel: 'Sep 2021', end: null, endLabel: 'Present',
    summary: 'Delivered a Canadian sports booking platform from requirements to production, handling around 1,000 bookings per month.',
  },
  {
    company: 'SPD Computing', role: 'Full-Stack Developer · Part-time',
    start: '2019-10', startLabel: 'Oct 2019', end: '2021-05', endLabel: 'May 2021',
    summary: 'Modernized banking software and automated 100+ financial reports and branch printing.',
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
    summary: 'Built and operated an election news aggregator covering 100+ sources and about 1,000 daily users during operation.',
  },
  {
    id: 'stock-reports',
    title: 'AI Daily Stock Reports',
    category: 'Past project · Sep 2024–Feb 2025',
    summary: 'An automated market-data and reporting pipeline using the OpenAI API. Reduced AI operating costs by about 30%.',
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
