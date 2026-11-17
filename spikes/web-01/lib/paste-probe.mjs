// Diagnostic metadata only. Never return, log, save or transmit clipboard text.
export function observePaste(clipboard, report) {
  const observation = {
    html: Boolean(clipboard?.getData('text/html')),
    plainText: Boolean(clipboard?.getData('text/plain')),
    portableText: [...(clipboard?.types || [])].some(type => type.includes('portable-text')),
  };
  report(observation);
  // Synchronous undefined preserves Studio's native paste behavior.
  return undefined;
}
