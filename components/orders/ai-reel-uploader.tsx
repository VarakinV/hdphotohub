'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface AiReelUploaderProps {
  orderId: string;
  onGenerated?: () => void;
}

export function AiReelUploader({ orderId, onGenerated }: AiReelUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(f: File) {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }

  async function handleGenerate() {
    if (!file) return;
    setUploading(true);
    setGenerating(false);

    try {
      // Step 1: Get presigned URL and upload to S3
      const pres = await fetch(`/api/orders/${orderId}/media/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'reels-sources',
          fileName: file.name,
          fileType: file.type,
        }),
      });
      if (!pres.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, fileUrl } = await pres.json();

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      setUploading(false);
      setGenerating(true);

      // Step 2: Trigger AI reel generation
      const genRes = await fetch(`/api/orders/${orderId}/ai-reels/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceImageUrl: fileUrl }),
      });

      if (!genRes.ok) {
        const err = await genRes.json().catch(() => ({}));
        const msg = err.missing ? `Missing: ${err.missing.join(', ')}` : (err.error || 'Failed');
        throw new Error(msg);
      }

      toast.success('AI Reel generation started! The process takes a few minutes.');
      setFile(null);
      setPreview(null);
      onGenerated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate AI reel');
    } finally {
      setUploading(false);
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
        <strong>AI Twilight Reel:</strong> Upload a daytime exterior photo of the house.
        The AI will transform it into a twilight version and generate a cinematic
        day-to-twilight transition reel with property info and agent branding.
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) selectFile(f);
        }}
      />

      {preview ? (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="relative w-48 h-36 rounded-md overflow-hidden border">
            <Image src={preview} alt="Selected photo" fill className="object-cover" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-700 truncate max-w-xs">{file?.name}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreview(null); }}>
                Remove
              </Button>
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                Change
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center justify-center border-2 border-dashed rounded-md h-32 cursor-pointer transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-muted hover:border-gray-400'
          }`}
        >
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Upload className="h-4 w-4" /> Drop a daytime house photo here or click to select
          </div>
        </div>
      )}

      <Button onClick={handleGenerate} disabled={!file || uploading || generating}>
        {uploading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
        ) : generating ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting AI Generation...</>
        ) : (
          <><Sparkles className="mr-2 h-4 w-4" /> Generate AI Twilight Reel</>
        )}
      </Button>
    </div>
  );
}
