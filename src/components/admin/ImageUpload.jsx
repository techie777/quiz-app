"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";

export default function ImageUpload({ onUploadSuccess, label = "Upload Image" }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        toast.success("Image uploaded successfully!");
        onUploadSuccess(data.url);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      toast.error("Something went wrong during upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "inline-block" }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          border: "1px dashed #4361ee",
          background: "white",
          color: "#4361ee",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          transition: "all 0.2s"
        }}
      >
        {uploading ? "Uploading..." : `+ ${label}`}
      </button>
    </div>
  );
}
