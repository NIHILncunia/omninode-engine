import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

describe('상태 API', () => {
  it('DB 연결 없이 서비스 상태를 표준 응답으로 반환한다', async () => {
    vi.stubGlobal(
      'defineEventHandler',
      <THandler>(handler: THandler): THandler => handler,
    );

    const healthModule = await import(
      '../server/api/health.get',
    );
    const healthHandler = healthModule.default;

    expect(healthHandler({} as never)).toEqual({
      error: false,
      data: { status: 'ok', },
      code: 'OK',
      message: '요청이 정상적으로 처리되었습니다.',
    });
  });
});

afterEach(() => vi.unstubAllGlobals());
