import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { TFunction } from "i18next";
import type { HealthMetrics } from "@/types";

export async function exportToExcel(data: HealthMetrics, t: TFunction) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Heda - Health Data Dashboard";
  workbook.lastModifiedBy = "Heda - Health Data Dashboard";
  workbook.created = new Date();
  workbook.modified = new Date();

  const getWeekday = (date: Date) => {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return t(`weekdays.${days[date.getDay()]}`);
  };

  const addSheet = <T extends Record<string, unknown>>(
    id: string,
    displayName: string,
    columns: { header: string; key: string; width?: number; numFmt?: string }[],
    rows: T[],
  ) => {
    if (rows.length === 0) return;

    const sheet = workbook.addWorksheet(displayName);

    // Create the table rows first
    const tableRows = rows.map((row) =>
      columns.map((col) => {
        const val = row[col.key];
        // Handle potential undefined/null
        return val === undefined || val === null ? null : val;
      }),
    );

    // Add table
    sheet.addTable({
      name: `Table_${id}`,
      ref: "A1",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: columns.map((col) => ({ name: col.header, filterButton: true })),
      rows: tableRows,
    });

    // Apply column widths and number formats
    columns.forEach((col, index) => {
      const column = sheet.getColumn(index + 1);
      if (col.width) column.width = col.width;
      if (col.numFmt) column.numFmt = col.numFmt;

      if (!col.width) {
        // Auto-fit (rough)
        column.width = Math.min(Math.max(10, col.header.length + 5), 30);
      }
    });
  };

  // Sleep Sheet
  addSheet(
    "Sleep",
    t("common.sleep", "Sleep"),
    [
      {
        header: t("common.date", "Date"),
        key: "date",
        width: 12,
        numFmt: "yyyy-mm-dd",
      },
      {
        header: t("common.day", "Day"),
        key: "weekday",
        width: 12,
      },
      {
        header: t("common.start", "Start"),
        key: "start",
        width: 18,
        numFmt: "yyyy-mm-dd hh:mm",
      },
      {
        header: t("common.end", "End"),
        key: "end",
        width: 18,
        numFmt: "yyyy-mm-dd hh:mm",
      },
      {
        header: `${t("common.duration", "Duration")} (h)`,
        key: "duration_h",
        numFmt: "0.00",
      },
      { header: t("common.type", "Type"), key: "type" },
      {
        header: `${t("common.lightSleep", "Light Sleep")} (h)`,
        key: "lightSleep",
        numFmt: "0.00",
      },
      {
        header: `${t("common.deepSleep", "Deep Sleep")} (h)`,
        key: "deepSleep",
        numFmt: "0.00",
      },
      {
        header: `${t("common.remSleep", "REM Sleep")} (h)`,
        key: "remSleep",
        numFmt: "0.00",
      },
      {
        header: `${t("common.awake", "Awake")} (h)`,
        key: "awake",
        numFmt: "0.00",
      },
      { header: t("common.sleepScore", "Score"), key: "sleepScore" },
      { header: "HR Avg", key: "hrAverage" },
      { header: t("common.device", "Device"), key: "device" },
    ],
    data.sleep.map((s) => {
      const date = new Date(s.date);
      return {
        date,
        weekday: getWeekday(date),
        start: new Date(s.start),
        end: new Date(s.end),
        duration_h: s.duration / 3600,
        type: s.isNap ? t("common.nap", "Nap") : t("common.night", "Night"),
        lightSleep: (s.lightSleep || 0) / 3600,
        deepSleep: (s.deepSleep || 0) / 3600,
        remSleep: (s.remSleep || 0) / 3600,
        awake: (s.awake || 0) / 3600,
        sleepScore: s.sleepScore || null,
        hrAverage: s.hrAverage || null,
        device: s.deviceCategory || "",
      };
    }),
  );

  // Steps Sheet
  addSheet(
    "Steps",
    t("common.steps", "Steps"),
    [
      {
        header: t("common.date", "Date"),
        key: "date",
        width: 12,
        numFmt: "yyyy-mm-dd",
      },
      {
        header: t("common.day", "Day"),
        key: "weekday",
        width: 12,
      },
      { header: t("common.steps", "Steps"), key: "steps", numFmt: "#,##0" },
      {
        header: `${t("common.distance", "Distance")} (km)`,
        key: "distance",
        numFmt: "0.00",
      },
      {
        header: t("common.calories", "Calories"),
        key: "calories",
        numFmt: "0",
      },
      { header: "Elevation", key: "elevation", numFmt: "0.0" },
    ],
    data.steps.map((s) => {
      const date = new Date(s.date);
      return {
        date,
        weekday: getWeekday(date),
        steps: s.steps,
        distance: s.distance || 0,
        calories: s.calories || 0,
        elevation: s.elevation || 0,
      };
    }),
  );

  // Activities Sheet
  addSheet(
    "Activities",
    t("common.activities", "Activities"),
    [
      {
        header: t("common.date", "Date"),
        key: "date",
        width: 12,
        numFmt: "yyyy-mm-dd",
      },
      {
        header: t("common.day", "Day"),
        key: "weekday",
        width: 12,
      },
      { header: t("common.type", "Type"), key: "type" },
      {
        header: `${t("common.duration", "Duration")} (h)`,
        key: "duration_h",
        numFmt: "0.00",
      },
      {
        header: t("common.calories", "Calories"),
        key: "calories",
        numFmt: "0",
      },
      {
        header: `${t("common.distance", "Distance")} (km)`,
        key: "distance",
        numFmt: "0.00",
      },
    ],
    data.activities.map((a) => {
      const date = new Date(a.date);
      return {
        date,
        weekday: getWeekday(date),
        type: a.type,
        duration_h: a.duration / 3600,
        calories: a.calories,
        distance: a.distance || 0,
      };
    }),
  );

  // Weight Sheet
  addSheet(
    "Weight",
    t("common.weight", "Weight"),
    [
      {
        header: t("common.date", "Date"),
        key: "date",
        width: 12,
        numFmt: "yyyy-mm-dd",
      },
      {
        header: t("common.day", "Day"),
        key: "weekday",
        width: 12,
      },
      {
        header: `${t("common.weight", "Weight")} (kg)`,
        key: "weight",
        numFmt: "0.0",
      },
      {
        header: `${t("common.fatMass", "Fat Mass")} (kg)`,
        key: "fatMass",
        numFmt: "0.0",
      },
      {
        header: `${t("common.muscleMass", "Muscle Mass")} (kg)`,
        key: "muscleMass",
        numFmt: "0.0",
      },
      {
        header: `${t("common.boneMass", "Bone Mass")} (kg)`,
        key: "boneMass",
        numFmt: "0.0",
      },
      {
        header: `${t("common.hydration", "Hydration")} (kg)`,
        key: "hydration",
        numFmt: "0.0",
      },
    ],
    data.weight.map((w) => {
      const date = new Date(w.date);
      return {
        date,
        weekday: getWeekday(date),
        weight: w.weight,
        fatMass: w.fatMass || null,
        muscleMass: w.muscleMass || null,
        boneMass: w.boneMass || null,
        hydration: w.hydration || null,
      };
    }),
  );

  // Blood Pressure Sheet
  addSheet(
    "BP",
    t("common.bp", "Blood Pressure"),
    [
      {
        header: t("common.date", "Date"),
        key: "date",
        width: 12,
        numFmt: "yyyy-mm-dd",
      },
      {
        header: t("common.day", "Day"),
        key: "weekday",
        width: 12,
      },
      {
        header: t("common.systolic", "Systolic"),
        key: "systolic",
        numFmt: "0",
      },
      {
        header: t("common.diastolic", "Diastolic"),
        key: "diastolic",
        numFmt: "0",
      },
      { header: t("common.hr", "Heart Rate"), key: "hr", numFmt: "0" },
    ],
    data.bp.map((b) => {
      const date = new Date(b.date);
      return {
        date,
        weekday: getWeekday(date),
        systolic: b.systolic,
        diastolic: b.diastolic,
        hr: b.hr,
      };
    }),
  );

  // SpO2 Sheet
  addSheet(
    "SpO2",
    t("common.spo2", "SpO2"),
    [
      {
        header: t("common.date", "Date"),
        key: "date",
        width: 12,
        numFmt: "yyyy-mm-dd",
      },
      {
        header: t("common.day", "Day"),
        key: "weekday",
        width: 12,
      },
      { header: "SpO2 (%)", key: "spo2", numFmt: "0" },
    ],
    data.spo2.map((s) => {
      const date = new Date(s.date);
      return {
        date,
        weekday: getWeekday(date),
        spo2: s.spo2,
      };
    }),
  );

  // Height Sheet
  addSheet(
    "Height",
    t("common.height", "Height"),
    [
      {
        header: t("common.date", "Date"),
        key: "date",
        width: 12,
        numFmt: "yyyy-mm-dd",
      },
      {
        header: t("common.day", "Day"),
        key: "weekday",
        width: 12,
      },
      {
        header: `${t("common.height", "Height")} (m)`,
        key: "height",
        numFmt: "0.00",
      },
    ],
    data.height.map((h) => {
      const date = new Date(h.date);
      return {
        date,
        weekday: getWeekday(date),
        height: h.height,
      };
    }),
  );

  // Generate Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `withings_data_${new Date().toISOString().split("T")[0]}.xlsx`);
}
