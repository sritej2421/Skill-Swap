-- Create chat images storage bucket
insert into storage.buckets (id, name, public) 
values ('chat-images', 'chat-images', true);

-- Create storage policy to allow authenticated uploads
create policy "Allow authenticated image uploads"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-images'
  and owner = auth.uid()
  and (storage.extension(name) = 'jpg' or
       storage.extension(name) = 'jpeg' or
       storage.extension(name) = 'png' or
       storage.extension(name) = 'gif')
);

-- Create storage policy to allow public downloads
create policy "Allow public image downloads"
on storage.objects for select
to public
using (bucket_id = 'chat-images');

-- Add 'image' as a valid message type
alter table public.messages 
drop constraint if exists valid_message_type;

alter table public.messages 
add constraint valid_message_type 
check (message_type in ('text', 'file', 'image'));
