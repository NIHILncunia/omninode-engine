import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: '.env.production',
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set.');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema/postgresql/index.ts',
  out: './server/db/migrations/postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
