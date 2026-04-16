import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Smile, Send, Image, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import type { MessageType } from '@/integrations/supabase/types';
import data from '@emoji-mart/data/sets/14/native.json';
import Picker from '@emoji-mart/react';
import { useTheme } from '@/hooks/use-theme';

// Type for emoji-mart data
interface EmojiData {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
}

interface ChatInputBarProps {
  onSendMessage: (
    content: string, 
    messageType: MessageType,
    fileUrl?: string,
    fileName?: string
  ) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

// Helper for file upload
const useFileUpload = (
  onSendMessage: ChatInputBarProps['onSendMessage'],
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  fileInputRef: React.RefObject<HTMLInputElement>,
  imageInputRef: React.RefObject<HTMLInputElement>,
  disabled: boolean
) => {
  const handleFileUpload = async (file: File, type: 'file' | 'image') => {
    if (!file || disabled) return;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop() ?? '';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;
      const bucket = type === 'image' ? 'chat-images' : 'chat-files';
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      await onSendMessage(
        type === 'image' ? `Shared an image: ${file.name}` : `Shared a file: ${file.name}`,
        type,
        publicUrlData.publicUrl,
        file.name
      );
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileUpload(file, 'file');
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileUpload(file, 'image');
  };

  return { handleFileUpload, handleFileSelect, handleImageSelect };
};

// Helper for emoji picker
const useEmojiPicker = (
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setShowEmojiPicker: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const handleEmojiSelect = (emoji: EmojiData) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };
  return { handleEmojiSelect };
};

// Helper for audio recording
const useAudioRecorder = (
  onSendMessage: ChatInputBarProps['onSendMessage'],
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  setRecordingError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);  const handleAudioUpload = async (audioBlob: Blob, mimeType: string) => {
    try {
      console.log('Starting audio upload...', { size: audioBlob.size, type: mimeType });

      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (!session || authError) {
        console.error('Auth error:', authError);
        throw new Error('You must be logged in to send voice messages');
      }

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data received');
      }

      setIsUploading(true);
      
      // Create a new blob with the correct type
      const properBlob = new Blob([audioBlob], { type: 'audio/webm;codecs=opus' });
      console.log('Created proper blob:', { size: properBlob.size, type: properBlob.type });
        const timestamp = new Date().getTime();
      const fileName = `${uuidv4()}-${timestamp}.webm`;
      const filePath = `voice-messages/${fileName}`;
      
      console.log('Uploading file:', { fileName, filePath, contentType: properBlob.type });
      
      // First check if the bucket exists and we have access
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket('chat-files');
        
      if (bucketError) {
        console.error('Bucket access error:', bucketError);
        throw new Error('Unable to access storage bucket. Please check permissions.');
      }
      
      console.log('Bucket access confirmed:', bucketData);
      
      // Attempt upload with proper content type
      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, properBlob, {
          contentType: properBlob.type,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Check if it's a permissions error
        if (uploadError.message?.includes('Permission')) {
          throw new Error('Permission denied to upload file. Please check storage policies.');
        }
        throw uploadError;
      }

      console.log('Upload successful, getting public URL');      console.log('Upload successful, getting public URL');
      
      const { data: publicUrlData, error: urlError } = await supabase.storage
        .from('chat-files')
        .createSignedUrl(filePath, 31536000); // Valid for 1 year
        
      if (urlError || !publicUrlData?.signedUrl) {
        console.error('Error getting signed URL:', urlError);
        const { data: fallbackUrl } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);
          
        if (!fallbackUrl?.publicUrl) {
          throw new Error('Failed to get file URL');
        }
        
        console.log('Using fallback public URL:', fallbackUrl.publicUrl);
        await onSendMessage('Sent a voice message', 'audio', fallbackUrl.publicUrl, fileName);
      } else {
        console.log('Got signed URL:', publicUrlData.signedUrl);
        await onSendMessage('Sent a voice message', 'audio', publicUrlData.signedUrl, fileName);
      }

    } catch (error) {
      console.error('Audio upload error:', error);
      if (error instanceof Error) {
        setRecordingError(`Failed to upload: ${error.message}`);
      } else {
        setRecordingError('Failed to upload voice message');
      }
      throw error; // Re-throw to trigger the recorder cleanup
    } finally {
      setIsUploading(false);
    }
  };
  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      console.log('Microphone access granted');

      // Always use WebM with Opus codec for best compatibility
      const mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('WebM with Opus codec not supported');
      }

      console.log('Creating MediaRecorder with mime type:', mimeType);
      
      const recorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000 
      });

      let chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        console.log('Received data chunk:', e.data.size, 'bytes');
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          console.log('Recording stopped, processing chunks...');
          const audioBlob = new Blob(chunks, { type: mimeType });
          console.log('Created audio blob:', audioBlob.size, 'bytes');
          
          if (audioBlob.size > 0) {
            await handleAudioUpload(audioBlob, mimeType);
          } else {
            throw new Error('No audio data captured');
          }
        } catch (error) {
          console.error('Error in recorder.onstop:', error);
          setRecordingError(error instanceof Error ? error.message : 'Failed to process recording');
        } finally {
          console.log('Cleaning up recording resources');
          chunks = [];
          stream.getTracks().forEach(track => track.stop());
        }
      };
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingError(null);
      recorder.start(1000);
    } catch (error) {
      setRecordingError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  return { isRecording, startRecording, stopRecording };
};

function ChatInputBar({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Type a message..." 
}: ChatInputBarProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // File upload logic
  const { handleFileUpload, handleFileSelect, handleImageSelect } = useFileUpload(
    onSendMessage, setIsUploading, fileInputRef, imageInputRef, disabled
  );

  // Emoji picker logic
  const { handleEmojiSelect } = useEmojiPicker(setMessage, setShowEmojiPicker);

  // Audio recorder logic
  const { isRecording, startRecording, stopRecording } = useAudioRecorder(
    onSendMessage, setIsUploading, setRecordingError
  );

  // Handle clicking outside emoji picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        // Check if the click is not inside the emoji picker
        !(event.target as Element)?.closest('.emoji-mart')
      ) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isSending) return;
    try {
      setIsSending(true);
      console.log('Sending message:', message); // Debug log
      
      // Always send as text type - emojis will render properly
      await onSendMessage(message.trim(), 'text');
      setMessage(''); // Clear input after successful send
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2 p-2 bg-background/95 border-t border-border">
        {/* Left side buttons */}
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.zip,.rar"
            disabled={disabled || isUploading}
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageSelect}
            className="hidden"
            accept="image/*"
            disabled={disabled || isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
          >
            <Image className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        {/* Message input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="flex-1 px-4 py-2 bg-accent/20 dark:bg-accent/30 rounded-lg border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm placeholder:text-muted-foreground"
        />

        {/* Right side buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isUploading}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isRecording 
                ? "text-destructive hover:bg-destructive/10" 
                : "text-muted-foreground hover:text-primary hover:bg-accent"
            )}
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={disabled || isUploading || !message.trim()}
            className="p-2 text-primary hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-0 mb-2"
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme={theme}
            set="native"
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}

      {/* Recording error toast */}
      {recordingError && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg shadow-lg">
          {recordingError}
        </div>
      )}
    </form>
  );
}

export default ChatInputBar;
