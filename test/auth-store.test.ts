import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  createPinia,
  setActivePinia,
} from 'pinia';
import { useAuthStore } from '../app/stores/auth.store';

describe('인증 상태', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('인증과 비밀번호 변경 필요 상태를 독립적으로 전이한다', () => {
    const auth = useAuthStore();

    auth.onSetAuthenticated(false);

    expect(auth.status).toBe('authenticated');
    expect(auth.passwordChangeRequired).toBe(false);

    auth.onSetPasswordChangeRequired();

    expect(auth.passwordChangeRequired).toBe(true);

    auth.onSetUnauthenticated();

    expect(auth.status).toBe('unauthenticated');
    expect(auth.passwordChangeRequired).toBe(false);
  });
});
