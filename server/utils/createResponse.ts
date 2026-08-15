import type {
  BaseResponse,
  ListData,
  ListResponseInput,
  ResponseKey,
} from '~/types/response.types';
import { responseCodeData } from '~/data/response-code.data';
import { responseMessageData } from '~/data/response-message.data';

export const CreateResponse = {
  data<TData>(
    data: TData,
    code: ResponseKey = 'OK',
    message: ResponseKey = 'OK',
  ): BaseResponse<TData> {
    return {
      error: false,
      data,
      code: responseCodeData[code],
      message: responseMessageData[message],
    };
  },

  list<TData>(
    listData: ListResponseInput<TData>,
    code: ResponseKey = 'OK',
    message: ResponseKey = 'OK',
  ): BaseResponse<ListData<TData>> {
    const {
      list,
      page,
      pageSize,
      totalElements,
    } = listData;

    const normalizedPage = Math.max(0, Math.floor(page));
    const normalizedPageSize = Math.max(1, Math.floor(pageSize));
    const normalizedTotalElements = Math.max(0, Math.floor(totalElements));
    const numberOfElements = list.length;
    const totalPages = Math.ceil(normalizedTotalElements / normalizedPageSize);
    const empty = numberOfElements === 0;
    const startIndex = empty ? 0 : normalizedPage * normalizedPageSize + 1;
    const endIndex = empty ? 0 : startIndex + numberOfElements - 1;
    const isFirst = normalizedPage === 0;
    const isLast = totalPages === 0 || normalizedPage >= totalPages - 1;

    return {
      error: false,
      data: {
        list,
        page: normalizedPage,
        pageSize: normalizedPageSize,
        totalElements: normalizedTotalElements,
        numberOfElements,
        startIndex,
        endIndex,
        hasPrev: !isFirst,
        hasNext: !isLast,
        isFirst,
        isLast,
        empty,
        totalPages,
      },
      code: responseCodeData[code],
      message: responseMessageData[message],
    };
  },

  error(
    code: ResponseKey = 'INTERNAL_SERVER_ERROR',
    message: ResponseKey = 'INTERNAL_SERVER_ERROR',
  ): BaseResponse<null> {
    return {
      error: true,
      data: null,
      code: responseCodeData[code],
      message: responseMessageData[message],
    };
  },
};
