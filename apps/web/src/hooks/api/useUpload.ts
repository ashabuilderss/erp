"use client";

import { useState } from "react";

interface UploadResponse {
  url: string;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadPropertyImages = async (files: FileList | File[]): Promise<string[]> => {
    setUploading(true);
    try {
      const formData = new FormData();
      for (const f of files) formData.append("files", f);
      const res = await fetch("/api/proxy/uploads/property-images", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as UploadResponse[];
      return data.map((d) => d.url);
    } finally {
      setUploading(false);
    }
  };

  return { uploadPropertyImages, uploading };
}
