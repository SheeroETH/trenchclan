-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Supabase Storage — Clan Avatars Bucket
-- Copie TOUT ce fichier dans le SQL Editor de Supabase → Run
-- ═══════════════════════════════════════════════════════════════

-- ─── ÉTAPE 1 : Créer le bucket "clan-avatars" ───
-- Public = true → les images sont accessibles via URL sans auth
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clan-avatars',
  'clan-avatars',
  true,
  2097152,  -- 2MB max
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ─── ÉTAPE 2 : Policy — Tout le monde peut VOIR les avatars ───
drop policy if exists "Public avatar read access" on storage.objects;
create policy "Public avatar read access" on storage.objects
  for select using (bucket_id = 'clan-avatars');

-- ─── ÉTAPE 3 : Policy — Les utilisateurs auth peuvent UPLOAD ───
-- Le chemin est {user_id}/{filename} — chaque user upload dans son dossier
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars" on storage.objects
  for insert with check (
    bucket_id = 'clan-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── ÉTAPE 4 : Policy — Les utilisateurs peuvent UPDATE leurs propres fichiers ───
drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars" on storage.objects
  for update using (
    bucket_id = 'clan-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── ÉTAPE 5 : Policy — Les utilisateurs peuvent DELETE leurs propres fichiers ───
drop policy if exists "Users can delete own avatars" on storage.objects;
create policy "Users can delete own avatars" on storage.objects
  for delete using (
    bucket_id = 'clan-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════
-- ✅ STORAGE MIGRATION TERMINÉE !
-- Tu devrais voir "Success. No rows returned"
-- ═══════════════════════════════════════════
