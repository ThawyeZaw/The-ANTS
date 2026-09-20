import React from 'react';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

interface EdexcelSuiteSelectorsProps {
  activeQualification: any;
  selectedElectives: string[];
  handleElectiveToggle: (unitCode: string) => void;
  selectedPairIndex: number;
  setSelectedPairIndex: (index: number) => void;
  className?: string;
}

export function EdexcelSuiteSelectors({
  activeQualification,
  selectedElectives,
  handleElectiveToggle,
  selectedPairIndex,
  setSelectedPairIndex,
  className,
}: EdexcelSuiteSelectorsProps) {
  if (!activeQualification?.electiveRules) return null;

  const rules = activeQualification.electiveRules;

  return (
    <div className={cn('space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl', className)}>
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
          Select Optional Units
        </h4>
      </div>
      
      {rules.strategy === 'EXACT_COMBINATION_PAIRS' && rules.validCombinationSets && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-foreground-muted mb-2">
            Select a valid combination of {rules.pickCount} units for this cash-in:
          </p>
          <select
            value={selectedPairIndex}
            onChange={(e) => setSelectedPairIndex(Number(e.target.value))}
            className="w-full bg-background-card border border-primary/30 rounded-xl py-2.5 px-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
          >
            {rules.validCombinationSets.map((pair: string[], index: number) => (
              <option key={index} value={index}>
                {pair.join(' & ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {(rules.strategy === 'CHOOSE_N_FROM_SET' || rules.strategy === 'AT_LEAST_ONE_OF') && rules.allowedUnitPool && (
        <div className="space-y-2">
          <p className="text-[11px] text-foreground-muted mb-2">
            {rules.strategy === 'CHOOSE_N_FROM_SET' 
              ? `Select exactly ${rules.pickCount} optional unit(s) from the following:`
              : `Select at least one optional unit from the following:`}
          </p>
          <div className="flex flex-wrap gap-2">
            {rules.allowedUnitPool.map((unitCode: string) => {
              const isChecked = selectedElectives.includes(unitCode);
              const isDisabled = !isChecked && rules.strategy === 'CHOOSE_N_FROM_SET' && selectedElectives.length >= (rules.pickCount || 0);

              return (
                <button
                  key={unitCode}
                  type="button"
                  onClick={() => handleElectiveToggle(unitCode)}
                  disabled={isDisabled}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                    isChecked 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-background-card text-foreground-secondary border-border hover:border-primary/50',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {unitCode}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
