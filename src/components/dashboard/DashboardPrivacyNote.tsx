import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/Card";

export function DashboardPrivacyNote() {
  const { t } = useTranslation();
  return (
    <Card className="mt-6 md:mt-8 bg-muted/50 border-none animate-in fade-in duration-500 delay-1000 fill-mode-both ease-in-out">
      <CardContent className="text-sm text-muted-foreground flex items-start gap-3 py-4">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <p>
          <strong className="text-foreground">
            {t("dashboard.privacy.title")}
          </strong>{" "}
          {t("dashboard.privacy.description")}
        </p>
      </CardContent>
    </Card>
  );
}
