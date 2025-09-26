'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';

interface Props {
  orderId: string;
  onUploaded?: () => void;
}

type Item = {
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
};

export function FloorplansUploader({ orderId, onUploaded }: Props) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoStartRef = useRef(false);

  useEffect(() => {
    fetch('/api/s3-status')
      .then((r) => r.json())
      .then((d) => setIsConfigured(d.isConfigured))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (
      autoStartRef.current &&
      items.some((i) => i.status === 'queued' || i.status === 'error') &&
      !uploading
    ) {
      autoStartRef.current = false;
      handleUpload();
    }
  }, [items, uploading]);

  function addFiles(fs: FileList | File[]) {
    const arr = Array.from(fs).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    setItems((prev) => [
      ...prev,
      ...arr.map((f) => ({ file: f, progress: 0, status: 'queued' as const })),
    ]);
    autoStartRef.current = true;
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
    setTimeout(() => {
      autoStartRef.current = true;

      handleUpload();
    }, 0);
  }

  async function uploadOne(
    item: Item
  ): Promise<{ url: string; filename: string } | null> {
    try {
      const pres = await fetch(`/api/orders/${orderId}/media/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'floorplans',
          fileName: item.file.name,
          fileType: item.file.type,
        }),
      });
      if (!pres.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, fileUrl } = await pres.json();
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setItems((prev) =>
              prev.map((it) =>
                it.file === item.file ? { ...it, progress: pct } : it
              )
            );
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error('Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Upload error'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', item.file.type);
        xhr.send(item.file);
        setItems((prev) =>
          prev.map((it) =>
            it.file === item.file
              ? { ...it, status: 'uploading', progress: 0 }
              : it
          )
        );
      });
      setItems((prev) =>
        prev.map((it) =>
          it.file === item.file ? { ...it, status: 'done', progress: 100 } : it
        )
      );
      return { url: fileUrl, filename: item.file.name };
    } catch (e) {
      setItems((prev) =>
        prev.map((it) =>
          it.file === item.file ? { ...it, status: 'error' } : it
        )
      );
      return null;
    }
  }

  async function handleUpload() {
    const queue = items.filter(
      (i) => i.status === 'queued' || i.status === 'error'
    );
    if (!queue.length) return;
    setUploading(true);
    try {
      const results: { url: string; filename: string }[] = [];
      for (const it of queue) {
        const res = await uploadOne(it);
        if (res) results.push(res);
      }
      if (results.length) {
        await fetch(`/api/orders/${orderId}/media/floorplans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(results),
        });
        setItems([]);
        onUploaded?.();
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-md p-4 text-sm ${
          isConfigured ? 'bg-gray-50 border' : 'bg-red-50 border border-red-200'
        }`}
      >
        {isConfigured
          ? 'S3 is configured. Drag and drop images or click to browse.'
          : 'S3 is not configured.'}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files || [])}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex items-center justify-center border-2 border-dashed rounded-md h-28 cursor-pointer ${
          dragging ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <Upload className="h-4 w-4" /> Drop images here or click to select
        </div>
      </div>

      {!!items.length && (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="border rounded-md p-2">
              <div className="flex items-center justify-between text-sm">
                <div className="truncate mr-3">{it.file.name}</div>
                <div className="text-xs text-gray-500">{it.progress}%</div>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded mt-2 overflow-hidden">
                <div
                  className={`h-full ${
                    it.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${it.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={!isConfigured || uploading}
        >
          <Upload className="mr-2 h-4 w-4" /> Browse
        </Button>
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!items.length || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            'Upload'
          )}
        </Button>
      </div>
    </div>
  );
}
