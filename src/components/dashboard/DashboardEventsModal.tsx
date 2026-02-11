import { useTranslation } from "react-i18next";
import { EventsManager } from "@/components/EventsManager";
import { Modal } from "@/components/ui/Modal";
import type { PatternEvent } from "@/types";

interface DashboardEventsModalProps {
  open: boolean;
  onClose: () => void;
  events: PatternEvent[];
  onEventsUpdate: (events: PatternEvent[]) => void | Promise<void>;
}

export function DashboardEventsModal({
  open,
  onClose,
  events,
  onEventsUpdate,
}: DashboardEventsModalProps) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t("events.title")}>
      <EventsManager events={events} onEventsChange={onEventsUpdate} />
    </Modal>
  );
}
