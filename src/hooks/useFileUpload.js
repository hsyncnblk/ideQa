/**
 * @module hooks/useFileUpload
 *
 * Reusable hook for image and file upload logic.
 * Features:
 * - Pure async file reading outside React state setters (fixes React StrictMode double invocation bug)
 * - Strict deduplication engine based on file.name + file.size + file.lastModified
 * - Size limit and file count limit enforcement
 * - Memory cleanup for Object URLs
 *
 * @param {object} [options]
 * @param {number} [options.maxSizeMb=10] - Max file size in MB
 * @param {number} [options.maxImages=5] - Max number of images
 * @param {number} [options.maxFiles=5] - Max number of document files
 */

import { useState, useCallback } from 'react';

/**
 * Builds a unique fingerprint key for a File object to ensure deduplication.
 * @param {File} file
 * @returns {string}
 */
function getFileFingerprint(file) {
  if (!file) return '';
  const name = file.name || '';
  const size = file.size || 0;
  const lastModified = file.lastModified || 0;
  return `${name}_${size}_${lastModified}`;
}

export function useFileUpload({ maxSizeMb = 10, maxImages = 5, maxFiles = 5 } = {}) {
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);

  /**
   * Handles image file input change with pure async Base64 conversion & deduplication.
   * @param {Event} e - Input change event
   */
  const handleImageUpload = useCallback(async (e) => {
    const uploadedFiles = Array.from(e.target.files || []);
    if (uploadedFiles.length === 0) return;

    // Reset input value to allow re-uploading the same file if removed
    if (e.target) e.target.value = '';

    setUploadError(null);

    const validFiles = [];
    for (const file of uploadedFiles) {
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > maxSizeMb) {
        setUploadError(`"${file.name}" boyutu ${maxSizeMb} MB sınırını aşıyor.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Asynchronously read all valid files before calling state updater
    const processedItems = await Promise.all(
      validFiles.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = reader.result.split(',')[1];
              resolve({
                fingerprint: getFileFingerprint(file),
                name: file.name,
                sizeMb: (file.size / (1024 * 1024)).toFixed(2),
                mimeType: file.type || 'image/png',
                base64: base64Data,
                previewUrl: URL.createObjectURL(file),
                fileObject: file,
              });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          })
      )
    );

    const validItems = processedItems.filter(Boolean);

    setImages((prevImages) => {
      const existingKeys = new Set(
        prevImages.map((img) => img.fingerprint || getFileFingerprint(img.fileObject))
      );

      const uniqueItems = validItems.filter((item) => {
        if (existingKeys.has(item.fingerprint)) {
          return false;
        }
        existingKeys.add(item.fingerprint);
        return true;
      });

      if (uniqueItems.length === 0) return prevImages;

      const combined = [...prevImages, ...uniqueItems];
      if (combined.length > maxImages) {
        setUploadError(`En fazla ${maxImages} görsel yükleyebilirsiniz.`);
        return combined.slice(0, maxImages);
      }

      return combined;
    });
  }, [maxSizeMb, maxImages]);

  /**
   * Removes an image by index and revokes its preview URL to prevent memory leaks.
   * @param {number} index
   */
  const removeImage = useCallback((index) => {
    setImages((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /**
   * Handles document file input change with deduplication check.
   * @param {Event} e - Input change event
   */
  const handleFileUpload = useCallback((e) => {
    const uploadedFiles = Array.from(e.target.files || []);
    if (uploadedFiles.length === 0) return;

    if (e.target) e.target.value = '';

    setUploadError(null);

    const newItems = [];
    for (const file of uploadedFiles) {
      const sizeMb = file.size / (1024 * 1024);

      if (sizeMb > maxSizeMb) {
        setUploadError(`"${file.name}" boyutu ${maxSizeMb} MB sınırını aşıyor.`);
        continue;
      }

      newItems.push({
        fingerprint: getFileFingerprint(file),
        name: file.name,
        sizeMb: sizeMb.toFixed(2),
        fileObject: file,
      });
    }

    if (newItems.length === 0) return;

    setFiles((prevFiles) => {
      const existingKeys = new Set(
        prevFiles.map((f) => f.fingerprint || getFileFingerprint(f.fileObject))
      );

      const uniqueItems = newItems.filter((item) => {
        if (existingKeys.has(item.fingerprint)) {
          return false;
        }
        existingKeys.add(item.fingerprint);
        return true;
      });

      if (uniqueItems.length === 0) return prevFiles;

      const combined = [...prevFiles, ...uniqueItems];
      if (combined.length > maxFiles) {
        setUploadError(`En fazla ${maxFiles} dosya yükleyebilirsiniz.`);
        return combined.slice(0, maxFiles);
      }

      return combined;
    });
  }, [maxSizeMb, maxFiles]);

  /**
   * Removes a file by index.
   * @param {number} index
   */
  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Cleans up all images (revokes preview URLs) and resets state.
   */
  const resetAll = useCallback(() => {
    images.forEach((img) => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
    setFiles([]);
    setUploadError(null);
  }, [images]);

  /**
   * Returns all attachments (images + files) in a format ready for Jira upload.
   * @returns {Array<{ name: string, sizeMb: string, fileObject: File }>}
   */
  const getAllAttachments = useCallback(() => {
    return [
      ...images.map((img) => ({ name: img.name, sizeMb: img.sizeMb, fileObject: img.fileObject })),
      ...files.map((f) => ({ name: f.name, sizeMb: f.sizeMb, fileObject: f.fileObject })),
    ];
  }, [images, files]);

  return {
    images,
    files,
    uploadError,
    setUploadError,
    handleImageUpload,
    removeImage,
    handleFileUpload,
    removeFile,
    resetAll,
    getAllAttachments,
  };
}
