-- Add timestamp column to messages table
alter table public.messages 
add column if not exists timestamp timestamptz not null default now();

-- Update existing messages with current timestamp
update public.messages
set timestamp = created_at::timestamptz
where timestamp is null;
