-- PortfolioHub — activities 테이블을 사용자별로 분리하는 스키마.
--
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.
-- 같은 스크립트를 두 번 실행해도 안전하도록 작성했습니다.

-- ---------------------------------------------------------------------------
-- 1. 테이블 (이미 있으면 건너뜁니다)
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 1-1. 기존 테이블의 기본값 보정
--
-- 위 create 문은 테이블이 이미 있으면 통째로 건너뜁니다. 그래서 거기 적힌
-- default 는 기존 테이블에 반영되지 않습니다. 앱은 id 와 created_at 을 보내지
-- 않고 DB가 채워주길 기대하므로, 기본값이 비어 있으면 not null 위반이 납니다.
-- ---------------------------------------------------------------------------
alter table public.activities
  alter column id set default gen_random_uuid(),
  alter column created_at set default now();

alter table public.activities
  alter column created_at set not null;

-- ---------------------------------------------------------------------------
-- 2. 소유자 컬럼
--
-- default auth.uid() 덕분에 클라이언트는 user_id를 보내지 않습니다.
-- 보낼 수 있게 두면 남의 id를 적어 넣을 여지가 생기므로, 값은 DB가 정하고
-- 아래 RLS 정책이 이를 강제합니다.
-- ---------------------------------------------------------------------------
alter table public.activities
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;

-- 기존 행이 있다면 먼저 주인을 정해준 뒤 not null을 걸어야 합니다.
-- 아래 한 줄의 주석을 풀고 '본인 user id'를 넣어 실행하세요.
-- (Supabase 대시보드 > Authentication > Users 에서 확인할 수 있습니다.)
--
-- update public.activities set user_id = '여기에-본인-user-id' where user_id is null;

alter table public.activities
  alter column user_id set not null;

create index if not exists activities_user_id_created_at_idx
  on public.activities (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
--
-- RLS를 켜면 정책에 허용된 행만 보이고 수정됩니다. 앱 코드에서 user_id로
-- 거르지 않아도 되는 이유이자, 익명 키가 브라우저에 노출되어도 안전한 이유입니다.
-- ---------------------------------------------------------------------------
alter table public.activities enable row level security;

-- 기존 정책을 모두 제거합니다.
-- 예전에 만들어 둔 "모두 읽기 허용" 같은 정책이 하나라도 남아 있으면
-- 아래 소유자 제한이 무력화되므로, 이름을 몰라도 전부 지우도록 했습니다.
do $$
declare
  existing record;
begin
  for existing in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'activities'
  loop
    execute format('drop policy if exists %I on public.activities', existing.policyname);
  end loop;
end $$;

create policy "activities_select_own"
  on public.activities for select
  to authenticated
  using (auth.uid() = user_id);

create policy "activities_insert_own"
  on public.activities for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "activities_update_own"
  on public.activities for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "activities_delete_own"
  on public.activities for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. 확인용 조회
--
-- SQL Editor는 마지막 구문의 결과만 보여주므로 한 번에 나오도록 합쳤습니다.
-- 아래 세 가지를 확인하세요.
--   * id 의 default 가 gen_random_uuid(), created_at 의 default 가 now() 인지
--   * user_id 행의 default 가 auth.uid() 이고 nullable 이 NO 인지
--   * policy 행이 select / insert / update / delete 네 개인지
-- ---------------------------------------------------------------------------
select
  'column: ' || column_name
    || ' | default: ' || coalesce(column_default, '(none)')
    || ' | nullable: ' || is_nullable as result
from information_schema.columns
where table_schema = 'public' and table_name = 'activities'
union all
select
  'policy: ' || policyname
    || ' | ' || cmd
    || ' | ' || array_to_string(roles, ',')
from pg_policies
where schemaname = 'public' and tablename = 'activities'
order by result;
