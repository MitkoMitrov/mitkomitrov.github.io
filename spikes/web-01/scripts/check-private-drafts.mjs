import {getCliClient} from 'sanity/cli';
import {createClient} from '@sanity/client';
import fixture from '../fixtures/article.json' with {type:'json'};
import {runPrivateAcceptance, TEST_TARGET} from '../lib/private-acceptance.mjs';

try {
  const owner = getCliClient({apiVersion:'2025-02-19'}).withConfig({useCdn:false, perspective:'raw'});
  const resume = createClient(owner.config());
  const anonymous = createClient({...TEST_TARGET, apiVersion:'2025-02-19', useCdn:false, perspective:'raw'});
  const result = await runPrivateAcceptance({owner, resume, anonymous, fixture, report(event) {
    // Only controlled stage names, HTTP status and synthetic cleanup IDs.
    // Never print SDK errors/configuration, credentials or article contents.
    if (event.check) console.log(`${event.state.toUpperCase()}: ${event.check}`);
    else console.log(JSON.stringify(event));
  }});
  console.log('LIMITS: API revision guards do not prove Studio stale/offline edit behavior. This is not a full dataset/asset restore, a Word paste test or a publishing test.');
  if (result.state !== 'passed') process.exitCode = 1;
} catch {
  console.error('Private check could not start. Use the configured web01 Studio folder and an active Sanity CLI login. No successful cloud check is claimed.');
  process.exitCode = 1;
}
