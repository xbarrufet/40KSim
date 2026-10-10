-- 40KSim Supabase schema
-- Run against your Supabase project to create the shared data tables.

create table if not exists factions (
  slug text primary key,
  name text not null,
  category text,
  icon text,
  unit_count integer not null default 0
);

create table if not exists units (
  faction_slug text not null references factions(slug) on delete cascade,
  slug text not null,
  name text not null,
  category text,
  points integer,
  keywords text[] not null default '{}',
  primary key (faction_slug, slug)
);

create table if not exists base_data (
  faction_slug text not null,
  unit_slug text not null,
  data jsonb not null,
  primary key (faction_slug, unit_slug),
  foreign key (faction_slug, unit_slug) references units(faction_slug, slug) on delete cascade
);

create table if not exists unit_data (
  faction_slug text not null,
  unit_slug text not null,
  tag text not null default 'PENDING',
  abilities jsonb not null default '[]',
  raw_abilities jsonb not null default '[]',
  base_data_hash text,
  primary key (faction_slug, unit_slug),
  foreign key (faction_slug, unit_slug) references units(faction_slug, slug) on delete cascade
);
