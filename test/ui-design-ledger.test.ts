import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('UI 디자인 진행표', () => {
  it('기능 진행표와 UI 진행표를 분리해 유지한다', () => {
    const ledger = readFileSync(resolve(process.cwd(), 'docs/UI-DESIGN-TODO.md'), 'utf8');

    expect(ledger).toContain('UI-0');
    expect(ledger).toContain('UI-6');
    expect(ledger).toContain('58개 라우트');
    expect(ledger).toContain('루트 `TODO.md`');
  });
});
