import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import * as schema from '../server/db/table';

const expectedTables = {
  adminRequests: 'admin_requests',
  admins: 'admins',
  categories: 'categories',
  documentRevisions: 'document_revisions',
  documents: 'documents',
  projectAdminPermissions: 'project_admin_permissions',
  projectCategories: 'project_categories',
  projectTemplates: 'project_templates',
  projects: 'projects',
  relationshipRoleCategories: 'relationship_role_categories',
  relationshipRoles: 'relationship_roles',
  relationshipTargets: 'relationship_targets',
  relationshipTypes: 'relationship_types',
  relationships: 'relationships',
  templateHeadings: 'template_headings',
  templates: 'templates',
  worldAdmins: 'world_admins',
  worldRelationshipRoleCategories: 'world_relationship_role_categories',
  worldRelationshipTypes: 'world_relationship_types',
  worlds: 'worlds',
} as const;

describe('옴니노드 PostgreSQL 스키마', () => {
  it('명세의 20개 테이블을 snake_case 물리명으로 export한다', () => {
    expect(Object.keys(schema).sort()).toEqual(Object.keys(expectedTables).sort());

    for (const [
      exportName,
      physicalName,
    ] of Object.entries(expectedTables)) {
      const table = schema[exportName as keyof typeof schema];

      expect(getTableConfig(table).name).toBe(physicalName);
    }
  });

  it('모든 테이블에 공통 상태와 감사 컬럼을 선언한다', () => {
    for (const table of Object.values(schema)) {
      expect(Object.keys(table)).toEqual(expect.arrayContaining([
        'id',
        'useYn',
        'delYn',
        'createId',
        'createDate',
        'updateId',
        'updateDate',
        'deleteId',
        'deleteDate',
      ]));
    }
  });

  it('명세의 역할, 상태, 활성 데이터 중복 제한을 선언한다', () => {
    expect(schema.admins.role.enumValues).toEqual([
      'SUPER_ADMIN',
      'ADMIN',
      'SUB_ADMIN',
    ]);
    expect(schema.adminRequests.status.enumValues).toEqual([
      'PENDING',
      'APPROVED',
      'REJECTED',
    ]);
    expect(schema.relationshipTypes.directionType.enumValues).toEqual([
      'DIRECTED',
      'SYMMETRIC',
    ]);

    expect(getTableConfig(schema.projects).indexes.map(index => index.config.name))
      .toContain('uq_projects_world_id_name_active');
    expect(getTableConfig(schema.documents).indexes.map(index => index.config.name))
      .toContain('uq_documents_project_id_title_active');
    expect(getTableConfig(schema.documentRevisions).indexes.map(index => index.config.name))
      .toContain('uq_document_revisions_document_id_current');
  });

  it('활성 행과 관계 대상의 복합 UNIQUE 제약을 선언한다', () => {
    const getIndexNames = (table: Parameters<typeof getTableConfig>[0]) => getTableConfig(table).indexes
      .map(index => index.config.name);

    expect(getIndexNames(schema.worldAdmins))
      .toContain('uq_world_admins_world_id_admin_id_active');
    expect(getIndexNames(schema.projectAdminPermissions))
      .toContain('uq_project_admin_permissions_project_id_admin_id_active');
    expect(getIndexNames(schema.relationshipTargets))
      .toContain('uq_relationship_targets_relationship_id_relationship_role_id_active');
  });
});
