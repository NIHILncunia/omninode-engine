import type { AdminRole } from '~/types/auth.types';

export type UiDocumentStatus = 'PUBLIC' | 'PRIVATE' | 'DRAFT' | 'HIDDEN' | 'DELETED';
export type UiFixtureState = 'ACTIVE' | 'ARCHIVED' | 'PENDING';

export interface UiFixtureProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: UiFixtureState;
  worldIds: string[];
}

export interface UiFixtureWorld {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  description: string;
  status: UiFixtureState;
  updatedAt: string;
}

export interface UiFixtureCategory {
  id: string;
  worldId: string;
  name: string;
  parentCategoryId: string | null;
  depth: number;
}

export interface UiFixtureDocument {
  id: string;
  worldId: string;
  categoryId: string;
  title: string;
  status: UiDocumentStatus;
  updatedAt: string;
}

export interface UiFixtureAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: UiFixtureState;
  lastSignedInAt: string;
  projectIds: string[];
}

export interface UiFixture {
  projects: UiFixtureProject[];
  worlds: UiFixtureWorld[];
  categories: UiFixtureCategory[];
  documents: UiFixtureDocument[];
  admins: UiFixtureAdmin[];
}

export const uiFixture: UiFixture = {
  projects: [
    {
      id: 'project-yggdrasil',
      name: '프로젝트 위그드라실',
      slug: 'project-yggdrasil',
      description: '메인 세계관과 운영 도구를 함께 관리하는 대표 프로젝트입니다.',
      status: 'ACTIVE',
      worldIds: [
        'world-luxtera',
        'world-eldros',
      ],
    },
    {
      id: 'project-machinaz',
      name: '마키나즈',
      slug: 'machinaz',
      description: '기계 문명 기반 세계관을 정리하는 보조 프로젝트입니다.',
      status: 'ACTIVE',
      worldIds: [
        'world-machinaz-core',
      ],
    },
    {
      id: 'project-archive',
      name: '보관 프로젝트',
      slug: 'archive',
      description: '정비가 끝난 설정과 중단된 실험 월드를 아카이브합니다.',
      status: 'ARCHIVED',
      worldIds: [
        'world-archive-sandbox',
      ],
    },
  ],
  worlds: [
    {
      id: 'world-luxtera',
      projectId: 'project-yggdrasil',
      name: '룩스테라',
      slug: 'luxtera',
      description: '관계형 문서 구조와 공개 설정 문서가 가장 먼저 정비되는 핵심 월드입니다.',
      status: 'ACTIVE',
      updatedAt: '2026-08-17T08:30:00+09:00',
    },
    {
      id: 'world-eldros',
      projectId: 'project-yggdrasil',
      name: '엘드로스',
      slug: 'eldros',
      description: '후속 문서·관계 타입 실험을 위한 보조 월드입니다.',
      status: 'PENDING',
      updatedAt: '2026-08-16T19:45:00+09:00',
    },
    {
      id: 'world-machinaz-core',
      projectId: 'project-machinaz',
      name: '마키나즈 코어',
      slug: 'machinaz-core',
      description: '프로젝트·월드 대시보드 UI 검증용 표본 월드입니다.',
      status: 'ACTIVE',
      updatedAt: '2026-08-15T21:10:00+09:00',
    },
    {
      id: 'world-archive-sandbox',
      projectId: 'project-archive',
      name: '샌드박스 보관소',
      slug: 'archive-sandbox',
      description: '삭제·숨김 문서를 포함한 보관 상태를 점검하는 월드입니다.',
      status: 'ARCHIVED',
      updatedAt: '2026-08-10T14:00:00+09:00',
    },
  ],
  categories: [
    {
      id: 'category-character',
      worldId: 'world-luxtera',
      name: '인물',
      parentCategoryId: null,
      depth: 1,
    },
    {
      id: 'category-region',
      worldId: 'world-luxtera',
      name: '지역',
      parentCategoryId: null,
      depth: 1,
    },
    {
      id: 'category-city',
      worldId: 'world-luxtera',
      name: '도시',
      parentCategoryId: 'category-region',
      depth: 2,
    },
    {
      id: 'category-eldros-region',
      worldId: 'world-eldros',
      name: '지역',
      parentCategoryId: null,
      depth: 1,
    },
    {
      id: 'category-event',
      worldId: 'world-machinaz-core',
      name: '사건',
      parentCategoryId: null,
      depth: 1,
    },
    {
      id: 'category-archive-event',
      worldId: 'world-archive-sandbox',
      name: '보관 사건',
      parentCategoryId: null,
      depth: 1,
    },
  ],
  documents: [
    {
      id: 'document-amiyu',
      worldId: 'world-luxtera',
      categoryId: 'category-character',
      title: '아미유',
      status: 'PUBLIC',
      updatedAt: '2026-08-17T08:55:00+09:00',
    },
    {
      id: 'document-hati',
      worldId: 'world-luxtera',
      categoryId: 'category-character',
      title: '하티 크레실크',
      status: 'DRAFT',
      updatedAt: '2026-08-16T23:10:00+09:00',
    },
    {
      id: 'document-eridian',
      worldId: 'world-luxtera',
      categoryId: 'category-city',
      title: '에리디안',
      status: 'PRIVATE',
      updatedAt: '2026-08-15T20:15:00+09:00',
    },
    {
      id: 'document-hidden-relay',
      worldId: 'world-eldros',
      categoryId: 'category-eldros-region',
      title: '숨겨진 중계탑',
      status: 'HIDDEN',
      updatedAt: '2026-08-15T11:45:00+09:00',
    },
    {
      id: 'document-machinaz-war',
      worldId: 'world-machinaz-core',
      categoryId: 'category-event',
      title: '중앙 기관 반란',
      status: 'PUBLIC',
      updatedAt: '2026-08-14T10:20:00+09:00',
    },
    {
      id: 'document-archive-note',
      worldId: 'world-archive-sandbox',
      categoryId: 'category-archive-event',
      title: '삭제 대기 메모',
      status: 'DELETED',
      updatedAt: '2026-08-10T14:10:00+09:00',
    },
  ],
  admins: [
    {
      id: 'admin-master',
      email: 'master@omninode.local',
      name: '마스터',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      lastSignedInAt: '2026-08-17T09:10:00+09:00',
      projectIds: [
        'project-yggdrasil',
        'project-machinaz',
        'project-archive',
      ],
    },
    {
      id: 'admin-project',
      email: 'project-admin@omninode.local',
      name: '프로젝트 관리자',
      role: 'ADMIN',
      status: 'ACTIVE',
      lastSignedInAt: '2026-08-16T22:20:00+09:00',
      projectIds: [
        'project-yggdrasil',
      ],
    },
  ],
};
