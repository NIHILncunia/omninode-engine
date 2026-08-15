import { describe, expect, it } from 'vitest';
import { ApiError, toApiErrorResponse } from '../server/utils/api-error';
import { CreateResponse } from '../server/utils/createResponse';

describe('서버 공통 응답', () => {
  it('단건 성공 응답에 표준 필드를 넣는다', () => {
    expect(CreateResponse.data({ id: 1, })).toEqual({
      error: false,
      data: { id: 1, },
      code: 'OK',
      message: '요청이 정상적으로 처리되었습니다.',
    });
  });

  it('빈 목록의 페이지 상태를 정규화한다', () => {
    expect(CreateResponse.list({
      list: [

      ],
      page: -1,
      pageSize: 0,
      totalElements: -1,
    }).data).toMatchObject({
      page: 0,
      pageSize: 1,
      totalElements: 0,
      totalPages: 0,
      empty: true,
      isFirst: true,
      isLast: true,
      hasPrev: false,
      hasNext: false,
    });
  });

  it('표준 오류 응답을 반환한다', () => {
    expect(CreateResponse.error()).toEqual({
      error: true,
      data: null,
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다.',
    });
  });

  it('API 오류를 상태 코드와 표준 오류 본문으로 변환한다', () => {
    expect(toApiErrorResponse(new ApiError(403, 'FORBIDDEN'))).toEqual({
      statusCode: 403,
      body: {
        error: true,
        data: null,
        code: 'FORBIDDEN',
        message: '해당 요청을 수행할 권한이 없습니다.',
      },
    });
  });

  it('알 수 없는 오류를 내부 서버 오류로 정규화한다', () => {
    expect(toApiErrorResponse(new Error('database unavailable'))).toEqual({
      statusCode: 500,
      body: {
        error: true,
        data: null,
        code: 'INTERNAL_SERVER_ERROR',
        message: '서버 내부 오류가 발생했습니다.',
      },
    });
  });
});
