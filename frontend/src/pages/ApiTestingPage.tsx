import React, { useEffect, useState, useMemo } from "react";
import {
  Play,
  Trash2,
  Copy,
  Plus,
  Search,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Folder,
  ArrowRightLeft,
  Compass,
  Download,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  Split,
  Shield,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type { ApiEndpoint, TestCase } from "../store/api.store";
import { useApiStore } from "../store/api.store";
import { api } from "../lib/axios";
import axios from "axios";
import { toast } from "sonner";

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
};

// ================= CUSTOM COLLAPSIBLE JSON TREE COMPONENT =================
interface JsonTreeViewerProps {
  data: any;
  label?: string;
  isLast?: boolean;
  depth?: number;
}

function JsonTreeNode({ data, label, isLast = true, depth = 0 }: JsonTreeViewerProps) {
  const [collapsed, setCollapsed] = useState(depth > 1);

  const isObject = data !== null && typeof data === "object";
  const isArray = Array.isArray(data);

  const getPreviewText = () => {
    if (isArray) {
      return `Array(${data.length})`;
    }
    if (isObject) {
      return `Object { ${Object.keys(data).slice(0, 3).join(", ")}${Object.keys(data).length > 3 ? "..." : ""} }`;
    }
    return "";
  };

  if (!isObject) {
    let valColor = "text-amber-600 dark:text-amber-400";
    let valStr = JSON.stringify(data);
    
    if (typeof data === "number") {
      valColor = "text-blue-600 dark:text-blue-400";
    } else if (typeof data === "boolean") {
      valColor = "text-indigo-600 dark:text-indigo-400";
    } else if (data === null) {
      valColor = "text-gray-500 dark:text-gray-400";
    }

    return (
      <div className="pl-4 font-mono text-[11px] leading-relaxed">
        {label && <span className="text-purple-600 dark:text-purple-400 mr-1">"{label}":</span>}
        <span className={valColor}>{valStr}</span>
        {!isLast && <span className="text-gray-400">,</span>}
      </div>
    );
  }

  const keys = Object.keys(data);
  const openBrace = isArray ? "[" : "{";
  const closeBrace = isArray ? "]" : "}";

  return (
    <div className="pl-4 font-mono text-[11px] leading-relaxed">
      <div 
        className="flex items-center gap-1 cursor-pointer select-none text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400" 
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-gray-400 dark:text-gray-500 text-[9px] w-3 text-center">
          {collapsed ? "▶" : "▼"}
        </span>
        {label && <span className="text-purple-600 dark:text-purple-400 mr-1">"{label}":</span>}
        <span className="text-gray-500 dark:text-gray-400">{openBrace}</span>
        {collapsed && (
          <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-400 px-1 rounded mx-1 italic">
            {getPreviewText()}
          </span>
        )}
        {collapsed && <span className="text-gray-500 dark:text-gray-400">{closeBrace}</span>}
      </div>

      {!collapsed && (
        <div className="border-l border-gray-200 dark:border-slate-800 pl-1 ml-1.5 my-0.5 space-y-0.5">
          {keys.map((k, idx) => (
            <JsonTreeNode
              key={k}
              data={data[k]}
              label={isArray ? undefined : k}
              isLast={idx === keys.length - 1}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {!collapsed && (
        <div className="pl-4 text-gray-500 dark:text-gray-400">
          {closeBrace}
          {!isLast && <span>,</span>}
        </div>
      )}
    </div>
  );
}

function JsonTreeViewer({ data }: { data: any }) {
  if (data === null || data === undefined) return <div className="text-gray-400 italic">No JSON Data</div>;
  return (
    <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-auto max-h-[450px]">
      <JsonTreeNode data={data} />
    </div>
  );
}

// ================= MAIN COMPONENT =================
export default function ApiTestingPage() {
  const {
    endpoints,
    loadingEndpoints,
    activeEndpointId,
    environment,
    playToken,
    playUserRole,
    collections,
    testCases,
    history,
    headersInput,
    queryParamsInput,
    pathParamsInput,
    bodyType,
    bodyJsonInput,
    bodyFormDataInput,
    executing,
    activeResponse,
    comparisonLeft,
    comparisonRight,
    
    // Actions
    fetchEndpoints,
    fetchDemoUsers,
    fetchHistory,
    clearHistory,
    fetchCollections,
    fetchTestCases,
    setEnvironment,
    setActiveEndpointId,
    setPlayToken,
    loginAsDemoUser,
    refreshToken,
    setHeadersInput,
    setQueryParamsInput,
    setPathParamsInput,
    setBodyType,
    setBodyJsonInput,
    setBodyFormDataInput,
    saveTestCase,
    deleteTestCase,
    duplicateTestCase,
    saveCollection,
    deleteCollection,
    executePlaygroundRequest,
    setComparisonLeft,
    setComparisonRight,
  } = useApiStore();

  // Panels width states for drag-resizing
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(420);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Dark/Light Theme state
  const [explorerTheme, setExplorerTheme] = useState<"light" | "dark">("light");

  // Search / filtering UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("ALL");
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // Tabs states
  const [centerTab, setCenterTab] = useState<"builder" | "docs" | "tests">("builder");
  const [builderSubTab, setBuilderSubTab] = useState<"params" | "headers" | "body" | "auth">("params");
  const [rightTab, setRightTab] = useState<"response" | "performance" | "validation" | "debug" | "compare">("response");

  // Modals dialog states
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);
  const [testCaseForm, setTestCaseForm] = useState<{
    id?: string;
    name: string;
    description: string;
    expectedStatus: number;
    expectedResponse: string;
  }>({
    name: "",
    description: "",
    expectedStatus: 200,
    expectedResponse: "",
  });

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionForm, setCollectionForm] = useState<{
    id?: string;
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });

  // Automated suite runner result state
  const [suiteResult, setSuiteResult] = useState<{
    running: boolean;
    total: number;
    passed: number;
    failed: number;
    executionTime: number;
    details: Array<{ name: string; endpoint: string; status: number; expected: number; passed: boolean }>;
  } | null>(null);

  // Initialize data
  useEffect(() => {
    fetchEndpoints();
    fetchDemoUsers();
    fetchHistory();
    fetchCollections();
    fetchTestCases();
  }, []);

  const activeEndpoint = useMemo(() => {
    return endpoints.find((e) => e.id === activeEndpointId) || null;
  }, [endpoints, activeEndpointId]);

  // Modules list grouped & filtered
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, ApiEndpoint[]> = {};
    
    // Auto-create category structure with 0 default endpoints
    const categoriesList = [
      "Authentication", "Dashboard", "Users", "Products", "Leads", "Customers", "Projects", 
      "Pipeline", "Project Details", "Quotations", "Payments", "Reminders", "Tasks", 
      "Settings", "Reports", "Search", "Notifications", "API Testing", "Unknown"
    ];
    categoriesList.forEach((c) => {
      groups[c] = [];
    });

    endpoints.forEach((ep) => {
      const matchSearch =
        ep.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.module.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMethod = filterMethod === "ALL" || ep.method === filterMethod;

      if (matchSearch && matchMethod) {
        const groupName = ep.module || "Unknown";
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(ep);
      }
    });

    // Remove empty groups to clean layout
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [endpoints, searchTerm, filterMethod]);

  // Total endpoints count after filter
  const filteredEndpointsCount = useMemo(() => {
    return Object.values(groupedEndpoints).reduce((acc, curr) => acc + curr.length, 0);
  }, [groupedEndpoints]);

  // Dynamic test cases generation when none exist
  const resolvedTestCases = useMemo(() => {
    if (!activeEndpoint) return [];
    
    // Filter actual saved test cases from DB first
    const saved = testCases.filter((tc) => tc.endpointId === activeEndpoint.id);
    if (saved.length > 0) return saved;

    // Fallback: dynamically generate realistic default test cases
    const basePayload = activeEndpoint.exampleRequest || {};
    const defaults: TestCase[] = [];

    if (activeEndpoint.method === "POST" || activeEndpoint.method === "PATCH" || activeEndpoint.method === "PUT") {
      defaults.push({
        id: `default-valid-${activeEndpoint.id}`,
        endpointId: activeEndpoint.id,
        name: "✓ Valid Request",
        description: "Submit request with complete, valid parameters.",
        request: {
          bodyType: "json",
          body: JSON.stringify(basePayload, null, 2),
        },
        expectedStatus: activeEndpoint.method === "POST" ? 201 : 200,
      });

      // Missing required fields tests
      if (activeEndpoint.requestSchema && activeEndpoint.requestSchema.required) {
        activeEndpoint.requestSchema.required.forEach((reqField: string) => {
          const bodyCopy = { ...basePayload };
          delete bodyCopy[reqField];
          defaults.push({
            id: `default-missing-${reqField}-${activeEndpoint.id}`,
            endpointId: activeEndpoint.id,
            name: `✓ Missing ${reqField.charAt(0).toUpperCase() + reqField.slice(1)}`,
            description: `Verify that request fails if required field '${reqField}' is absent.`,
            request: {
              bodyType: "json",
              body: JSON.stringify(bodyCopy, null, 2),
            },
            expectedStatus: 400,
          });
        });
      }

      // Add dummy wrong parameter type tests
      defaults.push({
        id: `default-invalid-status-${activeEndpoint.id}`,
        endpointId: activeEndpoint.id,
        name: "✓ Invalid Status Check",
        description: "Verify validation fails for bad values.",
        request: {
          bodyType: "json",
          body: JSON.stringify({ ...basePayload, status: "INVALID_STATUS_CODE" }, null, 2),
        },
        expectedStatus: 400,
      });
    } else {
      defaults.push({
        id: `default-success-${activeEndpoint.id}`,
        endpointId: activeEndpoint.id,
        name: "✓ Valid Success Fetch",
        description: "Verify default lookup execution returns status 200.",
        request: {
          bodyType: "none",
        },
        expectedStatus: 200,
      });
    }

    return defaults;
  }, [testCases, activeEndpoint]);

  // Resizing mouse handles hook
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        setLeftWidth((w) => Math.max(240, Math.min(450, w + e.movementX)));
      }
      if (isResizingRight) {
        setRightWidth((w) => Math.max(300, Math.min(600, w - e.movementX)));
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  const toggleModuleCollapse = (mod: string) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [mod]: !prev[mod],
    }));
  };

  const copyToClipboard = (text: string, message: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleSend = () => {
    if (!activeEndpoint) return;
    executePlaygroundRequest(activeEndpoint);
  };

  const handleImportPostman = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const importedTestCases: TestCase[] = [];
        const items = json.item || [];

        items.forEach((item: any) => {
          const req = item.request || {};
          const method = req.method || "GET";
          const path = "/" + (req.url?.path || []).join("/");
          const endpointId = `${method} ${path}`;

          importedTestCases.push({
            id: crypto.randomUUID(),
            endpointId,
            name: item.name || "Postman Test",
            description: req.description || "Imported from Postman",
            request: {
              headers: (req.header || []).reduce((acc: any, h: any) => {
                acc[h.key] = h.value;
                return acc;
              }, {}),
              bodyType: req.body?.mode === "raw" ? "json" : "none",
              body: req.body?.raw || "",
            },
            expectedStatus: 200,
          });
        });

        for (const tc of importedTestCases) {
          await api.post("/dev/test-cases", tc);
        }

        await api.post("/dev/collections", {
          name: json.info?.name || "Imported Collection",
          description: "Postman collection imported.",
          testCaseIds: importedTestCases.map((tc) => tc.id),
        });

        await fetchCollections();
        await fetchTestCases();
        toast.success("Postman collection imported successfully!");
      } catch (err: any) {
        toast.error("Failed to import Postman: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExportData = async () => {
    try {
      const res = await api.get("/dev/export");
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "api-console-export.json";
      a.click();
      toast.success("Configurations exported successfully");
    } catch (e) {
      toast.error("Export failed");
    }
  };

  const handleRunTestCase = async (tc: TestCase) => {
    const targetEndpoint = endpoints.find((e) => e.id === tc.endpointId);
    if (!targetEndpoint) {
      toast.error("Endpoint not found for this test case");
      return;
    }

    setActiveEndpointId(tc.endpointId);
    if (tc.request.headers) {
      setHeadersInput(
        Object.keys(tc.request.headers).map((k) => ({
          key: k,
          value: tc.request.headers![k],
          enabled: true,
        })),
      );
    }
    if (tc.request.queryParams) {
      setQueryParamsInput(
        Object.keys(tc.request.queryParams).map((k) => ({
          key: k,
          value: tc.request.queryParams![k],
          enabled: true,
        })),
      );
    }
    if (tc.request.pathParams) {
      setPathParamsInput(tc.request.pathParams);
    }
    if (tc.request.bodyType) {
      setBodyType(tc.request.bodyType);
    }
    if (tc.request.body) {
      setBodyJsonInput(
        typeof tc.request.body === "string"
          ? tc.request.body
          : JSON.stringify(tc.request.body, null, 2),
      );
    }

    toast.info(`Running test case: ${tc.name}`);
    await executePlaygroundRequest(targetEndpoint);
    
    const response = useApiStore.getState().activeResponse;
    if (response) {
      const passed = response.status === tc.expectedStatus;
      if (passed) {
        toast.success(`Test Passed: ${tc.name}`);
      } else {
        toast.error(`Test Failed: ${tc.name}. Expected ${tc.expectedStatus}, got ${response.status}`);
      }
    }
  };

  const handleRunSuite = async (scope: "all" | "module" | "collection", targetId?: string) => {
    setSuiteResult({ running: true, total: 0, passed: 0, failed: 0, executionTime: 0, details: [] });
    const startTime = Date.now();
    
    let targetTests: TestCase[] = [];
    if (scope === "all") {
      targetTests = testCases;
    } else if (scope === "module" && targetId) {
      const moduleEndpoints = endpoints.filter((e) => e.module === targetId).map((e) => e.id);
      targetTests = testCases.filter((tc) => moduleEndpoints.includes(tc.endpointId));
    } else if (scope === "collection" && targetId) {
      const col = collections.find((c) => c.id === targetId);
      if (col) {
        targetTests = testCases.filter((tc) => col.testCaseIds.includes(tc.id));
      }
    }

    if (targetTests.length === 0) {
      toast.warning("No test cases found for execution.");
      setSuiteResult(null);
      return;
    }

    let passedCount = 0;
    let failedCount = 0;
    const detailsList: Array<{ name: string; endpoint: string; status: number; expected: number; passed: boolean }> = [];

    const rawAxios = axios.create({
      baseURL: getBaseUrl(),
      validateStatus: () => true,
    });

    for (const tc of targetTests) {
      const ep = endpoints.find((e) => e.id === tc.endpointId);
      if (!ep) continue;

      let finalPath = ep.route;
      const pathParams = tc.request.pathParams || {};
      Object.keys(pathParams).forEach((key) => {
        finalPath = finalPath.replace(`:${key}`, encodeURIComponent(pathParams[key] || ""));
      });

      const headers = { ...(tc.request.headers || {}) };
      if (ep.authRequired && !headers["Authorization"] && playToken) {
        headers["Authorization"] = `Bearer ${playToken}`;
      }

      let data = undefined;
      if (tc.request.bodyType === "json" && tc.request.body) {
        try {
          data = typeof tc.request.body === "string" ? JSON.parse(tc.request.body) : tc.request.body;
        } catch {
          // ignore
        }
      }

      try {
        const response = await rawAxios({
          method: ep.method,
          url: finalPath.startsWith("/api") ? finalPath.substring(4) : finalPath,
          params: tc.request.queryParams,
          headers,
          data,
        });

        const passed = response.status === tc.expectedStatus;
        if (passed) passedCount++;
        else failedCount++;

        detailsList.push({
          name: tc.name,
          endpoint: `${ep.method} ${ep.route}`,
          status: response.status,
          expected: tc.expectedStatus,
          passed,
        });
      } catch (err: any) {
        failedCount++;
        detailsList.push({
          name: tc.name,
          endpoint: `${ep.method} ${ep.route}`,
          status: 500,
          expected: tc.expectedStatus,
          passed: false,
        });
      }
    }

    const duration = Date.now() - startTime;
    setSuiteResult({
      running: false,
      total: targetTests.length,
      passed: passedCount,
      failed: failedCount,
      executionTime: duration,
      details: detailsList,
    });
  };

  const handleOpenTestCaseModal = (tc?: TestCase) => {
    if (!activeEndpointId) {
      toast.error("Please select an API route first");
      return;
    }
    if (tc) {
      setTestCaseForm({
        id: tc.id,
        name: tc.name,
        description: tc.description,
        expectedStatus: tc.expectedStatus,
        expectedResponse: tc.expectedResponse || "",
      });
    } else {
      setTestCaseForm({
        name: "",
        description: "",
        expectedStatus: activeEndpoint?.method === "POST" ? 201 : 200,
        expectedResponse: "",
      });
    }
    setIsTestCaseModalOpen(true);
  };

  const handleSaveTestCase = async () => {
    if (!testCaseForm.name || !activeEndpointId) {
      toast.error("Name is required");
      return;
    }

    const headers: Record<string, string> = {};
    headersInput.forEach((h) => {
      if (h.enabled && h.key) headers[h.key] = h.value;
    });

    const queryParams: Record<string, string> = {};
    queryParamsInput.forEach((q) => {
      if (q.enabled && q.key) queryParams[q.key] = q.value;
    });

    await saveTestCase({
      id: testCaseForm.id,
      endpointId: activeEndpointId,
      name: testCaseForm.name,
      description: testCaseForm.description,
      request: {
        headers,
        queryParams,
        pathParams: pathParamsInput,
        bodyType,
        body: bodyJsonInput,
      },
      expectedStatus: Number(testCaseForm.expectedStatus),
      expectedResponse: testCaseForm.expectedResponse,
    });

    setIsTestCaseModalOpen(false);
    toast.success("Test case saved");
  };

  const prettyPrint = (data: any) => {
    if (data === null || data === undefined) return "";
    if (typeof data === "string") {
      try {
        return JSON.stringify(JSON.parse(data), null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2);
  };

  const renderJsonDiff = () => {
    if (!comparisonLeft || !comparisonRight) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-gray-400 bg-gray-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-center">
          <ArrowRightLeft className="w-12 h-12 mb-2 animate-pulse text-gray-300" />
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Select Left & Right History logs from panel to compare</p>
        </div>
      );
    }

    const leftStr = prettyPrint(comparisonLeft.responsePayload);
    const rightStr = prettyPrint(comparisonRight.responsePayload);

    return (
      <div className="grid grid-cols-2 gap-4 h-[450px]">
        <div className="flex flex-col h-full bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800 bg-gray-900">
            <span className="text-[10px] font-bold text-gray-400">Left Response</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold">
              {comparisonLeft.method} {comparisonLeft.status}
            </span>
          </div>
          <pre className="p-3 text-[10px] font-mono text-gray-300 overflow-auto flex-1 whitespace-pre">
            {leftStr}
          </pre>
        </div>
        <div className="flex flex-col h-full bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800 bg-gray-900">
            <span className="text-[10px] font-bold text-gray-400">Right Response</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono font-bold">
              {comparisonRight.method} {comparisonRight.status}
            </span>
          </div>
          <pre className="p-3 text-[10px] font-mono text-gray-300 overflow-auto flex-1 whitespace-pre">
            {rightStr}
          </pre>
        </div>
      </div>
    );
  };

  const handleResetRequest = () => {
    if (!activeEndpointId) return;
    setActiveEndpointId(activeEndpointId);
    toast.success("Request reset to defaults");
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-100px)] min-h-[600px] border shadow-2xl overflow-hidden font-sans rounded-2xl ${
      explorerTheme === "dark" ? "dark bg-slate-950 text-slate-100 border-slate-900" : "bg-white text-gray-900 border-gray-200"
    }`}>
      {/* ================= HEADER BAR ================= */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight flex items-center gap-1.5">
              API Testing & Explorer Console
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 uppercase tracking-widest border border-blue-500/20">
                Postman v2
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              API Environment: <span className="font-semibold text-blue-400 capitalize">{environment}</span> • Discovered: <span className="font-bold text-emerald-400">{endpoints.length} APIs</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          {/* Environment Switcher */}
          <div className="flex bg-slate-800/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-700/50">
            {(["development", "staging", "production"] as const).map((env) => (
              <button
                key={env}
                onClick={() => setEnvironment(env)}
                className={`px-3 py-1 rounded-lg text-xxs transition-all uppercase font-bold ${
                  environment === env
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {env.substring(0, 3)}
              </button>
            ))}
          </div>

          {/* Theme switcher */}
          <button
            onClick={() => setExplorerTheme(explorerTheme === "light" ? "dark" : "light")}
            className="p-2 rounded-xl bg-slate-800/80 dark:bg-slate-900/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 cursor-pointer"
            title="Toggle Console Theme"
          >
            {explorerTheme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Configuration Import / Export */}
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
            <button
              onClick={handleExportData}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xxs font-bold text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 transition"
              title="Export all database settings"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xxs font-bold text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 cursor-pointer transition">
              <Upload className="w-3 h-3" />
              Import
              <input type="file" onChange={handleImportPostman} accept=".json" className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* ================= WORKSPACE ================= */}
      <div className="flex-1 flex overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
        
        {/* ================= LEFT PANEL ================= */}
        <div 
          style={{ width: `${leftWidth}px` }} 
          className="border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col shrink-0 overflow-y-auto"
        >
          {/* Search controls */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by URL, method, module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border dark:border-slate-800 rounded-lg text-xs bg-gray-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/25 transition outline-none dark:text-slate-100"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="flex-1 px-2 py-1.5 border dark:border-slate-800 rounded-md text-[11px] text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none"
              >
                <option value="ALL">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setFilterMethod("ALL");
                }}
                className="px-2 py-1.5 border dark:border-slate-800 rounded-md text-[10px] font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Module Explorer */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-3 py-1 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Categories
              </span>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {filteredEndpointsCount} / {endpoints.length}
              </span>
            </div>

            {loadingEndpoints ? (
              <div className="p-4 text-center text-xs text-gray-400 animate-pulse">Scanning routes...</div>
            ) : Object.keys(groupedEndpoints).length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 italic">No matching endpoints</div>
            ) : (
              Object.keys(groupedEndpoints).map((mod) => {
                const isCollapsed = !!collapsedModules[mod];
                const list = groupedEndpoints[mod];

                return (
                  <div key={mod} className="space-y-0.5">
                    <button
                      onClick={() => toggleModuleCollapse(mod)}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-900 transition"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Folder className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                        <span className="truncate">{mod}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500">
                          {list.length}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className="pl-3 border-l border-gray-100 dark:border-slate-800 ml-4 space-y-0.5 my-0.5">
                        {list.map((ep) => {
                          const isActive = activeEndpointId === ep.id;
                          const methodColors: Record<string, string> = {
                            GET: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
                            POST: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
                            PATCH: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
                            DELETE: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
                          };

                          return (
                            <button
                              key={ep.id}
                              onClick={() => {
                                setActiveEndpointId(ep.id);
                                setCenterTab("builder");
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs transition border ${
                                isActive
                                  ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-medium"
                                  : "border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900/50 hover:text-gray-900 dark:hover:text-white"
                              }`}
                            >
                              <span
                                className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded border uppercase shrink-0 font-mono ${
                                  methodColors[ep.method] || "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {ep.method}
                              </span>
                              <span className="truncate font-mono text-[10px] flex-1">{ep.route}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Test Collections */}
            <div className="border-t border-gray-200 dark:border-slate-800 my-3 pt-3 px-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Collections</span>
                <button
                  onClick={() => {
                    setCollectionForm({ name: "", description: "" });
                    setIsCollectionModalOpen(true);
                  }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition"
                  title="Create Collection"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {collections.length === 0 ? (
                <div className="px-2 py-1 text-[10px] text-gray-400 dark:text-slate-500 italic">No collections</div>
              ) : (
                <div className="space-y-1">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className="group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs bg-gray-50/50 dark:bg-slate-900/50 border dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-900 transition"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Folder className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                        <span className="font-semibold text-gray-700 dark:text-slate-300 truncate">{col.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-200/50 dark:bg-slate-800 text-gray-500">
                          {col.testCaseIds.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleRunSuite("collection", col.id)}
                          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 rounded"
                          title="Run all test cases in suite"
                        >
                          <Play className="w-3 h-3 fill-green-600" />
                        </button>
                        <button
                          onClick={() => deleteCollection(col.id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                          title="Delete Collection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Request History */}
            <div className="border-t border-gray-200 dark:border-slate-800 my-3 pt-3 px-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">History</span>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="px-2 py-1 text-[10px] text-gray-400 dark:text-slate-500 italic">No logs recorded</div>
              ) : (
                <div className="space-y-1 max-h-[180px] overflow-y-auto">
                  {history.slice(0, 15).map((entry) => {
                    const statusColor = entry.status < 300 ? "text-emerald-500 font-bold" : "text-red-500 font-bold";
                    return (
                      <div
                        key={entry.id}
                        className="group flex items-center justify-between p-2 rounded-lg text-[10px] hover:bg-gray-100 dark:hover:bg-slate-900 border dark:border-slate-800 bg-white dark:bg-slate-950 transition cursor-pointer"
                        onClick={() => {
                          const matchEp = endpoints.find(
                            (e) => e.method === entry.method && e.route === entry.endpoint,
                          );
                          if (matchEp) {
                            setActiveEndpointId(matchEp.id);
                          }
                          if (entry.requestHeaders) {
                            setHeadersInput(
                              Object.keys(entry.requestHeaders).map((k) => ({
                                key: k,
                                value: entry.requestHeaders![k],
                                enabled: true,
                              })),
                            );
                          }
                          if (entry.requestPayload) {
                            setBodyType("json");
                            setBodyJsonInput(JSON.stringify(entry.requestPayload, null, 2));
                          }
                          setCenterTab("builder");
                        }}
                      >
                        <div className="flex flex-col min-w-0 flex-1 pr-1 font-mono">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-[9px] text-gray-500">{entry.method}</span>
                            <span className="truncate text-gray-800 dark:text-slate-200">{entry.endpoint}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
                            <span className={statusColor}>{entry.status}</span>
                            <span>•</span>
                            <span>{entry.duration}ms</span>
                            <span>•</span>
                            <span className="truncate text-blue-500 font-bold uppercase text-[8px]">
                              {entry.user?.role || "Public"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!comparisonLeft) {
                                setComparisonLeft(entry);
                                toast.info("Set as Left comparison");
                              } else {
                                setComparisonRight(entry);
                                toast.info("Set as Right comparison");
                                setRightTab("compare");
                              }
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-500"
                            title="Add to compare layout"
                          >
                            <Split className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RESIZE DIVIDER 1 ================= */}
        <div
          onMouseDown={() => setIsResizingLeft(true)}
          className="w-1 bg-gray-200 dark:bg-slate-800 hover:bg-blue-500 cursor-col-resize transition-colors shrink-0 select-none"
        />

        {/* ================= CENTER PANEL (DOCUMENTATION & BUILDER) ================= */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto">
          {activeEndpoint ? (
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* HTTP Action bar */}
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex items-center gap-3 shrink-0">
                <span className="px-3 py-1.5 text-xxs font-extrabold font-mono rounded bg-slate-900 dark:bg-slate-950 text-white shadow-sm border dark:border-slate-800">
                  {activeEndpoint.method}
                </span>
                <input
                  type="text"
                  readOnly
                  value={`${getBaseUrl()}${activeEndpoint.route}`}
                  className="flex-1 px-3 py-1.5 border dark:border-slate-800 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 outline-none select-all"
                />
                
                <button
                  onClick={handleResetRequest}
                  className="px-2.5 py-1.5 border dark:border-slate-800 rounded-lg text-[10px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition"
                  title="Reset form parameters to defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>

                <button
                  onClick={handleSend}
                  disabled={executing}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-blue-500/20 transition disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {executing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-white" />
                      Send
                    </>
                  )}
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 text-xs font-semibold shrink-0">
                <button
                  onClick={() => setCenterTab("builder")}
                  className={`px-5 py-3 border-b-2 transition ${
                    centerTab === "builder"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-950"
                      : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Request Builder
                </button>
                <button
                  onClick={() => setCenterTab("docs")}
                  className={`px-5 py-3 border-b-2 transition ${
                    centerTab === "docs"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-950"
                      : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Documentation
                </button>
                <button
                  onClick={() => setCenterTab("tests")}
                  className={`px-5 py-3 border-b-2 transition ${
                    centerTab === "tests"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-950"
                      : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Test Cases ({resolvedTestCases.length})
                </button>
              </div>

              {/* Tabs Content */}
              <div className="flex-1 p-5 overflow-y-auto">
                
                {/* Center Tab: Request Builder */}
                {centerTab === "builder" && (
                  <div className="space-y-4">
                    <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800 text-xs pb-2 shrink-0">
                      {(["params", "headers", "body", "auth"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setBuilderSubTab(tab)}
                          className={`px-3 py-1.5 rounded-lg capitalize font-bold text-xxs transition ${
                            builderSubTab === tab
                              ? "bg-slate-900 dark:bg-slate-800 text-white"
                              : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-900"
                          }`}
                        >
                          {tab === "params" ? "Parameters" : tab}
                        </button>
                      ))}
                    </div>

                    {/* Parameters tab */}
                    {builderSubTab === "params" && (
                      <div className="space-y-4">
                        {/* Path Params */}
                        {Object.keys(pathParamsInput).length > 0 && (
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Path Variables</span>
                            <div className="space-y-2 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border dark:border-slate-800">
                              {Object.keys(pathParamsInput).map((key) => (
                                <div key={key} className="flex items-center gap-3">
                                  <label className="w-24 text-[11px] font-bold text-gray-500 dark:text-slate-400 truncate font-mono">
                                    {key}
                                  </label>
                                  <input
                                    type="text"
                                    value={pathParamsInput[key]}
                                    onChange={(e) => {
                                      setPathParamsInput({
                                        ...pathParamsInput,
                                        [key]: e.target.value,
                                      });
                                    }}
                                    placeholder="Value"
                                    className="flex-1 px-3 py-1.5 border dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 focus:ring-1 focus:ring-blue-500 dark:text-slate-200"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Query Params */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Query Parameters</span>
                            <button
                              onClick={() => {
                                setQueryParamsInput([...queryParamsInput, { key: "", value: "", enabled: true }]);
                              }}
                              className="text-xxs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Add Parameter
                            </button>
                          </div>

                          <div className="space-y-2">
                            {queryParamsInput.length === 0 ? (
                              <div className="text-xs text-gray-400 dark:text-slate-500 italic bg-gray-50 dark:bg-slate-900/40 p-4 border dark:border-slate-800 rounded-xl">
                                No query parameters active.
                              </div>
                            ) : (
                              queryParamsInput.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={p.enabled}
                                    onChange={(e) => {
                                      const copy = [...queryParamsInput];
                                      copy[idx].enabled = e.target.checked;
                                      setQueryParamsInput(copy);
                                    }}
                                    className="rounded border-gray-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Parameter Name"
                                    value={p.key}
                                    onChange={(e) => {
                                      const copy = [...queryParamsInput];
                                      copy[idx].key = e.target.value;
                                      setQueryParamsInput(copy);
                                    }}
                                    className="flex-1 px-3 py-1.5 border dark:border-slate-800 rounded-lg text-xs font-mono dark:bg-slate-950 dark:text-slate-100"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Value"
                                    value={p.value}
                                    onChange={(e) => {
                                      const copy = [...queryParamsInput];
                                      copy[idx].value = e.target.value;
                                      setQueryParamsInput(copy);
                                    }}
                                    className="flex-1 px-3 py-1.5 border dark:border-slate-800 rounded-lg text-xs dark:bg-slate-950 dark:text-slate-100"
                                  />
                                  <button
                                    onClick={() => {
                                      setQueryParamsInput(queryParamsInput.filter((_, i) => i !== idx));
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-900 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Headers tab */}
                    {builderSubTab === "headers" && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Request Headers</span>
                          <button
                            onClick={() => {
                              setHeadersInput([...headersInput, { key: "", value: "", enabled: true }]);
                            }}
                            className="text-xxs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Header
                          </button>
                        </div>

                        <div className="space-y-2">
                          {headersInput.map((h, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={h.enabled}
                                onChange={(e) => {
                                  const copy = [...headersInput];
                                  copy[idx].enabled = e.target.checked;
                                  setHeadersInput(copy);
                                }}
                                className="rounded border-gray-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                placeholder="Header Key"
                                value={h.key}
                                onChange={(e) => {
                                  const copy = [...headersInput];
                                  copy[idx].key = e.target.value;
                                  setHeadersInput(copy);
                                }}
                                className="flex-1 px-3 py-1.5 border dark:border-slate-800 rounded-lg text-xs font-mono dark:bg-slate-950 dark:text-slate-100"
                              />
                              <input
                                type="text"
                                placeholder="Value"
                                value={h.value}
                                onChange={(e) => {
                                  const copy = [...headersInput];
                                  copy[idx].value = e.target.value;
                                  setHeadersInput(copy);
                                }}
                                className="flex-1 px-3 py-1.5 border dark:border-slate-800 rounded-lg text-xs dark:bg-slate-950 dark:text-slate-100"
                              />
                              <button
                                onClick={() => {
                                  setHeadersInput(headersInput.filter((_, i) => i !== idx));
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-900 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Body tab */}
                    {builderSubTab === "body" && (
                      <div className="space-y-4">
                        <div className="flex gap-4 text-xs font-medium border-b border-gray-200 dark:border-slate-800 pb-2">
                          {(["json", "form-data", "x-www-form-urlencoded", "none"] as const).map((t) => (
                            <label key={t} className="flex items-center gap-1.5 cursor-pointer text-gray-600 dark:text-slate-400">
                              <input
                                type="radio"
                                name="bodyType"
                                checked={bodyType === t}
                                onChange={() => setBodyType(t)}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="uppercase text-[10px] font-bold">{t}</span>
                            </label>
                          ))}
                        </div>

                        {bodyType === "json" && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs text-gray-400">
                              <span>JSON Payload</span>
                              <button
                                onClick={() => {
                                  try {
                                    setBodyJsonInput(JSON.stringify(JSON.parse(bodyJsonInput), null, 2));
                                    toast.success("JSON Formatted");
                                  } catch (err: any) {
                                    toast.error("Invalid JSON: " + err.message);
                                  }
                                }}
                                className="text-xxs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                Format
                              </button>
                            </div>
                            <textarea
                              value={bodyJsonInput}
                              onChange={(e) => setBodyJsonInput(e.target.value)}
                              rows={10}
                              className="w-full p-4 border dark:border-slate-800 rounded-xl text-xs font-mono bg-gray-900 text-green-400 focus:ring-2 focus:ring-blue-500/25 outline-none resize-y"
                            />
                          </div>
                        )}

                        {(bodyType === "form-data" || bodyType === "x-www-form-urlencoded") && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Form Parameters</span>
                              <button
                                onClick={() => {
                                  setBodyFormDataInput([
                                    ...bodyFormDataInput,
                                    { key: "", value: "", type: "text" },
                                  ]);
                                }}
                                className="text-xxs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add field
                              </button>
                            </div>
                            <div className="space-y-2 bg-gray-50 dark:bg-slate-900/50 p-4 border dark:border-slate-800 rounded-xl">
                              {bodyFormDataInput.length === 0 ? (
                                <div className="text-xs text-gray-400 italic">No parameters defined.</div>
                              ) : (
                                bodyFormDataInput.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    <input
                                      type="text"
                                      placeholder="Key"
                                      value={item.key}
                                      onChange={(e) => {
                                        const copy = [...bodyFormDataInput];
                                        copy[idx].key = e.target.value;
                                        setBodyFormDataInput(copy);
                                      }}
                                      className="flex-1 px-3 py-1.5 border dark:border-slate-800 rounded-lg text-xs dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    {bodyType === "form-data" && (
                                      <select
                                        value={item.type}
                                        onChange={(e) => {
                                          const copy = [...bodyFormDataInput];
                                          copy[idx].type = e.target.value as "text" | "file";
                                          setBodyFormDataInput(copy);
                                        }}
                                        className="px-2 py-1.5 border dark:border-slate-800 rounded-md text-xs dark:bg-slate-900 dark:text-slate-200"
                                      >
                                        <option value="text">Text</option>
                                        <option value="file">File</option>
                                      </select>
                                    )}
                                    {item.type === "file" ? (
                                      <input
                                        type="file"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          const copy = [...bodyFormDataInput];
                                          copy[idx].file = file;
                                          copy[idx].value = file ? file.name : "";
                                          setBodyFormDataInput(copy);
                                        }}
                                        className="text-xs max-w-[200px]"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        placeholder="Value"
                                        value={item.value}
                                        onChange={(e) => {
                                          const copy = [...bodyFormDataInput];
                                          copy[idx].value = e.target.value;
                                          setBodyFormDataInput(copy);
                                        }}
                                        className="flex-1 px-3 py-1.5 border dark:border-slate-800 rounded-lg text-xs dark:bg-slate-950 dark:text-slate-100"
                                      />
                                    )}
                                    <button
                                      onClick={() => {
                                        setBodyFormDataInput(bodyFormDataInput.filter((_, i) => i !== idx));
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {bodyType === "none" && (
                          <div className="p-8 text-center text-xs text-gray-400 italic bg-gray-50 dark:bg-slate-900/30 border dark:border-slate-800 rounded-xl">
                            Request does not require a request body.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Auth tab */}
                    {builderSubTab === "auth" && (
                      <div className="space-y-4">
                        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 border border-blue-100 dark:border-blue-900/50 rounded-xl space-y-2">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Demo Account Role Impersonation
                          </span>
                          <p className="text-xxs text-blue-800 dark:text-blue-400">
                            Impersonate any of the default workspace accounts in the system database. The playground JWT token will automatically update.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Select Role Account</span>
                          <div className="grid grid-cols-2 gap-3">
                            {(["OWNER", "SALESMAN", "ACCOUNTANT", "ATTENDANT"] as const).map((role) => {
                              const isActive = playUserRole === role;
                              return (
                                <button
                                  key={role}
                                  onClick={() => loginAsDemoUser(role)}
                                  className={`flex items-center justify-between px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                    isActive
                                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                      : "bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800"
                                  }`}
                                >
                                  <span>{role}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isActive ? "bg-blue-800 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-500"}`}>
                                    Impersonate
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-slate-300">
                            <span>JWT Authorization Header</span>
                            <div className="flex gap-2 font-bold text-xxs">
                              <button onClick={refreshToken} className="text-blue-600 dark:text-blue-400 hover:underline">
                                Refresh
                              </button>
                              <button onClick={() => setPlayToken(null, null)} className="text-red-500 hover:underline">
                                Reset
                              </button>
                            </div>
                          </div>
                          <textarea
                            readOnly
                            value={playToken || "No authorization token active"}
                            rows={3}
                            className="w-full p-3 border dark:border-slate-800 rounded-xl text-xxs font-mono bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Center Tab: Documentation */}
                {centerTab === "docs" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">API Overview</h3>
                      <p className="text-xs text-gray-700 dark:text-slate-300">{activeEndpoint.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-900 p-4 border dark:border-slate-800 rounded-xl text-xs font-mono">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Controller Handler</span>
                        <span className="font-bold text-gray-800 dark:text-slate-200">{activeEndpoint.controller}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Service Layer</span>
                        <span className="font-bold text-gray-800 dark:text-slate-200">{activeEndpoint.serviceMethod}</span>
                      </div>
                      <div className="col-span-2 border-t dark:border-slate-800 pt-2">
                        <span className="text-gray-400 block mb-0.5">Security Level</span>
                        <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                          <Shield className="w-3.5 h-3.5 text-blue-500" />
                          {activeEndpoint.authRequired ? (
                            <span>Required Auth (Roles: <strong className="text-red-600 dark:text-red-400">{activeEndpoint.requiredRoles.join(", ")}</strong>)</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400 font-bold">Public Endpoint (No Auth Needed)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {activeEndpoint.validationRules?.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Validation Rules</h3>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-800">
                          <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-slate-400 space-y-1">
                            {activeEndpoint.validationRules.map((rule, idx) => (
                              <li key={idx} className="font-mono text-[10px]">{rule}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeEndpoint.requestSchema && (
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Request JSON Schema</h3>
                        <pre className="p-3 border dark:border-slate-800 rounded-xl bg-gray-900 text-[10px] font-mono text-gray-300 overflow-auto whitespace-pre max-h-[220px]">
                          {JSON.stringify(activeEndpoint.requestSchema, null, 2)}
                        </pre>
                      </div>
                    )}

                    {activeEndpoint.exampleResponse && (
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Example Response Structure</h3>
                        <pre className="p-3 border dark:border-slate-800 rounded-xl bg-gray-900 text-[10px] font-mono text-emerald-400 overflow-auto whitespace-pre max-h-[220px]">
                          {JSON.stringify(activeEndpoint.exampleResponse, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Center Tab: Test Cases */}
                {centerTab === "tests" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-200">Playbook Assertions</h3>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">Configure Expected Status codes and run functional suites.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRunSuite("module", activeEndpoint.module)}
                          className="px-3 py-1.5 bg-gray-900 dark:bg-slate-800 hover:bg-gray-800 text-white rounded-lg text-xxs font-bold shadow-sm cursor-pointer"
                        >
                          Run All for {activeEndpoint.module}
                        </button>
                        <button
                          onClick={() => handleOpenTestCaseModal()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xxs font-bold shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Save current request
                        </button>
                      </div>
                    </div>

                    {/* Suite report */}
                    {suiteResult && (
                      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-[10px] font-bold text-blue-400">Workflow Execution Report</span>
                          <button onClick={() => setSuiteResult(null)} className="text-[9px] text-gray-400 hover:underline">
                            Dismiss
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div>
                            <span className="text-[9px] text-gray-400 block uppercase">Total</span>
                            <span className="font-bold">{suiteResult.total}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-emerald-400 block uppercase">Passed</span>
                            <span className="font-bold text-emerald-400">{suiteResult.passed}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-red-400 block uppercase">Failed</span>
                            <span className="font-bold text-red-400">{suiteResult.failed}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-400 block uppercase">Time</span>
                            <span className="font-bold">{suiteResult.executionTime}ms</span>
                          </div>
                        </div>
                        <div className="space-y-1 pt-2 border-t border-slate-800 max-h-[140px] overflow-y-auto">
                          {suiteResult.details.map((detail, idx) => (
                            <div key={idx} className="flex justify-between text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="truncate pr-1 text-slate-300">{detail.name} ({detail.endpoint})</span>
                              <span className={detail.passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                {detail.passed ? "PASS" : "FAIL"} (Got {detail.status})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {resolvedTestCases.map((tc) => (
                        <div
                          key={tc.id}
                          className="group p-4 bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl transition shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                {tc.name}
                              </h4>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500">{tc.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRunTestCase(tc)}
                                className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                Run
                              </button>
                              <button
                                onClick={async () => {
                                  // If it's a dynamic mock test case, save it permanently first
                                  if (tc.id.startsWith("default-")) {
                                    await saveTestCase({
                                      endpointId: tc.endpointId,
                                      name: tc.name.replace("✓ ", ""),
                                      description: tc.description,
                                      request: tc.request as any,
                                      expectedStatus: tc.expectedStatus,
                                    });
                                    toast.success("Default test case persisted permanently!");
                                  } else {
                                    await duplicateTestCase(tc.id);
                                    toast.success("Test case duplicated");
                                  }
                                }}
                                className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                {tc.id.startsWith("default-") ? "Save" : "Duplicate"}
                              </button>
                              {!tc.id.startsWith("default-") && (
                                <button
                                  onClick={() => deleteTestCase(tc.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-[10px] text-gray-500 dark:text-slate-400 border-t dark:border-slate-850 pt-2 mt-2 font-mono">
                            <span>Assert Status: <strong className="text-blue-600 dark:text-blue-400 font-bold">{tc.expectedStatus}</strong></span>
                            {tc.request.bodyType && tc.request.bodyType !== "none" && (
                              <span>Format: <strong className="text-gray-700 dark:text-slate-300 uppercase font-semibold">{tc.request.bodyType}</strong></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 bg-white dark:bg-slate-950">
              <Compass className="w-16 h-16 text-blue-500 mb-3 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-slate-300">Dynamic API Explorer Console</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
                Express routes are automatically discovered, mapped, and exposed. Select an endpoint in the Left Navigation to get started.
              </p>
            </div>
          )}
        </div>

        {/* ================= RESIZE DIVIDER 2 ================= */}
        <div
          onMouseDown={() => setIsResizingRight(true)}
          className="w-1 bg-gray-200 dark:bg-slate-800 hover:bg-blue-500 cursor-col-resize transition-colors shrink-0 select-none"
        />

        {/* ================= RIGHT PANEL (RESPONSE VIEWER & SQL) ================= */}
        <div 
          style={{ width: `${rightWidth}px` }} 
          className="bg-white dark:bg-slate-950 flex flex-col shrink-0 overflow-y-auto"
        >
          {activeResponse ? (
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* Output status bar */}
              <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xxs font-extrabold rounded-lg border shadow-sm ${
                    activeResponse.status < 300
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                      : activeResponse.status < 400
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                  }`}>
                    {activeResponse.status} {activeResponse.statusText}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 font-mono">
                    {activeResponse.duration} ms
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(prettyPrint(activeResponse.body), "Response payload copied!")}
                    className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-900 rounded transition cursor-pointer"
                    title="Copy payload response"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Navigation sub-tabs */}
              <div className="flex border-b border-gray-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider bg-gray-50 dark:bg-slate-900/30 shrink-0">
                {(["response", "performance", "validation", "debug", "compare"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setRightTab(t)}
                    className={`flex-1 py-3 text-center border-b-2 transition ${
                      rightTab === t
                        ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-950"
                        : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Content Panels */}
              <div className="flex-1 p-4 overflow-y-auto">
                
                {/* 1. Tab: Response body */}
                {rightTab === "response" && (
                  <div className="h-full flex flex-col space-y-2">
                    <span className="text-xxs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Collapsible Json Tree</span>
                    <JsonTreeViewer data={activeResponse.body} />
                    
                    <span className="text-xxs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider pt-2">Raw View</span>
                    <pre className="p-3 border dark:border-slate-800 rounded-xl bg-gray-950 text-emerald-400 text-[10px] font-mono overflow-auto whitespace-pre max-h-[200px]">
                      {prettyPrint(activeResponse.body)}
                    </pre>
                  </div>
                )}

                {/* 2. Tab: Performance logs */}
                {rightTab === "performance" && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-slate-900 p-4 border dark:border-slate-800 rounded-xl grid grid-cols-2 gap-4 text-center font-mono">
                      <div>
                        <span className="text-[9px] text-gray-400 block uppercase">Total Time</span>
                        <span className="text-base font-bold text-gray-800 dark:text-slate-200">{activeResponse.duration} ms</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block uppercase">SQL Queries</span>
                        <span className="text-base font-bold text-gray-800 dark:text-slate-200">{activeResponse.sqlQueries?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block uppercase">Request Payload</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-350">{(activeResponse.payloadSize / 1024).toFixed(2)} KB</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block uppercase">Response Size</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-355">{(activeResponse.responseSize / 1024).toFixed(2)} KB</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block">Database Query Traces</span>
                      {activeResponse.sqlQueries && activeResponse.sqlQueries.length > 0 ? (
                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                          {activeResponse.sqlQueries.map((q, idx) => {
                            const isSlow = q.duration > 50;
                            return (
                              <div key={idx} className={`p-3 rounded-lg border text-[10px] space-y-1 font-mono ${
                                isSlow ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900" : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                              }`}>
                                <div className="flex justify-between font-bold text-gray-400 dark:text-slate-500 text-[8px]">
                                  <span>QUERY #{idx + 1}</span>
                                  <span className={isSlow ? "text-red-500 font-extrabold" : "text-blue-500"}>
                                    {q.duration}ms {isSlow ? "(SLOW QUERY)" : ""}
                                  </span>
                                </div>
                                <pre className="text-[10px] text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-tight">{q.query}</pre>
                                {q.params && <p className="text-[8px] text-gray-400">Params: {q.params}</p>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-slate-500 italic bg-gray-50 dark:bg-slate-900 p-4 border dark:border-slate-800 rounded-lg">
                          No query traces captured for this call.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Tab: Validation Assertions */}
                {rightTab === "validation" && (
                  <div className="space-y-4">
                    <div className="space-y-3 border dark:border-slate-800 rounded-xl p-4 bg-gray-50/50 dark:bg-slate-900/20">
                      <h3 className="text-xs font-bold text-gray-800 dark:text-slate-300">Automated Playbook Assertions</h3>
                      
                      <div className="flex items-center justify-between border-b dark:border-slate-850 pb-2 text-xs">
                        <span className="font-semibold text-gray-600 dark:text-slate-400">Status assertion (2xx Response)</span>
                        {activeResponse.validationResults.statusPass ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> PASSED</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 font-bold"><XCircle className="w-4 h-4" /> FAILED</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-b dark:border-slate-850 pb-2 text-xs">
                        <span className="font-semibold text-gray-600 dark:text-slate-400">Response Keys verification</span>
                        {activeResponse.validationResults.requiredFieldsPass ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> PASSED</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 font-bold"><XCircle className="w-4 h-4" /> FAILED</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pb-1 text-xs">
                        <span className="font-semibold text-gray-600 dark:text-slate-400">Schema Types verification</span>
                        {activeResponse.validationResults.schemaPass ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> PASSED</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 font-bold"><XCircle className="w-4 h-4" /> FAILED</span>
                        )}
                      </div>
                    </div>

                    {activeResponse.validationResults.errorMessage && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl space-y-1.5 text-xs text-red-800 dark:text-red-400 font-mono">
                        <span className="font-bold flex items-center gap-1 text-[11px]"><AlertCircle className="w-4 h-4" /> Validation Failures</span>
                        <p className="text-[10px] leading-relaxed">{activeResponse.validationResults.errorMessage}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Tab: Developer Debug logs */}
                {rightTab === "debug" && (
                  <div className="space-y-4 font-mono text-[10px]">
                    {activeResponse.error ? (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-red-800 dark:text-red-400 flex items-center gap-1 font-sans">
                          <AlertCircle className="w-4 h-4" /> Server Exception Stack Trace
                        </span>
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 space-y-2 text-red-800 dark:text-red-400">
                          <p className="font-bold">{activeResponse.error.name}: {activeResponse.error.message}</p>
                          {activeResponse.error.stack && (
                            <pre className="overflow-auto max-h-[180px] whitespace-pre-wrap border-t dark:border-red-900/30 pt-2 leading-tight">
                              {activeResponse.error.stack}
                            </pre>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/55 p-4 rounded-xl text-xs text-green-800 dark:text-green-400 font-sans">
                        <span className="font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> Server Execution Clean</span>
                        <p className="mt-1 text-xxs">Request was processed successfully with zero exceptions or Prisma errors.</p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block font-sans">Prisma SQL Traced Logs</span>
                      {activeResponse.sqlQueries && activeResponse.sqlQueries.length > 0 ? (
                        <pre className="p-3 border dark:border-slate-800 rounded-xl bg-gray-900 text-gray-300 overflow-auto whitespace-pre max-h-[160px]">
                          {activeResponse.sqlQueries.map(s => `${s.query} (Params: ${s.params})`).join("\n\n")}
                        </pre>
                      ) : (
                        <div className="text-xxs italic text-gray-400">No logs traced</div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block font-sans">HTTP Response Headers</span>
                      <pre className="p-3 border dark:border-slate-800 rounded-xl bg-gray-950 text-gray-400 overflow-auto whitespace-pre max-h-[160px]">
                        {JSON.stringify(activeResponse.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 5. Tab: Comparison diff */}
                {rightTab === "compare" && renderJsonDiff()}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 bg-white dark:bg-slate-950">
              <Compass className="w-12 h-12 text-gray-300 dark:text-slate-700 mb-2" />
              <h2 className="text-xs font-bold text-gray-500">No Response Data</h2>
              <p className="text-xxs text-gray-400 mt-1 max-w-[200px] text-center">
                Run an endpoint or playbook test case to generate execution outputs here.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ================= TEST CASE CONFIG MODAL ================= */}
      {isTestCaseModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider">Save Test Case Playbook</span>
              <button onClick={() => setIsTestCaseModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xxs font-bold text-gray-500 uppercase">Test Title</label>
                <input
                  type="text"
                  placeholder="e.g. Create valid Lead"
                  value={testCaseForm.name}
                  onChange={(e) => setTestCaseForm({ ...testCaseForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-gray-500 uppercase">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Assert valid parameters return 201"
                  value={testCaseForm.description}
                  onChange={(e) => setTestCaseForm({ ...testCaseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-gray-500 uppercase">Expected Status Code</label>
                <input
                  type="number"
                  placeholder="e.g. 200 or 201"
                  value={testCaseForm.expectedStatus}
                  onChange={(e) => setTestCaseForm({ ...testCaseForm, expectedStatus: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 mt-4">
                <button
                  onClick={() => setIsTestCaseModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-650 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTestCase}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Save TestCase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= COLLECTION CONFIG MODAL ================= */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider">Create Workflow Suite</span>
              <button onClick={() => setIsCollectionModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xxs font-bold text-gray-500 uppercase">Collection Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Workflow Suite"
                  value={collectionForm.name}
                  onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-gray-500 uppercase">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Pipeline tests"
                  value={collectionForm.description}
                  onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 mt-4">
                <button
                  onClick={() => setIsCollectionModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-650 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!collectionForm.name) return;
                    await saveCollection({
                      id: collectionForm.id,
                      name: collectionForm.name,
                      description: collectionForm.description,
                      testCaseIds: [],
                    });
                    setIsCollectionModalOpen(false);
                    toast.success("Collection created successfully");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
