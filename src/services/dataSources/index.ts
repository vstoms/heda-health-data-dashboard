import { parseWithingsZip } from "@/services/parser";
import type { DataSourceId, HealthMetrics } from "@/types";

interface DataSourceDefinition {
  id: DataSourceId;
  label: string;
  parse: (file: File) => Promise<HealthMetrics>;
  fileAccept: string;
}

export const dataSources: Record<DataSourceId, DataSourceDefinition> = {
  withings: {
    id: "withings",
    label: "Withings",
    parse: parseWithingsZip,
    fileAccept: "application/zip,.zip",
  },
};

export const defaultDataSource = dataSources.withings;
