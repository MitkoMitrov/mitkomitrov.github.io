// Transitional, repository-owned HTML only; never feed CMS or visitor input here.
// WEB-02 can replace this bridge with Astro components without changing this build.
export function splitLegacyDocument(html) {
  const match = html.match(/^\s*<!doctype html>\s*<html lang="en">\s*<head>([\s\S]*?)<\/head>\s*<body>([\s\S]*?)<\/body>\s*<\/html>\s*$/i);
  if (!match) throw new Error('Unsupported legacy document shell; update the Astro route explicitly.');
  return {head: match[1], body: match[2]};
}
