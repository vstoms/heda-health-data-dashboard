export interface StepData {
  date: string;
  steps: number;
  distance?: number;
  elevation?: number;
  calories?: number;
}

export interface SleepData {
  date: string;
  start: string;
  end: string;
  duration: number;
  deepSleep?: number;
  lightSleep?: number;
  remSleep?: number;
  awake?: number;
  isNap?: boolean;
  sleepScore?: number;
  hrAverage?: number;
  hrMin?: number;
  hrMax?: number;
  durationToSleep?: number;
  durationToWakeUp?: number;
  snoring?: number;
  snoringEpisodes?: number;
  wakeupCount?: number;
  nightEvents?: string;
  notes?: string;
  deviceCategory?: "bed" | "tracker";
}

export interface WeightData {
  date: string;
  weight: number;
  fatMass?: number;
  boneMass?: number;
  muscleMass?: number;
  hydration?: number;
}

export interface BloodPressureData {
  date: string;
  systolic: number;
  diastolic: number;
  hr: number;
}

export interface HeightData {
  date: string;
  height: number;
}

export interface SpO2Data {
  date: string;
  spo2: number;
}

export interface ActivityData {
  date: string;
  type: string;
  duration: number;
  calories: number;
  distance?: number;
}

export type PatternEventType = "point" | "range";

export interface PatternEvent {
  id: string;
  title: string;
  titleKey?: string;
  type: PatternEventType;
  startDate: string;
  endDate?: string;
  notes?: string;
  color?: string;
}

export interface HealthMetrics {
  steps: StepData[];
  sleep: SleepData[];
  weight: WeightData[];
  bp: BloodPressureData[];
  height: HeightData[];
  spo2: SpO2Data[];
  activities: ActivityData[];
}

export type DataSourceId = "withings" | (string & {});

export interface HealthDataSource {
  id: DataSourceId;
  label: string;
  data: HealthMetrics;
  importedAt: string;
}

export interface HealthDataStore {
  sources: Record<string, HealthDataSource>;
  events: PatternEvent[];
}

export interface HealthData extends HealthMetrics {
  events: PatternEvent[];
  sources?: DataSourceId[];
}
