import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const currentLang = i18n.language.startsWith("fr") ? "fr" : "en";

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    localStorage.setItem("withings_language", value);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground mr-1" />
      <Select value={currentLang} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[100px] h-8 text-xs border-none bg-accent/50 hover:bg-accent transition-colors">
          <SelectValue placeholder={t("common.select")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t("languages.en")}</SelectItem>
          <SelectItem value="fr">{t("languages.fr")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
