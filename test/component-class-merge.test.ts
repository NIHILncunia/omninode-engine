import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const componentFiles = [
  'app/components/admin/AdminDetail.vue',
  'app/components/admin/AdminEditForm.vue',
  'app/components/admin/AdminList.vue',
  'app/components/admin/AdminPermissionRequestForm.vue',
  'app/components/admin/AdminPermissionRequestList.vue',
  'app/components/auth/AccountProfile.vue',
  'app/components/auth/PasswordChangeForm.vue',
  'app/components/auth/SigninForm.vue',
  'app/components/common/AdminInfoBlock.vue',
  'app/components/common/AppSidebar.vue',
  'app/components/common/EmptyState.vue',
  'app/components/common/ErrorState.vue',
  'app/components/common/LoadingState.vue',
  'app/components/common/SiteLogo.vue',
  'app/components/index/Home.vue',
  'app/components/layout/SiteLinkItem.vue',
  'app/components/project/ProjectAdminInviteForm.vue',
  'app/components/project/ProjectAdminList.vue',
  'app/components/project/ProjectAdminManagement.vue',
  'app/components/ui/UiIcon.vue',
  'app/components/ui/UiImage.vue',
];

describe('렌더링 및 UI 컴포넌트 class 병합 규약', () => {
  it.each(componentFiles)('%s는 class 프롭을 여러 줄 cn 병합으로 루트에 적용한다', (componentFile) => {
    const content = readFileSync(resolve(process.cwd(), componentFile), 'utf8');

    expect(content).toMatch(/const props =/);
    expect(content).toMatch(/class\?: string/);
    expect(content).toMatch(/:class="cn\(\[\r?\n\s+cssVariants\(\{\}\),\r?\n\s+props\.class,?\r?\n\s+\]\)"/);
  });
});
