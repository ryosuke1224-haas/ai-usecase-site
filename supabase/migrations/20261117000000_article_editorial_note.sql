-- Editorial notes for Japanese blog drafts.
-- Apply this in the Atlas Supabase SQL editor after the review queue migration.
-- Saving a note or accepting a revision does not publish.
-- Publishing remains a separate approved-article action.

alter table public.articles add column if not exists editorial_note text;
alter table public.articles add column if not exists proposed_body text;
alter table public.articles add column if not exists editorial_applied_note text;

alter table public.admin_action_log drop constraint if exists admin_action_log_action_check;
alter table public.admin_action_log add constraint admin_action_log_action_check
  check (action in (
    'approve',
    'needs_changes',
    'reject',
    'publish',
    'save_editorial_note',
    'apply_editorial_note',
    'accept_revision',
    'keep_revision'
  ));
