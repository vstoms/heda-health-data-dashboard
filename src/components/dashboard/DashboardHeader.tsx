import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onOpenEvents: () => void;
}

export function DashboardHeader({
  title,
  subtitle,
  onOpenEvents,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8"
    >
      <div className="flex items-center gap-4">
        <Logo className="w-14 h-14 md:w-24 md:h-24" />
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-2"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center gap-2"
      >
        <ThemeToggle />
        <LanguageSwitcher />
        <Button variant="outline" onClick={onOpenEvents}>
          <Calendar className="mr-2 h-4 w-4" />
          {t("dashboard.header.manageEvents")}
        </Button>
      </motion.div>
    </motion.header>
  );
}
