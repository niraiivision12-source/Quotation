import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { CreateQuotationDTO, QuotationItemForm } from "./quotation.types";
import logoImg from "../../assets/logo.jpg";
import { ARIAL_REGULAR_FONT, ARIAL_BOLD_FONT } from "./quotation.fonts";

// ─── Indian currency formatting ───────────────────────────────────────────────
function formatIndianCurrency(value: number, symbol = "₹"): string {
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const fixed = absVal.toFixed(2);
  const [intPart, decPart] = fixed.split(".");

  // Indian grouping: last 3 digits, then groups of 2
  const lastThree = intPart.slice(-3);
  const remaining = intPart.slice(0, -3);
  const withCommas =
    remaining.length > 0
      ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree;

  const formatted = `${symbol}${withCommas}.${decPart}`;
  return isNegative ? `- ${formatted}` : formatted;
}

// ─── Type definitions ─────────────────────────────────────────────────────────
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

// ─── Default company info ─────────────────────────────────────────────────────
const DEFAULT_COMPANY: CompanyDetails = {
  companyName: "N.K. Poduval & Company",
  companyLogo: null,
  companyGst: "32AABFN7415K1ZD",
  companyAddress: "Sastri Road, Kottayam - 1",
  companyPhone: "2563001, 2564648",
  companyEmail: "office.nkpoduval@gmail.com",
  companyWebsite: "",
  bankName: "CANARA BANK",
  bankAccountNo: "0809261005016",
  bankIfsc: "CNRB0000809",
  bankBranch: "K.K. ROAD, KOTTAYAM",
  upiId: "",
  termsAndConditions:
    "1. Price – As per the date of quotation and subject to market fluctuation.\n" +
    "2. Payment – Against proforma invoice prior to delivery.\n" +
    "3. GST – As shown above.",
  authorizedSignature: null,
  footerText: "Thank you for doing business with us!",
  currencySymbol: "₹",
};

// ─── Page Layout Constants ──────────────────────────────────────────────────
const PAGE_W = 210;       // A4 width in mm
const PAGE_H = 297;       // A4 height in mm
const MARGIN_L = 14;
const MARGIN_R = 14;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 182 mm
const RIGHT_EDGE = PAGE_W - MARGIN_R;           // 196 mm

// Strict Proportional Column Widths (Sum = 182 mm = 100%)
// Product Description: 48% (87.36 mm)
// Qty:                 8%  (14.56 mm)
// Selling Price:       17% (30.94 mm)
// GST %:               8%  (14.56 mm)
// Total Selling Price: 19% (34.58 mm)
const COL_WIDTHS = {
  desc: CONTENT_W * 0.48,   // 87.36 mm
  qty: CONTENT_W * 0.08,    // 14.56 mm
  price: CONTENT_W * 0.17,  // 30.94 mm
  gst: CONTENT_W * 0.08,    // 14.56 mm
  total: CONTENT_W * 0.19,  // 34.58 mm
};

const FONT_FAMILY = "ArialCustom";

/**
  Registers embedded TTF fonts into jsPDF VFS.
  This enables full UTF-8 character metrics and prevents unicode character
  splitting / spacing bugs in standard jsPDF WinAnsi mode.
 */
