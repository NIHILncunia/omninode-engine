import { describe, expect, it } from 'vitest';
import { uiFixture } from '../app/data/ui-fixture.data';

describe('uiFixture', () => {
  it('프로젝트·월드·문서 fixture를 UI-0 계약대로 제공한다', () => {
    expect(uiFixture.projects).toHaveLength(3);
    expect(uiFixture.worlds).toHaveLength(4);
    expect(uiFixture.documents.some((document) => document.status === 'HIDDEN')).toBe(true);
    expect(uiFixture.documents.every((document) => document.worldId.length > 0 && document.categoryId.length > 0)).toBe(true);
  });

  it('모든 문서는 같은 월드의 카테고리를 참조한다', () => {
    for (const document of uiFixture.documents) {
      const category = uiFixture.categories.find((item) => item.id === document.categoryId);

      expect(category).toBeDefined();
      expect(category?.worldId).toBe(document.worldId);
    }
  });
});
