(() => {
  const article = document.querySelector('[data-article-id]');
  const body = article?.querySelector('[data-article-body]');
  if (!body) return;

  // Reading and copying remain usable when analytics is disabled.
  for (const button of body.querySelectorAll('[data-copy-code]')) {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const status = document.querySelector('[data-copy-status]');
      const code = button.closest('.code-block')?.querySelector('pre code');
      try {
        await navigator.clipboard.writeText(code.textContent);
        status.textContent = 'Code copied.';
        button.textContent = 'Copied';
        window.setTimeout(() => {button.textContent = 'Copy code';}, 2000);
      } catch {
        status.textContent = 'Copy is unavailable. Select the code and copy it manually.';
      }
    });
  }

  const metadata = {article_id:article.dataset.articleId, article_topic:article.dataset.articleTopic};
  const milestones = new Set();
  let activeMs = 0, reportedMs = 0, maxDepth = 0, readSent = false;
  let lastTick = performance.now(), lastActivity = lastTick;
  const idleMs = 30000;
  function enabled() { return window.portfolioAnalytics?.enabled() === true; }
  function visible() {
    const rect = body.getBoundingClientRect();
    return document.visibilityState === 'visible' && document.hasFocus() && rect.top < window.innerHeight && rect.bottom > 0;
  }
  function send(name, extra = {}) {
    return window.portfolioAnalytics?.track(name, {...metadata, ...extra}) === true;
  }
  function measureDepth() {
    if (!enabled() || !visible()) return;
    const rect = body.getBoundingClientRect();
    if (rect.height <= 0) return;
    maxDepth = Math.max(maxDepth, Math.min(100, Math.max(0, (window.innerHeight - rect.top) / rect.height * 100)));
    for (const percent of [25, 50, 75, 100]) {
      if (maxDepth + 0.01 >= percent && !milestones.has(percent) && send('article_scroll', {percent_scrolled:percent})) milestones.add(percent);
    }
  }
  function checkRead() {
    if (!readSent && activeMs >= 60000 && maxDepth >= 75 && enabled() && visible()) {
      readSent = send('article_read', {active_seconds:Math.floor(activeMs / 1000), percent_scrolled:Math.floor(maxDepth), read_definition:'60s_active_75pct_body', is_estimate:1});
    }
  }
  function flush() {
    const seconds = Math.floor((activeMs - reportedMs) / 1000);
    if (seconds > 0 && send('article_engagement', {active_seconds:seconds, active_seconds_total:Math.floor(activeMs / 1000)})) reportedMs += seconds * 1000;
  }
  function tick() {
    const now = performance.now();
    if (enabled() && visible()) activeMs += Math.max(0, Math.min(now, lastActivity + idleMs) - Math.max(lastTick, now - 2000));
    lastTick = now;
    measureDepth(); checkRead();
    if (activeMs - reportedMs >= 30000) flush();
  }
  function activity() { tick(); lastActivity = performance.now(); }
  for (const event of ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'scroll']) window.addEventListener(event, activity, {passive:true});
  window.addEventListener('focus', () => {lastTick = performance.now(); lastActivity = lastTick;});
  window.addEventListener('blur', () => {tick(); flush();});
  document.addEventListener('visibilitychange', () => {
    tick(); flush();
    lastTick = performance.now();
    if (document.visibilityState === 'visible') lastActivity = lastTick;
  });
  window.addEventListener('pagehide', () => {tick(); flush();});
  window.addEventListener('analytics:enabled', () => {lastTick = performance.now(); lastActivity = lastTick; measureDepth();});
  window.addEventListener('analytics:disabled', () => {lastTick = performance.now(); activeMs = 0; reportedMs = 0;});
  window.setInterval(tick, 1000);
  measureDepth();
})();
