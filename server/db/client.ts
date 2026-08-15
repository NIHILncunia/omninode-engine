import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/postgresql';

export const createDatabaseClient = (databaseUrl: string) => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  const client = postgres(databaseUrl, {
    prepare: false,
  });

  return drizzle(client, {
    schema,
  });
};

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
