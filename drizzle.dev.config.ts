import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: '.env.development',
});

const databaseUrl = process.env.DB_FILE_NAME;

if (!databaseUrl) {
  throw new Error('DB_FILE_NAME is not set.');
}

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema/sqlite/index.ts',
  out: './server/db/migrations/sqlite',
  dbCredentials: {
    url: databaseUrl,
  },
});
