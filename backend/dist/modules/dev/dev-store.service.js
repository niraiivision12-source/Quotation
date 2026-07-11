"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevStoreService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DEFAULT_TEST_CASES = [
    {
        id: "tc-auth-login-owner",
        endpointId: "POST /api/auth/login",
        name: "Login as Owner",
        description: "Authenticate using the pre-seeded owner credentials.",
        request: {
            bodyType: "json",
            body: JSON.stringify({ email: "owner@system.com", password: "Admin@123" }, null, 2),
        },
        expectedStatus: 200,
    },
    {
        id: "tc-auth-login-salesman",
        endpointId: "POST /api/auth/login",
        name: "Login as Salesman",
        description: "Authenticate using the pre-seeded salesman credentials.",
        request: {
            bodyType: "json",
            body: JSON.stringify({ email: "suresh.sales@system.com", password: "Admin@123" }, null, 2),
        },
        expectedStatus: 200,
    },
    {
        id: "tc-auth-login-invalid",
        endpointId: "POST /api/auth/login",
        name: "Login with Invalid Password",
        description: "Verify that incorrect passwords reject authentication with 401.",
        request: {
            bodyType: "json",
            body: JSON.stringify({ email: "owner@system.com", password: "wrong_password" }, null, 2),
        },
        expectedStatus: 401,
    },
    {
        id: "tc-lead-get-all",
        endpointId: "GET /api/leads",
        name: "Get Leads List",
        description: "Retrieve a paginated list of leads in the system.",
        request: {
            bodyType: "none",
        },
        expectedStatus: 200,
    },
    {
        id: "tc-lead-create-valid",
        endpointId: "POST /api/leads",
        name: "Create Lead - Valid Request",
        description: "Add a new lead with all required fields populated.",
        request: {
            bodyType: "json",
            body: JSON.stringify({ name: "Raj Kumar", mobile: "9876543210", email: "raj.kumar@example.com", source: "Google", city: "Coimbatore" }, null, 2),
        },
        expectedStatus: 201,
    },
    {
        id: "tc-lead-create-missing-name",
        endpointId: "POST /api/leads",
        name: "Create Lead - Missing Name",
        description: "Verify that lead creation fails if name is not provided.",
        request: {
            bodyType: "json",
            body: JSON.stringify({ mobile: "9876543210", city: "Coimbatore" }, null, 2),
        },
        expectedStatus: 400,
    },
    {
        id: "tc-quotation-get-all",
        endpointId: "GET /api/quotations",
        name: "Get Quotations List",
        description: "Fetch list of all quotations.",
        request: {
            bodyType: "none",
        },
        expectedStatus: 200,
    },
    {
        id: "tc-payment-get-all",
        endpointId: "GET /api/payments",
        name: "Get Payments List",
        description: "Fetch list of all records of payments.",
        request: {
            bodyType: "none",
        },
        expectedStatus: 200,
    },
    {
        id: "tc-project-get-all",
        endpointId: "GET /api/projects",
        name: "Get Projects List",
        description: "Fetch list of active and completed installation projects.",
        request: {
            bodyType: "none",
        },
        expectedStatus: 200,
    },
];
const DEFAULT_COLLECTIONS = [
    {
        id: "col-auth",
        name: "Authentication Suite",
        description: "Verifies user login mechanics and token generation.",
        testCaseIds: ["tc-auth-login-owner", "tc-auth-login-salesman", "tc-auth-login-invalid"],
    },
    {
        id: "col-leads",
        name: "Lead Workflow",
        description: "End-to-end testing of leads retrieval and creation pipeline.",
        testCaseIds: ["tc-lead-get-all", "tc-lead-create-valid", "tc-lead-create-missing-name"],
    },
    {
        id: "col-quotations",
        name: "Quotation Workflow",
        description: "Validates quotations pipeline and item costing.",
        testCaseIds: ["tc-quotation-get-all"],
    },
    {
        id: "col-payments",
        name: "Payment Workflow",
        description: "Checks bill tracking, linking, and payments listing.",
        testCaseIds: ["tc-payment-get-all"],
    },
    {
        id: "col-projects",
        name: "Project Workflow",
        description: "Inspects projects layout listings and phase tracking.",
        testCaseIds: ["tc-project-get-all"],
    },
];
const STORE_PATH = path_1.default.join(__dirname, "../../../data/dev-store.json");
class DevStoreService {
    static initStore() {
        const dir = path_1.default.dirname(STORE_PATH);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        if (!fs_1.default.existsSync(STORE_PATH)) {
            fs_1.default.writeFileSync(STORE_PATH, JSON.stringify({ collections: DEFAULT_COLLECTIONS, testCases: DEFAULT_TEST_CASES, history: [] }, null, 2));
        }
        else {
            try {
                const content = fs_1.default.readFileSync(STORE_PATH, "utf-8");
                const data = JSON.parse(content);
                let modified = false;
                if (!data.collections || data.collections.length === 0) {
                    data.collections = DEFAULT_COLLECTIONS;
                    modified = true;
                }
                if (!data.testCases || data.testCases.length === 0) {
                    data.testCases = DEFAULT_TEST_CASES;
                    modified = true;
                }
                if (!data.history) {
                    data.history = [];
                    modified = true;
                }
                if (modified) {
                    fs_1.default.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
                }
            }
            catch (e) {
                // ignore
            }
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
            return { collections: DEFAULT_COLLECTIONS, testCases: DEFAULT_TEST_CASES, history: [] };
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