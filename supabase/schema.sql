-- DayFlow Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  timezone text default 'Europe/Berlin',
  dark_mode text default 'system' check (dark_mode in ('system', 'light', 'dark')),
  ai_enabled boolean default false,
  notifications_enabled boolean default true,
  daily_briefing_time time default '08:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks table
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null check (length(title) > 0 and length(title) <= 500),
  description text,
  due_date date,
  due_time time,
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  tags text[] default '{}',
  completed boolean default false,
  completed_at timestamptz,
  recurring text check (recurring in ('daily', 'weekly', 'custom')),
  parent_id uuid references public.tasks(id) on delete cascade,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subtasks table
create table if not exists public.subtasks (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null check (length(title) > 0 and length(title) <= 500),
  completed boolean default false,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ideas table
create table if not exists public.ideas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null check (length(title) > 0 and length(title) <= 500),
  content text default '',
  color text default 'default' check (color in ('default', 'red', 'yellow', 'green', 'blue', 'purple')),
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Links table
create table if not exists public.links (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null check (length(url) > 0),
  title text,
  description text,
  image text,
  favicon text,
  status text default 'unread' check (status in ('unread', 'read', 'later')),
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.ideas enable row level security;
alter table public.links enable row level security;

-- Policies: users can only access their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can CRUD own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users can CRUD own subtasks" on public.subtasks for all using (auth.uid() = user_id);
create policy "Users can CRUD own ideas" on public.ideas for all using (auth.uid() = user_id);
create policy "Users can CRUD own links" on public.links for all using (auth.uid() = user_id);

-- Triggers: auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.handle_updated_at();
create trigger ideas_updated_at before update on public.ideas
  for each row execute procedure public.handle_updated_at();
create trigger links_updated_at before update on public.links
  for each row execute procedure public.handle_updated_at();
create trigger subtasks_updated_at before update on public.subtasks
  for each row execute procedure public.handle_updated_at();

-- Trigger: auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for performance
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists tasks_completed_idx on public.tasks(completed);
create index if not exists ideas_user_id_idx on public.ideas(user_id);
create index if not exists links_user_id_idx on public.links(user_id);
create index if not exists links_status_idx on public.links(status);
