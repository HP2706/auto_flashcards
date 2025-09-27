export type Card = {
  id: string;
  title?: string;
  front: string;
  back: string;
  frontImages?: string[]; // Array of image URLs for front
  backImages?: string[];  // Array of image URLs for back
  path: string; // absolute path on disk (legacy, will be removed)
  group?: string; // relative folder name under cards root
};

export type ReviewGrade = "again" | "hard" | "good" | "easy" | "view";

export type ReviewLog = {
  cardId: string;
  ts: number; // epoch ms
  grade: ReviewGrade;
  durationMs?: number;
};

export type CardAggregate = {
  cardId: string;
  lastReviewed?: number;
  reviews: number;
  ease: number; // scheduling ease factor
  intervalDays: number; // last interval in days
  due?: number; // epoch ms
};

export type SchedulerContext = {
  now: number;
  cards: Card[];
  history: ReviewLog[];
  aggregates: Record<string, CardAggregate>;
};

export type Scheduler = {
  name: string;
  description?: string;
  // Return next N card IDs in order
  pickNext: (count: number, ctx: SchedulerContext) => string[];
  // Optional hook to update aggregates on review
  onReview?: (log: ReviewLog, agg: CardAggregate) => CardAggregate;
};
