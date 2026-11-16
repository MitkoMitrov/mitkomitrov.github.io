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
    window['ga-disable-' + measurementId] = false;
    // Owner-requested opt-out policy. Enabled storage is not evidence of consent.
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied',
    });
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
    status.textContent = choice === 'denied' ? 'Analytics is currently off.' : 'Analytics is currently on.';
    panel.hidden = false;
    if (moveFocus) accept.focus();
  }

  function saveChoice(next) {
    choice = next;
    let saved = false;
    try {
      localStorage.setItem(storageKey, choice);
      saved = localStorage.getItem(storageKey) === choice;
    } catch { /* Keep the choice for this page visit. */ }
    panel.hidden = true;
    preferences.focus();
    if (choice === 'granted') {
      window['ga-disable-' + measurementId] = false;
      loadAnalytics();
    } else {
      stopAnalytics(saved);
    }
    if (!saved) {
      showPreferences();
      status.textContent += ' Your browser could not save this choice; it applies only to this page.';
    }
  }

  function stopAnalytics(reload) {
    window['ga-disable-' + measurementId] = true;
    // Do not send a consent-update ping after the visitor declines.
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['', '; Domain=mitko.mk', '; Domain=.mitko.mk']) {
        document.cookie = name + '=; Max-Age=0; Path=/' + domain + '; SameSite=Lax; Secure';
      }
    }
    // Reload only with a persisted opt-out: otherwise the new page would re-enable GA.
    if (loaded && reload) location.reload();
  }

  preferences.hidden = false;
  preferences.addEventListener('click', () => showPreferences(true));
  accept.addEventListener('click', () => saveChoice('granted'));
  panel.querySelector('[data-analytics-decline]').addEventListener('click', () => saveChoice('denied'));
  window.addEventListener('storage', event => {
    if (event.key !== storageKey || event.newValue !== 'denied') return;
    choice = 'denied';
    panel.hidden = true;
    stopAnalytics(true);
  });
  // Preserve all earlier opt-outs, including those saved under the old opt-in UI.
  if (choice === 'denied') stopAnalytics(false);
  else {
    loadAnalytics();
    if (choice !== 'granted') showPreferences();
  }
})();
