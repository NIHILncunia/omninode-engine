import * as postgresqlSchema from '../server/db/schema/postgresql';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

const toSnakeCase = (value: string) => value.replaceAll(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

const getSqlText = (queryChunks: unknown[]) => queryChunks.map((chunk) => {
  if (typeof chunk !== 'object' || chunk === null) return '';

  if ('name' in chunk && typeof chunk.name === 'string') return chunk.name;
  if ('value' in chunk && Array.isArray(chunk.value)) return chunk.value.join('');

  return '';
}).join('');

const tableNames = {
  admins: 'admins',
  adminRefreshTokens: 'admin_refresh_tokens',
  projectAdmins: 'project_admins',
  projects: 'projects',
  worlds: 'worlds',
  categories: 'categories',
  templates: 'templates',
  sections: 'sections',
  templateSections: 'template_sections',
  documents: 'documents',
  documentCategories: 'document_categories',
  documentSections: 'document_sections',
  relationshipTypes: 'relationship_types',
  relationshipTypeRoles: 'relationship_type_roles',
  worldRelationshipTypes: 'world_relationship_types',
  worldRelationshipRoleCategories: 'world_relationship_role_categories',
  documentRelationships: 'document_relationships',
  documentRelationshipTargets: 'document_relationship_targets',
  permissions: 'permissions',
  adminPermissions: 'admin_permissions',
  adminPermissionRequests: 'admin_permission_requests',
} as const;

describe('PostgreSQL 문서 관리 스키마', () => {
  it('명세의 관리자 요청을 포함한 테이블을 모두 내보낸다', () => {
    for (const tableName of Object.keys(tableNames)) expect(postgresqlSchema).toHaveProperty(tableName);
  });

  it('모든 테이블이 공통 컬럼을 가진다', () => {
    for (const tableName of Object.keys(tableNames)) {
      const table = postgresqlSchema[tableName];
      expect(Object.keys(table)).toEqual(expect.arrayContaining([
        'id',
        'useYn',
        'delYn',
        'createId',
        'updateId',
        'deleteId',
        'createDate',
        'updateDate',
        'deleteDate',
      ]));
    }
  });

  it('문서 본문을 documents.content 하나로 선언한다', () => {
    expect(postgresqlSchema.documents).toHaveProperty('content');
    expect(Object.keys(postgresqlSchema.documentSections)).not.toContain('content');
  });
});

describe('PostgreSQL 문서 관리 스키마 물리 명명', () => {
  it('camelCase export를 snake_case 물리 테이블명으로 선언한다', () => {
    for (const [
      tableKey,
      physicalTableName,
    ] of Object.entries(tableNames)) {
      expect(getTableConfig(postgresqlSchema[tableKey] as never).name).toBe(physicalTableName);
    }
  });

  it('camelCase Drizzle 속성 key를 snake_case 물리 컬럼명으로 선언한다', () => {
    for (const tableKey of Object.keys(tableNames)) {
      const table = postgresqlSchema[tableKey];
      const physicalColumnNames = new Set(getTableConfig(table as never).columns.map(column => column.name));

      for (const [
        columnKey,
        column,
      ] of Object.entries(table)) {
        if (!physicalColumnNames.has(column.name)) continue;

        expect(columnKey).not.toContain('_');
        expect(column.name).toMatch(/^[a-z]+(?:_[a-z0-9]+)*$/);
        expect(column.name).toBe(toSnakeCase(columnKey));
      }
    }
  });
});

describe('PostgreSQL 문서 관리 스키마 기본값 계약', () => {
  it('documents.content의 기본값을 빈 문자열로 선언한다', () => {
    expect(postgresqlSchema.documents.content.default).toBe('');
  });

  it('relationshipTypeRoles의 역할 순서와 필수 여부 기본값을 선언한다', () => {
    expect(postgresqlSchema.relationshipTypeRoles.roleOrder.default).toBe(0);
    expect(postgresqlSchema.relationshipTypeRoles.requiredYn.default).toBe('Y');
  });
});

describe('PostgreSQL 문서 관리 스키마의 sections', () => {
  it('sectionType을 TEMPLATE와 DOCUMENT로 제한하는 enum 및 CHECK를 선언한다', () => {
    expect(postgresqlSchema.sections.sectionType.enumValues).toEqual([
      'TEMPLATE',
      'DOCUMENT',
    ]);
    expect(getTableConfig(postgresqlSchema.sections).checks.map(check => check.name)).toContain('ck_sections_section_type');
  });
});

describe('PostgreSQL 문서 관리 스키마의 admins', () => {
  it('role을 SUPER_ADMIN, ADMIN으로 제한하고 초기 비밀번호 변경을 요구한다', () => {
    expect(postgresqlSchema.admins.role.enumValues).toEqual([
      'SUPER_ADMIN',
      'ADMIN',
    ]);
    expect(postgresqlSchema.admins.passwordChangeRequiredYn.default).toBe('Y');
  });

  it('감사 생성자와 로그인·비밀번호 변경 시각을 새 계약으로 선언한다', () => {
    expect(postgresqlSchema.admins).toHaveProperty('createId');
    expect(postgresqlSchema.admins).toHaveProperty('lastSignInDate');
    expect(postgresqlSchema.admins).toHaveProperty('passwordChangeRequiredDate');
    expect(postgresqlSchema.admins).not.toHaveProperty('createdByAdminId');
    expect(postgresqlSchema.admins).not.toHaveProperty('lastLoginDate');
  });
});

describe('PostgreSQL 관리자 세부 권한 스키마', () => {
  it('권한 마스터와 프로젝트별 관리자 YN 권한을 선언한다', () => {
    expect(postgresqlSchema.permissions).toHaveProperty('code');
    expect(postgresqlSchema.permissions).toHaveProperty('name');
    expect(postgresqlSchema.adminPermissions).toHaveProperty('adminId');
    expect(postgresqlSchema.adminPermissions).toHaveProperty('projectId');
    expect(postgresqlSchema.adminPermissions).toHaveProperty('permissionId');
    expect(postgresqlSchema.adminPermissions.grantYn.default).toBe('Y');
  });

  it('승인형 어드민 요청의 상태·검토·전달 기록을 선언한다', () => {
    expect(postgresqlSchema.adminPermissionRequests.status.enumValues).toEqual([
      'PENDING',
      'APPROVED',
      'REJECTED',
    ]);
    expect(postgresqlSchema.adminPermissionRequests).toHaveProperty('reviewedByAdminId');
    expect(postgresqlSchema.adminPermissionRequests).toHaveProperty('credentialDeliveredDate');
    expect(postgresqlSchema.adminPermissionRequests).toHaveProperty('credentialDeliveryFailedDate');
  });
});

describe('PostgreSQL 문서 관리 스키마 제약', () => {
  const tableConfigs = Object.values(postgresqlSchema).map(table => getTableConfig(table));
  const expectedForeignKeyReferences = [
    'admin_refresh_tokens.admin_id->admins.id',
    'admin_permissions.admin_id->admins.id',
    'admin_permissions.permission_id->permissions.id',
    'admin_permissions.project_id->projects.id',
    'admin_permission_requests.reviewed_by_admin_id->admins.id',
    'categories.template_id->templates.id',
    'categories.upper_category_id->categories.id',
    'categories.world_id->worlds.id',
    'document_categories.category_id->categories.id',
    'document_categories.document_id->documents.id',
    'document_relationships.world_id->worlds.id',
    'document_relationships.world_relationship_type_id->world_relationship_types.id',
    'document_relationship_targets.document_id->documents.id',
    'document_relationship_targets.document_relationship_id->document_relationships.id',
    'document_relationship_targets.relationship_type_role_id->relationship_type_roles.id',
    'document_sections.document_id->documents.id',
    'document_sections.section_id->sections.id',
    'document_sections.upper_section_id->sections.id',
    'documents.template_id->templates.id',
    'documents.world_id->worlds.id',
    'project_admins.admin_id->admins.id',
    'project_admins.project_id->projects.id',
    'projects.admin_id->admins.id',
    'relationship_type_roles.relationship_type_id->relationship_types.id',
    'relationship_types.owner_admin_id->admins.id',
    'template_sections.section_id->sections.id',
    'template_sections.template_id->templates.id',
    'template_sections.upper_section_id->sections.id',
    'templates.world_id->worlds.id',
    'world_relationship_role_categories.category_id->categories.id',
    'world_relationship_role_categories.relationship_type_role_id->relationship_type_roles.id',
    'world_relationship_role_categories.world_relationship_type_id->world_relationship_types.id',
    'world_relationship_types.relationship_type_id->relationship_types.id',
    'world_relationship_types.world_id->worlds.id',
    'worlds.project_id->projects.id',
  ];
  const expectedAuditForeignKeyReferences = Object.values(tableNames).flatMap(tableName => [
    `${tableName}.create_id->admins.id`,
    `${tableName}.update_id->admins.id`,
    `${tableName}.delete_id->admins.id`,
  ]);

  const expectedVarcharLengths = {
    'adminRefreshTokens.deviceInfo': 500,
    'adminRefreshTokens.tokenHash': 255,
    'admins.email': 320,
    'admins.name': 100,
    'admins.passwordHash': 255,
    'admins.role': 20,
    'categories.name': 200,
    'documents.title': 300,
    'projects.name': 200,
    'relationshipTypeRoles.displayName': 300,
    'relationshipTypeRoles.name': 200,
    'relationshipTypes.name': 300,
    'sections.sectionType': 20,
    'sections.title': 300,
    'templates.name': 200,
    'worlds.name': 200,
  } as const;

  it('초안의 모든 VARCHAR 컬럼을 지정 길이의 varchar로 선언한다', () => {
    for (const [
      columnPath,
      length,
    ] of Object.entries(expectedVarcharLengths)) {
      const [
        tableName,
        columnName,
      ] = columnPath.split('.') as [keyof typeof postgresqlSchema, string];
      const column = postgresqlSchema[tableName][columnName as never];

      expect(column.getSQLType()).toBe(`varchar(${length})`);
    }
  });

  it('98개 외래키의 원본과 대상 열을 정확히 ON DELETE NO ACTION으로 선언한다', () => {
    const foreignKeys = tableConfigs.flatMap(table => table.foreignKeys.map((foreignKey) => {
      const reference = foreignKey.reference();
      const sourceColumns = reference.columns.map(column => column.name).join(',');
      const targetColumns = reference.foreignColumns.map(column => column.name).join(',');
      const targetTable = getTableConfig(reference.foreignTable).name;

      return {
        onDelete: foreignKey.onDelete,
        reference: `${table.name}.${sourceColumns}->${targetTable}.${targetColumns}`,
      };
    }));

    expect(foreignKeys).toHaveLength(98);
    expect(foreignKeys.every(foreignKey => foreignKey.onDelete === 'no action')).toBe(true);
    expect(foreignKeys.map(foreignKey => foreignKey.reference).sort()).toEqual(expectedForeignKeyReferences.concat(expectedAuditForeignKeyReferences).sort());
  });

  it('모든 YN 컬럼의 CHECK가 Y와 N을 허용한다', () => {
    for (const table of tableConfigs) {
      const ynColumns = table.columns.filter(column => column.name.endsWith('_yn'));

      for (const column of ynColumns) {
        const checkName = `ck_${table.name}_${column.name}`;
        const check = table.checks.find(candidate => candidate.name === checkName);

        expect(check).toBeDefined();
        expect(getSqlText(check?.value.queryChunks ?? [
        ])).toContain(column.name);
        expect(getSqlText(check?.value.queryChunks ?? [
        ])).toContain('\'Y\'');
        expect(getSqlText(check?.value.queryChunks ?? [
        ])).toContain('\'N\'');
      }
    }
  });

  it('관계 유형 이름 부분 UNIQUE 인덱스의 고유성과 WHERE 조건을 선언한다', () => {
    const relationshipTypeIndexes = getTableConfig(postgresqlSchema.relationshipTypes).indexes;
    const expectedPartialUniqueIndexes = {
      uq_relationship_types_system_name: 'system_yn=\'Y\'',
      uq_relationship_types_owner_name: 'system_yn=\'N\'',
    };

    for (const [
      name,
      where,
    ] of Object.entries(expectedPartialUniqueIndexes)) {
      const index = relationshipTypeIndexes.find(candidate => candidate.config.name === name);

      expect(index?.config.unique).toBe(true);
      expect(getSqlText(index?.config.where?.queryChunks ?? [
      ]).replaceAll(/\s/g, '')).toBe(where);
    }
  });
});
