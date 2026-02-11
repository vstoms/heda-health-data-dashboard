export const SEASON_DEFINITIONS = [
  {
    key: "spring",
    titleKey: "seasons.spring",
    months: [2, 3, 4],
    color: "#22c55e",
  },
  {
    key: "summer",
    titleKey: "seasons.summer",
    months: [5, 6, 7],
    color: "#f97316",
  },
  {
    key: "autumn",
    titleKey: "seasons.autumn",
    months: [8, 9, 10],
    color: "#a855f7",
  },
  {
    key: "winter",
    titleKey: "seasons.winter",
    months: [11, 0, 1],
    color: "#38bdf8",
  },
];

export const weekDayOptions = [
  { value: 1, labelKey: "weekdays.monday" },
  { value: 2, labelKey: "weekdays.tuesday" },
  { value: 3, labelKey: "weekdays.wednesday" },
  { value: 4, labelKey: "weekdays.thursday" },
  { value: 5, labelKey: "weekdays.friday" },
  { value: 6, labelKey: "weekdays.saturday" },
  { value: 0, labelKey: "weekdays.sunday" },
];

export const rollingAverageOptions = [
  { value: 7, days: 7 },
  { value: 30, days: 30 },
  { value: 90, days: 90 },
];

export const valueTone = {
  neutral: "text-muted-foreground",
  steps: [
    "bg-sky-500/10 text-sky-950/80 dark:text-sky-100",
    "bg-sky-500/15 text-sky-950/80 dark:text-sky-100",
    "bg-sky-500/20 text-sky-950/80 dark:text-sky-100",
    "bg-sky-500/25 text-sky-950/80 dark:text-sky-100",
  ],
  sleep: [
    "bg-violet-500/10 text-violet-950/80 dark:text-violet-100",
    "bg-violet-500/15 text-violet-950/80 dark:text-violet-100",
    "bg-violet-500/20 text-violet-950/80 dark:text-violet-100",
    "bg-violet-500/25 text-violet-950/80 dark:text-violet-100",
  ],
  asleep: [
    "bg-amber-500/10 text-amber-950/80 dark:text-amber-100",
    "bg-amber-500/15 text-amber-950/80 dark:text-amber-100",
    "bg-amber-500/20 text-amber-950/80 dark:text-amber-100",
    "bg-amber-500/25 text-amber-950/80 dark:text-amber-100",
  ],
  wake: [
    "bg-rose-500/10 text-rose-950/80 dark:text-rose-100",
    "bg-rose-500/15 text-rose-950/80 dark:text-rose-100",
    "bg-rose-500/20 text-rose-950/80 dark:text-rose-100",
    "bg-rose-500/25 text-rose-950/80 dark:text-rose-100",
  ],
  weightPositive: [
    "bg-emerald-500/10 text-emerald-950/80 dark:text-emerald-100",
    "bg-emerald-500/15 text-emerald-950/80 dark:text-emerald-100",
    "bg-emerald-500/20 text-emerald-950/80 dark:text-emerald-100",
    "bg-emerald-500/25 text-emerald-950/80 dark:text-emerald-100",
  ],
  weightNegative: [
    "bg-rose-500/10 text-rose-950/80 dark:text-rose-100",
    "bg-rose-500/15 text-rose-950/80 dark:text-rose-100",
    "bg-rose-500/20 text-rose-950/80 dark:text-rose-100",
    "bg-rose-500/25 text-rose-950/80 dark:text-rose-100",
  ],
  hr: [
    "bg-teal-500/10 text-teal-950/80 dark:text-teal-100",
    "bg-teal-500/15 text-teal-950/80 dark:text-teal-100",
    "bg-teal-500/20 text-teal-950/80 dark:text-teal-100",
    "bg-teal-500/25 text-teal-950/80 dark:text-teal-100",
  ],
};
