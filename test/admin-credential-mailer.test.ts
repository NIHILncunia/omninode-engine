import { describe, expect, it } from 'vitest';
import { createAdminCredentialMailer } from '../server/utils/admin-credential-mailer';

describe('관리자 초기 비밀번호 SMTP 전달', () => {
  it('필수 SMTP 설정이 없으면 전달자를 구성하지 않는다', () => {
    const mailer = createAdminCredentialMailer({
      host: undefined,
      port: undefined,
      secure: undefined,
      user: undefined,
      password: undefined,
      from: undefined,
    });

    expect(mailer.isConfigured()).toBe(false);
  });
});
