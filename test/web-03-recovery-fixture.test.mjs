import test from 'node:test';
import assert from 'node:assert/strict';

// Deliberate failure for an isolated draft PR. Never merge this fixture.
test('WEB-03 isolated build failure', () => {
  assert.fail('Intentional WEB-03 fixture: the Pages artifact upload must be skipped.');
});
