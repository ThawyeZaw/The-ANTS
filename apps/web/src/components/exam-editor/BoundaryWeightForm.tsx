'use client';

import React, { useState, useMemo } from 'react';
import { Save, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ComponentWeight {
  id: string;
  name: string;
  weight: number;
}

export default function BoundaryWeightForm() {
  const [components, setComponents] = useState<ComponentWeight[]>([
    { id: '1', name: 'Paper 1 (Core)', weight: 40 },
    { id: '2', name: 'Paper 2 (Extended)', weight: 40 },
    { id: '3', name: 'Coursework', weight: 20 },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const totalWeight = useMemo(() => {
    return components.reduce((sum, comp) => sum + (Number(comp.weight) || 0), 0);
  }, [components]);

  const isComplete = totalWeight === 100;

  const handleComponentChange = (id: string, field: keyof ComponentWeight, value: string) => {
    setComponents(current =>
      current.map(comp => {
        if (comp.id === id) {
          return { ...comp, [field]: field === 'name' ? value : Number(value) };
        }
        return comp;
      })
    );
  };

  const addComponent = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setComponents([...components, { id: newId, name: '', weight: 0 }]);
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(comp => comp.id !== id));
  };

  const handleSave = async () => {
    if (!isComplete) return;
    setIsSaving(true);
    // Simulate API call to Server Action
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
  };

  return (
    <div className="w-full bg-background-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex justify-between items-center bg-background-secondary">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Component Weights</h3>
          <p className="text-sm text-foreground-muted mt-1">Assign proportional weights for syllabus components.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !isComplete}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Weights'}
        </button>
      </div>

      <div className="p-5">
        <div className="space-y-4">
          {components.map((comp) => (
            <div key={comp.id} className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={comp.name}
                  onChange={(e) => handleComponentChange(comp.id, 'name', e.target.value)}
                  placeholder="Component name (e.g. Paper 1)"
                  className="w-full px-4 py-2 bg-background-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg outline-none text-foreground transition-all"
                />
              </div>
              <div className="w-32 relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={comp.weight}
                  onChange={(e) => handleComponentChange(comp.id, 'weight', e.target.value)}
                  className="w-full pl-4 pr-8 py-2 bg-background-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg outline-none text-foreground text-right transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">%</span>
              </div>
              <button
                onClick={() => removeComponent(comp.id)}
                className="p-2 text-foreground-muted hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addComponent}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-foreground bg-background-secondary hover:bg-background-elevated border border-border rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Component
        </button>

        <div className="mt-8 p-4 rounded-lg bg-background-secondary border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-500" />
            )}
            <div>
              <p className="font-medium text-foreground">Total Weight</p>
              <p className="text-sm text-foreground-muted">Must equal 100%</p>
            </div>
          </div>
          <div className={`text-2xl font-semibold ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
            {totalWeight}%
          </div>
        </div>
      </div>
    </div>
  );
}
