"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevStoreService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const STORE_PATH = path_1.default.join(__dirname, "../../../data/dev-store.json");
class DevStoreService {
    static initStore() {
        const dir = path_1.default.dirname(STORE_PATH);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        if (!fs_1.default.existsSync(STORE_PATH)) {
            fs_1.default.writeFileSync(STORE_PATH, JSON.stringify({ collections: [], testCases: [], history: [] }, null, 2));
        }
    }
    static readStore() {
        this.initStore();
        try {
            const content = fs_1.default.readFileSync(STORE_PATH, "utf-8");
            return JSON.parse(content);
        }
        catch (e) {
            console.error("Error reading dev-store.json:", e);
            return { collections: [], testCases: [], history: [] };
        }
    }
    static writeStore(data) {
        this.initStore();
        try {
            fs_1.default.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
        }
        catch (e) {
            console.error("Error writing dev-store.json:", e);
        }
    }
    // --- History ---
    static getHistory() {
        const store = this.readStore();
        // Return sorted by timestamp desc
        return store.history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    static addHistoryEntry(entry) {
        const store = this.readStore();
        const newEntry = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
        };
        store.history.push(newEntry);
        // Keep max 200 history logs to prevent bloating
        if (store.history.length > 200) {
            store.history = store.history
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .slice(store.history.length - 200);
        }
        this.writeStore(store);
        return newEntry;
    }
    static clearHistory() {
        const store = this.readStore();
        store.history = [];
        this.writeStore(store);
    }
    // --- Collections ---
    static getCollections() {
        return this.readStore().collections;
    }
    static saveCollection(collection) {
        const store = this.readStore();
        const index = store.collections.findIndex((c) => c.id === collection.id);
        if (index >= 0) {
            store.collections[index] = collection;
        }
        else {
            store.collections.push(collection);
        }
        this.writeStore(store);
        return collection;
    }
    static deleteCollection(id) {
        const store = this.readStore();
        store.collections = store.collections.filter((c) => c.id !== id);
        this.writeStore(store);
    }
    // --- Test Cases ---
    static getTestCases() {
        return this.readStore().testCases;
    }
    static saveTestCase(testCase) {
        const store = this.readStore();
        const index = store.testCases.findIndex((t) => t.id === testCase.id);
        if (index >= 0) {
            store.testCases[index] = testCase;
        }
        else {
            store.testCases.push(testCase);
        }
        this.writeStore(store);
        return testCase;
    }
    static deleteTestCase(id) {
        const store = this.readStore();
        store.testCases = store.testCases.filter((t) => t.id !== id);
        // Also remove from any collection
        store.collections.forEach((c) => {
            c.testCaseIds = c.testCaseIds.filter((tId) => tId !== id);
        });
        this.writeStore(store);
    }
    static duplicateTestCase(id) {
        const store = this.readStore();
        const testCase = store.testCases.find((t) => t.id === id);
        if (!testCase)
            return null;
        const duplicated = {
            ...testCase,
            id: crypto.randomUUID(),
            name: `${testCase.name} (Copy)`,
        };
        store.testCases.push(duplicated);
        this.writeStore(store);
        return duplicated;
    }
    // --- Import / Export ---
    static importData(data) {
        const store = this.readStore();
        if (data.collections) {
            data.collections.forEach((c) => {
                if (!store.collections.some((sc) => sc.id === c.id)) {
                    store.collections.push(c);
                }
            });
        }
        if (data.testCases) {
            data.testCases.forEach((t) => {
                if (!store.testCases.some((st) => st.id === t.id)) {
                    store.testCases.push(t);
                }
            });
        }
        this.writeStore(store);
    }
    static getExportData() {
        return this.readStore();
    }
}
exports.DevStoreService = DevStoreService;
//# sourceMappingURL=dev-store.service.js.map