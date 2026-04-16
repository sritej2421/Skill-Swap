-- Drop existing type constraint if it exists
do $$ begin
    alter table public.messages 
    drop constraint if exists messages_message_type_check;
exception
    when others then null;
end $$;

-- Add emoji to message_type enum
alter table public.messages
    add constraint messages_message_type_check
    check (message_type in ('text', 'file', 'image', 'emoji'));
