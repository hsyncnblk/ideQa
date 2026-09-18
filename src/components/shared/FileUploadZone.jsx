/**
 * @module components/shared/FileUploadZone
 *
 * Reusable drag-and-drop file upload UI with image preview grid.
 * Consumes useFileUpload hook data and renders upload areas + file lists.
 * Replaces ~100 lines of duplicated JSX across StoryDrawer, BugDrawer, IpkDrawer.
 */

import React, { useRef } from 'react';
import { UploadCloud, ImageIcon, Paperclip, Trash2, Plus } from 'lucide-react';

/**
 * @param {object} props
 * @param {Array} props.images - Current images array from useFileUpload
 * @param {Array} props.files - Current files array from useFileUpload
 * @param {Function} props.onImageUpload - handleImageUpload from useFileUpload
 * @param {Function} props.onFileUpload - handleFileUpload from useFileUpload
 * @param {Function} props.onRemoveImage - removeImage from useFileUpload
 * @param {Function} props.onRemoveFile - removeFile from useFileUpload
 * @param {boolean} [props.showFiles=true] - Whether to show document upload area
 * @param {string} [props.imageAccept='image/png,image/jpeg,image/webp'] - Accepted image types
 * @param {string} [props.fileAccept='.pdf,.txt,.doc,.docx,.xlsx,.csv'] - Accepted file types
 * @param {string} [props.imageLabel='Görsel Yükle'] - Image section label
 * @param {string} [props.fileLabel='Dosya / Doküman Ekle'] - File section label
 */
export default function FileUploadZone({
  images = [],
  files = [],
  onImageUpload,
  onFileUpload,
  onRemoveImage,
  onRemoveFile,
  showFiles = true,
  imageAccept = 'image/png,image/jpeg,image/webp',
  fileAccept = '.pdf,.txt,.doc,.docx,.xlsx,.csv',
  imageLabel = 'Görsel Yükle',
  fileLabel = 'Dosya / Doküman Ekle',
}) {
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  return (
    <div className="space-y-4">
      {/* Image Upload Area */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
          {imageLabel}
          <span className="text-slate-400 font-normal">(PNG, JPG, WEBP)</span>
        </label>

        <input
          ref={imageInputRef}
          type="file"
          accept={imageAccept}
          multiple
          onChange={onImageUpload}
          className="hidden"
        />

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="w-full h-20 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 p-1 truncate">{img.name}</p>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="w-full py-3 px-4 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{images.length > 0 ? 'Daha Fazla Görsel Ekle' : 'Görsel Seçin veya Sürükleyin'}</span>
        </button>
      </div>

      {/* Document / File Upload Area */}
      {showFiles && (
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
            {fileLabel}
            <span className="text-slate-400 font-normal">(PDF, TXT, DOCX, XLS)</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            multiple
            onChange={onFileUpload}
            className="hidden"
          />

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-700 min-w-0">
                    <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-slate-400 shrink-0">({file.sizeMb} MB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{files.length > 0 ? 'Daha Fazla Dosya Ekle' : 'Dosya Seçin'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
