'use client';

import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';

interface RowData {
  id: string;
  candidateName: string;
  q1: number;
  q2: number;
  q3: number;
  total: number;
}

export default function EvaluationMatrix() {
  const [rows, setRows] = useState<RowData[]>([
    { id: '1', candidateName: 'Alice Smith', q1: 10, q2: 15, q3: 20, total: 45 },
    { id: '2', candidateName: 'Bob Jones', q1: 8, q2: 12, q3: 18, total: 38 },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const calculateTotal = (row: Omit<RowData, 'total'>) => {
    return (Number(row.q1) || 0) + (Number(row.q2) || 0) + (Number(row.q3) || 0);
  };

  const handleMarkChange = (id: string, field: keyof RowData, value: string) => {
    setRows(currentRows =>
      currentRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: field === 'candidateName' ? value : Number(value) };
          return { ...updatedRow, total: calculateTotal(updatedRow) };
        }
        return row;
      })
    );
  };

  const addRow = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setRows([...rows, { id: newId, candidateName: '', q1: 0, q2: 0, q3: 0, total: 0 }]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call to Server Action
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
  };

  return (
    <div className="w-full bg-background-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex justify-between items-center bg-background-secondary">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Evaluation Matrix</h3>
          <p className="text-sm text-foreground-muted mt-1">Enter raw marks for each question.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Marks'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background-secondary text-foreground-secondary text-sm">
              <th className="px-6 py-3 font-medium">Candidate Name</th>
              <th className="px-6 py-3 font-medium w-32">Q1 (20)</th>
              <th className="px-6 py-3 font-medium w-32">Q2 (20)</th>
              <th className="px-6 py-3 font-medium w-32">Q3 (20)</th>
              <th className="px-6 py-3 font-medium w-32">Total (60)</th>
              <th className="px-6 py-3 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-background-secondary/50 transition-colors">
                <td className="px-6 py-3">
                  <input
                    type="text"
                    value={row.candidateName}
                    onChange={(e) => handleMarkChange(row.id, 'candidateName', e.target.value)}
                    placeholder="Enter name..."
                    className="w-full px-3 py-1.5 bg-transparent border border-transparent hover:border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-md outline-none text-foreground transition-all"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={row.q1}
                    onChange={(e) => handleMarkChange(row.id, 'q1', e.target.value)}
                    className="w-full px-3 py-1.5 bg-background-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-md outline-none text-foreground"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={row.q2}
                    onChange={(e) => handleMarkChange(row.id, 'q2', e.target.value)}
                    className="w-full px-3 py-1.5 bg-background-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-md outline-none text-foreground"
                  />
                </td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={row.q3}
                    onChange={(e) => handleMarkChange(row.id, 'q3', e.target.value)}
                    className="w-full px-3 py-1.5 bg-background-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-md outline-none text-foreground"
                  />
                </td>
                <td className="px-6 py-3">
                  <div className="w-full px-3 py-1.5 font-semibold text-foreground">
                    {row.total}
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-foreground-muted hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-border bg-background-secondary">
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 text-foreground bg-background-card border border-border hover:bg-background-secondary rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Candidate
        </button>
      </div>
    </div>
  );
}
