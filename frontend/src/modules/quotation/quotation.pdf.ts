import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { CreateQuotationDTO, QuotationItemForm } from "./quotation.types";
import logoImg from "../../assets/logo.jpg";

interface CompanyDetails {
  companyName: string;
  companyLogo?: string | null;
  companyGst: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
  upiId: string;
  termsAndConditions: string;
  authorizedSignature?: string | null;
  footerText: string;
  currencySymbol?: string | null;
}

interface DownloadQuotationPDFProps {
  quotationNumber: string;
  quotationType: "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER";
  targetName?: string;
  projectName?: string;
  payload: CreateQuotationDTO;
  items: QuotationItemForm[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  companyDetails?: CompanyDetails;
}

export function downloadQuotationPDF({
  quotationNumber,
  quotationType,
  targetName,
  projectName,
  payload,
  items,
  subtotal,
  discountAmount,
  totalAmount,
  companyDetails,
}: DownloadQuotationPDFProps) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const comp = companyDetails || {
    companyName: "N.K.Poduval & Company",
    companyLogo: null,
    companyGst: "UDYAM-KL-07-0017431",
    companyAddress: "Sastri Road, Kottayam, Kerala - 686001",
    companyPhone: "+91 94970 89390",
    companyEmail: "office.nkpoduval@gmail.com",
    companyWebsite: "www.nkpoduval.com",
    bankName: "State Bank of India",
    bankAccountNo: "123456789012",
    bankIfsc: "SBIN0001234",
    bankBranch: "Kottayam Branch",
    upiId: "nkpoduval@sbi",
    termsAndConditions: "1. Quotation is valid for 30 days.\n2. 50% advance payment required.",
    authorizedSignature: null,
    footerText: "Thank you for doing business with us!",
    currencySymbol: "₹",
  };

