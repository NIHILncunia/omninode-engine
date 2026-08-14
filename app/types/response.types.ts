export type ResponseCode =
  typeof responseCodeData[keyof typeof responseCodeData];

export type ResponseMessage =
  typeof responseMessageData[keyof typeof responseMessageData];

export type ResponseKey =
  keyof typeof responseCodeData &
  keyof typeof responseMessageData;

export interface BaseResponse<TData> {
  data: TData | null;
  error: boolean;
  code: ResponseCode;
  message: ResponseMessage;
}

export interface ListData<TData> {
  list: TData[]; // 목록 데이터
  page: number; // 현재 페이지
  pageSize: number; // 페이지 크기
  totalElements: number; // 총 데이터 수
  numberOfElements: number; // 조회된 데이터 수
  startIndex: number; // 현재 목록 시작 순번
  endIndex: number; // 현재 목록 마지막 순번
  hasPrev: boolean; // 이전 페이지 존재 여부
  hasNext: boolean; // 다음 페이지 존재 여부
  isFirst: boolean; // 최초 페이지 여부
  isLast: boolean; // 마지막 페이지 여부
  empty: boolean; // 조회된 데이터가 없을 경우
  totalPages: number; // 모든 페이지 수
}

export interface ListResponseInput<TData> {
  list: TData[];
  page: number;
  pageSize: number;
  totalElements: number;
}
