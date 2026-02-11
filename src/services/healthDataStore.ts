import { dataSources } from "@/services/dataSources";
import type {
  DataSourceId,
  HealthData,
  HealthDataSource,
  HealthDataStore,
  HealthMetrics,
  PatternEvent,
} from "@/types";

const createEmptyMetrics = (): HealthMetrics => ({
  steps: [],
  sleep: [],
  weight: [],
  bp: [],
  height: [],
  spo2: [],
  activities: [],
});

export const normalizeMetrics = (
  data: Partial<HealthMetrics> | null | undefined,
): HealthMetrics => ({
  steps: data?.steps ?? [],
  sleep: data?.sleep ?? [],
  weight: data?.weight ?? [],
  bp: data?.bp ?? [],
  height: data?.height ?? [],
  spo2: data?.spo2 ?? [],
  activities: data?.activities ?? [],
});

export const createDataSource = (
  id: DataSourceId,
  data: HealthMetrics,
): HealthDataSource => ({
  id,
  label: dataSources[id]?.label ?? id,
  data: normalizeMetrics(data),
  importedAt: new Date().toISOString(),
});

export const updateEvents = (
  store: HealthDataStore,
  events: PatternEvent[],
): HealthDataStore => ({
  ...store,
  events,
});

export const aggregateHealthData = (store: HealthDataStore): HealthData => {
  const merged = Object.values(store.sources).reduce<HealthMetrics>(
    (acc, source) => ({
      steps: [...acc.steps, ...source.data.steps],
      sleep: [...acc.sleep, ...source.data.sleep],
      weight: [...acc.weight, ...source.data.weight],
      bp: [...acc.bp, ...source.data.bp],
      height: [...acc.height, ...source.data.height],
      spo2: [...acc.spo2, ...source.data.spo2],
      activities: [...acc.activities, ...source.data.activities],
    }),
    createEmptyMetrics(),
  );

  return {
    ...merged,
    events: store.events ?? [],
    sources: Object.keys(store.sources) as DataSourceId[],
  };
};