  // -----------------------------
  // Header Logo and Info
  // -----------------------------
  let textStartX = 14;
  const logoToUse = comp.companyLogo || logoImg;
  if (logoToUse) {
    try {
      const format = logoToUse.includes(".png") || logoToUse.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(logoToUse, format, 14, 8, 22, 22);
      textStartX = 41;
    } catch (e) {
      console.error("Failed to add company logo to PDF", e);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(comp.companyName, textStartX, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);

  let currentHeaderY = 20;
  if (comp.companyAddress) {
    doc.text(comp.companyAddress, textStartX, currentHeaderY);
    currentHeaderY += 4.5;
  }
  
  const contactLines = [
    comp.companyPhone ? `Phone: ${comp.companyPhone}` : "",
    comp.companyEmail ? `Email: ${comp.companyEmail}` : "",
    comp.companyWebsite ? `Web: ${comp.companyWebsite}` : "",
  ].filter(Boolean).join("  |  ");
  
  if (contactLines) {
    doc.text(contactLines, textStartX, currentHeaderY);
    currentHeaderY += 4.5;
  }

  if (comp.companyGst) {
    doc.text(`GSTIN: ${comp.companyGst}`, textStartX, currentHeaderY);
  }

  // Right-aligned "QUOTATION" label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(33, 37, 41);
  doc.text("QUOTATION", 196, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`No: ${quotationNumber}`, 196, 25, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 196, 30, { align: "right" });

  doc.setDrawColor(220);
  doc.line(14, 38, 196, 38);

  // -----------------------------
  // Billing / Project Details
  // -----------------------------
  doc.setFontSize(10);
  doc.setTextColor(33, 37, 41);

  let detailY = 46;
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION FOR:", 14, detailY);
  doc.text("DETAILS:", 130, detailY);
  
  detailY += 6;
  doc.setFont("helvetica", "normal");

  // Client Details
  const clientLines = [];
  if (quotationType === "WALK_IN_CUSTOMER") {
    clientLines.push(payload.walkInName || "-");
    clientLines.push(`Mobile: ${payload.walkInMobile || "-"}`);
    if (payload.walkInEmail) clientLines.push(`Email: ${payload.walkInEmail}`);
    if (payload.walkInAddress) clientLines.push(`Address: ${payload.walkInAddress}`);
  } else {
    clientLines.push(targetName || "-");
    if (projectName) clientLines.push(`Project: ${projectName}`);
    if (payload.phase) clientLines.push(`Phase: ${payload.phase}`);
  }

  let tempY = detailY;
  clientLines.forEach((line) => {
    doc.text(line, 14, tempY);
    tempY += 5;
  });

  // Metadata Details
  let metaY = detailY;
  doc.text(`Validity: ${payload.validUntil ? new Date(payload.validUntil).toLocaleDateString() : "-"}`, 130, metaY);
  metaY += 5;
  doc.text(`Currency: ${comp.currencySymbol || "INR (Rs)"}`, 130, metaY);

  const startTableY = Math.max(tempY, metaY) + 6;

  // -----------------------------
  // Items Table
  // -----------------------------
  const rows = items
    .filter((item) => item.productId)
    .map((item) => [
      item.productName ?? item.search,
      item.quantity.toString(),
      `₹ ${item.sellingPrice.toFixed(2)}`,
      `${item.gstPercent ?? 18}%`,
      `₹ ${item.totalPrice.toFixed(2)}`,
    ]);

  autoTable(doc, {
    startY: startTableY,
    head: [["Product Description", "Qty", "Selling Price", "GST %", "Total Selling Price"]],
    body: rows,
    styles: {
      fontSize: 9.5,
      cellPadding: 3.5,
    },
    headStyles: {
      fillColor: [33, 37, 41],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "center" },
      4: { halign: "right" },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? (startTableY + 20);

  // -----------------------------
  // Totals & Bank Box side-by-side
  // -----------------------------
  const nextSectionY = finalY + 10;

  // Render Bank Details Box on the left
  doc.setDrawColor(220);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(14, nextSectionY, 105, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(33, 37, 41);
  doc.text("Bank Details for Payment:", 18, nextSectionY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Bank: ${comp.bankName}`, 18, nextSectionY + 12);
  doc.text(`A/C No: ${comp.bankAccountNo}`, 18, nextSectionY + 17);
  doc.text(`IFSC: ${comp.bankIfsc}`, 18, nextSectionY + 22);
  doc.text(`Branch: ${comp.bankBranch}`, 18, nextSectionY + 27);
  if (comp.upiId) {
    doc.text(`UPI ID: ${comp.upiId}`, 18, nextSectionY + 32);
  }

  // Render Summary Totals on the right
  doc.setFontSize(10.5);
  doc.setTextColor(33, 37, 41);
  doc.text(`Subtotal:`, 140, nextSectionY + 6);
  doc.text(`₹ ${subtotal.toFixed(2)}`, 196, nextSectionY + 6, { align: "right" });

  doc.text(`Discount:`, 140, nextSectionY + 13);
  doc.text(`₹ ${discountAmount.toFixed(2)}`, 196, nextSectionY + 13, { align: "right" });

  const totalGst = items.reduce((sum, item) => sum + item.totalPrice * ((item.gstPercent ?? 18) / 100), 0);
  doc.text(`Total GST:`, 140, nextSectionY + 20);
  doc.text(`₹ ${totalGst.toFixed(2)}`, 196, nextSectionY + 20, { align: "right" });

  doc.setDrawColor(180);
  doc.line(140, nextSectionY + 24, 196, nextSectionY + 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Grand Total:`, 140, nextSectionY + 31);
  doc.text(`₹ ${totalAmount.toFixed(2)}`, 196, nextSectionY + 31, { align: "right" });

  // -----------------------------
  // Terms & Conditions / Signatures
  // -----------------------------
  const termsY = nextSectionY + 44;

  // Terms & Conditions on the Left
  if (comp.termsAndConditions) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(33, 37, 41);
    doc.text("Terms & Conditions:", 14, termsY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const splitTerms = doc.splitTextToSize(comp.termsAndConditions, 110);
    doc.text(splitTerms, 14, termsY + 6);
  }

  // Notes if exists
  if (payload.notes) {
    const notesY = termsY + 30;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(33, 37, 41);
    doc.text("Notes:", 14, notesY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const splitNotes = doc.splitTextToSize(payload.notes, 110);
    doc.text(splitNotes, 14, notesY + 6);
  }

  // Signature on the Right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(33, 37, 41);
  doc.text("For, " + comp.companyName, 150, termsY);

  if (comp.authorizedSignature && comp.authorizedSignature.startsWith("data:image")) {
    try {
      doc.addImage(comp.authorizedSignature, "PNG", 150, termsY + 4, 35, 14);
    } catch (e) {
      console.error("Failed to add authorized signature to PDF", e);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Authorized Signatory", 150, termsY + 24);

  // -----------------------------
  // Footer text
  // -----------------------------
  doc.setDrawColor(220);
  doc.line(14, 280, 196, 280);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(comp.footerText, 105, 286, { align: "center" });

  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);

  window.open(pdfUrl, "_blank");
}
