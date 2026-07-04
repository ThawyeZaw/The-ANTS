'use client';

import { useState } from 'react';
import { Plus, Trash2, ShieldCheck, Globe, BookOpen, Award, PenTool } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { CertificationType } from '@/types';

interface Certification {
  id: string;
  type: string;
  subject?: string | null;
  exam_board?: string | null;
  grade?: string | null;
  year?: number | null;
  certificate_url?: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  order_no?: number | null;
}

interface CertificationEditorProps {
  certifications: Certification[];
  onAdd: (data: {
    type: string;
    subject?: string | null;
    exam_board?: string | null;
    grade?: string | null;
    year?: number | null;
  }) => { success: boolean; error?: string };
  onUpdate: (certId: string, updates: Record<string, unknown>) => { success: boolean; error?: string };
  onDelete: (certId: string) => { success: boolean; error?: string };
}

const CERT_TYPES: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'igcse', label: 'IGCSE', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'as_level', label: 'AS Level', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'a_level', label: 'A Level', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'ielts', label: 'IELTS', icon: <Globe className="h-4 w-4" /> },
  { value: 'toefl', label: 'TOEFL', icon: <Globe className="h-4 w-4" /> },
  { value: 'sat', label: 'SAT', icon: <PenTool className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <Award className="h-4 w-4" /> },
];

export default function CertificationEditor({ certifications, onAdd, onUpdate, onDelete }: CertificationEditorProps) {
  const [type, setType] = useState('igcse');
  const [subject, setSubject] = useState('');
  const [examBoard, setExamBoard] = useState('');
  const [grade, setGrade] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    if (!type) {
      setError('Type is required.');
      return;
    }
    const result = onAdd({
      type,
      subject: subject || null,
      exam_board: examBoard || null,
      grade: grade || null,
      year: year ? parseInt(year) : null,
    });
    if (!result.success) {
      setError(result.error || 'Failed to add certification.');
      return;
    }
    setSubject('');
    setExamBoard('');
    setGrade('');
    setYear('');
  };

  const handleToggleHidden = (cert: Certification) => {
    onUpdate(cert.id, { is_hidden: !cert.is_hidden });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-background-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Add Certification</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-border bg-background-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {CERT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Mathematics" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">Exam Board</label>
            <Input value={examBoard} onChange={(e) => setExamBoard(e.target.value)} placeholder="e.g., Cambridge" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">Grade</label>
            <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g., A* or Band 8.0" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">Year</label>
            <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g., 2025" type="number" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        <div className="mt-4">
          <Button onClick={handleAdd} icon={<Plus className="h-4 w-4" />}>Add Certification</Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Your Certifications ({certifications.length})
        </h3>
        {certifications.length === 0 ? (
          <p className="text-sm text-foreground-muted">No certifications added yet.</p>
        ) : (
          certifications.map((cert) => {
            const typeInfo = CERT_TYPES.find((t) => t.value === cert.type);
            return (
              <div
                key={cert.id}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  cert.is_hidden ? 'border-border bg-background opacity-50' : 'border-border bg-background-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {typeInfo?.icon || <Award className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {typeInfo?.label || cert.type}
                        {cert.subject ? ` - ${cert.subject}` : ''}
                      </span>
                      {cert.is_verified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                      )}
                    </div>
                    <p className="text-xs text-foreground-muted">
                      {[cert.exam_board, cert.grade, cert.year].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleHidden(cert)}
                    className="rounded-lg p-1.5 text-foreground-muted hover:bg-background-hover hover:text-foreground"
                    title={cert.is_hidden ? 'Show on profile' : 'Hide from profile'}
                  >
                    {cert.is_hidden ? 'Show' : 'Hide'}
                  </button>
                  <button
                    onClick={() => onDelete(cert.id)}
                    className="rounded-lg p-1.5 text-foreground-muted hover:bg-error/10 hover:text-error"
                    title="Delete certification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
