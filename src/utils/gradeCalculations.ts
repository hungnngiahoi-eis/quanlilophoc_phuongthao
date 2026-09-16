import { ScoreColumn } from '../types';

export function calculateSemesterAverage(
  scores: Record<string, number | null> | undefined,
  columns: ScoreColumn[]
): number | null {
  if (!scores) return null;

  let totalWeightedScore = 0;
  let totalWeights = 0;

  for (const col of columns) {
    const val = scores[col.id];
    if (val !== undefined && val !== null && !isNaN(val)) {
      totalWeightedScore += Number(val) * col.weight;
      totalWeights += col.weight;
    }
  }

  if (totalWeights === 0) return null;
  const avg = totalWeightedScore / totalWeights;
  return Math.round(avg * 10) / 10;
}

export function calculateYearlyAverage(
  avgHK1: number | null,
  avgHK2: number | null
): number | null {
  if (avgHK1 !== null && avgHK2 !== null) {
    const avg = (avgHK1 + avgHK2 * 2) / 3;
    return Math.round(avg * 10) / 10;
  }
  if (avgHK1 !== null) return avgHK1;
  if (avgHK2 !== null) return avgHK2;
  return null;
}

export interface Classification {
  label: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export function getGradeClassification(avg: number | null): Classification {
  if (avg === null || isNaN(avg)) {
    return {
      label: 'Chưa xét',
      color: 'text-slate-400',
      badgeBg: 'bg-slate-100 text-slate-600',
      badgeBorder: 'border-slate-200',
    };
  }
  if (avg >= 8.0) {
    return {
      label: 'Giỏi',
      color: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeBorder: 'border-emerald-300',
    };
  }
  if (avg >= 6.5) {
    return {
      label: 'Khá',
      color: 'text-blue-700',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeBorder: 'border-blue-300',
    };
  }
  if (avg >= 5.0) {
    return {
      label: 'Đạt (TB)',
      color: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeBorder: 'border-amber-300',
    };
  }
  return {
    label: 'Chưa đạt (Yếu)',
    color: 'text-rose-700',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeBorder: 'border-rose-300',
  };
}
