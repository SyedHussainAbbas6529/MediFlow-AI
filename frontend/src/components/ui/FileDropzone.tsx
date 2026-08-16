'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { UploadCloud, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface FileDropzoneProps {
  onExtracted?: (data: any) => void;
  compact?: boolean;
}

export default function FileDropzone({ onExtracted, compact }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileName(file.name);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.autoExtract(formData);
      if (onExtracted) {
        onExtracted(res);
      }
    } catch (err) {
      console.error('Auto-extraction error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
        compact ? 'p-4' : 'p-8'
      } ${
        isDragging
          ? 'border-sky-500 bg-sky-950/40'
          : 'border-slate-800 hover:border-sky-500/60 bg-[#0D1322]'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
      />

      {isProcessing ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
          <p className="text-xs font-semibold text-slate-200">
            Reading Document & Extracting Fields...
          </p>
          <span className="text-[10px] text-slate-400">Finding patient name, visit date, and billing codes</span>
        </div>
      ) : fileName ? (
        <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{fileName} — Scan Complete</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-sky-950/80 text-sky-400 flex items-center justify-center border border-sky-800/40">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Drag & drop document or <span className="text-sky-400 font-bold">browse files</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Supports Bills, EOBs, Insurance Cards, Licenses (PDF, Word, Images)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
