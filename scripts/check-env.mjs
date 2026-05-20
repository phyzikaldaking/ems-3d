import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const strict = process.argv.includes('--strict');
const envFiles = ['.env.local', '.env', '.env.production'];
const required = ['NEXT_PUBLIC_SITE_URL', 'EMS_API_URL', 'STRIPE_SECRET_KEY'];
const optional = ['NEXT_PUBLIC_LAUNCH_MODE', 'POSTHOG_API_KEY', 'POSTHOG_HOST'];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return acc;

      const index = trimmed.indexOf('=');
      if (index === -1) return acc;

      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
      acc[key] = value;
      return acc;
    }, {});
}

const fileEnv = envFiles
  .map((file) => parseEnvFile(resolve(process.cwd(), file)))
  .reduce((acc, entries) => ({ ...acc, ...entries }), {});

const mergedEnv = { ...fileEnv, ...process.env };
const missingRequired = required.filter((key) => !mergedEnv[key]);
const missingOptional = optional.filter((key) => !mergedEnv[key]);

if (missingRequired.length === 0) {
  console.log('Launch env: required variables are configured.');
} else {
  console.log(`Launch env: missing required variables: ${missingRequired.join(', ')}`);
}

if (missingOptional.length > 0) {
  console.log(`Launch env: optional variables not set: ${missingOptional.join(', ')}`);
}

if (strict && missingRequired.length > 0) {
  process.exit(1);
}
