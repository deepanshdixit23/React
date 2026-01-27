import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Upload,
  Trash2,
  Download,
  FileText,
  GripVertical,
  AlertCircle,
  X,
  ArrowLeft,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";

const PDFEditor = () => {
  const [pages, setPages] = useState([]);
  const [draggedPage, setDraggedPage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Memoized total file size
  const totalSize = useMemo(() => {
    return pages.reduce((acc, page) => acc + (page.fileSize || 0), 0);
  }, [pages]);

  // Format file size
  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = "";
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf",
    );

    if (files.length === 0) {
      setError("Please drop PDF files only");
      setTimeout(() => setError(null), 3000);
      return;
    }

    await processFiles(files);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Load PDF.js library once
  const loadPDFJS = useCallback(async () => {
    if (window.pdfjsLib) return window.pdfjsLib;

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  // Render PDF preview as image using canvas - Each page gets its own PDF instance
  const renderPDFPreview = async (pdfData, pageIndex) => {
    try {
      console.log(`Starting render for page index ${pageIndex}`);

      // Load PDF.js
      const pdfjsLib = await loadPDFJS();

      // Create a fresh Uint8Array for this render
      const uint8Array = new Uint8Array(pdfData.slice(0));

      // Load the PDF document - create new instance for each page
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        verbosity: 0, // Reduce console spam
      });
      const pdf = await loadingTask.promise;

      console.log(
        `PDF loaded for page ${pageIndex + 1}, total pages: ${pdf.numPages}`,
      );

      // Get the specific page
      const page = await pdf.getPage(pageIndex + 1);

      console.log(`Page ${pageIndex + 1} retrieved`);

      // Set scale for good quality
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", {
        alpha: false,
        willReadFrequently: false,
      });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        intent: "print",
      };

      console.log(`Rendering page ${pageIndex + 1}...`);
      const renderTask = page.render(renderContext);
      await renderTask.promise;
      console.log(`Page ${pageIndex + 1} rendered to canvas`);

      // Convert canvas to data URL (image)
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

      console.log(
        `Page ${pageIndex + 1} converted to image (${Math.round(imageDataUrl.length / 1024)}KB)`,
      );

      // Cleanup
      page.cleanup();
      await pdf.destroy();
      canvas.width = 0;
      canvas.height = 0;

      return imageDataUrl;
    } catch (err) {
      console.error(
        `FAILED rendering page ${pageIndex + 1}:`,
        err.message,
        err,
      );
      return null;
    }
  };

  // Process uploaded PDF files
  const processFiles = async (files) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Ensure PDF.js is loaded first
      console.log("Loading PDF.js library...");
      await loadPDFJS();
      console.log("PDF.js loaded successfully");

      for (const file of files) {
        console.log(`\n===== Processing file: ${file.name} =====`);
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        console.log(`File has ${pageCount} pages`);

        // Create all pages for this file with loading state
        const pagesForFile = [];
        for (let i = 0; i < pageCount; i++) {
          const pageId = `${file.name}-${i}-${Date.now()}-${Math.random()}`;

          pagesForFile.push({
            id: pageId,
            fileName: file.name,
            pageNumber: i + 1,
            totalPages: pageCount,
            pdfData: arrayBuffer,
            fileSize: file.size,
            preview: null,
            rotation: 0,
            isLoading: true,
          });
        }

        // Add pages immediately so user sees placeholders
        console.log("Adding page placeholders to UI");
        setPages((prev) => [...prev, ...pagesForFile]);

        // Render all previews in parallel with Promise.all
        console.log("Starting parallel preview generation...");
        const previewPromises = pagesForFile.map(async (pageInfo, index) => {
          try {
            console.log(`[Thread ${index + 1}] Starting...`);
            const previewUrl = await renderPDFPreview(arrayBuffer, index);

            if (previewUrl) {
              console.log(`[Thread ${index + 1}] ✓ Success`);
            } else {
              console.log(`[Thread ${index + 1}] ✗ Failed (null result)`);
            }

            // Update the specific page
            setPages((currentPages) =>
              currentPages.map((p) =>
                p.id === pageInfo.id
                  ? { ...p, preview: previewUrl, isLoading: false }
                  : p,
              ),
            );

            return { index, success: !!previewUrl };
          } catch (err) {
            console.error(`[Thread ${index + 1}] ✗ Error:`, err);

            setPages((currentPages) =>
              currentPages.map((p) =>
                p.id === pageInfo.id ? { ...p, isLoading: false } : p,
              ),
            );

            return { index, success: false, error: err.message };
          }
        });

        // Wait for all previews to complete
        const results = await Promise.all(previewPromises);

        const successCount = results.filter((r) => r.success).length;
        console.log(
          `\n===== Completed ${file.name}: ${successCount}/${pageCount} previews generated =====\n`,
        );

        if (successCount < pageCount) {
          console.warn(
            "Some previews failed:",
            results.filter((r) => !r.success),
          );
        }
      }
    } catch (err) {
      console.error("CRITICAL ERROR processing PDF:", err);
      setError(
        "Error processing PDF files. Please ensure they are valid PDFs.",
      );
    }

    setIsProcessing(false);
  };

  // Delete a single page
  const deletePage = useCallback((pageId) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  }, []);

  // Rotate page
  const rotatePage = useCallback((pageId) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id === pageId) {
          const newRotation = (page.rotation + 90) % 360;
          return { ...page, rotation: newRotation };
        }
        return page;
      }),
    );
  }, []);

  // Move page left (decrease position)
  const movePageLeft = useCallback((pageId) => {
    setPages((prev) => {
      const index = prev.findIndex((p) => p.id === pageId);
      if (index <= 0) return prev; // Already at start

      const newPages = [...prev];
      const temp = newPages[index];
      newPages[index] = newPages[index - 1];
      newPages[index - 1] = temp;
      return newPages;
    });
  }, []);

  // Move page right (increase position)
  const movePageRight = useCallback((pageId) => {
    setPages((prev) => {
      const index = prev.findIndex((p) => p.id === pageId);
      if (index === -1 || index >= prev.length - 1) return prev; // Already at end

      const newPages = [...prev];
      const temp = newPages[index];
      newPages[index] = newPages[index + 1];
      newPages[index + 1] = temp;
      return newPages;
    });
  }, []);

  // Clear all pages
  const clearAll = useCallback(() => {
    if (window.confirm("Are you sure you want to remove all pages?")) {
      setPages([]);
      setError(null);
    }
  }, []);

  // Drag and drop for reordering (Desktop only)
  const handleDragStart = useCallback((e, page, index) => {
    setDraggedPage({ page, index });
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "0.5";
    }
  }, []);

  const handleDragEnd = useCallback((e) => {
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedPage(null);
    setDragOverIndex(null);
  }, []);

  const handlePageDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handlePageDrop = useCallback(
    (e, targetIndex) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedPage || draggedPage.index === targetIndex) {
        setDragOverIndex(null);
        return;
      }

      const newPages = [...pages];
      const [movedPage] = newPages.splice(draggedPage.index, 1);
      newPages.splice(targetIndex, 0, movedPage);

      setPages(newPages);
      setDraggedPage(null);
      setDragOverIndex(null);
    },
    [draggedPage, pages],
  );

  // Merge PDFs and download
  const mergePDFs = async () => {
    if (pages.length === 0) {
      setError("Please add some PDF pages first!");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const page of pages) {
        const sourcePdf = await PDFDocument.load(page.pdfData);
        const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [
          page.pageNumber - 1,
        ]);

        // Apply rotation
        if (page.rotation !== 0) {
          copiedPage.setRotation(degrees(page.rotation));
        }

        mergedPdf.addPage(copiedPage);
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `merged-pdf-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      // Show success message
      const successDiv = document.createElement("div");
      successDiv.className =
        "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in";
      successDiv.textContent = "✓ PDF downloaded successfully!";
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          successDiv.classList.add("animate-slide-out");
          setTimeout(() => {
            if (document.body.contains(successDiv)) {
              document.body.removeChild(successDiv);
            }
          }, 300);
        }
      }, 3000);
    } catch (err) {
      console.error("Error merging PDFs:", err);
      setError("Error creating merged PDF. Please try again.");
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with SEO */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <FileText size={44} className="text-blue-600" />
            PDF Page Manager
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            Free Online PDF Editor - Merge, Split, Reorder & Rotate PDF Pages
          </p>
          <p className="text-sm text-gray-500">
            No registration required • Completely free • Works offline • Secure
            & Private
          </p>
        </header>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between shadow-md animate-shake">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="hover:bg-red-200 rounded p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="bg-white rounded-xl border-2 border-dashed border-blue-300 p-12 mb-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
          role="button"
          aria-label="Upload PDF files"
          tabIndex={0}
        >
          <Upload
            className="mx-auto mb-4 text-blue-500 animate-bounce-slow"
            size={56}
          />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {isProcessing
              ? "Processing PDFs..."
              : "Drop PDF files here or click to browse"}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Support for multiple PDF files • Max 50MB per file
          </p>
          {totalSize > 0 && (
            <p className="text-xs text-gray-400">
              Total size: {formatSize(totalSize)}
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Choose PDF files"
          />
        </div>

        {/* Stats Bar */}
        {pages.length > 0 && (
          <div className="bg-white rounded-lg p-4 mb-6 shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-gray-600">Total Pages:</span>
                <span className="ml-2 font-bold text-blue-600">
                  {pages.length}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Size:</span>
                <span className="ml-2 font-bold text-blue-600">
                  {formatSize(totalSize)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={mergePDFs}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg active:scale-95"
                aria-label="Download merged PDF"
              >
                <Download size={18} />
                {isProcessing ? "Processing..." : "Download PDF"}
              </button>
              <button
                onClick={clearAll}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-all font-semibold shadow-md hover:shadow-lg active:scale-95"
                aria-label="Clear all pages"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        {pages.length === 0 && !isProcessing && (
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <AlertCircle
                className="text-blue-600 mt-0.5 flex-shrink-0"
                size={28}
              />
              <div>
                <h3 className="font-bold text-blue-900 mb-3 text-xl">
                  How to use this PDF Editor:
                </h3>
                <ol className="text-sm text-blue-800 space-y-2.5">
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      1
                    </span>
                    <span>
                      <strong>Upload PDFs:</strong> Drag and drop or click to
                      select one or more PDF files
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      2
                    </span>
                    <span>
                      <strong>Reorder Pages:</strong> Use arrow buttons to move
                      pages left or right
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      3
                    </span>
                    <span>
                      <strong>Rotate Pages:</strong> Use the rotate button to
                      adjust page orientation
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      4
                    </span>
                    <span>
                      <strong>Delete Pages:</strong> Click trash icon to remove
                      unwanted pages
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      5
                    </span>
                    <span>
                      <strong>Download:</strong> Click "Download PDF" to save
                      your edited document
                    </span>
                  </li>
                </ol>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    🔒 <strong>Privacy First:</strong> All processing happens in
                    your browser. Your files never leave your device.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Pages Grid */}
        {pages.length > 0 && (
          <section
            className="bg-white rounded-xl p-4 md:p-6 shadow-lg"
            aria-label="PDF pages"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText size={28} className="text-blue-600" />
                Your Pages ({pages.length})
              </h2>
              <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                💡 Use arrows to reorder pages
              </p>
            </div>

            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 overflow-y-auto"
              style={{
                maxHeight: "calc(100vh - 400px)",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {pages.map((page, index) => (
                <article
                  key={page.id}
                  draggable={!("ontouchstart" in window)}
                  onDragStart={(e) => handleDragStart(e, page, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handlePageDragOver(e, index)}
                  onDrop={(e) => handlePageDrop(e, index)}
                  className={`relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 p-2 md:p-3 transition-all group ${
                    dragOverIndex === index
                      ? "border-blue-500 bg-blue-50 scale-105"
                      : "border-gray-200"
                  }`}
                  style={{ touchAction: "pan-y" }}
                >
                  {/* Drag Handle - Desktop only */}
                  <div className="absolute top-2 left-2 bg-white rounded p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block cursor-move">
                    <GripVertical size={16} className="text-gray-600" />
                  </div>

                  {/* PDF Preview */}
                  <div className="w-full h-32 md:h-40 bg-white rounded border border-gray-300 flex items-center justify-center mb-2 md:mb-3 shadow-sm overflow-hidden relative">
                    {page.isLoading ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500">Loading...</p>
                      </div>
                    ) : page.preview ? (
                      <img
                        src={page.preview}
                        alt={`Page ${page.pageNumber} preview`}
                        className="w-full h-full object-contain"
                        style={{
                          transform: `rotate(${page.rotation}deg)`,
                          transition: "transform 0.3s ease",
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-center">
                        <FileText
                          size={48}
                          className="text-gray-400 mx-auto mb-2"
                        />
                        <p className="text-xs text-gray-500 font-semibold">
                          Page {page.pageNumber}
                        </p>
                        <p className="text-xs text-gray-400">
                          of {page.totalPages}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Always visible on mobile */}
                  <div className="flex gap-1 mb-2 justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        movePageLeft(page.id);
                      }}
                      disabled={index === 0}
                      className="bg-blue-500 text-white rounded p-1.5 hover:bg-blue-600 active:bg-blue-700 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed touch-manipulation"
                      title="Move left"
                      aria-label="Move page left"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        movePageRight(page.id);
                      }}
                      disabled={index === pages.length - 1}
                      className="bg-blue-500 text-white rounded p-1.5 hover:bg-blue-600 active:bg-blue-700 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed touch-manipulation"
                      title="Move right"
                      aria-label="Move page right"
                    >
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotatePage(page.id);
                      }}
                      className="bg-purple-500 text-white rounded p-1.5 hover:bg-purple-600 active:bg-purple-700 transition-all shadow-md touch-manipulation"
                      title="Rotate"
                      aria-label="Rotate page"
                    >
                      <RotateCw size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePage(page.id);
                      }}
                      className="bg-red-500 text-white rounded p-1.5 hover:bg-red-600 active:bg-red-700 transition-all shadow-md touch-manipulation"
                      title="Delete"
                      aria-label="Delete this page"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Page Info */}
                  <div className="space-y-1">
                    <div
                      className="text-xs text-gray-600 truncate font-medium"
                      title={page.fileName}
                    >
                      📄 {page.fileName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Page {page.pageNumber}/{page.totalPages}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-bold text-blue-600 bg-blue-50 rounded px-2 py-1">
                        Pos: {index + 1}
                      </div>
                      {page.rotation !== 0 && (
                        <div className="text-xs text-purple-600 bg-purple-50 rounded px-2 py-1 flex items-center gap-1">
                          <RotateCw size={10} />
                          {page.rotation}°
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* SEO Footer */}
        <footer className="mt-12 text-center text-sm text-gray-600 pb-8">
          <p className="mb-2">
            <strong>Free PDF Editor Online</strong> - Merge PDF files, reorder
            pages, rotate, and delete pages without watermarks.
          </p>
          <p className="text-xs text-gray-500">
            100% free • No file size limits • Secure & private • No registration
            required • Works on all devices
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PDFEditor;
