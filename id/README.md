# VOIDWORKS ID v1.0 — Supabase build

This is the real browser-auth build for GitHub Pages.

## Before uploading
Open `config.js` and replace:

`PASTE_YOUR_SB_PUBLISHABLE_KEY_HERE`

with the Supabase **publishable** key (`sb_publishable_...`). Never use a secret/service_role key.

## Upload structure
Upload the contents of this folder to `/VoidWorks/id/`, keeping the `reset-password/` subfolder.

## Supabase database hardening still required
Run the supplied `004_harden_voidworks_id.sql` once in Supabase SQL Editor before public testing.

## Google
The Google buttons are wired, but Google must be enabled/configured in Supabase Authentication before they can succeed.
