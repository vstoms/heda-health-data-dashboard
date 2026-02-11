import { RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";

interface DashboardFooterProps {
  onTriggerReimport: () => void;
  onClear: () => void;
}

export function DashboardFooter({
  onTriggerReimport,
  onClear,
}: DashboardFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="flex flex-wrap items-center justify-end gap-3 mt-8 pt-6 border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      <Button variant="outline" onClick={onTriggerReimport}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {t("dashboard.header.reimport")}
      </Button>
      <Button variant="destructive" onClick={onClear}>
        <Trash2 className="mr-2 h-4 w-4" />
        {t("dashboard.header.clear")}
      </Button>
    </footer>
  );
}
