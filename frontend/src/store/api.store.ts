import { create } from "zustand";
import axios from "axios";
import { api } from "../lib/axios";

// Typings
export interface ApiEndpoint {
  id: string;
  method: string;
  route: string;
  module: string;
  description: string;
  authRequired: boolean;
  requiredRoles: string[];
  controller: string;
  serviceMethod: string;
  pathParams: Array<{ name: string; type: string; required: boolean; description: string }>;
  queryParams: Array<{ name: string; type: string; required: boolean; description: string }>;
  headers: Array<{ name: string; type: string; required: boolean; description: string }>;
  requestSchema: any;
  validationRules: string[];
  exampleRequest: any;
  exampleResponse: any;
  errorResponses: Array<{ status: number; message: string; description: string }>;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TestCase {
  id: string;
  endpointId: string;
  name: string;
  description: string;
  request: {
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    pathParams?: Record<string, string>;
    bodyType?: "json" | "form-data" | "x-www-form-urlencoded" | "none";
    body?: string;
    formData?: Array<{ key: string; value: string; type: "text" | "file" }>;
  };
  expectedStatus: number;
  expectedResponse?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  testCaseIds: string[];
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  requestHeaders?: Record<string, string>;
  requestPayload?: any;
  responseHeaders?: Record<string, string>;
  responsePayload?: any;
  sqlQueries: Array<{
    query: string;
    params: string;
    duration: number;
    timestamp: string;
  }>;
  error?: {
    message: string;
    name: string;
    stack?: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface ApiState {
  // Discovery
  endpoints: ApiEndpoint[];
  loadingEndpoints: boolean;
  activeEndpointId: string | null;

  // Configuration
  environment: "development" | "staging" | "production";
  playToken: string | null;
  playUserRole: string | null;
  demoUsers: DemoUser[];

  // Collections & Test Cases
  collections: Collection[];
  testCases: TestCase[];
  history: HistoryEntry[];

  // Request Builder State
  headersInput: Array<{ key: string; value: string; enabled: boolean }>;
  queryParamsInput: Array<{ key: string; value: string; enabled: boolean }>;
  pathParamsInput: Record<string, string>;
  bodyType: "json" | "form-data" | "x-www-form-urlencoded" | "none";
  bodyJsonInput: string;
  bodyFormDataInput: Array<{ key: string; value: string; type: "text" | "file"; file?: File }>;

  // Response Panel State
  executing: boolean;
  activeResponse: {
    status: number;
    statusText: string;
    duration: number;
    headers: Record<string, string>;
    body: any;
    sqlQueries: any[];
    error?: any;
    payloadSize: number;
    responseSize: number;
    validationResults: {
      statusPass: boolean;
      schemaPass: boolean;
      requiredFieldsPass: boolean;
      missingFields?: string[];
      typeMismatches?: string[];
      errorMessage?: string;
    };
  } | null;

  // Comparison State
  comparisonLeft: HistoryEntry | null;
  comparisonRight: HistoryEntry | null;

  // Actions
  fetchEndpoints: () => Promise<void>;
  fetchDemoUsers: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  fetchCollections: () => Promise<void>;
  fetchTestCases: () => Promise<void>;

  setEnvironment: (env: "development" | "staging" | "production") => void;
  setActiveEndpointId: (id: string | null) => void;
  setPlayToken: (token: string | null, role: string | null) => void;
  loginAsDemoUser: (role: string) => Promise<void>;
  refreshToken: () => Promise<void>;

  setHeadersInput: (headers: Array<{ key: string; value: string; enabled: boolean }>) => void;
  setQueryParamsInput: (params: Array<{ key: string; value: string; enabled: boolean }>) => void;
  setPathParamsInput: (params: Record<string, string>) => void;
  setBodyType: (type: "json" | "form-data" | "x-www-form-urlencoded" | "none") => void;
  setBodyJsonInput: (json: string) => void;
  setBodyFormDataInput: (data: Array<{ key: string; value: string; type: "text" | "file"; file?: File }>) => void;

  saveTestCase: (testCase: Omit<TestCase, "id"> & { id?: string }) => Promise<void>;
  deleteTestCase: (id: string) => Promise<void>;
  duplicateTestCase: (id: string) => Promise<void>;

  saveCollection: (collection: Omit<Collection, "id"> & { id?: string }) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;

  executePlaygroundRequest: (endpoint: ApiEndpoint) => Promise<void>;
  setComparisonLeft: (entry: HistoryEntry | null) => void;
  setComparisonRight: (entry: HistoryEntry | null) => void;
}

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
};

export const useApiStore = create<ApiState>((set, get) => ({
  endpoints: [],
  loadingEndpoints: false,
  activeEndpointId: null,

  environment: "development",
  playToken: localStorage.getItem("token"),
  playUserRole: "OWNER",
  demoUsers: [],

  collections: [],
  testCases: [],
  history: [],

  headersInput: [],
  queryParamsInput: [],
  pathParamsInput: {},
  bodyType: "json",
  bodyJsonInput: "{\n  \n}",
  bodyFormDataInput: [],

  executing: false,
  activeResponse: null,

  comparisonLeft: null,
  comparisonRight: null,

  fetchEndpoints: async () => {
    set({ loadingEndpoints: true });
    try {
      const res = await api.get("/dev/endpoints");
      if (res.data.success) {
        set({ endpoints: res.data.data });
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ loadingEndpoints: false });
    }
  },

  fetchDemoUsers: async () => {
    try {
      const res = await api.get("/dev/demo-users");
      if (res.data.success) {
        set({ demoUsers: res.data.data });
      }
    } catch (e) {
      console.error(e);
    }
  },

  fetchHistory: async () => {
    try {
      const res = await api.get("/dev/history");
      if (res.data.success) {
        set({ history: res.data.data });
      }
    } catch (e) {
      console.error(e);
    }
  },

  clearHistory: async () => {
    try {
      await api.post("/dev/history/clear");
      set({ history: [] });
    } catch (e) {
      console.error(e);
    }
  },

  fetchCollections: async () => {
    try {
      const res = await api.get("/dev/collections");
      if (res.data.success) {
        set({ collections: res.data.data });
      }
    } catch (e) {
      console.error(e);
    }
  },

  fetchTestCases: async () => {
    try {
      const res = await api.get("/dev/test-cases");
      if (res.data.success) {
        set({ testCases: res.data.data });
      }
    } catch (e) {
      console.error(e);
    }
  },

  setEnvironment: (environment) => set({ environment }),

  setActiveEndpointId: (id) => {
    set({ activeEndpointId: id, activeResponse: null });
    if (!id) return;
    const endpoint = get().endpoints.find((e) => e.id === id);
    if (!endpoint) return;

    // Load defaults from endpoint documentation
    const headers = (endpoint.headers || []).map((h) => ({
      key: h.name,
      value: h.name === "Authorization" ? `Bearer ${get().playToken || ""}` : "",
      enabled: true,
    }));
    if (!headers.some((h) => h.key === "Content-Type") && endpoint.method !== "GET") {
      headers.push({ key: "Content-Type", value: "application/json", enabled: true });
    }

    const queryParams = (endpoint.queryParams || []).map((q) => ({
      key: q.name,
      value: "",
      enabled: q.required,
    }));

    const pathParams: Record<string, string> = {};
    (endpoint.pathParams || []).forEach((p) => {
      pathParams[p.name] = "";
    });

    let bodyJson = "{\n  \n}";
    if (endpoint.exampleRequest) {
      bodyJson = JSON.stringify(endpoint.exampleRequest, null, 2);
    } else if (endpoint.requestSchema) {
      const defaults: Record<string, any> = {};
      const props = endpoint.requestSchema.properties || {};
      Object.keys(props).forEach((key) => {
        defaults[key] = props[key].type === "string" ? "" : props[key].type === "number" ? 0 : props[key].type === "boolean" ? false : null;
      });
      bodyJson = JSON.stringify(defaults, null, 2);
    }

    set({
      headersInput: headers,
      queryParamsInput: queryParams,
      pathParamsInput: pathParams,
      bodyType: endpoint.method === "GET" ? "none" : "json",
      bodyJsonInput: bodyJson,
      bodyFormDataInput: [],
    });
  },

  setPlayToken: (token, role) => set({ playToken: token, playUserRole: role }),

  loginAsDemoUser: async (role) => {
    try {
      const res = await api.post("/dev/auth/token-as", { role });
      if (res.data.success) {
        const { token, user } = res.data.data;
        set({ playToken: token, playUserRole: user.role });

        // Update Authorization header in request builder
        const headers = get().headersInput.map((h) => {
          if (h.key === "Authorization") {
            return { ...h, value: `Bearer ${token}` };
          }
          return h;
        });
        set({ headersInput: headers });
      }
    } catch (e) {
      console.error("Login as demo user failed:", e);
    }
  },

  refreshToken: async () => {
    const role = get().playUserRole || "OWNER";
    await get().loginAsDemoUser(role);
  },

  setHeadersInput: (headersInput) => set({ headersInput }),
  setQueryParamsInput: (queryParamsInput) => set({ queryParamsInput }),
  setPathParamsInput: (pathParamsInput) => set({ pathParamsInput }),
  setBodyType: (bodyType) => set({ bodyType }),
  setBodyJsonInput: (bodyJsonInput) => set({ bodyJsonInput }),
  setBodyFormDataInput: (bodyFormDataInput) => set({ bodyFormDataInput }),

  saveTestCase: async (testCase) => {
    try {
      await api.post("/dev/test-cases", testCase);
      await get().fetchTestCases();
      await get().fetchCollections();
    } catch (e) {
      console.error(e);
    }
  },

  deleteTestCase: async (id) => {
    try {
      await api.delete(`/dev/test-cases/${id}`);
      await get().fetchTestCases();
      await get().fetchCollections();
    } catch (e) {
      console.error(e);
    }
  },

  duplicateTestCase: async (id) => {
    try {
      await api.post(`/dev/test-cases/${id}/duplicate`);
      await get().fetchTestCases();
    } catch (e) {
      console.error(e);
    }
  },

  saveCollection: async (collection) => {
    try {
      await api.post("/dev/collections", collection);
      await get().fetchCollections();
    } catch (e) {
      console.error(e);
    }
  },

  deleteCollection: async (id) => {
    try {
      await api.delete(`/dev/collections/${id}`);
      await get().fetchCollections();
    } catch (e) {
      console.error(e);
    }
  },

  executePlaygroundRequest: async (endpoint) => {
    set({ executing: true, activeResponse: null });
    const startTime = Date.now();
    const playgroundRequestId = crypto.randomUUID();

    // 1. Build URL path with parameters replaced
    let finalPath = endpoint.route;
    const pathParams = get().pathParamsInput;
    Object.keys(pathParams).forEach((key) => {
      finalPath = finalPath.replace(`:${key}`, encodeURIComponent(pathParams[key] || `:${key}`));
    });

    // 2. Build Query Params
    const queryParams: Record<string, string> = {};
    get().queryParamsInput.forEach((q) => {
      if (q.enabled && q.key) {
        queryParams[q.key] = q.value;
      }
    });

    // 3. Build Headers
    const headers: Record<string, string> = {};
    get().headersInput.forEach((h) => {
      if (h.enabled && h.key) {
        headers[h.key] = h.value;
      }
    });

    // Automatically inject JWT if required and Authorization is missing
    if (endpoint.authRequired && !headers["Authorization"] && get().playToken) {
      headers["Authorization"] = `Bearer ${get().playToken}`;
    }

    // Attach tracing header to link it in the history log
    headers["x-dev-playground-request-id"] = playgroundRequestId;

    // 4. Build Body
    let data: any = undefined;
    if (endpoint.method !== "GET") {
      if (get().bodyType === "json") {
        try {
          data = JSON.parse(get().bodyJsonInput);
        } catch (err: any) {
          set({
            executing: false,
            activeResponse: {
              status: 0,
              statusText: "Invalid JSON Body",
              duration: 0,
              headers: {},
              body: null,
              sqlQueries: [],
              error: err.message,
              payloadSize: 0,
              responseSize: 0,
              validationResults: {
                statusPass: false,
                schemaPass: false,
                requiredFieldsPass: false,
                errorMessage: "Failed to parse Request JSON body: " + err.message,
              },
            },
          });
          return;
        }
      } else if (get().bodyType === "form-data") {
        const formData = new FormData();
        get().bodyFormDataInput.forEach((item) => {
          if (item.key) {
            if (item.type === "file" && item.file) {
              formData.append(item.key, item.file);
            } else {
              formData.append(item.key, item.value);
            }
          }
        });
        data = formData;
      } else if (get().bodyType === "x-www-form-urlencoded") {
        const params = new URLSearchParams();
        get().bodyFormDataInput.forEach((item) => {
          if (item.key) {
            params.append(item.key, item.value);
          }
        });
        data = params;
      }
    }

    // Calculate Payload Size
    const payloadSize = data ? new Blob([JSON.stringify(data)]).size : 0;

    // 5. Send request using raw axios (avoids redirect on 401)
    const rawAxios = axios.create({
      baseURL: getBaseUrl(),
      validateStatus: () => true, // resolve promise for any status code
    });

    try {
      const response = await rawAxios({
        method: endpoint.method,
        url: finalPath.startsWith("/api") ? finalPath.substring(4) : finalPath, // strip /api if baseUrl has it
        params: queryParams,
        headers,
        data,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      const responseSize = new Blob([JSON.stringify(response.data)]).size;

      // Wait 300ms for backend to write log, then fetch history to extract SQL queries
      await new Promise((resolve) => setTimeout(resolve, 300));
      await get().fetchHistory();

      // Find our matching history log
      const historyLog = get().history.find((h) => {
        return h.requestHeaders?.["x-dev-playground-request-id"] === playgroundRequestId;
      });

      // Run automatic assertions
      const statusPass = response.status >= 200 && response.status < 300;
      let schemaPass = true;
      let requiredFieldsPass = true;
      let valMessage = "";
      const missingFields: string[] = [];
      const typeMismatches: string[] = [];

      const responseData = response.data?.data !== undefined ? response.data.data : response.data;
      const expectedData = endpoint.exampleResponse?.data !== undefined ? endpoint.exampleResponse.data : endpoint.exampleResponse;

      if (response.status >= 200 && response.status < 300) {
        if (expectedData && typeof expectedData === "object" && responseData && typeof responseData === "object") {
          const expectedKeys = Object.keys(expectedData);
          expectedKeys.forEach((key) => {
            if (responseData[key] === undefined) {
              requiredFieldsPass = false;
              missingFields.push(key);
            } else {
              const expectedType = typeof expectedData[key];
              const actualType = typeof responseData[key];
              if (expectedType !== actualType && responseData[key] !== null) {
                schemaPass = false;
                typeMismatches.push(`'${key}': expected ${expectedType}, got ${actualType}`);
              }
            }
          });
        }
      }

      if (missingFields.length > 0) {
        valMessage += `Missing fields: ${missingFields.map(f => `'${f}'`).join(", ")}. `;
      }
      if (typeMismatches.length > 0) {
        valMessage += `Type mismatches: ${typeMismatches.join("; ")}. `;
      }

      set({
        executing: false,
        activeResponse: {
          status: response.status,
          statusText: response.statusText,
          duration,
          headers: response.headers as Record<string, string>,
          body: response.data,
          sqlQueries: historyLog?.sqlQueries || [],
          error: historyLog?.error || null,
          payloadSize,
          responseSize,
          validationResults: {
            statusPass,
            schemaPass,
            requiredFieldsPass,
            errorMessage: valMessage || undefined,
          },
        },
      });
    } catch (e: any) {
      const endTime = Date.now();
      set({
        executing: false,
        activeResponse: {
          status: 500,
          statusText: "Playground Request Failed",
          duration: endTime - startTime,
          headers: {},
          body: null,
          sqlQueries: [],
          error: e.message,
          payloadSize,
          responseSize: 0,
          validationResults: {
            statusPass: false,
            schemaPass: false,
            requiredFieldsPass: false,
            errorMessage: e.message,
          },
        },
      });
    }
  },

  setComparisonLeft: (comparisonLeft) => set({ comparisonLeft }),
  setComparisonRight: (comparisonRight) => set({ comparisonRight }),
}));
