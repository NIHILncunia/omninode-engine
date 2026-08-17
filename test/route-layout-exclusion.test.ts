import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readPage = (pagePath: string): string => readFileSync(
  resolve(process.cwd(), pagePath),
  'utf8',
);

describe('UI 전환 제외 라우트', () => {
  it('/, /about, /settings는 layout false를 명시한다', () => {
    const indexPage = readPage('app/pages/index.vue');
    const aboutPage = readPage('app/pages/about.vue');
    const settingsPage = readPage('app/pages/settings.vue');

    expect(indexPage).toContain('definePageMeta({ layout: false, });');
    expect(aboutPage).toContain('definePageMeta({ layout: false, });');
    expect(settingsPage).toContain('definePageMeta({ layout: false, });');
  });

  it('/는 기존 /docs 리디렉션을 유지한다', () => {
    const indexPage = readPage('app/pages/index.vue');

    expect(indexPage).toContain('await navigateTo(\'/docs\', { replace: true, });');
  });
});
