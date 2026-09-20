import { useState, useMemo, useEffect } from 'react';
import { EdexcelIALQualificationSpecification } from '@/lib/grading/ial-structure';
import { mathsCashInSelectionStatus } from '@/lib/grading/ial-cash-in';

export function useEdexcelSuiteSelectors(qualificationDataRaw: string | object | null | undefined, initialCashInCode?: string) {
  const [selectedCashIn, setSelectedCashIn] = useState<string>(initialCashInCode || '');
  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);

  const spec = useMemo(() => {
    if (!qualificationDataRaw) return null;
    try {
      const parsed = typeof qualificationDataRaw === 'string'
        ? JSON.parse(qualificationDataRaw)
        : qualificationDataRaw;
      return parsed as EdexcelIALQualificationSpecification;
    } catch (e) {
      console.error('Failed to parse qualification_data', e);
      return null;
    }
  }, [qualificationDataRaw]);

  const availableCashIns = useMemo(() => {
    if (!spec || !spec.qualifications) return [];
    return spec.qualifications;
  }, [spec]);

  useEffect(() => {
    if (!selectedCashIn && availableCashIns.length > 0) {
      setSelectedCashIn(availableCashIns[0].cashInCode);
    }
  }, [selectedCashIn, availableCashIns]);

  const activeQualification = useMemo(() => {
    return availableCashIns.find(q => q.cashInCode === selectedCashIn) || null;
  }, [availableCashIns, selectedCashIn]);

  useEffect(() => {
    setSelectedElectives([]);
    setSelectedPairIndex(0);
  }, [selectedCashIn]);

  // Derived state: what units are currently selected/mandatory?
  const activeUnits = useMemo(() => {
    if (!activeQualification) return new Set<string>();
    const units = new Set<string>(activeQualification.mandatoryUnits);
    
    if (activeQualification.electiveRules) {
      if (activeQualification.electiveRules.strategy === 'EXACT_COMBINATION_PAIRS') {
        const pair = activeQualification.electiveRules.validCombinationSets?.[selectedPairIndex] || [];
        pair.forEach(u => units.add(u));
      } else {
        selectedElectives.forEach(u => units.add(u));
      }
    }
    return units;
  }, [activeQualification, selectedElectives, selectedPairIndex]);

  const combinationStatus = useMemo(() => {
    if (!activeQualification) return { complete: true, message: null };
    const pair =
      activeQualification.electiveRules?.strategy === 'EXACT_COMBINATION_PAIRS'
        ? activeQualification.electiveRules.validCombinationSets?.[selectedPairIndex] || []
        : [];
    return mathsCashInSelectionStatus(activeQualification.cashInCode, selectedElectives, pair);
  }, [activeQualification, selectedElectives, selectedPairIndex]);

  const handleElectiveToggle = (unitCode: string) => {
    if (!activeQualification?.electiveRules) return;
    const rules = activeQualification.electiveRules;
    const pickCount = rules.pickCount || 0;

    setSelectedElectives(prev => {
        if (prev.includes(unitCode)) {
          return prev.filter((u) => u !== unitCode);
        }
        if (prev.length >= pickCount) {
          return prev;
        }
        return [...prev, unitCode];
    });
  };

  return {
    spec,
    availableCashIns,
    selectedCashIn,
    setSelectedCashIn,
    activeQualification,
    selectedElectives,
    handleElectiveToggle,
    selectedPairIndex,
    setSelectedPairIndex,
    activeUnits,
    combinationStatus,
  };
}
