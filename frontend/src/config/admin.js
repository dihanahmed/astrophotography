// admin.js - Settings for the online admin section. None of this is secret.

// The address of your Cloudflare Worker (admin-worker/). `npm run worker:deploy`
// prints it at the end; paste it here, without a slash at the end.
export const WORKER_URL = 'https://astro-admin.dihanahmed205.workers.dev';

// Where the photos live on GitHub. The admin panel shows images straight from
// here, so a new upload appears before the live site has finished rebuilding.
export const GITHUB_REPO = 'dihanahmed/astrophotography';
export const GITHUB_BRANCH = 'main';
