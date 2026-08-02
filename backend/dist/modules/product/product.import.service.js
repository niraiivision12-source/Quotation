"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductImportService = void 0;
const XLSX = __importStar(require("xlsx"));
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
// Map database fields to possible column aliases (cleaned)
const HEADER_MAPPINGS = {
    sku: ["sku", "productcode", "itemcode", "code", "partnumber", "skucode", "partno"],
    name: ["name", "productname", "itemname", "title", "product", "item", "particulars", "particular"],
    brand: ["brand", "manufacturer", "make"],
    category: ["category", "group", "productgroup", "type"],
    unit: ["unit", "uom", "measurement", "unitofmeasure"],
    costPrice: ["costprice", "cost", "purchaseprice", "buyingprice", "cp", "rate", "unitprice"],
    mrp: ["mrp", "maxretailprice", "maximumretailprice", "retailprice"],
    stockQty: ["stockqty", "qty", "quantity", "stock", "openingstock", "stockquantity", "onhand", "inventory", "balance", "closingbalance"],
    tallyMasterId: ["tallymasterid", "masterid", "tallymaster", "tallyid"],
    tallyGuid: ["tallyguid", "guid", "tallyuniqueid"],
    tallyAlterId: ["tallyalterid", "alterid", "tallyalter"],
};
function cleanHeader(header) {
    return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function mapHeaderToField(header) {
    const cleaned = cleanHeader(header);
    for (const [field, aliases] of Object.entries(HEADER_MAPPINGS)) {
        if (aliases.includes(cleaned)) {
            return field;
        }
    }
    return null;
}
function cleanString(val) {
    if (val === undefined || val === null)
        return null;
    const str = String(val).trim();
    return str === "" ? null : str;
}
function parseNumber(val) {
    if (val === undefined || val === null || val === "")
        return null;
    if (typeof val === "number")
        return val;
    // Remove commas, spaces, currency symbols
    const cleaned = String(val).replace(/[^0-9.-]/g, "");
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
}
function parseIntNumber(val) {
    if (val === undefined || val === null || val === "")
        return null;
    if (typeof val === "number")
        return Math.round(val);
    const cleaned = String(val).replace(/[^0-9.-]/g, "");
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
}
function isSubRow(name, rawName) {
    if (!name)
        return true; // empty name but has qty/rate is a sub-row/detail
    const cleaned = name.trim().toLowerCase();
    // Tally locations are often "Main Location" or have "location" or "godown"
    if (cleaned === "main location" || cleaned.includes("location") || cleaned.includes("godown")) {
        return true;
    }
    // Check if the original raw value has leading spaces in string format
    if (typeof rawName === "string" && (rawName.startsWith(" ") || rawName.startsWith("\t"))) {
        return true;
    }
    return false;
}
function isTotalRow(name) {
    if (!name)
        return false;
    const cleaned = name.trim().toLowerCase();
    return cleaned === "total" || cleaned === "grand total" || cleaned.includes("total") || cleaned === "delete items";
}
function generateSku(name) {
    const prefix = "SKU-";
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (!name) {
        return `${prefix}${rand}`;
    }
    // Slugify name: remove non-alphanumeric chars, replace spaces/underscores with hyphens
    const slug = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s-]/g, "")
        .replace(/[\s-_]+/g, "-");
    const base = slug.substring(0, 30); // limit base length
    return `${base}-${rand}`;
}
class ProductImportService {
    /**
     * Parse the Excel/CSV file from buffer, clean, normalize, validate, compare, and return an Import Preview.
     */
    static async parseAndPreview(fileBuffer) {
        let workbook;
        try {
            workbook = XLSX.read(fileBuffer, { type: "buffer" });
        }
        catch (e) {
            throw new app_error_1.AppError("Failed to parse file buffer. Ensure it is a valid CSV, XLS, XLSX, or ODS file.", 400);
        }
        if (workbook.SheetNames.length === 0) {
            throw new app_error_1.AppError("Uploaded spreadsheet contains no sheets.", 400);
        }
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Read the spreadsheet rows as an array of arrays to handle headers accurately
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
        if (rows.length === 0) {
            throw new app_error_1.AppError("Uploaded spreadsheet is empty.", 400);
        }
        // Find the best header row index
        let bestHeaderRowIndex = 0;
        let bestColIndexToField = {};
        let maxFieldsMapped = 0;
        let maxHeaderRowUsed = 0;
        const scanLimit = Math.min(rows.length, 40); // scan first 40 rows
        for (let i = 0; i < scanLimit; i++) {
            const colIndexToField = {};
            const fieldsMapped = new Set();
            let localMaxHeaderRowUsed = i;
            // For row i, look at a window of [i - 2, i + 2] (clamped to 0..rows.length-1)
            const startWin = Math.max(0, i - 2);
            const endWin = Math.min(rows.length - 1, i + 2);
            const row = rows[i];
            if (!row)
                continue;
            // Find the maximum number of columns across the window to ensure we cover all columns
            let maxCols = 0;
            for (let r = startWin; r <= endWin; r++) {
                if (rows[r] && rows[r].length > maxCols) {
                    maxCols = rows[r].length;
                }
            }
            for (let c = 0; c < maxCols; c++) {
                // Look through the window for this column to find a header match
                for (let r = startWin; r <= endWin; r++) {
                    const cellValue = rows[r] ? rows[r][c] : null;
                    if (cellValue !== null && cellValue !== undefined) {
                        const field = mapHeaderToField(cellValue.toString());
                        if (field) {
                            colIndexToField[c] = field;
                            fieldsMapped.add(field);
                            if (r > localMaxHeaderRowUsed) {
                                localMaxHeaderRowUsed = r;
                            }
                            break; // take the first match we find in this column within the window
                        }
                    }
                }
            }
            if (fieldsMapped.size > maxFieldsMapped) {
                maxFieldsMapped = fieldsMapped.size;
                bestHeaderRowIndex = i;
                bestColIndexToField = colIndexToField;
                maxHeaderRowUsed = localMaxHeaderRowUsed;
            }
        }
        if (maxFieldsMapped === 0) {
            throw new app_error_1.AppError("Could not find any recognized column headers (such as Product Name, SKU, Quantity, or Price) in the uploaded file.", 400);
        }
        const dataStartRowIndex = maxHeaderRowUsed + 1;
        // Generate merged raw headers for the window to use in the rawData keys
        const rawHeaders = [];
        let maxCols = 0;
        const startWin = Math.max(0, bestHeaderRowIndex - 2);
        const endWin = Math.min(rows.length - 1, bestHeaderRowIndex + 2);
        for (let r = startWin; r <= endWin; r++) {
            if (rows[r] && rows[r].length > maxCols) {
                maxCols = rows[r].length;
            }
        }
        for (let c = 0; c < maxCols; c++) {
            let mergedHeader = "";
            for (let r = startWin; r <= endWin; r++) {
                const val = rows[r] ? rows[r][c] : null;
                if (val !== null && val !== undefined && val !== "") {
                    const valStr = val.toString().trim();
                    if (valStr && !mergedHeader.includes(valStr)) {
                        if (mergedHeader)
                            mergedHeader += " ";
                        mergedHeader += valStr;
                    }
                }
            }
            rawHeaders.push(mergedHeader || `Column ${c + 1}`);
        }
        const parsedRows = [];
        const invalidRows = [];
        const duplicateRows = [];
        const seenSkus = new Set();
        const seenTallyMasterIds = new Set();
        const seenTallyGuids = new Set();
        const seenNames = new Set();
        let totalRowsCount = 0;
        let currentProduct = null;
        const candidateProducts = [];
        for (let i = dataStartRowIndex; i < rows.length; i++) {
            const row = rows[i];
            // Skip completely empty rows
            if (!row || row.every((cell) => cell === null || cell === "")) {
                continue;
            }
            totalRowsCount++;
            const rowNumber = i + 1;
            // Gather raw data for reporting
            const rawData = {};
            rawHeaders.forEach((header, colIndex) => {
                rawData[header] = row[colIndex];
            });
            // Construct mapped object
            const mapped = {};
            Object.entries(bestColIndexToField).forEach(([colIndexStr, field]) => {
                const colIndex = parseInt(colIndexStr, 10);
                const val = row[colIndex];
                if (field === "sku" || field === "name" || field === "brand" || field === "category" || field === "unit" || field === "tallyMasterId" || field === "tallyGuid") {
                    mapped[field] = cleanString(val);
                }
                else if (field === "costPrice" || field === "mrp") {
                    mapped[field] = parseNumber(val);
                }
                else if (field === "stockQty") {
                    mapped[field] = parseIntNumber(val);
                }
                else if (field === "tallyAlterId") {
                    mapped[field] = parseIntNumber(val);
                }
            });
            const sku = mapped.sku;
            const name = mapped.name;
            const tallyMasterId = mapped.tallyMasterId;
            const tallyGuid = mapped.tallyGuid;
            // Skip total/summary rows
            if (isTotalRow(name)) {
                continue;
            }
            // Check if it's a sub-row/location row
            const nameColIndex = Object.keys(bestColIndexToField).find(k => bestColIndexToField[parseInt(k, 10)] === "name");
            const rawName = nameColIndex !== undefined ? row[parseInt(nameColIndex, 10)] : null;
            if (isSubRow(name, rawName)) {
                if (currentProduct) {
                    if (mapped.stockQty !== null && mapped.stockQty !== undefined) {
                        currentProduct.stockQty = (currentProduct.stockQty ?? 0) + mapped.stockQty;
                    }
                    if (mapped.costPrice !== null && mapped.costPrice !== undefined) {
                        // Take the rate from the sub-row/location if the parent row didn't have it
                        currentProduct.costPrice = mapped.costPrice;
                    }
                    if (mapped.mrp !== null && mapped.mrp !== undefined) {
                        currentProduct.mrp = mapped.mrp;
                    }
                }
                continue;
            }
            // Create new parent product
            const newProduct = {
                sku: sku || null,
                name: name || null,
                brand: mapped.brand || null,
                category: mapped.category || null,
                unit: mapped.unit || null,
                costPrice: mapped.costPrice || null,
                mrp: mapped.mrp || null,
                stockQty: mapped.stockQty !== null && mapped.stockQty !== undefined ? mapped.stockQty : 0,
                tallyMasterId: tallyMasterId || null,
                tallyGuid: tallyGuid || null,
                tallyAlterId: mapped.tallyAlterId || null,
            };
            currentProduct = newProduct;
            candidateProducts.push({
                rowNumber,
                rawData,
                mapped: newProduct,
            });
        }
        // Now run validation on the aggregated products
        candidateProducts.forEach(({ rowNumber, rawData, mapped }) => {
            const sku = mapped.sku;
            const name = mapped.name;
            const tallyMasterId = mapped.tallyMasterId;
            const tallyGuid = mapped.tallyGuid;
            // 1. Identify Unique Identifiers for duplicate checking and matching
            let duplicateReason = "";
            if (sku) {
                const lowerSku = sku.toLowerCase();
                if (seenSkus.has(lowerSku)) {
                    duplicateReason = `Duplicate SKU: "${sku}" already seen in file.`;
                }
                else {
                    seenSkus.add(lowerSku);
                }
            }
            else if (tallyMasterId) {
                const lowerId = tallyMasterId.toLowerCase();
                if (seenTallyMasterIds.has(lowerId)) {
                    duplicateReason = `Duplicate Tally Master ID: "${tallyMasterId}" already seen in file.`;
                }
                else {
                    seenTallyMasterIds.add(lowerId);
                }
            }
            else if (tallyGuid) {
                const lowerGuid = tallyGuid.toLowerCase();
                if (seenTallyGuids.has(lowerGuid)) {
                    duplicateReason = `Duplicate Tally GUID: "${tallyGuid}" already seen in file.`;
                }
                else {
                    seenTallyGuids.add(lowerGuid);
                }
            }
            else if (name) {
                const lowerName = name.toLowerCase();
                if (seenNames.has(lowerName)) {
                    duplicateReason = `Duplicate Product Name: "${name}" already seen in file.`;
                }
                else {
                    seenNames.add(lowerName);
                }
            }
            // If duplicate row detected, skip it
            if (duplicateReason) {
                duplicateRows.push({
                    rowNumber,
                    rowData: rawData,
                    reason: duplicateReason,
                });
                return;
            }
            // 2. Validate row data
            const errors = [];
            if (!sku && !name && !tallyMasterId && !tallyGuid) {
                errors.push({
                    field: "identifiers",
                    message: "Missing product identifier. Row must contain a SKU, Tally Master ID, Tally GUID, or Product Name.",
                    fix: "Ensure at least one identifier column has a value.",
                });
            }
            if (sku && sku.length < 2) {
                errors.push({
                    field: "sku",
                    message: "SKU must be at least 2 characters.",
                    fix: "Update SKU to be a code with 2 or more characters.",
                });
            }
            if (name && name.length < 2) {
                errors.push({
                    field: "name",
                    message: "Product name must be at least 2 characters.",
                    fix: "Provide a valid, descriptive product name.",
                });
            }
            // Default stockQty to 0 if not provided
            if (mapped.stockQty === null || mapped.stockQty === undefined) {
                mapped.stockQty = 0;
            }
            if (errors.length > 0) {
                invalidRows.push({
                    rowNumber,
                    rowData: rawData,
                    errors,
                });
                return;
            }
            parsedRows.push({
                rowNumber,
                rawData,
                mapped,
            });
        });
        // 3. Query existing products in batch
        const validSkus = parsedRows.map((r) => r.mapped.sku).filter((x) => !!x);
        const validTallyMasterIds = parsedRows.map((r) => r.mapped.tallyMasterId).filter((x) => !!x);
        const validTallyGuids = parsedRows.map((r) => r.mapped.tallyGuid).filter((x) => !!x);
        const validNames = parsedRows.map((r) => r.mapped.name).filter((x) => !!x);
        const uniqueSkus = [...new Set(validSkus)];
        const uniqueTallyMasterIds = [...new Set(validTallyMasterIds)];
        const uniqueTallyGuids = [...new Set(validTallyGuids)];
        const uniqueNames = [...new Set(validNames)];
        const CHUNK_SIZE = 2000;
        const existingProducts = [];
        const maxSize = Math.max(uniqueSkus.length, uniqueTallyMasterIds.length, uniqueTallyGuids.length, uniqueNames.length);
        for (let i = 0; i < maxSize; i += CHUNK_SIZE) {
            const skuChunk = uniqueSkus.slice(i, i + CHUNK_SIZE);
            const tallyMasterIdChunk = uniqueTallyMasterIds.slice(i, i + CHUNK_SIZE);
            const tallyGuidChunk = uniqueTallyGuids.slice(i, i + CHUNK_SIZE);
            const nameChunk = uniqueNames.slice(i, i + CHUNK_SIZE);
            const chunkResults = await prisma_1.prisma.product.findMany({
                where: {
                    OR: [
                        skuChunk.length > 0 ? { sku: { in: skuChunk } } : {},
                        tallyMasterIdChunk.length > 0 ? { tallyMasterId: { in: tallyMasterIdChunk } } : {},
                        tallyGuidChunk.length > 0 ? { tallyGuid: { in: tallyGuidChunk } } : {},
                        nameChunk.length > 0 ? { name: { in: nameChunk } } : {},
                    ].filter((cond) => Object.keys(cond).length > 0),
                },
            });
            existingProducts.push(...chunkResults);
        }
        // Lookup structures
        const dbBySku = new Map();
        const dbByTallyMasterId = new Map();
        const dbByTallyGuid = new Map();
        const dbByName = new Map();
        existingProducts.forEach((p) => {
            if (p.sku)
                dbBySku.set(p.sku.toLowerCase(), p);
            if (p.tallyMasterId)
                dbByTallyMasterId.set(p.tallyMasterId.toLowerCase(), p);
            if (p.tallyGuid)
                dbByTallyGuid.set(p.tallyGuid.toLowerCase(), p);
            if (p.name)
                dbByName.set(p.name.toLowerCase(), p);
        });
        const newProducts = [];
        const updatedProducts = [];
        const unchangedProducts = [];
        // Process valid rows to identify inserts vs updates
        parsedRows.forEach((rowObj) => {
            const row = rowObj.mapped;
            // Match hierarchical logic
            let matchedDbProduct = null;
            if (row.sku) {
                matchedDbProduct = dbBySku.get(row.sku.toLowerCase());
            }
            if (!matchedDbProduct && row.tallyMasterId) {
                matchedDbProduct = dbByTallyMasterId.get(row.tallyMasterId.toLowerCase());
            }
            if (!matchedDbProduct && row.tallyGuid) {
                matchedDbProduct = dbByTallyGuid.get(row.tallyGuid.toLowerCase());
            }
            if (!matchedDbProduct && row.name) {
                matchedDbProduct = dbByName.get(row.name.toLowerCase());
            }
            if (matchedDbProduct) {
                // Compute differences
                const changes = [];
                const compare = (field, dbVal, newVal) => {
                    let cleanDb = dbVal;
                    if (dbVal && typeof dbVal === "object" && dbVal.constructor && dbVal.constructor.name === "Decimal") {
                        cleanDb = Number(dbVal);
                    }
                    if (cleanDb === null || cleanDb === undefined)
                        cleanDb = null;
                    if (newVal === null || newVal === undefined)
                        newVal = null;
                    if (cleanDb !== newVal) {
                        changes.push({
                            field,
                            oldValue: cleanDb,
                            newValue: newVal,
                        });
                    }
                };
                compare("sku", matchedDbProduct.sku, row.sku || matchedDbProduct.sku);
                compare("name", matchedDbProduct.name, row.name || matchedDbProduct.name);
                compare("brand", matchedDbProduct.brand, row.brand !== undefined ? row.brand : matchedDbProduct.brand);
                compare("category", matchedDbProduct.category, row.category !== undefined ? row.category : matchedDbProduct.category);
                compare("unit", matchedDbProduct.unit, row.unit !== undefined ? row.unit : matchedDbProduct.unit);
                compare("costPrice", matchedDbProduct.costPrice, row.costPrice !== undefined ? row.costPrice : (matchedDbProduct.costPrice ? Number(matchedDbProduct.costPrice) : null));
                compare("mrp", matchedDbProduct.mrp, row.mrp !== undefined ? row.mrp : (matchedDbProduct.mrp ? Number(matchedDbProduct.mrp) : null));
                compare("stockQty", matchedDbProduct.stockQty, row.stockQty !== null && row.stockQty !== undefined ? row.stockQty : matchedDbProduct.stockQty);
                compare("tallyMasterId", matchedDbProduct.tallyMasterId, row.tallyMasterId !== undefined ? row.tallyMasterId : matchedDbProduct.tallyMasterId);
                compare("tallyGuid", matchedDbProduct.tallyGuid, row.tallyGuid !== undefined ? row.tallyGuid : matchedDbProduct.tallyGuid);
                compare("tallyAlterId", matchedDbProduct.tallyAlterId, row.tallyAlterId !== undefined ? row.tallyAlterId : matchedDbProduct.tallyAlterId);
                if (changes.length > 0) {
                    updatedProducts.push({
                        id: matchedDbProduct.id,
                        sku: row.sku || matchedDbProduct.sku,
                        name: row.name || matchedDbProduct.name,
                        brand: row.brand !== undefined ? row.brand : matchedDbProduct.brand,
                        category: row.category !== undefined ? row.category : matchedDbProduct.category,
                        unit: row.unit !== undefined ? row.unit : matchedDbProduct.unit,
                        costPrice: row.costPrice !== undefined ? row.costPrice : (matchedDbProduct.costPrice ? Number(matchedDbProduct.costPrice) : null),
                        mrp: row.mrp !== undefined ? row.mrp : (matchedDbProduct.mrp ? Number(matchedDbProduct.mrp) : null),
                        stockQty: row.stockQty !== null && row.stockQty !== undefined ? row.stockQty : matchedDbProduct.stockQty,
                        changes,
                    });
                }
                else {
                    unchangedProducts.push(row);
                }
            }
            else {
                row.sku = row.sku || generateSku(row.name);
                row.name = row.name || `Product ${row.sku}`;
                newProducts.push(row);
            }
        });
        const newCount = newProducts.length;
        const updateCount = updatedProducts.length;
        const unchangedCount = unchangedProducts.length;
        const duplicateCount = duplicateRows.length;
        const invalidCount = invalidRows.length;
        const skippedCount = duplicateCount + invalidCount;
        return {
            summary: {
                totalRows: totalRowsCount,
                newProductsCount: newCount,
                updatedProductsCount: updateCount,
                unchangedCount,
                duplicateCount,
                invalidCount,
                skippedCount,
            },
            newProducts,
            updatedProducts,
            unchangedProducts,
            invalidRows,
            duplicateRows,
        };
    }
    /**
     * Commit the parsed products to the database using batch operations.
     */
    static async executeImport(inserts, updates) {
        const startTime = Date.now();
        let importedCount = 0;
        let updatedCount = 0;
        let failedCount = 0;
        // 1. Execute insertions in batches
        const BATCH_SIZE = 500;
        for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
            const chunk = inserts.slice(i, i + BATCH_SIZE);
            try {
                await prisma_1.prisma.product.createMany({
                    data: chunk.map((item) => {
                        const finalSku = item.sku || generateSku(item.name);
                        return {
                            sku: finalSku,
                            name: item.name || `Product ${finalSku}`,
                            brand: item.brand ?? null,
                            category: item.category ?? null,
                            unit: item.unit ?? null,
                            costPrice: item.costPrice ?? null,
                            mrp: item.mrp ?? null,
                            stockQty: item.stockQty ?? 0,
                            tallyMasterId: item.tallyMasterId ?? null,
                            tallyGuid: item.tallyGuid ?? null,
                            tallyAlterId: item.tallyAlterId ?? null,
                            isActive: true,
                        };
                    }),
                    skipDuplicates: true,
                });
                importedCount += chunk.length;
            }
            catch (err) {
                // Fallback to inserting one-by-one
                for (const item of chunk) {
                    try {
                        const finalSku = item.sku || generateSku(item.name);
                        await prisma_1.prisma.product.create({
                            data: {
                                sku: finalSku,
                                name: item.name || `Product ${finalSku}`,
                                brand: item.brand ?? null,
                                category: item.category ?? null,
                                unit: item.unit ?? null,
                                costPrice: item.costPrice ?? null,
                                mrp: item.mrp ?? null,
                                stockQty: item.stockQty ?? 0,
                                tallyMasterId: item.tallyMasterId ?? null,
                                tallyGuid: item.tallyGuid ?? null,
                                tallyAlterId: item.tallyAlterId ?? null,
                                isActive: true,
                            },
                        });
                        importedCount++;
                    }
                    catch (e) {
                        failedCount++;
                    }
                }
            }
        }
        // 2. Execute updates in transaction batches
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const chunk = updates.slice(i, i + BATCH_SIZE);
            try {
                await prisma_1.prisma.$transaction(chunk.map((item) => prisma_1.prisma.product.update({
                    where: { id: item.id },
                    data: {
                        sku: item.mapped.sku !== undefined ? item.mapped.sku : undefined,
                        name: item.mapped.name !== undefined ? item.mapped.name : undefined,
                        brand: item.mapped.brand !== undefined ? item.mapped.brand : undefined,
                        category: item.mapped.category !== undefined ? item.mapped.category : undefined,
                        unit: item.mapped.unit !== undefined ? item.mapped.unit : undefined,
                        costPrice: item.mapped.costPrice !== undefined ? item.mapped.costPrice : undefined,
                        mrp: item.mapped.mrp !== undefined ? item.mapped.mrp : undefined,
                        stockQty: item.mapped.stockQty !== undefined ? item.mapped.stockQty : undefined,
                        tallyMasterId: item.mapped.tallyMasterId !== undefined ? item.mapped.tallyMasterId : undefined,
                        tallyGuid: item.mapped.tallyGuid !== undefined ? item.mapped.tallyGuid : undefined,
                        tallyAlterId: item.mapped.tallyAlterId !== undefined ? item.mapped.tallyAlterId : undefined,
                    },
                })));
                updatedCount += chunk.length;
            }
            catch (err) {
                // Fallback to updating one-by-one in this batch
                for (const item of chunk) {
                    try {
                        await prisma_1.prisma.product.update({
                            where: { id: item.id },
                            data: {
                                sku: item.mapped.sku !== undefined ? item.mapped.sku : undefined,
                                name: item.mapped.name !== undefined ? item.mapped.name : undefined,
                                brand: item.mapped.brand !== undefined ? item.mapped.brand : undefined,
                                category: item.mapped.category !== undefined ? item.mapped.category : undefined,
                                unit: item.mapped.unit !== undefined ? item.mapped.unit : undefined,
                                costPrice: item.mapped.costPrice !== undefined ? item.mapped.costPrice : undefined,
                                mrp: item.mapped.mrp !== undefined ? item.mapped.mrp : undefined,
                                stockQty: item.mapped.stockQty !== undefined ? item.mapped.stockQty : undefined,
                                tallyMasterId: item.mapped.tallyMasterId !== undefined ? item.mapped.tallyMasterId : undefined,
                                tallyGuid: item.mapped.tallyGuid !== undefined ? item.mapped.tallyGuid : undefined,
                                tallyAlterId: item.mapped.tallyAlterId !== undefined ? item.mapped.tallyAlterId : undefined,
                            },
                        });
                        updatedCount++;
                    }
                    catch (e) {
                        failedCount++;
                    }
                }
            }
        }
        const executionTimeMs = Date.now() - startTime;
        return {
            imported: importedCount,
            updated: updatedCount,
            failed: failedCount,
            executionTimeMs,
        };
    }
}
exports.ProductImportService = ProductImportService;
//# sourceMappingURL=product.import.service.js.map