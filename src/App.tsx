import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dashboard } from "@/components/Dashboard";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { FileUpload } from "@/components/FileUpload";
import { SEO } from "@/components/SEO";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { cn, debugLog } from "@/lib/utils";
import { defaultDataSource } from "@/services/dataSources";
import {
  clearHealthDataStore,
  getHealthDataStore,
  saveHealthDataStore,
} from "@/services/db";
import {
  aggregateHealthData,
  createDataSource,
  updateEvents,
} from "@/services/healthDataStore";
import type { HealthDataStore, PatternEvent } from "@/types";

function renderStepWithLinks(step: string): ReactNode {
  const match = step.match(/https?:\/\/[^\s]+/);
  if (!match || match.index === undefined) return step;

  const rawUrl = match[0];
  let cleanUrl = rawUrl;
  let trailingPunctuation = "";
  while (/[.,;!?)]$/.test(cleanUrl)) {
    trailingPunctuation = cleanUrl.slice(-1) + trailingPunctuation;
    cleanUrl = cleanUrl.slice(0, -1);
  }

  const before = step.slice(0, match.index);
  const after = step.slice(match.index + rawUrl.length);

  return (
    <>
      {before}
      <a
        href={cleanUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2 text-foreground"
      >
        {cleanUrl}
      </a>
      {trailingPunctuation}
      {after}
    </>
  );
}

function App() {
  const { t } = useTranslation();
  const [store, setStore] = useState<HealthDataStore | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [instructionMode, setInstructionMode] = useState<"computer" | "mobile">(
    "computer",
  );
  const data = useMemo(
    () => (store ? aggregateHealthData(store) : null),
    [store],
  );
  const howToSteps = useMemo(
    () =>
      [
        t(`app.landing.howTo.${instructionMode}.step1`, { defaultValue: "" }),
        t(`app.landing.howTo.${instructionMode}.step2`, { defaultValue: "" }),
        t(`app.landing.howTo.${instructionMode}.step3`, { defaultValue: "" }),
        t(`app.landing.howTo.${instructionMode}.step4`, { defaultValue: "" }),
        t(`app.landing.howTo.${instructionMode}.step5`, { defaultValue: "" }),
      ].filter((step) => step.trim().length > 0),
    [instructionMode, t],
  );

  useEffect(() => {
    async function loadExistingData() {
      debugLog("Loading existing data from DB...");
      const existingStore = await getHealthDataStore();
      if (existingStore) {
        const aggregated = aggregateHealthData(existingStore);
        debugLog("Found existing data", {
          steps: aggregated.steps?.length,
          sleep: aggregated.sleep?.length,
          weight: aggregated.weight?.length,
          sources: aggregated.sources,
        });
        setStore(existingStore);
      } else {
        debugLog("No existing data found");
      }
      setIsLoading(false);
    }
    loadExistingData();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateInstructionMode = (matches: boolean) => {
      setInstructionMode(matches ? "mobile" : "computer");
    };

    updateInstructionMode(mediaQuery.matches);
    const onChange = (event: MediaQueryListEvent) => {
      updateInstructionMode(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  async function handleReplaceAllData(file: File) {
    setIsProcessing(true);
    debugLog(`Processing selected file: ${file.name}`);
    try {
      const parsedData = await defaultDataSource.parse(file);
      const source = createDataSource(defaultDataSource.id, parsedData);
      const preservedEvents = store?.events ?? [];
      const nextStore: HealthDataStore = {
        sources: { [source.id]: source },
        events: preservedEvents,
      };
      debugLog("Parsing complete, replacing data store...");
      await clearHealthDataStore();
      await saveHealthDataStore(nextStore);
      setStore(nextStore);
      debugLog("Data store saved and state updated");
    } catch (error) {
      console.error("Error processing file:", error);
      alert(t("app.errors.invalidZip"));
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleEventsUpdate(events: PatternEvent[]) {
    if (!store) return;
    const nextStore = updateEvents(store, events);
    setStore(nextStore);
    await saveHealthDataStore(nextStore);
  }

  async function handleClearData() {
    if (confirm(t("app.confirmClear"))) {
      await clearHealthDataStore();
      setStore(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">{t("app.loading")}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <SEO />
      <AnimatePresence mode="wait">
        {!data && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-end gap-2 mb-4 max-w-2xl mx-auto"
          >
            <ThemeToggle />
            <LanguageSwitcher />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {data ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Dashboard
              data={data}
              onClear={handleClearData}
              onEventsUpdate={handleEventsUpdate}
              onReimportData={handleReplaceAllData}
            />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-6 md:mb-8">
              <Logo className="w-24 h-24 mx-auto mb-6 drop-shadow-xl" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {t("app.landing.title")}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("app.landing.subtitle")}
              </p>
            </div>
            <FileUpload
              onFileSelect={handleReplaceAllData}
              isProcessing={isProcessing}
            />
            <div className="mt-6 md:mt-8 space-y-4 text-sm text-muted-foreground">
              <h2 className="font-semibold text-foreground">
                {t("app.landing.howTo.title")}
              </h2>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wide">
                  {t("app.landing.howTo.deviceSwitchLabel")}
                </p>
                <div className="inline-flex rounded-md border border-border bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setInstructionMode("computer")}
                    className={cn(
                      "rounded px-2 py-1 text-xs transition-colors",
                      instructionMode === "computer"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("app.landing.howTo.deviceComputer")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstructionMode("mobile")}
                    className={cn(
                      "rounded px-2 py-1 text-xs transition-colors",
                      instructionMode === "mobile"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("app.landing.howTo.deviceMobile")}
                  </button>
                </div>
              </div>
              <ol className="list-decimal list-inside space-y-2">
                {howToSteps.map((step) => (
                  <li key={`${instructionMode}-${step}`}>
                    {renderStepWithLinks(step)}
                  </li>
                ))}
              </ol>
              <p className="mt-4">
                <strong>{t("app.landing.privacy.title")}</strong>{" "}
                {t("app.landing.privacy.description")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
