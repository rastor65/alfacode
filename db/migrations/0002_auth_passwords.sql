alter table app_users
add column if not exists password_hash text;

create index if not exists idx_app_users_email_status
on app_users (lower(email), status);
