import React from 'react';
import EvaluationMatrix from '@/components/exam-editor/EvaluationMatrix';
import BoundaryWeightForm from '@/components/exam-editor/BoundaryWeightForm';

export const metadata = {
  title: 'Exam Evaluation & Boundaries | Editor',
};

export default function ExamEditorPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Exam Syllabus Editor</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage evaluation matrices, set boundary weights, and configure syllabus details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Raw Marks Entry</h2>
            <EvaluationMatrix />
          </section>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Syllabus Weights</h2>
            <BoundaryWeightForm />
          </section>

          {/* Additional Info Box */}
          <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Evaluation Status</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Current Status: <span className="font-bold">Pending Review</span>
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
              Note: You cannot downgrade a status once it has been approved according to the Role Upgrade Rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
