-- Bunon's vector database on Supabase (pgvector). Run once in the Supabase SQL editor.
-- Embeddings: Qwen3-Embedding 0.6B, 1024 dimensions.

create extension if not exists vector with schema extensions;

create table if not exists public.bunon_passages (
  id text not null,
  model text not null,
  org_id text not null,
  doc_id text not null,
  title text not null,
  text text not null,
  embedding extensions.vector(1024) not null,
  updated_at timestamptz not null default now(),
  primary key (id, model)
);
create index if not exists bunon_passages_org on public.bunon_passages (org_id, model);
create index if not exists bunon_passages_doc on public.bunon_passages (doc_id);

-- Row level security on, no policies: only Bunon's server (secret key) can read or write.
alter table public.bunon_passages enable row level security;

-- Nearest passages by cosine distance, within one factory and one embedding model.
create or replace function public.bunon_match_passages(query_embedding extensions.vector(1024), p_org text, p_model text, match_count int)
returns table (id text, score float)
language sql stable
set search_path = public, extensions
as $$
  select p.id, 1 - (p.embedding <=> query_embedding) as score
  from public.bunon_passages p
  where p.org_id = p_org and p.model = p_model
  order by p.embedding <=> query_embedding
  limit match_count;
$$;
revoke execute on function public.bunon_match_passages(extensions.vector, text, text, int) from public, anon, authenticated;

-- Make the REST API see the new table and function right away.
notify pgrst, 'reload schema';
