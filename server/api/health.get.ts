import { CreateResponse } from '../utils/createResponse';

export default defineEventHandler(() => CreateResponse.data({
  status: 'ok' as const,
}));
