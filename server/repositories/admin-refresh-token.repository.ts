import { and, eq, gt, type InferSelectModel } from 'drizzle-orm';
import type { DatabaseClient } from '../db/client';
import { adminRefreshTokens } from '../db/schema/postgresql';
import type {
  AdminRefreshTokenRepository,
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RotateRefreshTokenInput,
} from '../services/auth.service';

type RefreshTokenRow = InferSelectModel<typeof adminRefreshTokens>;

function toRefreshTokenRecord(token: RefreshTokenRow): RefreshTokenRecord {
  return {
    id: token.id,
    adminId: token.adminId,
    expiresDate: token.expiresDate,
  };
}

function toInsertValues(input: CreateRefreshTokenInput) {
  return {
    adminId: input.adminId,
    tokenHash: input.tokenHash,
    expiresDate: input.expiresDate,
    deviceInfo: input.deviceInfo ?? null,
  };
}

export function createAdminRefreshTokenRepository(
  database: DatabaseClient,
): AdminRefreshTokenRepository {
  return {
    async create(input: CreateRefreshTokenInput) {
      await database.insert(adminRefreshTokens).values(toInsertValues(input));
    },

    async findActiveByTokenHash(tokenHash: string, now: Date) {
      const [
        refreshToken,
      ] = await database
        .select()
        .from(adminRefreshTokens)
        .where(and(
          eq(adminRefreshTokens.tokenHash, tokenHash),
          eq(adminRefreshTokens.useYn, 'Y'),
          eq(adminRefreshTokens.delYn, 'N'),
          eq(adminRefreshTokens.revokedYn, 'N'),
          gt(adminRefreshTokens.expiresDate, now),
        ))
        .limit(1);

      return refreshToken ? toRefreshTokenRecord(refreshToken) : undefined;
    },

    async rotate(input: RotateRefreshTokenInput) {
      const revokedAt = new Date();

      return database.transaction(async transaction => {
        const revokedTokens = await transaction
          .update(adminRefreshTokens)
          .set({
            revokedYn: 'Y',
            revokedDate: revokedAt,
            updateDate: revokedAt,
          })
          .where(and(
            eq(adminRefreshTokens.id, input.previousTokenId),
            eq(adminRefreshTokens.adminId, input.adminId),
            eq(adminRefreshTokens.revokedYn, 'N'),
          ))
          .returning({ id: adminRefreshTokens.id, });

        if (revokedTokens.length !== 1) {
          return false;
        }

        await transaction.insert(adminRefreshTokens).values(toInsertValues(input));

        return true;
      });
    },

    async revokeByTokenHash(tokenHash: string, revokedAt: Date) {
      await database
        .update(adminRefreshTokens)
        .set({
          revokedYn: 'Y',
          revokedDate: revokedAt,
          updateDate: revokedAt,
        })
        .where(and(
          eq(adminRefreshTokens.tokenHash, tokenHash),
          eq(adminRefreshTokens.revokedYn, 'N'),
        ));
    },

    async revokeAllByAdminId(adminId: number, revokedAt: Date) {
      await database
        .update(adminRefreshTokens)
        .set({
          revokedYn: 'Y',
          revokedDate: revokedAt,
          updateDate: revokedAt,
        })
        .where(and(
          eq(adminRefreshTokens.adminId, adminId),
          eq(adminRefreshTokens.revokedYn, 'N'),
        ));
    },
  };
}
