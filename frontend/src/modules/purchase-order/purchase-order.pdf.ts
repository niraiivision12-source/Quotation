import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "../../assets/logo.jpg";

interface CompanyDetails {
  companyName: string;
  companyLogo?: string | null;
  companyGst?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyWebsite?: string | null;
  footerText: string;
}

interface DownloadPurchaseOrderPDFProps {
  purchaseOrderNumber: string;
  targetName?: string;
  payload: any; // backend PO record with snapshot fields
  items: any[];
  companyDetails?: CompanyDetails;
}

export function downloadPurchaseOrderPDF({
  purchaseOrderNumber,
  targetName,
  payload,
  items,
  companyDetails,
}: DownloadPurchaseOrderPDFProps) {
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
    footerText: "Thank you for your business!",
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

  // Right-aligned "PURCHASE ORDER" label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text("PURCHASE ORDER", 196, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`No: ${purchaseOrderNumber}`, 196, 25, { align: "right" });
  doc.text(`Date: ${new Date(payload.poDate || Date.now()).toLocaleDateString()}`, 196, 30, { align: "right" });

  doc.setDrawColor(220);
  doc.line(14, 38, 196, 38);

  // -----------------------------
  // Dealer / Project Details
  // -----------------------------
  doc.setFontSize(10);
  doc.setTextColor(33, 37, 41);

  let detailY = 46;
  doc.setFont("helvetica", "bold");
  doc.text("ORDER TO (DEALER):", 14, detailY);
  doc.text("DELIVERY DETAILS:", 130, detailY);
  
  detailY += 6;
  doc.setFont("helvetica", "normal");

  // Dealer details from snapshots
  const dealerLines = [
    payload.dealerNameSnapshot || targetName || "—",
  ];
  if (payload.dealerContactPersonSnapshot) {
    dealerLines.push(`Contact Person: ${payload.dealerContactPersonSnapshot}`);
  }
  dealerLines.push(`Mobile: ${payload.dealerMobileSnapshot || "—"}`);
  if (payload.dealerEmailSnapshot) {
    dealerLines.push(`Email: ${payload.dealerEmailSnapshot}`);
  }
  if (payload.dealerGstSnapshot) {
    dealerLines.push(`GSTIN: ${payload.dealerGstSnapshot}`);
  }
  if (payload.dealerAddressSnapshot) {
    dealerLines.push(`Address: ${payload.dealerAddressSnapshot}`);
  }

  let tempY = detailY;
  dealerLines.forEach((line) => {
    doc.text(line, 14, tempY);
    tempY += 5;
  });

  // Delivery details on the right
  let metaY = detailY;
  doc.text(`Expected Delivery: ${payload.expectedDeliveryDate ? new Date(payload.expectedDeliveryDate).toLocaleDateString() : "—"}`, 130, metaY);
  metaY += 5;
  doc.text(`Destination: ${payload.deliveryAddress || "Shop Warehouse"}`, 130, metaY);

  const startTableY = Math.max(tempY, metaY) + 6;

  // -----------------------------
  // Items Table (Quantity only, no pricing)
  // -----------------------------
  const rows = items
    .filter((item) => item.productId)
    .map((item, idx) => [
      (idx + 1).toString(),
      item.productName ?? item.search,
      item.sku ?? "—",
      item.quantity.toString() + (item.unit ? ` ${item.unit}` : ""),
    ]);

  autoTable(doc, {
    startY: startTableY,
    head: [["S.No", "Product Description", "SKU / Code", "Quantity"]],
    body: rows,
    styles: {
      fontSize: 9.5,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [30, 41, 59], // Dark slate theme
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      2: { fontStyle: "italic" },
      3: { halign: "center", cellWidth: 30 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? (startTableY + 20);

  // -----------------------------
  // Notes & Signatures
  // -----------------------------
  const termsY = finalY + 12;

  // Notes on the Left
  if (payload.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(33, 37, 41);
    doc.text("Instructions / Notes:", 14, termsY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const splitNotes = doc.splitTextToSize(payload.notes, 110);
    doc.text(splitNotes, 14, termsY + 6);
  }

  // Signature on the Right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(33, 37, 41);
  doc.text("For, " + comp.companyName, 150, termsY);

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
