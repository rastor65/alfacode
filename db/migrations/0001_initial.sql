create extension if not exists pgcrypto;

create type visibility as enum ('PRIVATE', 'INTERNAL', 'PUBLIC');
create type member_status as enum ('ACTIVE', 'INACTIVE', 'ALUMNI');
create type project_status as enum (
  'PROPOSAL',
  'RESEARCH',
  'DESIGN',
  'DEVELOPMENT',
  'VALIDATION',
  'COMPLETED',
  'ARCHIVED'
);
create type milestone_status as enum (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED'
);

create table app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  image_url text,
  email_verified_at timestamptz,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references app_users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  email text not null unique,
  status text not null default 'ACTIVE',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key text not null unique,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  module text not null,
  description text,
  created_at timestamptz not null default now()
);

create table user_roles (
  user_id uuid not null references app_users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  assigned_by uuid references app_users(id),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table media (
  id uuid primary key default gen_random_uuid(),
  store_name text not null,
  path text not null,
  url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  alt_text text,
  caption text,
  visibility visibility not null default 'PRIVATE',
  owner_id uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_name, path)
);

create table members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  photo_media_id uuid references media(id) on delete set null,
  bio text,
  academic_program text,
  semester smallint check (semester is null or semester >= 1),
  joined_at date,
  left_at date,
  status member_status not null default 'ACTIVE',
  email text,
  github_url text,
  linkedin_url text,
  orcid text,
  cvlac_url text,
  scholar_url text,
  portfolio_url text,
  visibility visibility not null default 'INTERNAL',
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table research_lines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon_key text,
  status text not null default 'ACTIVE',
  responsible_member_id uuid references members(id) on delete set null,
  visibility visibility not null default 'PUBLIC',
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  category text,
  icon_url text,
  description text,
  website_url text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  summary text,
  description text,
  problem_statement text,
  objective text,
  solution text,
  start_date date,
  end_date date,
  status project_status not null default 'PROPOSAL',
  visibility visibility not null default 'PRIVATE',
  cover_media_id uuid references media(id) on delete set null,
  repository_url text,
  demo_url text,
  documentation_url text,
  results text,
  impact text,
  published_at timestamptz,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table project_members (
  project_id uuid not null references projects(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  project_role text,
  responsibility text,
  joined_at date,
  left_at date,
  is_lead boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (project_id, member_id)
);

create table project_technologies (
  project_id uuid not null references projects(id) on delete cascade,
  technology_id uuid not null references technologies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, technology_id)
);

create table project_research_lines (
  project_id uuid not null references projects(id) on delete cascade,
  research_line_id uuid not null references research_lines(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, research_line_id)
);

create table project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  target_date date,
  completed_at date,
  status milestone_status not null default 'PENDING',
  responsible_member_id uuid references members(id) on delete set null,
  notes text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  media_id uuid references media(id) on delete set null,
  title text not null,
  resource_type text,
  visibility visibility not null default 'INTERNAL',
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

create table publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  abstract text,
  year int,
  doi text,
  venue text,
  link_url text,
  file_media_id uuid references media(id) on delete set null,
  type text not null,
  project_id uuid references projects(id) on delete set null,
  research_line_id uuid references research_lines(id) on delete set null,
  visibility visibility not null default 'INTERNAL',
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table publication_authors (
  publication_id uuid not null references publications(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  external_author_name text,
  author_order int not null,
  orcid text,
  primary key (publication_id, author_order),
  check (member_id is not null or external_author_name is not null)
);

create table site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  visibility visibility not null default 'PUBLIC',
  updated_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_users(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  ip_address inet
);

create index idx_projects_visibility on projects (visibility);
create index idx_projects_status on projects (status);
create index idx_projects_slug on projects (slug);
create index idx_members_visibility_status on members (visibility, status);
create index idx_project_members_member on project_members (member_id);
create index idx_project_members_lead on project_members (project_id, is_lead);
create index idx_media_visibility on media (visibility);
create index idx_publications_visibility_year on publications (visibility, year desc);

alter table projects enable row level security;
alter table members enable row level security;
alter table research_lines enable row level security;
alter table technologies enable row level security;
alter table media enable row level security;
alter table publications enable row level security;
alter table site_settings enable row level security;

create role app_public;
create role app_user;

create or replace function current_app_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

create or replace function has_permission(user_id uuid, permission_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.user_id = has_permission.user_id
      and p.key = permission_key
  );
$$;

create policy projects_public_select
on projects for select
to app_public, app_user
using (visibility = 'PUBLIC');

create policy projects_internal_select
on projects for select
to app_user
using (
  visibility in ('PUBLIC', 'INTERNAL')
  or has_permission(current_app_user_id(), 'projects.read')
);

create policy projects_manage
on projects for all
to app_user
using (has_permission(current_app_user_id(), 'projects.update'))
with check (has_permission(current_app_user_id(), 'projects.update'));
