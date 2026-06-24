'use client';

import { useState, useMemo } from 'react';
import { evaluatePasswordStrength } from '@/lib/password-strength';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  showSuggestions?: boolean;
}

const labelMap: Record<string, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
  very_strong: 'Very Strong',
};

const progressMap: Record<string, number> = {
  weak: 15,
  fair: 30,
  good: 50,
  strong: 70,
  very_strong: 100,
};

const barColor: Record<string, string> = {
  weak: 'bg-red-500',
  fair: 'bg-amber-500',
  good: 'bg-blue-500',
  strong: 'bg-emerald-500',
  very_strong: 'bg-emerald-600',
};

export function PasswordStrengthMeter({ password, showSuggestions = true }: PasswordStrengthMeterProps) {
  const result = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${result.color}`}>
          {labelMap[result.label]}
        </span>
        <span className="text-xs text-gray-400">{result.score}/100</span>
      </div>
      <Progress
        value={progressMap[result.label]}
        className="h-1.5"
        indicatorClassName={barColor[result.label]}
      />
      {(showSuggestions && (result.cracks.length > 0 || result.suggestions.length > 0)) && (
        <div className="space-y-1 pt-1">
          {result.cracks.map((crack, i) => (
            <div key={`crack-${i}`} className="flex items-start gap-1.5">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
              <span className="text-xs text-red-600">{crack}</span>
            </div>
          ))}
          {result.suggestions.slice(0, 2).map((suggestion, i) => (
            <div key={`suggestion-${i}`} className="flex items-start gap-1.5">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
              <span className="text-xs text-amber-600">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
