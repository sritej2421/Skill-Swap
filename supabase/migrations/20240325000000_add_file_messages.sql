-- Create chat files storage bucket
insert into storage.buckets (id, name, public) 
values ('chat-files', 'chat-files', true);

-- Create storage policy to allow authenticated uploads
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-files'
  and owner = auth.uid()
);

-- Create storage policy to allow public downloads
create policy "Allow public downloads"
on storage.objects for select
to public
using (bucket_id = 'chat-files');

-- Add message_type column to messages table if not exists
alter table public.messages 
add column if not exists message_type text not null default 'text',
add column if not exists file_url text,
add column if not exists file_name text;

-- Add check constraint for message type
alter table public.messages 
add constraint valid_message_type 
check (message_type in ('text', 'file'));

-- Enable RLS
alter table public.messages enable row level security;
