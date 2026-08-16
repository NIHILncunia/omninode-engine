import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { useAdministratorStore } from '../app/stores/administrator.store';

describe('administrator store', () => {
  it('replaces list and detail state with the latest server payload', () => {
    setActivePinia(createPinia());
    const store = useAdministratorStore();

    store.onSetList({
      list: [
        {
          id: 1,
          email: 'old@example.com',
          name: '이전 이름',
          role: 'ADMIN',
          useYn: 'Y',
          passwordChangeRequiredYn: 'N',
          lastSignInDate: null,
          createDate: '2026-08-16T00:00:00.000Z',
          updateDate: '2026-08-16T00:00:00.000Z',
        },
      ],
      totalElements: 1,
    });
    store.onSetList({
      list: [
        {
          id: 1,
          email: 'new@example.com',
          name: '최신 이름',
          role: 'ADMIN',
          useYn: 'N',
          passwordChangeRequiredYn: 'Y',
          lastSignInDate: null,
          createDate: '2026-08-16T00:00:00.000Z',
          updateDate: '2026-08-16T01:00:00.000Z',
        },
      ],
      totalElements: 1,
    });
    store.onSetDetail({
      id: 1,
      email: 'new@example.com',
      name: '최신 이름',
      role: 'ADMIN',
      useYn: 'N',
      passwordChangeRequiredYn: 'Y',
      lastSignInDate: null,
      createDate: '2026-08-16T00:00:00.000Z',
      updateDate: '2026-08-16T01:00:00.000Z',
    });

    expect(store.list[0]?.name).toBe('최신 이름');
    expect(store.totalElements).toBe(1);
    expect(store.detailById[1]?.useYn).toBe('N');
  });
});
