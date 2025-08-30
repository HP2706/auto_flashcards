import defaultScheduler from "@/algorithms/default";
import { Scheduler } from "@/lib/types";

const algorithms: Record<string, Scheduler> = {
  [defaultScheduler.name]: defaultScheduler,
};

export function listAlgorithms(): { key: string; name: string; description?: string }[] {
  return Object.entries(algorithms).map(([key, s]) => ({ key, name: s.name, description: s.description }));
}

export function getAlgorithm(key?: string): Scheduler {
  if (!key) return defaultScheduler;
  return algorithms[key] ?? defaultScheduler;
}

export default algorithms;
