// Re-export from the new DB module for backward compatibility
export { readHistory, appendHistory, gradeToDelta, buildAggregates } from '@/lib/db/history'

export type GroupSummary = {
  group: string;
  reviews: number;
  views: number;
};
