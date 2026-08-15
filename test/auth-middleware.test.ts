import {
  describe,
  expect,
  it,
} from 'vitest';
import { getAuthRedirect } from '../app/middleware/auth.global';

describe('인증 보호 경로', () => {
  it('공개 경로는 인증되지 않아도 통과시킨다', () => {
    expect(getAuthRedirect('/signin', 'unauthenticated', false)).toBeNull();
    expect(getAuthRedirect('/docs', 'unauthenticated', false)).toBeNull();
  });

  it('인증되지 않은 보호 경로 접근을 로그인으로 보낸다', () => {
    expect(getAuthRedirect('/projects', 'unauthenticated', false)).toBe('/signin');
  });

  it('비밀번호 변경이 필요한 관리자를 변경 화면으로 보낸다', () => {
    expect(getAuthRedirect('/projects', 'authenticated', true)).toBe('/account/password-change');
  });
});
