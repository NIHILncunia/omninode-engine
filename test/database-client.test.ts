import { describe, expect, it } from 'vitest';
import { createDatabaseClient } from '../server/db/client';

describe('PostgreSQL DB 클라이언트', () => {
  it('비어 있는 데이터베이스 URL을 즉시 거부한다', () => {
    expect(() => createDatabaseClient('')).toThrow('DATABASE_URL is not set.');
  });
});
