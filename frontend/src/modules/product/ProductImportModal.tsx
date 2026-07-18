import React, { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertTriangle, Info, ArrowRight, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { usePreviewProductImport, useConfirmProductImport } from "./product.query";
import { Badge } from "../../components/ui/badge";

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "upload" | "preview" | "importing" | "complete";
type ActiveTab = "summary" | "new" | "updates" | "errors";

export default function ProductImportModal({ isOpen, onClose }: ProductImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [activeTab, setActiveTab] = useState<ActiveTab>("summary");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = usePreviewProductImport();
  const confirmMutation = useConfirmProductImport();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    const validExtensions = [".csv", ".xlsx", ".xls", ".ods", ".tsv"];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error(`Unsupported file format. Please upload: ${validExtensions.join(", ")}`);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds the 10MB limit.");
      return;
    }

    setFile(selectedFile);
    uploadAndPreview(selectedFile);
  };

  const uploadAndPreview = async (selectedFile: File) => {
    setStep("upload");
    // Simulate upload & parsing progress increments for interactive high-fidelity feedback
    setUploadProgress(10);
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 100);

    try {
      const data = await previewMutation.mutateAsync(selectedFile);
      clearInterval(uploadInterval);
      setUploadProgress(100);

      // Transition to parsing
      setParsingProgress(20);
      const parseInterval = setInterval(() => {
        setParsingProgress((prev) => (prev < 90 ? prev + 25 : prev));
      }, 80);

      setTimeout(() => {
        clearInterval(parseInterval);
        setParsingProgress(100);
        setPreviewData(data);
        setStep("preview");
        setActiveTab("summary");
      }, 350);

    } catch (error: any) {
      clearInterval(uploadInterval);
      setFile(null);
      setUploadProgress(0);
      setParsingProgress(0);
      const errorMsg = error.response?.data?.error || error.message || "Failed to process spreadsheet.";
      toast.error(errorMsg);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;

    setStep("importing");
    setImportProgress(10);

    const importInterval = setInterval(() => {
      setImportProgress((prev) => (prev < 90 ? prev + 20 : prev));
    }, 150);

    try {
      const inserts = previewData.newProducts;
      const updates = previewData.updatedProducts.map((p: any) => {
        const mapped: any = {};
        mapped.sku = p.sku;
        mapped.name = p.name;
        mapped.brand = p.brand;
        mapped.category = p.category;
        mapped.unit = p.unit;
        mapped.costPrice = p.costPrice;
        mapped.mrp = p.mrp;
        mapped.stockQty = p.stockQty;

        // Apply changes
        p.changes.forEach((c: any) => {
          mapped[c.field] = c.newValue;
        });

        return {
          id: p.id,
          mapped,
        };
      });

      const summary = await confirmMutation.mutateAsync({ inserts, updates });
      clearInterval(importInterval);
      setImportProgress(100);
      setImportSummary(summary);
      setStep("complete");
      toast.success("Products imported successfully!");
    } catch (error: any) {
      clearInterval(importInterval);
      setStep("preview");
      setImportProgress(0);
      const errorMsg = error.response?.data?.error || error.message || "Failed to commit imports.";
      toast.error(errorMsg);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setPreviewData(null);
    setImportSummary(null);
    setUploadProgress(0);
    setParsingProgress(0);
    setImportProgress(0);
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "—";
    return `₹${Number(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      sku: "SKU",
      name: "Product Name",
      brand: "Brand",
      category: "Category",
      unit: "Unit",
      costPrice: "Cost Price",
      mrp: "MRP",
      stockQty: "Stock Quantity",
      tallyMasterId: "Tally Master ID",
      tallyGuid: "Tally GUID",
      tallyAlterId: "Tally Alter ID",
    };
    return labels[field] || field;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { if (step !== "importing") onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-gray-100 shadow-2xl bg-white transition-all duration-200">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              Import Product Catalogue
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Supports CSV, XLS, XLSX, TSV, and ODS spreadsheet formats.
            </p>
          </div>
          {step !== "importing" && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </DialogHeader>

        {/* Wizard Steps indicator */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between text-xs font-semibold text-gray-400">
          <div className="flex items-center gap-8">
            <span className={`${step === "upload" ? "text-indigo-600 font-bold" : "text-gray-500"}`}>
              1. Upload Spreadsheet
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
            <span className={`${step === "preview" ? "text-indigo-600 font-bold" : "text-gray-500"}`}>
              2. Inspect Preview
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
            <span className={`${step === "importing" ? "text-indigo-600 font-bold" : "text-gray-500"}`}>
              3. Importing Data
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
            <span className={`${step === "complete" ? "text-indigo-600 font-bold" : "text-gray-500"}`}>
              4. View Summary
            </span>
          </div>
        </div>

        {/* Step Contents */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px] flex flex-col justify-stretch">
          {/* UPLOAD STEP */}
          {step === "upload" && !previewMutation.isPending && !file && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-indigo-600 bg-indigo-50/50"
                  : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls,.ods,.tsv"
                className="hidden"
              />
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Drag and drop your spreadsheet here
              </h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-sm">
                or click to browse from your computer. Supports CSV, TSV, ODS, XLS, and XLSX formats (Max 10MB).
              </p>
              <Button type="button" variant="outline" className="h-9 px-4 rounded-xl text-xs font-semibold">
                Browse Files
              </Button>
            </div>
          )}

          {/* LOADING & PARSING STEPS */}
          {(previewMutation.isPending || (step === "upload" && file)) && (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              {uploadProgress < 100 ? (
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Validating & Parsing spreadsheet...</span>
                    <span>{parsingProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                      style={{ width: `${parsingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW STEP */}
          {step === "preview" && previewData && (
            <div className="flex-grow flex flex-col gap-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800">
                    New Products
                  </span>
                  <span className="text-2xl font-black text-emerald-700 mt-1">
                    {previewData.summary.newProductsCount}
                  </span>
                </div>
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800">
                    To Update
                  </span>
                  <span className="text-2xl font-black text-amber-700 mt-1">
                    {previewData.summary.updatedProductsCount}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    Unchanged
                  </span>
                  <span className="text-2xl font-black text-slate-700 mt-1">
                    {previewData.summary.unchangedCount}
                  </span>
                </div>
                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-rose-800">
                    Rows Skipped
                  </span>
                  <span className="text-2xl font-black text-rose-700 mt-1">
                    {previewData.summary.skippedCount}
                  </span>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-100 text-xs font-bold text-gray-400">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`pb-2 px-3 border-b-2 transition-colors ${
                    activeTab === "summary"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent hover:text-gray-900"
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab("new")}
                  className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "new"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent hover:text-gray-900"
                  }`}
                >
                  New ({previewData.newProducts.length})
                </button>
                <button
                  onClick={() => setActiveTab("updates")}
                  className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "updates"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent hover:text-gray-900"
                  }`}
                >
                  Updates ({previewData.updatedProducts.length})
                </button>
                <button
                  onClick={() => setActiveTab("errors")}
                  className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "errors"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent hover:text-gray-900"
                  }`}
                >
                  Skipped/Errors ({previewData.summary.skippedCount})
                </button>
              </div>

              {/* Tab Panels */}
              <div className="flex-1 min-h-[220px]">
                {/* 1. Summary View */}
                {activeTab === "summary" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-indigo-950 space-y-1">
                        <p className="font-bold">Review Changes Carefully</p>
                        <p>
                          Verify the changes below before clicking **Confirm Import**. The spreadsheet data will serve as the absolute source of truth. Negative quantities will be imported as-is.
                        </p>
                      </div>
                    </div>

                    <div className="border border-gray-150 rounded-xl overflow-hidden text-xs">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-gray-700">
                        Import Metadata Statistics
                      </div>
                      <div className="divide-y divide-gray-100">
                        <div className="px-4 py-2.5 flex justify-between">
                          <span className="text-muted-foreground">Total Rows Processed</span>
                          <span className="font-bold">{previewData.summary.totalRows}</span>
                        </div>
                        <div className="px-4 py-2.5 flex justify-between bg-emerald-50/20">
                          <span className="text-emerald-800">New Products (Will Insert)</span>
                          <span className="font-bold text-emerald-700">{previewData.summary.newProductsCount}</span>
                        </div>
                        <div className="px-4 py-2.5 flex justify-between bg-amber-50/20">
                          <span className="text-amber-800">Existing Products (Will Update)</span>
                          <span className="font-bold text-amber-700">{previewData.summary.updatedProductsCount}</span>
                        </div>
                        <div className="px-4 py-2.5 flex justify-between">
                          <span className="text-muted-foreground">Unchanged Products (Will Skip)</span>
                          <span className="font-bold">{previewData.summary.unchangedCount}</span>
                        </div>
                        <div className="px-4 py-2.5 flex justify-between bg-rose-50/20">
                          <span className="text-rose-800">Duplicate Rows (Will Skip)</span>
                          <span className="font-bold text-rose-700">{previewData.summary.duplicateCount}</span>
                        </div>
                        <div className="px-4 py-2.5 flex justify-between bg-rose-50/20">
                          <span className="text-rose-800">Invalid Rows (Will Skip)</span>
                          <span className="font-bold text-rose-700">{previewData.summary.invalidCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. New Products View */}
                {activeTab === "new" && (
                  <div className="border border-gray-150 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {previewData.newProducts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        No new products to insert.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs divide-y divide-gray-150">
                        <thead className="bg-gray-50 font-bold text-gray-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5">SKU</th>
                            <th className="px-4 py-2.5">Name</th>
                            <th className="px-4 py-2.5">Brand</th>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5 text-right">Cost Price</th>
                            <th className="px-4 py-2.5 text-right">MRP</th>
                            <th className="px-4 py-2.5 text-right">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {previewData.newProducts.map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 font-mono text-[10px] text-gray-900">{p.sku || "—"}</td>
                              <td className="px-4 py-2.5 font-semibold text-gray-950">{p.name}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{p.brand || "—"}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{p.category || "—"}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(p.costPrice)}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(p.mrp)}</td>
                              <td className="px-4 py-2.5 text-right font-bold tabular-nums text-gray-900">{p.stockQty ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* 3. Updates View */}
                {activeTab === "updates" && (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {previewData.updatedProducts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground border border-gray-150 rounded-xl">
                        No product updates detected.
                      </div>
                    ) : (
                      previewData.updatedProducts.map((p: any, idx: number) => (
                        <div key={idx} className="p-4 border border-gray-150 rounded-xl bg-white space-y-3 hover:shadow-xs transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <span className="font-mono text-[10px] font-bold text-gray-500 mr-2">SKU: {p.sku || "—"}</span>
                              <span className="text-xs font-bold text-gray-950">{p.name}</span>
                            </div>
                            <Badge variant="outline" className="w-fit text-[10px] font-bold border-amber-200 bg-amber-50 text-amber-800">
                              {p.changes.length} field(s) changing
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {p.changes.map((c: any, cidx: number) => (
                              <div key={cidx} className="p-2 bg-gray-50/50 rounded-lg flex items-center justify-between border border-gray-100">
                                <span className="font-semibold text-gray-600 text-[11px]">
                                  {formatFieldLabel(c.field)}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                                  <span className="text-rose-600 line-through">
                                    {c.field === "costPrice" || c.field === "mrp" ? formatCurrency(c.oldValue) : String(c.oldValue ?? "—")}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {c.field === "costPrice" || c.field === "mrp" ? formatCurrency(c.newValue) : String(c.newValue ?? "—")}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. Errors & Skipped View */}
                {activeTab === "errors" && (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {/* Invalid Rows */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Invalid Rows (Will Be Skipped)
                      </h4>
                      {previewData.invalidRows.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-5">No invalid rows found.</p>
                      ) : (
                        <div className="border border-red-100 rounded-xl overflow-hidden divide-y divide-red-50 text-xs">
                          {previewData.invalidRows.map((ir: any, idx: number) => (
                            <div key={idx} className="p-3 bg-red-50/20 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-red-950 bg-red-100/60 px-2 py-0.5 rounded text-[10px]">
                                  Row {ir.rowNumber}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-sm font-mono">
                                  {JSON.stringify(ir.rowData)}
                                </span>
                              </div>
                              <ul className="space-y-1.5 pl-2 list-disc list-inside">
                                {ir.errors.map((e: any, eidx: number) => (
                                  <li key={eidx} className="text-red-900 text-[11px]">
                                    <span className="font-bold uppercase text-[9px] bg-red-100 text-red-800 px-1 py-0.2 rounded mr-1.5">
                                      {e.field}
                                    </span>
                                    {e.message} <span className="text-red-700 italic font-medium ml-1">(Fix: {e.fix})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Duplicate Rows */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Duplicate Rows in File (Will Be Skipped)
                      </h4>
                      {previewData.duplicateRows.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-5">No duplicate rows found.</p>
                      ) : (
                        <div className="border border-amber-100 rounded-xl overflow-hidden divide-y divide-amber-50 text-xs">
                          {previewData.duplicateRows.map((dr: any, idx: number) => (
                            <div key={idx} className="p-3 bg-amber-50/20 flex items-center justify-between gap-4">
                              <span className="font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded text-[10px] shrink-0">
                                Row {dr.rowNumber}
                              </span>
                              <span className="text-amber-900 text-[11px] font-semibold flex-1">
                                {dr.reason}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate font-mono max-w-xs">
                                {JSON.stringify(dr.rowData)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IMPORTING STEP */}
          {step === "importing" && (
            <div className="flex-grow flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Importing products to database...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMPLETE STEP */}
          {step === "complete" && importSummary && (
            <div className="flex-grow flex flex-col items-center justify-center text-center py-8 space-y-6 animate-in zoom-in duration-200">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Import Process Completed</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Spreadsheet products have been synchronized in the database.
                </p>
              </div>

              <div className="w-full max-w-sm border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs text-left bg-white">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-muted-foreground">Total Processed Rows</span>
                  <span className="font-bold text-gray-900">
                    {previewData?.summary.totalRows ?? 0}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between bg-emerald-50/10">
                  <span className="text-emerald-800 font-medium">New Products Created</span>
                  <span className="font-bold text-emerald-700">{importSummary.imported}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between bg-amber-50/10">
                  <span className="text-amber-800 font-medium">Existing Products Updated</span>
                  <span className="font-bold text-amber-700">{importSummary.updated}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between bg-red-50/10">
                  <span className="text-red-800 font-medium">Failed Operations</span>
                  <span className="font-bold text-red-700">{importSummary.failed}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-muted-foreground">Skipped (Invalid/Duplicate)</span>
                  <span className="font-bold text-gray-700">
                    {previewData?.summary.skippedCount ?? 0}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-muted-foreground">Execution Time</span>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {importSummary.executionTimeMs} ms
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer actions */}
        <DialogFooter className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            {step === "preview" && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={confirmMutation.isPending}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Upload another file
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step === "preview" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={confirmMutation.isPending}
                  className="h-9 px-4 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={
                    confirmMutation.isPending ||
                    (previewData.summary.newProductsCount === 0 &&
                      previewData.summary.updatedProductsCount === 0)
                  }
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  {confirmMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Importing...
                    </>
                  ) : (
                    "Confirm Import"
                  )}
                </Button>
              </>
            )}
            {step === "complete" && (
              <Button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                Close
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
