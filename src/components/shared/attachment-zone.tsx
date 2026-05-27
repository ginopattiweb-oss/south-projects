"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "@uploadthing/react";
import { generateClientDropzoneAccept, generatePermittedFileTypes } from "uploadthing/client";
import { useUploadThing } from "@/lib/uploadthing-components";
import { Paperclip, Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AttachmentZoneProps {
  attachments: string[];
  onAttachmentsChange: (urls: string[]) => void;
  className?: string;
  disabled?: boolean;
}

function fileIcon(url: string) {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return <ImageIcon className="size-3.5" />;
  return <FileText className="size-3.5" />;
}

function fileName(url: string) {
  return decodeURIComponent(url.split("/").pop() ?? url).substring(0, 40);
}

export function AttachmentZone({
  attachments,
  onAttachmentsChange,
  className,
  disabled,
}: AttachmentZoneProps) {
  const [uploading, setUploading] = useState(false);

  const { startUpload, routeConfig } = useUploadThing("attachment", {
    onClientUploadComplete: (res: { ufsUrl?: string; url: string }[]) => {
      const urls = res.map((f) => f.ufsUrl ?? f.url);
      onAttachmentsChange([...attachments, ...urls]);
      setUploading(false);
    },
    onUploadError: (err: { message: string }) => {
      toast.error("Upload failed: " + err.message);
      setUploading(false);
    },
  });

  const onDrop = useCallback(
    (files: File[]) => {
      if (!files.length || disabled) return;
      setUploading(true);
      startUpload(files);
    },
    [startUpload, disabled, attachments]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(generatePermittedFileTypes(routeConfig).fileTypes),
    disabled: disabled || uploading,
  });

  function remove(url: string) {
    onAttachmentsChange(attachments.filter((a) => a !== url));
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border p-6 text-center cursor-pointer transition-colors",
          isDragActive && "border-[#0070F3] bg-[#0070F3]/5",
          !isDragActive && !disabled && "hover:border-[#0070F3]/50 hover:bg-card-elevated",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        ) : (
          <Upload className="size-5 text-muted-foreground" />
        )}
        <p className="text-xs text-muted-foreground">
          {uploading
            ? "Subiendo..."
            : isDragActive
            ? "Soltar archivos aquí"
            : "Arrastrá o hacé clic para subir"}
        </p>
        <p className="text-[10px] text-zinc-600">Imágenes hasta 8MB · PDFs hasta 16MB</p>
      </div>

      {/* File list */}
      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((url) => (
            <li
              key={url}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-card border border-border group"
            >
              <span className="text-muted-foreground">{fileIcon(url)}</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs text-foreground hover:text-[#0070F3] truncate"
              >
                {fileName(url)}
              </a>
              {!disabled && (
                <button
                  onClick={() => remove(url)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {attachments.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Paperclip className="size-3.5" />
          Sin adjuntos
        </div>
      )}
    </div>
  );
}
