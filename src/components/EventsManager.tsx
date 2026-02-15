import { Download, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatDate } from "@/lib/utils";
import type { PatternEvent, PatternEventType } from "@/types";

interface EventsManagerProps {
  events: PatternEvent[];
  onEventsChange: (events: PatternEvent[]) => void | Promise<void>;
}

const DEFAULT_COLOR = "#f97316";

function createEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function EventsManager({ events, onEventsChange }: EventsManagerProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PatternEventType>("point");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }, [events]);

  function resetForm() {
    setTitle("");
    setType("point");
    setStartDate("");
    setEndDate("");
    setNotes("");
    setColor(DEFAULT_COLOR);
    setEditingId(null);
    setError(null);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError(t("events.errors.titleRequired"));
      return;
    }
    if (!startDate) {
      setError(t("events.errors.startRequired"));
      return;
    }

    if (type === "range") {
      if (!endDate) {
        setError(t("events.errors.endRequired"));
        return;
      }
      if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
        setError(t("events.errors.endAfterStart"));
        return;
      }
    }

    const nextEvent: PatternEvent = {
      id: editingId ?? createEventId(),
      title: title.trim(),
      type,
      startDate,
      endDate: type === "range" ? endDate : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
      color: color || DEFAULT_COLOR,
    };

    const nextEvents = editingId
      ? events.map((evt) => (evt.id === editingId ? nextEvent : evt))
      : [...events, nextEvent];

    await onEventsChange(nextEvents);
    resetForm();
  }

  async function handleEdit(event: PatternEvent) {
    setEditingId(event.id);
    setTitle(event.title);
    setType(event.type);
    setStartDate(event.startDate);
    setEndDate(event.endDate || "");
    setNotes(event.notes || "");
    setColor(event.color || DEFAULT_COLOR);
    setError(null);
  }

  async function handleDelete(eventId: string) {
    if (!confirm(t("events.confirmDelete"))) {
      return;
    }
    const nextEvents = events.filter((evt) => evt.id !== eventId);
    await onEventsChange(nextEvents);
    if (editingId === eventId) {
      resetForm();
    }
  }

  function handleExport() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      events,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "withings-events.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const importedEvents: PatternEvent[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.events)
          ? parsed.events
          : [];

      if (importedEvents.length === 0) {
        setError(t("events.errors.noEvents"));
        return;
      }

      const normalized: PatternEvent[] = importedEvents.map((evt) => ({
        id: evt.id || createEventId(),
        title: evt.title?.trim() || t("events.untitled"),
        type: (evt.type === "range" ? "range" : "point") as PatternEventType,
        startDate: evt.startDate,
        endDate:
          evt.type === "range" ? evt.endDate || evt.startDate : undefined,
        notes: evt.notes?.trim() || undefined,
        color: evt.color || DEFAULT_COLOR,
      }));

      await onEventsChange(normalized);
      setError(null);
    } catch (err) {
      console.error("Failed to import events", err);
      setError(t("events.errors.importFailed"));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground -mt-2">
        {t("events.description")}
      </div>
      <div className="grid gap-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <Label>{t("events.form.title")}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
            placeholder={t("events.form.titlePlaceholder")}
          />
        </div>
        <div>
          <Label>{t("events.form.type")}</Label>
          <Select
            value={type}
            onValueChange={(value: string) =>
              setType(value as PatternEventType)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t("events.form.typePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="point">{t("events.type.point")}</SelectItem>
              <SelectItem value="range">{t("events.type.range")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("events.form.start")}</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>{t("events.form.end")}</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1"
            disabled={type !== "range"}
          />
        </div>
        <div>
          <Label>{t("events.form.color")}</Label>
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-1 h-10 w-full px-2"
          />
        </div>
        <div className="md:col-span-6">
          <Label>{t("events.form.notes")}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
            rows={2}
            placeholder={t("events.form.notesPlaceholder")}
          />
        </div>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSave}>
          {editingId ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("events.actions.update")}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {t("events.actions.add")}
            </>
          )}
        </Button>
        {editingId && (
          <Button variant="outline" onClick={resetForm}>
            <X className="mr-2 h-4 w-4" />
            {t("common.cancel")}
          </Button>
        )}
        <div className="h-6 w-px bg-border" />
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          {t("events.actions.export")}
        </Button>
        <Button variant="outline" onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" />
          {t("events.actions.import")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void handleImportFile(file);
            }
          }}
        />
      </div>

      <div className="space-y-3">
        {sortedEvents.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("events.empty")}
          </div>
        ) : (
          sortedEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-md"
                  style={{ backgroundColor: event.color || DEFAULT_COLOR }}
                />
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {event.type === "range"
                      ? `${formatDate(event.startDate)} → ${formatDate(
                          event.endDate || event.startDate,
                        )}`
                      : formatDate(event.startDate)}
                    {event.notes ? ` • ${event.notes}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(event)}
                  title={t("events.actions.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(event.id)}
                  title={t("events.actions.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
