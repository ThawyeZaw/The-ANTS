'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, Link, Loader2, ImageIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadTimelineImage } from '@/lib/timeline-upload';

type TabMode = 'upload' | 'url';

interface ImageUploaderProps {
  /** Current list of image URLs */
  images: string[];
  /** Called to add a new image URL */
  onAdd: (url: string) => void;
  /** Called to remove an image at the given index */
  onRemove: (index: number) => void;
  /** Maximum number of images allowed (default 10) */
  maxImages?: number;
}

export default function ImageUploader({ images, onAdd, onRemove, maxImages = 10 }: ImageUploaderProps) {
  const [tab, setTab] = useState<TabMode>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reachedMax = images.length >= maxImages;

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  // Handle file upload
  const handleFile = useCallback(
    async (file: File) => {
      if (reachedMax) {
        showError(`Maximum ${maxImages} images allowed.`);
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const result = await uploadTimelineImage(file);
        if (result.success && result.url) {
          onAdd(result.url);
        } else {
          showError(result.error || 'Upload failed.');
        }
      } catch {
        showError('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [onAdd, reachedMax, maxImages]
  );

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // URL paste handler
  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (reachedMax) {
      showError(`Maximum ${maxImages} images allowed.`);
      return;
    }
    onAdd(url);
    setUrlInput('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground-secondary">Images</label>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-background-secondary rounded-lg border border-border">
        {[
          { key: 'upload' as TabMode, label: 'Upload', icon: <Upload className="h-3.5 w-3.5" /> },
          { key: 'url' as TabMode, label: 'URL', icon: <Link className="h-3.5 w-3.5" /> },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer',
              tab === t.key
                ? 'bg-background-card text-foreground shadow-sm border border-border'
                : 'text-foreground-muted hover:text-foreground-secondary'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/30'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              if (e.target) e.target.value = '';
            }}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-foreground-muted">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-foreground-secondary">
                {reachedMax ? (
                  <span className="text-amber-400">Maximum images reached</span>
                ) : (
                  <>
                    <span className="font-medium text-primary">Click to upload</span> or drag and drop
                  </>
                )}
              </p>
              <p className="text-xs text-foreground-muted">JPEG, PNG, WebP (max 5MB)</p>
            </div>
          )}
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            className="flex-1 px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="Paste image URL..."
            disabled={reachedMax}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || reachedMax}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-xs text-foreground-muted">
          {images.length} / {maxImages} image{images.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Thumbnail previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative group">
              <div className="w-20 h-20 rounded-lg bg-background-secondary border border-border overflow-hidden">
                <img
                  src={url}
                  alt={`Image ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
