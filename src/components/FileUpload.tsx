import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/Card";
import { debugLog } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const { t } = useTranslation();
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        debugLog(
          `File selected: ${acceptedFiles[0].name} (${acceptedFiles[0].size} bytes)`,
        );
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/zip": [".zip"] },
    multiple: false,
    disabled: isProcessing,
  });

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Card
        className={`border-dashed border-2 transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "hover:border-primary/50"
        }`}
      >
        <CardContent className="p-6 md:p-12">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center cursor-pointer ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={
                isDragActive ? { y: -10, scale: 1.1 } : { y: 0, scale: 1 }
              }
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Upload
                className={`w-16 h-16 mb-4 ${
                  isDragActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </motion.div>
            {isProcessing ? (
              <p className="text-lg text-center font-medium animate-pulse">
                {t("app.upload.processing")}
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-center mb-2">
                  {isDragActive
                    ? t("app.upload.dropPrompt")
                    : t("app.upload.title")}
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {t("app.upload.subtitle")}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
