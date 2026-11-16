(() => {
  // Keep localhost, branch previews and GitHub's alternate hostname out of GA.
  if (location.hostname !== 'mitko.mk' || location.protocol !== 'https:') return;

  const measurementId = 'G-5J3W5EZLQL';
  const storageKey = 'mitko.analytics.v1';
  const panel = document.querySelector('[data-analytics-panel]');
  const preferences = document.querySelector('[data-analytics-preferences]');
  const status = document.querySelector('[data-analytics-status]');
  const accept = panel.querySelector('[data-analytics-accept]');
  let loaded = false;
  let choice = null;
  try { choice = localStorage.getItem(storageKey); } catch { /* Private storage can be unavailable. */ }

  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Basic consent mode: no Google script or request exists before opt-in.
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied',
    });
    window.gtag('consent', 'update', {analytics_storage: 'granted'});
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = document.createElement('script');
    script.async = true;
    script.dataset.analyticsLoader = '';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(script);
  }

  function showPreferences(moveFocus = false) {
    status.textContent = choice === 'granted' ? 'Analytics is currently on.' : 'Analytics is currently off.';
    panel.hidden = false;
    if (moveFocus) accept.focus();
  }

  function saveChoice(next) {
    choice = next;
    try { localStorage.setItem(storageKey, choice); } catch { /* Keep the choice for this page visit. */ }
    panel.hidden = true;
    preferences.focus();
    if (choice === 'granted') {
      window['ga-disable-' + measurementId] = false;
      loadAnalytics();
    } else {
      window['ga-disable-' + measurementId] = true;
      // Remove this site's GA cookies after withdrawing consent.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) continue;
        for (const domain of ['', '; Domain=mitko.mk', '; Domain=.mitko.mk']) {
          document.cookie = name + '=; Max-Age=0; Path=/' + domain + '; SameSite=Lax; Secure';
        }
      }
      // Unload enhanced measurement listeners as well as disabling collection.
      if (loaded) location.reload();
    }
  }

  preferences.hidden = false;
  preferences.addEventListener('click', () => showPreferences(true));
  accept.addEventListener('click', () => saveChoice('granted'));
  panel.querySelector('[data-analytics-decline]').addEventListener('click', () => saveChoice('denied'));
  if (choice === 'granted') loadAnalytics();
  else if (choice !== 'denied') showPreferences();
})();
