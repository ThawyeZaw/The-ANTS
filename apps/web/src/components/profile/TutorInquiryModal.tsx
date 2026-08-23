'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Tutor Inquiry Modal
// Generates formatted Telegram messages and QR code for student bookings.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  X,
  Send,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Clock,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorName: string;
  telegramHandle?: string;
  hourlyRate?: string;
  selectedSlot?: { day: string; time: string; status: string } | null;
  teachingSubjects?: string[];
}

export default function TutorInquiryModal({
  isOpen,
  onClose,
  tutorName,
  telegramHandle,
  hourlyRate,
  selectedSlot,
  teachingSubjects,
}: TutorInquiryModalProps) {
  const [selectedSubject, setSelectedSubject] = useState(
    teachingSubjects && teachingSubjects.length > 0 ? teachingSubjects[0] : ''
  );
  const [studentNote, setStudentNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cleanHandle = (telegramHandle || '').replace('@', '').trim();

  // Construct message
  let message = `👋 Hello ${tutorName}! I found your profile on The ANTs academic platform.\n\n`;
  if (selectedSubject) {
    message += `📚 Subject: ${selectedSubject}\n`;
  }
  if (selectedSlot) {
    message += `🗓️ Preferred Time Slot: ${selectedSlot.day} at ${selectedSlot.time}\n`;
  }
  if (studentNote.trim()) {
    message += `💬 Note: ${studentNote.trim()}\n`;
  }
  message += `\nI would love to inquire about lesson availability. Thank you!`;

  const encodedText = encodeURIComponent(message);
  const telegramUrl = cleanHandle
    ? `https://t.me/${cleanHandle}?text=${encodedText}`
    : `https://t.me/?text=${encodedText}`;

  // QR Code URL via public SVG QR generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    telegramUrl
  )}&bgcolor=13131a&color=6366f1&margin=10`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-overlay/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-background-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-background-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Inquire with {tutorName}</h2>
              <p className="text-xs text-foreground-muted">
                Connect on Telegram to book lessons or request schedule slots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Selected Slot indicator */}
          {selectedSlot && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-emerald-600">Selected Schedule Slot</p>
                <p className="text-foreground-muted">
                  {selectedSlot.day} at {selectedSlot.time} (
                  <span className="capitalize">{selectedSlot.status}</span>)
                </p>
              </div>
            </div>
          )}

          {/* Subject selector */}
          {teachingSubjects && teachingSubjects.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Select Subject
              </label>
              <div className="flex flex-wrap gap-2">
                {teachingSubjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer',
                      selectedSubject === sub
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background-secondary text-foreground-muted hover:text-foreground border-border'
                    )}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Student custom note */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Personal Note / Goal (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Preparing for May/June Cambridge IGCSE exams..."
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Formatted Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Formatted Telegram Message
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <div className="p-3.5 rounded-2xl bg-background-secondary border border-border text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">
              {message}
            </div>
          </div>

          {/* QR Code section for Mobile Scan */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-background-secondary/50 border border-border/80">
            <div className="w-24 h-24 rounded-xl bg-background-card border border-border flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-xs">
              <img
                src={qrCodeUrl}
                alt="Telegram Inquiry QR Code"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <QrCode className="w-4 h-4 text-primary" />
                Scan to Chat on Mobile
              </div>
              <p className="text-[11px] text-foreground-muted leading-snug">
                Scan this QR code with your phone camera or Telegram scanner to start the conversation immediately.
              </p>
              {cleanHandle && (
                <p className="text-[11px] font-mono text-primary pt-0.5">
                  Telegram: @{cleanHandle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border bg-background-secondary/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
          >
            Close
          </button>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Open in Telegram
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}
