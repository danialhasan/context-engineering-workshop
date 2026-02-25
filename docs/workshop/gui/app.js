(function () {
  const STORAGE_KEY = "workshop_gui_controls_v1";

  const API_ENDPOINTS = {
    run: ["/api/harness/run"],
  };

  const form = document.getElementById("control-form");
  const statusEl = document.getElementById("request-status");

  const runStatusEl = document.getElementById("run-status");
  const finalResponseEl = document.getElementById("final-response");
  const runRawEl = document.getElementById("run-raw");

  const timelineListEl = document.getElementById("timeline-list");
  const toolEventsListEl = document.getElementById("tool-events-list");
  const memoryListEl = document.getElementById("memory-list");
  const graphNodesListEl = document.getElementById("graph-nodes-list");

  const graphNodeCountEl = document.getElementById("graph-node-count");
  const graphEdgeCountEl = document.getElementById("graph-edge-count");
  const graphUpdatedAtEl = document.getElementById("graph-updated-at");

  const refreshGraphBtn = document.getElementById("refresh-graph");
  const refreshMemoryBtn = document.getElementById("refresh-memory");

  const defaultControls = {
    session: "workshop-demo",
    phase: "PLAN",
    goal: "Call resolve_identity, then summarize result.",
    session_key: "harness-main",
    max_steps: "6",
  };

  function safeText(value) {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value);
  }

  function escapeHTML(value) {
    return safeText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pretty(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return safeText(value);
    }
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object";
  }

  function hasStubNotImplemented(value, depth) {
    if (depth > 5 || value === null || value === undefined) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.some((item) => hasStubNotImplemented(item, depth + 1));
    }
    if (!isObject(value)) {
      return false;
    }

    if (safeText(value.status).toLowerCase() === "stub_not_implemented") {
      return true;
    }

    return Object.keys(value).some((key) => hasStubNotImplemented(value[key], depth + 1));
  }

  function badgeHTML(type, text) {
    return `<span class="badge ${type}">${text}</span>`;
  }

  function clearList(listEl) {
    listEl.innerHTML = "";
  }

  function setEmptyList(listEl, text) {
    clearList(listEl);
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = text;
    listEl.appendChild(item);
  }

  function appendEventItem(listEl, title, meta, body, opts) {
    const options = opts || {};
    const item = document.createElement("li");
    item.className = "event-item";

    const titleEl = document.createElement("strong");
    titleEl.innerHTML = `${escapeHTML(title)}${options.badge || ""}`;

    const metaEl = document.createElement("div");
    metaEl.className = "event-meta";
    metaEl.textContent = meta;

    const bodyEl = document.createElement("div");
    bodyEl.className = "event-body";
    bodyEl.textContent = body;

    item.appendChild(titleEl);
    item.appendChild(metaEl);
    item.appendChild(bodyEl);
    listEl.appendChild(item);
  }

  function nowLabel() {
    return new Date().toLocaleTimeString();
  }

  function setRequestStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.style.color = isError ? "var(--danger)" : "var(--muted)";
  }

  function loadControls() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultControls;
    }
    try {
      const parsed = JSON.parse(raw);
      return { ...defaultControls, ...parsed };
    } catch (error) {
      return defaultControls;
    }
  }

  function saveControls() {
    const controls = getControls();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));
  }

  function applyControls(values) {
    Object.keys(defaultControls).forEach((key) => {
      const input = form.elements.namedItem(key);
      if (!input) {
        return;
      }
      input.value = safeText(values[key] ?? defaultControls[key]);
    });
  }

  function getControls() {
    const data = new FormData(form);
    const maxSteps = Number.parseInt(safeText(data.get("max_steps")), 10);
    return {
      session: safeText(data.get("session")).trim(),
      phase: safeText(data.get("phase")).trim() || "PLAN",
      goal: safeText(data.get("goal")).trim(),
      session_key: safeText(data.get("session_key")).trim() || "harness-main",
      max_steps: Number.isFinite(maxSteps) && maxSteps > 0 ? maxSteps : 6,
    };
  }

  function toQueryString(payload) {
    const params = new URLSearchParams();
    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (value === null || value === undefined || value === "") {
        return;
      }
      params.set(key, safeText(value));
    });
    const query = params.toString();
    return query ? `?${query}` : "";
  }

  async function parseResponseBody(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      return { text };
    }
  }

  async function requestApi(kind, payload, options) {
    const requestOptions = options || {};
    const methods = requestOptions.methods || ["GET", "POST"];
    const endpoints = API_ENDPOINTS[kind] || [];

    let lastError = null;

    for (let i = 0; i < endpoints.length; i += 1) {
      const endpoint = endpoints[i];

      for (let j = 0; j < methods.length; j += 1) {
        const method = methods[j];
        const url = method === "GET" ? `${endpoint}${toQueryString(payload)}` : endpoint;

        const fetchOptions = {
          method,
          headers: {
            Accept: "application/json",
          },
        };

        if (method === "POST") {
          fetchOptions.headers["Content-Type"] = "application/json";
          fetchOptions.body = JSON.stringify(payload);
        }

        try {
          const response = await fetch(url, fetchOptions);
          const body = await parseResponseBody(response);

          if (response.ok) {
            return { data: body, endpoint: url, method };
          }

          const errMessage = body && body.error ? safeText(body.error) : safeText(response.statusText);
          const err = new Error(`${method} ${url} failed: ${response.status} ${errMessage}`);
          err.status = response.status;
          lastError = err;

          if (response.status === 404) {
            continue;
          }

          throw err;
        } catch (error) {
          lastError = error;
        }
      }
    }

    throw lastError || new Error(`No API endpoints available for ${kind}`);
  }

  function renderRunPanel(runData) {
    const ok = Boolean(runData && runData.ok);
    const steps = runData ? runData.steps_executed : "-";
    const runId = runData ? safeText(runData.run_id || runData.session || "") : "";

    let badge = "";
    if (ok) {
      badge = badgeHTML("ok", "ok");
    } else if (runData) {
      badge = badgeHTML("error", "error");
    }
    if (hasStubNotImplemented(runData, 0)) {
      badge += badgeHTML("stub", "stub_not_implemented");
    }

    runStatusEl.innerHTML = `${escapeHTML(ok ? "Completed" : "Needs attention")} (steps: ${escapeHTML(steps)}) ${badge}`;

    const finalResponse =
      runData && (runData.final_response || runData.response || runData.output || runData.error || "");
    finalResponseEl.textContent = safeText(finalResponse || "No final response.");
    runRawEl.textContent = pretty(runData || {});

    if (runId) {
      setRequestStatus(`Run updated at ${nowLabel()} for session ${runId}.`, false);
    }
  }

  function renderTimeline(runData) {
    const turns = asArray(runData && runData.turns);
    if (!turns.length) {
      setEmptyList(timelineListEl, "No timeline turns found in run payload.");
      return;
    }

    clearList(timelineListEl);
    turns.forEach((turn, idx) => {
      const step = safeText(turn.step || idx + 1);
      const action = isObject(turn.action) ? safeText(turn.action.action || "unknown") : "unknown";
      const reason = isObject(turn.action) ? safeText(turn.action.reason || "") : "";
      const model = safeText(turn.model_id || "-");
      const history = safeText(turn.history_turns_used || "-");

      const toolEvent = isObject(turn.tool_event) ? turn.tool_event : null;
      const toolLabel = toolEvent ? ` | tool: ${safeText(toolEvent.tool_name || "unknown")}` : "";
      const bodyText = reason || pretty(turn.action || turn);

      let badge = "";
      if (toolEvent && hasStubNotImplemented(toolEvent, 0)) {
        badge += badgeHTML("stub", "stub_not_implemented");
      }

      appendEventItem(
        timelineListEl,
        `Step ${step} | action: ${action}${toolLabel}`,
        `model: ${model} | history_turns_used: ${history}`,
        bodyText,
        { badge }
      );
    });
  }

  function renderToolEvents(runData) {
    const events = asArray(runData && runData.tool_events);
    if (!events.length) {
      setEmptyList(toolEventsListEl, "No tool events found.");
      return;
    }

    clearList(toolEventsListEl);
    events.forEach((event, idx) => {
      const toolName = safeText(event.tool_name || `event_${idx + 1}`);
      const ok = event.ok === true;
      const badge = hasStubNotImplemented(event, 0)
        ? badgeHTML("stub", "stub_not_implemented")
        : ok
          ? badgeHTML("ok", "ok")
          : badgeHTML("error", "error");

      const statusBits = [];
      statusBits.push(`ok: ${safeText(event.ok)}`);
      if (event.error) {
        statusBits.push(`error: ${safeText(event.error)}`);
      }
      if (event.output && event.output.status) {
        statusBits.push(`output.status: ${safeText(event.output.status)}`);
      }

      const bodyValue = event.output || event.input || event;
      appendEventItem(toolEventsListEl, toolName, statusBits.join(" | "), pretty(bodyValue), { badge });
    });
  }

  function pickMemoryNodes(memoryData) {
    if (!memoryData) {
      return [];
    }

    const candidates = [
      memoryData.memory_turns,
      memoryData.turns,
      memoryData.nodes,
      memoryData.items,
      memoryData.results,
    ];

    for (let i = 0; i < candidates.length; i += 1) {
      if (Array.isArray(candidates[i])) {
        const list = candidates[i];
        const decisionOnly = list.filter((item) => {
          const typeText = safeText(
            (item && (item.type || item.node_type || item.kind || item.label || item.category)) || ""
          ).toLowerCase();
          return typeText.includes("decision");
        });
        return decisionOnly.length ? decisionOnly : list;
      }
    }

    return [];
  }

  function renderMemory(memoryData) {
    const nodes = pickMemoryNodes(memoryData);
    if (!nodes.length) {
      setEmptyList(memoryListEl, "No session memory turns returned.");
      return;
    }

    clearList(memoryListEl);
    nodes.forEach((node, idx) => {
      const index = safeText(node.turn_index || node.turn || node.step || idx + 1);
      const type = safeText(node.type || node.node_type || node.kind || "Decision");
      const summary =
        safeText(node.summary || node.text || node.content || node.description || node.value || "") ||
        pretty(node);

      const badge = hasStubNotImplemented(node, 0)
        ? badgeHTML("stub", "stub_not_implemented")
        : "";

      appendEventItem(memoryListEl, `Turn ${index} | ${type}`, "session memory", summary, { badge });
    });
  }

  function pickGraph(graphData) {
    if (!graphData || !isObject(graphData)) {
      return {};
    }

    if (isObject(graphData.snapshot)) {
      return graphData.snapshot;
    }
    if (isObject(graphData.graph)) {
      return graphData.graph;
    }
    return graphData;
  }

  function renderGraph(graphData) {
    const graph = pickGraph(graphData);

    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const edges = Array.isArray(graph.edges) ? graph.edges : [];

    const nodeCount =
      graph.node_count || graph.nodes_count || graph.nodeCount || (nodes.length ? nodes.length : "-");
    const edgeCount =
      graph.edge_count || graph.edges_count || graph.edgeCount || (edges.length ? edges.length : "-");

    graphNodeCountEl.textContent = safeText(nodeCount);
    graphEdgeCountEl.textContent = safeText(edgeCount);

    const updatedAt = safeText(graph.updated_at || graph.updatedAt || graph.ts || nowLabel());
    graphUpdatedAtEl.textContent = updatedAt;

    const recentNodes =
      asArray(graph.recent_nodes).length > 0
        ? asArray(graph.recent_nodes)
        : nodes.slice(Math.max(0, nodes.length - 8));

    if (!recentNodes.length) {
      setEmptyList(graphNodesListEl, "No recent nodes returned.");
      return;
    }

    clearList(graphNodesListEl);
    recentNodes.forEach((node, idx) => {
      const nodeId = safeText((node && (node.node_id || node.id || node.pk || node.sk)) || `node_${idx + 1}`);
      const nodeType = safeText((node && (node.type || node.node_type || node.kind || "node")) || "node");
      const summary = safeText((node && (node.summary || node.title || node.text || node.content)) || "");

      const badge = hasStubNotImplemented(node, 0)
        ? badgeHTML("stub", "stub_not_implemented")
        : "";

      appendEventItem(
        graphNodesListEl,
        `${nodeId} | ${nodeType}`,
        "graph node",
        summary || pretty(node),
        { badge }
      );
    });
  }

  function payloadFromControls(controls) {
    return {
      session: controls.session,
      run_id: controls.session,
      phase: controls.phase,
      goal: controls.goal,
      session_key: controls.session_key,
      max_steps: controls.max_steps,
    };
  }

  async function runHarness() {
    const controls = getControls();
    saveControls();

    if (!controls.session || !controls.goal) {
      setRequestStatus("Session and goal are required.", true);
      return;
    }

    const payload = payloadFromControls(controls);
    setRequestStatus("Running harness...", false);

    try {
      const result = await requestApi("run", payload, { methods: ["POST"] });
      renderRunPanel(result.data || {});
      renderTimeline(result.data || {});
      renderToolEvents(result.data || {});
      setRequestStatus(`Run loaded via ${result.method} ${result.endpoint}`, false);
      await refreshGraph();
      await refreshMemory();
    } catch (error) {
      setRequestStatus(`Run request failed: ${safeText(error.message || error)}`, true);
      runStatusEl.innerHTML = `Run failed ${badgeHTML("error", "error")}`;
    }
  }

  async function refreshGraph() {
    const controls = getControls();
    saveControls();
    const sessionId = encodeURIComponent(controls.session);
    const query = toQueryString({ limit: 200 });
    const endpoint = `/api/session/${sessionId}/graph${query}`;

    setRequestStatus("Refreshing graph...", false);
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const body = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(`GET ${endpoint} failed: ${response.status} ${pretty(body)}`);
      }
      renderGraph(body || {});
      setRequestStatus(`Graph loaded via GET ${endpoint}`, false);
    } catch (error) {
      setRequestStatus(`Graph request failed: ${safeText(error.message || error)}`, true);
    }
  }

  async function refreshMemory() {
    const controls = getControls();
    saveControls();
    const sessionId = encodeURIComponent(controls.session);
    const query = toQueryString({ session_key: controls.session_key });
    const endpoint = `/api/session/${sessionId}/memory${query}`;

    setRequestStatus("Refreshing memory...", false);
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const body = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(`GET ${endpoint} failed: ${response.status} ${pretty(body)}`);
      }
      renderMemory(body || {});
      setRequestStatus(`Memory loaded via GET ${endpoint}`, false);
    } catch (error) {
      setRequestStatus(`Memory request failed: ${safeText(error.message || error)}`, true);
    }
  }

  function bindEvents() {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      runHarness();
    });

    refreshGraphBtn.addEventListener("click", function () {
      refreshGraph();
    });

    refreshMemoryBtn.addEventListener("click", function () {
      refreshMemory();
    });

    form.addEventListener("input", function () {
      saveControls();
    });
  }

  function init() {
    applyControls(loadControls());
    bindEvents();
    setRequestStatus("Ready. Fill controls and run harness.", false);
  }

  init();
})();