function setupFonts(doc: jsPDF) {
  try {
    doc.addFileToVFS("Arial-Regular.ttf", ARIAL_REGULAR_FONT);
    doc.addFont("Arial-Regular.ttf", FONT_FAMILY, "normal");

    doc.addFileToVFS("Arial-Bold.ttf", ARIAL_BOLD_FONT);
    doc.addFont("Arial-Bold.ttf", FONT_FAMILY, "bold");

    doc.setFont(FONT_FAMILY, "normal");
  } catch (e) {
    console.error("Error setting up custom fonts for PDF:", e);
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────
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

  // Load custom TTF fonts for pristine UTF-8 rendering
  setupFonts(doc);

  const comp: CompanyDetails = {
    ...DEFAULT_COMPANY,
    ...(companyDetails ?? {}),
  };

  const currSym = comp.currencySymbol || "₹";

  // ───────────────────────────────────────────────────────────────────────────
  // HEADER — Logo (left) + Company Details (center-left) + QUOTATION (right)
  // ───────────────────────────────────────────────────────────────────────────
  const headerTop = 12;
  const logoSize = 28;       // square logo size in mm
  const logoX = MARGIN_L;
  const logoY = headerTop;

  // Draw logo
  const logoToUse = comp.companyLogo || logoImg;
  let compInfoX = MARGIN_L;

  if (logoToUse) {
    try {
      const fmt =
        logoToUse.includes(".png") || logoToUse.startsWith("data:image/png")
          ? "PNG"
          : "JPEG";
      doc.addImage(logoToUse, fmt, logoX, logoY, logoSize, logoSize);
      compInfoX = logoX + logoSize + 6;
    } catch (e) {
      console.error("Failed to add company logo to PDF", e);
    }
  }

  // ── Company name (bold, prominent 15pt) ──────────────────────────────────
  const compNameY = logoY + 6;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(comp.companyName.toUpperCase(), compInfoX, compNameY);

  // ── Company detail lines — evenly spaced ─────────────────────────────────
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600

  const lineH = 4.5;
  let infoY = compNameY + 5.5;

  if (comp.companyAddress) {
    doc.text(comp.companyAddress, compInfoX, infoY);
    infoY += lineH;
  }
  if (comp.companyPhone) {
    doc.text(`Ph: ${comp.companyPhone}`, compInfoX, infoY);
    infoY += lineH;
  }
  if (comp.companyGst) {
    doc.text(`GSTIN/UIN: ${comp.companyGst}`, compInfoX, infoY);
    infoY += lineH;
  }
  if (comp.companyEmail) {
    doc.text(`Email: ${comp.companyEmail}`, compInfoX, infoY);
    infoY += lineH;
  }
  doc.text("State: Kerala (State Code: 32)", compInfoX, infoY);

  // ── QUOTATION title — top-right, aligned with top of header ──────────────
  const quotLabelY = logoY + 8;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("QUOTATION", RIGHT_EDGE, quotLabelY, { align: "right" });

  // Decorative accent line under QUOTATION title
  const quotUnderlineY = quotLabelY + 2.5;
  const quotLabelWidth = doc.getTextWidth("QUOTATION");
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.6);
  doc.line(RIGHT_EDGE - quotLabelWidth, quotUnderlineY, RIGHT_EDGE, quotUnderlineY);

  // ── Quotation Number & Date — Tabular alignment ──────────────────────────
  const quotInfoY = quotLabelY + 9.5;
  const quotLabelCol = RIGHT_EDGE - 42;
  const quotValueCol = RIGHT_EDGE;

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500

  doc.text("No:", quotLabelCol, quotInfoY);
  doc.text("Date:", quotLabelCol, quotInfoY + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont(FONT_FAMILY, "bold");
  doc.text(quotationNumber, quotValueCol, quotInfoY, { align: "right" });
  doc.text(
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    quotValueCol,
    quotInfoY + 5.5,
    { align: "right" }
  );

  // ── Header Divider Line ──────────────────────────────────────────────────
  const dividerY = Math.max(
    logoY + logoSize + 4,
    infoY + 4,
    quotInfoY + 13
  );
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(MARGIN_L, dividerY, RIGHT_EDGE, dividerY);

  // ───────────────────────────────────────────────────────────────────────────
  // CUSTOMER & DETAILS — Two-column grid starting at EXACT same Y height
  // ───────────────────────────────────────────────────────────────────────────
  const detailTopY = dividerY + 7;
  const colL = MARGIN_L;
  const colR = MARGIN_L + CONTENT_W * 0.54;
  const colLW = CONTENT_W * 0.48;
  const sectionLineH = 5.2;

  // Headers for both columns at exact same Y
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("QUOTATION FOR", colL, detailTopY);
  doc.text("DETAILS", colR, detailTopY);

  const detailDataY = detailTopY + 5.5;

  // ── Left Column: Client / Project Details ────────────────────────────────
  const clientLines: string[] = [];
  if (quotationType === "WALK_IN_CUSTOMER") {
    clientLines.push(payload.walkInName || "—");
    clientLines.push(`Mobile: ${payload.walkInMobile || "—"}`);
    if (payload.walkInEmail) clientLines.push(`Email: ${payload.walkInEmail}`);
    if (payload.walkInAddress)
      clientLines.push(`Address: ${payload.walkInAddress}`);
  } else {
    clientLines.push(targetName || "—");
    if (projectName) clientLines.push(`Project: ${projectName}`);
    if (payload.phase) clientLines.push(`Phase: ${payload.phase}`);
  }

  let leftY = detailDataY;

  // First line (name) bold and prominent
  if (clientLines[0]) {
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const wrapped = doc.splitTextToSize(clientLines[0], colLW);
    doc.text(wrapped, colL, leftY);
    leftY += wrapped.length * sectionLineH;
  }

  // Sub-lines
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  for (let i = 1; i < clientLines.length; i++) {
    const wrapped = doc.splitTextToSize(clientLines[i], colLW);
    doc.text(wrapped, colL, leftY);
    leftY += wrapped.length * sectionLineH;
  }

  // ── Right Column: Validity & Currency Details ────────────────────────────
  const rightLabelX = colR;
  const rightValueX = colR + 24; // uniform label-to-value offset
  let rightY = detailDataY;

  const addDetailRow = (label: string, value: string) => {
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label + ":", rightLabelX, rightY);

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(value, rightValueX, rightY);

    rightY += sectionLineH;
  };

  addDetailRow(
    "Validity",
    payload.validUntil
      ? new Date(payload.validUntil).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "30 days"
  );
  addDetailRow("Currency", `INR (${currSym})`);

  // ── Separator Before Table ────────────────────────────────────────────────
  const tableStartY = Math.max(leftY, rightY) + 5;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, tableStartY - 2.5, RIGHT_EDGE, tableStartY - 2.5);

  // ───────────────────────────────────────────────────────────────────────────
  // ITEMS TABLE — Fixed Proportional Layout (48%, 8%, 17%, 8%, 19%)
  // Header cells tuned with compact padding (2mm left/right) so headers NEVER wrap.
  // ───────────────────────────────────────────────────────────────────────────
  const rows = items
    .filter((item) => item.productId)
    .map((item) => [
      item.productName ?? item.search ?? "—",
      item.quantity.toString(),
      formatIndianCurrency(Number(item.sellingPrice), currSym),
      `${item.gstPercent ?? 18}%`,
      formatIndianCurrency(Number(item.totalPrice), currSym),
    ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [
      ["Product Description", "Qty", "Selling Price", "GST %", "Total Selling Price"],
    ],
    body: rows,
    margin: { left: MARGIN_L, right: MARGIN_R },
    styles: {
      font: FONT_FAMILY,
      fontStyle: "normal",
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      valign: "middle",
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.15,
    },
    headStyles: {
      font: FONT_FAMILY,
      fontStyle: "bold",
      fillColor: [15, 23, 42],   // slate-900
      textColor: [255, 255, 255],
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
      valign: "middle",
      overflow: "visible",       // prevent autoTable from wrapping headers
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      // 0: Product Description — 48% (87.36 mm), left-aligned, wraps naturally
      0: { halign: "left", cellWidth: COL_WIDTHS.desc, overflow: "linebreak" },
      // 1: Qty — 8% (14.56 mm), right-aligned, never wraps
      1: { halign: "right", cellWidth: COL_WIDTHS.qty, overflow: "ellipsize" },
      // 2: Selling Price — 17% (30.94 mm), right-aligned, tabular numerals
      2: { halign: "right", cellWidth: COL_WIDTHS.price, overflow: "ellipsize" },
      // 3: GST % — 8% (14.56 mm), right-aligned, never wraps
      3: { halign: "right", cellWidth: COL_WIDTHS.gst, overflow: "ellipsize" },
      // 4: Total Selling Price — 19% (34.58 mm), right-aligned, tabular numerals
      4: { halign: "right", cellWidth: COL_WIDTHS.total, overflow: "ellipsize" },
    },
    showHead: "everyPage",
    rowPageBreak: "avoid",
    didDrawPage: (data) => {
      // Clean footer on every page
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(MARGIN_L, PAGE_H - 14, RIGHT_EDGE, PAGE_H - 14);

      doc.setFont(FONT_FAMILY, "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400

      // Left: footer text, Right: Page X of Y
      doc.text(comp.footerText, MARGIN_L, PAGE_H - 8);
      const pageStr = `Page ${data.pageNumber}`;
      doc.text(pageStr, RIGHT_EDGE, PAGE_H - 8, { align: "right" });
    },
  });

  const finalY: number = (doc as any).lastAutoTable?.finalY ?? tableStartY + 20;

  // ───────────────────────────────────────────────────────────────────────────
  // TOTALS + BANK DETAILS
  // Side-by-side section with strict height calculation and page boundary safety
  // ───────────────────────────────────────────────────────────────────────────
  const totalGst = items.reduce(
    (sum, item) => sum + Number(item.totalPrice) * ((item.gstPercent ?? 18) / 100),
    0
  );

  let nextY = finalY + 8;

  // Calculate required height for bank box + totals + signature block
  const remainingHeight = PAGE_H - nextY - 18;
  const neededHeight = 90; // mm

  if (remainingHeight < neededHeight) {
    doc.addPage();
    nextY = 16;
  }

  // ── Left: Bank Details Container Card ────────────────────────────────────
  const bankBoxX = MARGIN_L;
  const bankBoxW = CONTENT_W * 0.52; // 94.64 mm

  const bankRows: [string, string][] = [
    ["Beneficiary", comp.companyName.toUpperCase()],
    ["Bank", comp.bankName],
    ["Branch", comp.bankBranch],
    ["Account No", comp.bankAccountNo],
    ["IFSC", comp.bankIfsc],
  ];
  if (comp.upiId) bankRows.push(["UPI ID", comp.upiId]);

  const bankLineH = 5.2;
  const bankHeaderPad = 7;
  const bankContentStartY = 14;
  const bankBoxH = bankContentStartY + bankRows.length * bankLineH + 4;

  // Draw background card with rounded border
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setFillColor(248, 250, 252);  // slate-50
  doc.setLineWidth(0.35);
  doc.roundedRect(bankBoxX, nextY, bankBoxW, bankBoxH, 2, 2, "FD");

  // Title
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BANK DETAILS FOR PAYMENT", bankBoxX + 6, nextY + bankHeaderPad);

  // Underline under card title
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.line(bankBoxX + 6, nextY + bankHeaderPad + 2, bankBoxX + bankBoxW - 6, nextY + bankHeaderPad + 2);

  // Label:Value rows — aligned label column with uniform offset (26 mm)
  const bankLabelX = bankBoxX + 6;
  const bankValueX = bankBoxX + 32;
  let bankY = nextY + bankContentStartY;

  for (const [label, value] of bankRows) {
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label + ":", bankLabelX, bankY);

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(value, bankValueX, bankY);

    bankY += bankLineH;
  }

  // ── Right: Totals Block ──────────────────────────────────────────────────
  // Label left-aligned at totLabelX, amount right-aligned at RIGHT_EDGE (196 mm)
  const totLabelX = MARGIN_L + CONTENT_W * 0.58;
  const totValueX = RIGHT_EDGE;
  const totLineH = 7;
  let totY = nextY + 4;

  const drawTotRow = (
    label: string,
    value: string,
    bold = false,
    fontSize = 9
  ) => {
    doc.setFont(FONT_FAMILY, bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(bold ? 15 : 71, bold ? 23 : 85, bold ? 42 : 105);
    doc.text(label, totLabelX, totY);
    doc.text(value, totValueX, totY, { align: "right" });
    totY += totLineH;
  };

  drawTotRow("Subtotal", formatIndianCurrency(subtotal, currSym));
  drawTotRow("Discount", `- ${formatIndianCurrency(discountAmount, currSym)}`);
  drawTotRow("Total GST", formatIndianCurrency(totalGst, currSym));

  // Separator line above Grand Total
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.4);
  doc.line(totLabelX, totY - 2, RIGHT_EDGE, totY - 2);
  totY += 3;

  // Grand Total — Bold, 13pt (~20px equivalent), matching Total Selling Price right alignment
  drawTotRow("Grand Total", formatIndianCurrency(totalAmount, currSym), true, 13);

  // Double accent underline for Grand Total
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(totLabelX, totY - 2, RIGHT_EDGE, totY - 2);

  // ───────────────────────────────────────────────────────────────────────────
  // TERMS & CONDITIONS + AUTHORIZED SIGNATURE
  // ───────────────────────────────────────────────────────────────────────────
  const termsTop = Math.max(nextY + bankBoxH, totY) + 8;

  // Separator line above terms & signature section
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, termsTop - 4, RIGHT_EDGE, termsTop - 4);

  // Terms & Conditions Heading & Text (Left side)
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Terms & Conditions:", MARGIN_L, termsTop);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const termsLines = doc.splitTextToSize(
    comp.termsAndConditions,
    CONTENT_W * 0.55
  );
  doc.text(termsLines, MARGIN_L, termsTop + 5);

  // Optional Notes section
  let notesEndY = termsTop + 5 + termsLines.length * 4;
  if (payload.notes) {
    const notesY = notesEndY + 5;
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Notes:", MARGIN_L, notesY);

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const notesLines = doc.splitTextToSize(payload.notes, CONTENT_W * 0.55);
    doc.text(notesLines, MARGIN_L, notesY + 4.5);
    notesEndY = notesY + 4.5 + notesLines.length * 4;
  }

  // ── Signature Block (Right side, aligned at termsTop) ──────────────────────
  const sigX = MARGIN_L + CONTENT_W * 0.63; // 128.66 mm

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${comp.companyName}`, sigX, termsTop);

  if (
    comp.authorizedSignature &&
    comp.authorizedSignature.startsWith("data:image")
  ) {
    try {
      doc.addImage(comp.authorizedSignature, "PNG", sigX, termsTop + 4, 38, 14);
    } catch (e) {
      console.error("Failed to add authorized signature to PDF", e);
    }
  }

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Authorized Signatory", sigX, termsTop + 24);

  // ───────────────────────────────────────────────────────────────────────────
  // OUTPUT
  // ───────────────────────────────────────────────────────────────────────────
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}
