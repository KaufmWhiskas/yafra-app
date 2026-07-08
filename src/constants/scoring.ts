export const SCORE_DESCRIPTORS = [
  { score: 4.8, label: 'Excellent' },
  { score: 4.2, label: 'Great' },
  { score: 3.5, label: 'Good' },
  { score: 3.0, label: 'Average' },
  { score: 2.3, label: 'Mediocre' },
  { score: 1.6, label: 'Bad' },
  { score: 1.0, label: 'Horrendous' },
];

export function getScoreColor(score: number): string {
  if (score >= 4.3) return '#22c55e'; // Vibrant Green
  if (score >= 3.6) return '#84cc16'; // Light Green
  if (score >= 3.0) return '#eab308'; // Neutral Yellow
  if (score >= 2.3) return '#f97316'; // Orange
  if (score >= 1.6) return '#ef4444'; // Red
  return '#b91c1c'; // Deep Dark Red
}

export function getScoreDescriptor(score: number): string {
  const match = SCORE_DESCRIPTORS.find((d) => score >= d.score);
  return match ? match.label : 'Horrendous';
}
