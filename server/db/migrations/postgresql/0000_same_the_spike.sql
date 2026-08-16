CREATE TABLE "admin_permission_requests" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"email" varchar(320) NOT NULL,
	"name" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_admin_id" bigint,
	"reviewed_date" timestamp with time zone,
	"rejection_reason" varchar(500),
	"credential_delivered_date" timestamp with time zone,
	"credential_delivery_failed_date" timestamp with time zone,
	CONSTRAINT "ck_admin_permission_requests_use_yn" CHECK ("admin_permission_requests"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_admin_permission_requests_del_yn" CHECK ("admin_permission_requests"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_admin_permission_requests_status" CHECK ("admin_permission_requests"."status" in ('PENDING', 'APPROVED', 'REJECTED'))
);
--> statement-breakpoint
CREATE TABLE "admin_permissions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"project_id" bigint NOT NULL,
	"admin_id" bigint NOT NULL,
	"permission_id" bigint NOT NULL,
	"grant_yn" char(1) DEFAULT 'Y' NOT NULL,
	CONSTRAINT "ck_admin_permissions_use_yn" CHECK ("admin_permissions"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_admin_permissions_del_yn" CHECK ("admin_permissions"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_admin_permissions_grant_yn" CHECK ("admin_permissions"."grant_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "admin_refresh_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"admin_id" bigint NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_date" timestamp with time zone NOT NULL,
	"revoked_yn" char(1) DEFAULT 'N' NOT NULL,
	"revoked_date" timestamp with time zone,
	"device_info" varchar(500),
	CONSTRAINT "ck_admin_refresh_tokens_use_yn" CHECK ("admin_refresh_tokens"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_admin_refresh_tokens_del_yn" CHECK ("admin_refresh_tokens"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_admin_refresh_tokens_revoked_yn" CHECK ("admin_refresh_tokens"."revoked_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"password_change_required_yn" char(1) DEFAULT 'Y' NOT NULL,
	"password_change_required_date" timestamp with time zone,
	"last_sign_in_date" timestamp with time zone,
	CONSTRAINT "ck_admins_use_yn" CHECK ("admins"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_admins_del_yn" CHECK ("admins"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_admins_role" CHECK ("admins"."role" in ('SUPER_ADMIN', 'ADMIN')),
	CONSTRAINT "ck_admins_password_change_required_yn" CHECK ("admins"."password_change_required_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"world_id" bigint NOT NULL,
	"upper_category_id" bigint,
	"template_id" bigint,
	"name" varchar(200) NOT NULL,
	"level" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ck_categories_use_yn" CHECK ("categories"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_categories_del_yn" CHECK ("categories"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_categories_level" CHECK ("categories"."level" between 1 and 3)
);
--> statement-breakpoint
CREATE TABLE "document_categories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"document_id" bigint NOT NULL,
	"category_id" bigint NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "ck_document_categories_use_yn" CHECK ("document_categories"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_document_categories_del_yn" CHECK ("document_categories"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_document_categories_level" CHECK ("document_categories"."level" between 1 and 3)
);
--> statement-breakpoint
CREATE TABLE "document_relationship_targets" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"document_relationship_id" bigint NOT NULL,
	"relationship_type_role_id" bigint NOT NULL,
	"document_id" bigint NOT NULL,
	CONSTRAINT "ck_document_relationship_targets_use_yn" CHECK ("document_relationship_targets"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_document_relationship_targets_del_yn" CHECK ("document_relationship_targets"."del_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "document_relationships" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"world_id" bigint NOT NULL,
	"world_relationship_type_id" bigint NOT NULL,
	"description" text,
	CONSTRAINT "ck_document_relationships_use_yn" CHECK ("document_relationships"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_document_relationships_del_yn" CHECK ("document_relationships"."del_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "document_sections" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"document_id" bigint NOT NULL,
	"section_id" bigint NOT NULL,
	"upper_section_id" bigint,
	"order" integer DEFAULT 0 NOT NULL,
	"template_section_yn" char(1) DEFAULT 'N' NOT NULL,
	"applied_template_version" integer,
	CONSTRAINT "ck_document_sections_use_yn" CHECK ("document_sections"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_document_sections_del_yn" CHECK ("document_sections"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_document_sections_template_section_yn" CHECK ("document_sections"."template_section_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"world_id" bigint NOT NULL,
	"template_id" bigint,
	"template_version" integer,
	"title" varchar(300) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	CONSTRAINT "ck_documents_use_yn" CHECK ("documents"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_documents_del_yn" CHECK ("documents"."del_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	CONSTRAINT "ck_permissions_use_yn" CHECK ("permissions"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_permissions_del_yn" CHECK ("permissions"."del_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "project_admins" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"project_id" bigint NOT NULL,
	"admin_id" bigint NOT NULL,
	CONSTRAINT "ck_project_admins_use_yn" CHECK ("project_admins"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_project_admins_del_yn" CHECK ("project_admins"."del_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"admin_id" bigint NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	CONSTRAINT "ck_projects_use_yn" CHECK ("projects"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_projects_del_yn" CHECK ("projects"."del_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "relationship_type_roles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"relationship_type_id" bigint NOT NULL,
	"name" varchar(200) NOT NULL,
	"display_name" varchar(300) NOT NULL,
	"role_order" integer DEFAULT 0 NOT NULL,
	"required_yn" char(1) DEFAULT 'Y' NOT NULL,
	CONSTRAINT "ck_relationship_type_roles_use_yn" CHECK ("relationship_type_roles"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_relationship_type_roles_del_yn" CHECK ("relationship_type_roles"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_relationship_type_roles_required_yn" CHECK ("relationship_type_roles"."required_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "relationship_types" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"owner_admin_id" bigint,
	"name" varchar(300) NOT NULL,
	"description" text,
	"system_yn" char(1) DEFAULT 'N' NOT NULL,
	"min_target_count" integer DEFAULT 2 NOT NULL,
	"max_target_count" integer DEFAULT 2 NOT NULL,
	CONSTRAINT "ck_relationship_types_use_yn" CHECK ("relationship_types"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_relationship_types_del_yn" CHECK ("relationship_types"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_relationship_types_system_yn" CHECK ("relationship_types"."system_yn" in ('Y', 'N')),
	CONSTRAINT "ck_relationship_types_owner" CHECK (("relationship_types"."system_yn" = 'Y' and "relationship_types"."owner_admin_id" is null) or ("relationship_types"."system_yn" = 'N' and "relationship_types"."owner_admin_id" is not null)),
	CONSTRAINT "ck_relationship_types_count" CHECK ("relationship_types"."min_target_count" >= 2 and "relationship_types"."max_target_count" >= "relationship_types"."min_target_count")
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"title" varchar(300) NOT NULL,
	"level" integer NOT NULL,
	"section_type" varchar(20) NOT NULL,
	CONSTRAINT "ck_sections_use_yn" CHECK ("sections"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_sections_del_yn" CHECK ("sections"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_sections_level" CHECK ("sections"."level" between 1 and 6),
	CONSTRAINT "ck_sections_section_type" CHECK ("sections"."section_type" in ('TEMPLATE', 'DOCUMENT'))
);
--> statement-breakpoint
CREATE TABLE "template_sections" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"template_id" bigint NOT NULL,
	"section_id" bigint NOT NULL,
	"upper_section_id" bigint,
	"order" integer DEFAULT 0 NOT NULL,
	"required_yn" char(1) DEFAULT 'N' NOT NULL,
	CONSTRAINT "ck_template_sections_use_yn" CHECK ("template_sections"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_template_sections_del_yn" CHECK ("template_sections"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_template_sections_required_yn" CHECK ("template_sections"."required_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"world_id" bigint NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "ck_templates_use_yn" CHECK ("templates"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_templates_del_yn" CHECK ("templates"."del_yn" in ('Y', 'N')),
	CONSTRAINT "ck_templates_version" CHECK ("templates"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "world_relationship_role_categories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"world_relationship_type_id" bigint NOT NULL,
	"relationship_type_role_id" bigint NOT NULL,
	"category_id" bigint NOT NULL,
	CONSTRAINT "ck_world_relationship_role_categories_use_yn" CHECK ("world_relationship_role_categories"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_world_relationship_role_categories_del_yn" CHECK ("world_relationship_role_categories"."del_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "world_relationship_types" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"world_id" bigint NOT NULL,
	"relationship_type_id" bigint NOT NULL,
	CONSTRAINT "ck_world_relationship_types_use_yn" CHECK ("world_relationship_types"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_world_relationship_types_del_yn" CHECK ("world_relationship_types"."del_yn" in ('Y', 'N'))
);
--> statement-breakpoint
CREATE TABLE "worlds" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"use_yn" char(1) DEFAULT 'Y' NOT NULL,
	"del_yn" char(1) DEFAULT 'N' NOT NULL,
	"create_id" bigint,
	"update_id" bigint,
	"delete_id" bigint,
	"create_date" timestamp with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp with time zone DEFAULT now() NOT NULL,
	"delete_date" timestamp with time zone,
	"project_id" bigint NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	CONSTRAINT "ck_worlds_use_yn" CHECK ("worlds"."use_yn" in ('Y', 'N')),
	CONSTRAINT "ck_worlds_del_yn" CHECK ("worlds"."del_yn" in ('Y', 'N'))
);
--> statement-breakpoint
ALTER TABLE "admin_permission_requests" ADD CONSTRAINT "admin_permission_requests_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permission_requests" ADD CONSTRAINT "admin_permission_requests_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permission_requests" ADD CONSTRAINT "admin_permission_requests_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permission_requests" ADD CONSTRAINT "admin_permission_requests_reviewed_by_admin_id_admins_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_upper_category_id_categories_id_fk" FOREIGN KEY ("upper_category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationship_targets" ADD CONSTRAINT "document_relationship_targets_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationship_targets" ADD CONSTRAINT "document_relationship_targets_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationship_targets" ADD CONSTRAINT "document_relationship_targets_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationship_targets" ADD CONSTRAINT "document_relationship_targets_document_relationship_id_document_relationships_id_fk" FOREIGN KEY ("document_relationship_id") REFERENCES "public"."document_relationships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationship_targets" ADD CONSTRAINT "document_relationship_targets_relationship_type_role_id_relationship_type_roles_id_fk" FOREIGN KEY ("relationship_type_role_id") REFERENCES "public"."relationship_type_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationship_targets" ADD CONSTRAINT "document_relationship_targets_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationships" ADD CONSTRAINT "document_relationships_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationships" ADD CONSTRAINT "document_relationships_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationships" ADD CONSTRAINT "document_relationships_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationships" ADD CONSTRAINT "document_relationships_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relationships" ADD CONSTRAINT "document_relationships_world_relationship_type_id_world_relationship_types_id_fk" FOREIGN KEY ("world_relationship_type_id") REFERENCES "public"."world_relationship_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_upper_section_id_sections_id_fk" FOREIGN KEY ("upper_section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_admins" ADD CONSTRAINT "project_admins_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_admins" ADD CONSTRAINT "project_admins_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_admins" ADD CONSTRAINT "project_admins_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_admins" ADD CONSTRAINT "project_admins_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_admins" ADD CONSTRAINT "project_admins_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_type_roles" ADD CONSTRAINT "relationship_type_roles_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_type_roles" ADD CONSTRAINT "relationship_type_roles_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_type_roles" ADD CONSTRAINT "relationship_type_roles_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_type_roles" ADD CONSTRAINT "relationship_type_roles_relationship_type_id_relationship_types_id_fk" FOREIGN KEY ("relationship_type_id") REFERENCES "public"."relationship_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_types" ADD CONSTRAINT "relationship_types_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_types" ADD CONSTRAINT "relationship_types_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_types" ADD CONSTRAINT "relationship_types_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_types" ADD CONSTRAINT "relationship_types_owner_admin_id_admins_id_fk" FOREIGN KEY ("owner_admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_sections" ADD CONSTRAINT "template_sections_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_sections" ADD CONSTRAINT "template_sections_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_sections" ADD CONSTRAINT "template_sections_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_sections" ADD CONSTRAINT "template_sections_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_sections" ADD CONSTRAINT "template_sections_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_sections" ADD CONSTRAINT "template_sections_upper_section_id_sections_id_fk" FOREIGN KEY ("upper_section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_role_categories" ADD CONSTRAINT "world_relationship_role_categories_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_role_categories" ADD CONSTRAINT "world_relationship_role_categories_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_role_categories" ADD CONSTRAINT "world_relationship_role_categories_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_role_categories" ADD CONSTRAINT "world_relationship_role_categories_world_relationship_type_id_world_relationship_types_id_fk" FOREIGN KEY ("world_relationship_type_id") REFERENCES "public"."world_relationship_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_role_categories" ADD CONSTRAINT "world_relationship_role_categories_relationship_type_role_id_relationship_type_roles_id_fk" FOREIGN KEY ("relationship_type_role_id") REFERENCES "public"."relationship_type_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_role_categories" ADD CONSTRAINT "world_relationship_role_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_types" ADD CONSTRAINT "world_relationship_types_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_types" ADD CONSTRAINT "world_relationship_types_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_types" ADD CONSTRAINT "world_relationship_types_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_types" ADD CONSTRAINT "world_relationship_types_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_relationship_types" ADD CONSTRAINT "world_relationship_types_relationship_type_id_relationship_types_id_fk" FOREIGN KEY ("relationship_type_id") REFERENCES "public"."relationship_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_create_id_admins_id_fk" FOREIGN KEY ("create_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_update_id_admins_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_delete_id_admins_id_fk" FOREIGN KEY ("delete_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_admin_permission_requests_pending_email" ON "admin_permission_requests" USING btree ("email") WHERE "admin_permission_requests"."status" = 'PENDING' and "admin_permission_requests"."del_yn" = 'N';--> statement-breakpoint
CREATE INDEX "idx_admin_permission_requests_status" ON "admin_permission_requests" USING btree ("status","use_yn","del_yn");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_admin_permissions_project_admin_permission" ON "admin_permissions" USING btree ("project_id","admin_id","permission_id");--> statement-breakpoint
CREATE INDEX "idx_admin_permissions_project_admin_status" ON "admin_permissions" USING btree ("project_id","admin_id","use_yn","del_yn");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_admin_refresh_tokens_hash" ON "admin_refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_admin_refresh_tokens_admin" ON "admin_refresh_tokens" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_refresh_tokens_expire" ON "admin_refresh_tokens" USING btree ("expires_date");--> statement-breakpoint
CREATE INDEX "idx_admin_refresh_tokens_status" ON "admin_refresh_tokens" USING btree ("admin_id","revoked_yn","del_yn");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_admins_email" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_admins_role" ON "admins" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_admins_status" ON "admins" USING btree ("use_yn","del_yn");--> statement-breakpoint
CREATE INDEX "idx_categories_status" ON "categories" USING btree ("world_id","use_yn","del_yn");--> statement-breakpoint
CREATE INDEX "idx_categories_world" ON "categories" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "idx_categories_upper" ON "categories" USING btree ("upper_category_id");--> statement-breakpoint
CREATE INDEX "idx_categories_template" ON "categories" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_categories_tree" ON "categories" USING btree ("world_id","upper_category_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_categories_level" ON "document_categories" USING btree ("document_id","level");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_categories_category" ON "document_categories" USING btree ("document_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_document_categories_category" ON "document_categories" USING btree ("category_id","document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_relationship_targets_role" ON "document_relationship_targets" USING btree ("document_relationship_id","relationship_type_role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_relationship_targets_document" ON "document_relationship_targets" USING btree ("document_relationship_id","document_id");--> statement-breakpoint
CREATE INDEX "idx_document_relationship_targets_document" ON "document_relationship_targets" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_document_relationship_targets_role" ON "document_relationship_targets" USING btree ("relationship_type_role_id");--> statement-breakpoint
CREATE INDEX "idx_document_relationships_world" ON "document_relationships" USING btree ("world_id","use_yn","del_yn");--> statement-breakpoint
CREATE INDEX "idx_document_relationships_type" ON "document_relationships" USING btree ("world_relationship_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_sections_document_section" ON "document_sections" USING btree ("document_id","section_id");--> statement-breakpoint
CREATE INDEX "idx_document_sections_order" ON "document_sections" USING btree ("document_id","order");--> statement-breakpoint
CREATE INDEX "idx_document_sections_upper" ON "document_sections" USING btree ("document_id","upper_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_documents_world_title" ON "documents" USING btree ("world_id","title");--> statement-breakpoint
CREATE INDEX "idx_documents_world" ON "documents" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "idx_documents_template" ON "documents" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_documents_status" ON "documents" USING btree ("world_id","use_yn","del_yn");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_permissions_code" ON "permissions" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_project_admins_project_admin" ON "project_admins" USING btree ("project_id","admin_id");--> statement-breakpoint
CREATE INDEX "idx_project_admins_admin" ON "project_admins" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_project_admins_status" ON "project_admins" USING btree ("project_id","use_yn","del_yn");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_projects_admin_name" ON "projects" USING btree ("admin_id","name");--> statement-breakpoint
CREATE INDEX "idx_projects_admin" ON "projects" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("admin_id","use_yn","del_yn");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_relationship_roles_order" ON "relationship_type_roles" USING btree ("relationship_type_id","role_order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_relationship_roles_name" ON "relationship_type_roles" USING btree ("relationship_type_id","name");--> statement-breakpoint
CREATE INDEX "idx_relationship_roles_required" ON "relationship_type_roles" USING btree ("relationship_type_id","required_yn");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_relationship_types_system_name" ON "relationship_types" USING btree ("system_yn","name") WHERE "relationship_types"."system_yn" = 'Y';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_relationship_types_owner_name" ON "relationship_types" USING btree ("owner_admin_id","name") WHERE "relationship_types"."system_yn" = 'N';--> statement-breakpoint
CREATE INDEX "idx_relationship_types_owner" ON "relationship_types" USING btree ("owner_admin_id");--> statement-breakpoint
CREATE INDEX "idx_relationship_types_system" ON "relationship_types" USING btree ("system_yn");--> statement-breakpoint
CREATE INDEX "idx_sections_type" ON "sections" USING btree ("section_type");--> statement-breakpoint
CREATE INDEX "idx_sections_status" ON "sections" USING btree ("section_type","use_yn","del_yn");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_template_sections_template_section" ON "template_sections" USING btree ("template_id","section_id");--> statement-breakpoint
CREATE INDEX "idx_template_sections_template_order" ON "template_sections" USING btree ("template_id","order");--> statement-breakpoint
CREATE INDEX "idx_template_sections_upper" ON "template_sections" USING btree ("template_id","upper_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_templates_world_name" ON "templates" USING btree ("world_id","name");--> statement-breakpoint
CREATE INDEX "idx_templates_world" ON "templates" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "idx_templates_status" ON "templates" USING btree ("world_id","use_yn","del_yn");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_world_role_categories" ON "world_relationship_role_categories" USING btree ("world_relationship_type_id","relationship_type_role_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_world_role_categories_role" ON "world_relationship_role_categories" USING btree ("world_relationship_type_id","relationship_type_role_id");--> statement-breakpoint
CREATE INDEX "idx_world_role_categories_category" ON "world_relationship_role_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_world_relationship_types" ON "world_relationship_types" USING btree ("world_id","relationship_type_id");--> statement-breakpoint
CREATE INDEX "idx_world_relationship_types_world" ON "world_relationship_types" USING btree ("world_id","use_yn","del_yn");--> statement-breakpoint
CREATE INDEX "idx_world_relationship_types_type" ON "world_relationship_types" USING btree ("relationship_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_worlds_project_name" ON "worlds" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "idx_worlds_project" ON "worlds" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_worlds_status" ON "worlds" USING btree ("project_id","use_yn","del_yn");