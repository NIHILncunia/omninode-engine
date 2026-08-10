import process from 'node:process';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const globalForDatabase = globalThis as typeof globalThis & {
  postgresClient?: ReturnType<typeof postgres>;
  drizzleDatabase?: ReturnType<typeof drizzle>;
};

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  const postgresClient =
    globalForDatabase.postgresClient ??
    postgres(databaseUrl, {
      prepare: false,
    });

  const db = globalForDatabase.drizzleDatabase ?? drizzle(postgresClient);

  if (process.env.NODE_ENV !== 'production') {
    globalForDatabase.postgresClient = postgresClient;
    globalForDatabase.drizzleDatabase = db;
  }

  return {
    db,
    postgresClient,
  };
}

export function getDatabase() {
  return createDatabase();
}
