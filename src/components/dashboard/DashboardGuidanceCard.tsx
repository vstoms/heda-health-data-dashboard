import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";

export function DashboardGuidanceCard() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("dashboard-guidance-dismissed") !== "true";
  });

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("dashboard-guidance-dismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative group overflow-hidden"
        >
          {/* Background Decorative Element */}
          <div className="absolute -right-4 -top-4 text-primary/5 group-hover:text-primary/10 transition-colors duration-500">
            <Sparkles className="h-24 w-24 rotate-12" />
          </div>

          <div className="relative flex flex-col md:flex-row items-stretch gap-0 rounded-2xl border border-primary/10 bg-linear-to-br from-primary/[0.03] to-background p-1 shadow-sm">
            {/* Left Side: Main Tips */}
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm tracking-tight text-foreground">
                  {t("dashboard.overview.tips.title")}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5 border-l-2 border-primary/10 pl-3">
                  <p className="text-sm font-medium leading-relaxed text-foreground/80">
                    {t("dashboard.overview.tips.item1")}
                  </p>
                </div>
                <div className="space-y-1.5 border-l-2 border-primary/10 pl-3">
                  <p className="text-sm font-medium leading-relaxed text-foreground/80">
                    {t("dashboard.overview.tips.item2")}
                  </p>
                </div>
                <div className="space-y-1.5 border-l-2 border-primary/10 pl-3">
                  <p className="text-sm font-medium leading-relaxed text-foreground/80">
                    {t("dashboard.overview.tips.item3")}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Featured Insight/Tip */}
            <div className="flex w-full md:w-80 flex-col justify-center border-t md:border-t-0 md:border-l border-primary/10 bg-primary/[0.02] p-4 md:p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70">
                    {t("common.tip", { text: "" }).split(":")[0]}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    &ldquo;{t("dashboard.overview.tips.tip")}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDismiss}
              title={t("common.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
