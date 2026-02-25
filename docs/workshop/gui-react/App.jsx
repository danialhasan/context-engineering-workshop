import React, { useEffect, useMemo, useState } from "react";
import { defineCatalog } from "@json-render/core";
import { ActionProvider, Renderer, StateProvider, VisibilityProvider, defineRegistry } from "@json-render/react";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

const STORAGE_KEY = "workshop_gui_controls_v2";
const ROUTES = {
  HARNESS: "/",
  REGISTRY: "/component-registry",
  CHAT: "/chat",
};

const defaultControls = {
  session: "workshop-demo",
  phase: "PLAN",
  goal: "Call resolve_identity, then summarize result.",
  session_key: "harness-main",
  max_steps: 6,
};

const COMPONENT_DESCRIPTIONS = {
  Stack: "Vertical stack container",
  DashboardGrid: "Two-column dashboard grid",
  Panel: "Card panel with title/subtitle and optional span",
  RunSummary: "Status and final response summary block",
  EventList: "List renderer for timeline, tools, memory, and registry entries",
  GraphStats: "Graph count and freshness stats",
  GraphView: "SVG graph renderer for nodes and edges",
  JsonBlock: "Raw payload inspector",
};

function safeText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pretty(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return safeText(value);
  }
}

function formatTimestamp(value) {
  const text = safeText(value).trim();
  if (!text) {
    return "-";
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }
  return parsed.toLocaleString();
}

function normalizeRoute(pathname) {
  if (pathname === ROUTES.REGISTRY) {
    return ROUTES.REGISTRY;
  }
  if (pathname === ROUTES.CHAT) {
    return ROUTES.CHAT;
  }
  return ROUTES.HARNESS;
}

function currentPathname() {
  if (typeof window === "undefined") {
    return ROUTES.HARNESS;
  }
  return window.location.pathname || ROUTES.HARNESS;
}

function loadControls() {
  let storage = null;
  try {
    storage = window.localStorage;
  } catch (_error) {
    return { ...defaultControls };
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultControls };
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultControls,
      ...parsed,
      max_steps: Number.isFinite(Number(parsed.max_steps)) ? Number(parsed.max_steps) : defaultControls.max_steps,
    };
  } catch (_error) {
    return { ...defaultControls };
  }
}

function saveControls(nextControls) {
  let storage = null;
  try {
    storage = window.localStorage;
  } catch (_error) {
    return;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(nextControls));
  } catch (_error) {
    // localStorage may be unavailable in some browser modes.
  }
}

function pickGraph(graphData) {
  if (!isObject(graphData)) {
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

function pickMemoryNodes(memoryData) {
  if (!isObject(memoryData)) {
    return [];
  }
  const candidates = [memoryData.memory_turns, memoryData.turns, memoryData.nodes, memoryData.items, memoryData.results];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }
    const decisionOnly = candidate.filter((item) =>
      safeText(item?.type || item?.node_type || item?.kind).toLowerCase().includes("decision")
    );
    return decisionOnly.length > 0 ? decisionOnly : candidate;
  }
  return [];
}

function nodeId(node, index) {
  const id = node?.node_id || node?.id || node?.pk || node?.sk;
  return safeText(id || `node_${index + 1}`);
}

function nodeType(node) {
  return safeText(node?.type || node?.node_type || node?.kind || "node") || "node";
}

function summarizeNode(node) {
  return (
    safeText(node?.summary || node?.title || node?.text || node?.content || node?.data?.summary || "") ||
    pretty(node)
  );
}

function buildTimelineItems(runData) {
  return asArray(runData?.turns).map((turn, idx) => {
    const toolName = safeText(turn?.tool_event?.tool_name);
    const action = safeText(turn?.action?.action || "unknown");
    const step = safeText(turn?.step || idx + 1);
    const reason = safeText(turn?.action?.reason || "") || pretty(turn?.action || turn);
    const meta = [
      `model: ${safeText(turn?.model_id || "-")}`,
      `history_turns_used: ${safeText(turn?.history_turns_used || "-")}`,
    ].join(" | ");
    return {
      title: `Step ${step} | action: ${action}${toolName ? ` | tool: ${toolName}` : ""}`,
      meta,
      body: reason,
      tone: "default",
    };
  });
}

function buildToolItems(runData) {
  return asArray(runData?.tool_events).map((event, idx) => {
    const statusBits = [`ok: ${safeText(event?.ok)}`];
    if (event?.error) {
      statusBits.push(`error: ${safeText(event.error)}`);
    }
    if (event?.output?.status) {
      statusBits.push(`output.status: ${safeText(event.output.status)}`);
    }
    const body = pretty(event?.output || event?.input || event);
    return {
      title: safeText(event?.tool_name || `event_${idx + 1}`),
      meta: statusBits.join(" | "),
      body,
      tone: event?.ok === true ? "ok" : "error",
    };
  });
}

function buildMemoryItems(memoryData) {
  return pickMemoryNodes(memoryData).map((node, idx) => {
    const idxText = safeText(node?.turn_index || node?.turn || node?.step || idx + 1);
    return {
      title: `Turn ${idxText} | ${safeText(node?.type || node?.node_type || node?.kind || "Decision")}`,
      meta: "session memory",
      body: summarizeNode(node),
      tone: "default",
    };
  });
}

function buildRecentNodeItems(graphData) {
  const graph = pickGraph(graphData);
  const nodes = asArray(graph?.nodes);
  const recentNodes = nodes.slice(Math.max(0, nodes.length - 8));
  return recentNodes.map((node, idx) => ({
    title: `${nodeId(node, idx)} | ${nodeType(node)}`,
    meta: "graph node",
    body: summarizeNode(node),
    tone: "default",
  }));
}

function computeGraphLayout(nodes, width, height) {
  const safeNodes = nodes.slice(0, 48);
  const count = Math.max(safeNodes.length, 1);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(130, Math.min(width, height) / 2 - 72);

  const positioned = safeNodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const byId = new Map();
  positioned.forEach((node) => {
    byId.set(node.id, node);
  });

  return { positioned, byId };
}

const catalog = defineCatalog(schema, {
  components: {
    Stack: {
      props: z.object({}),
      description: "Vertical stack container",
    },
    DashboardGrid: {
      props: z.object({}),
      description: "Two-column dashboard grid",
    },
    Panel: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().nullable(),
        span: z.enum(["1", "2"]).nullable(),
      }),
      description: "Card panel with heading",
    },
    RunSummary: {
      props: z.object({
        status: z.string(),
        steps: z.string(),
        requestStatus: z.string(),
        finalResponse: z.string(),
      }),
      description: "Summary block for run status",
    },
    EventList: {
      props: z.object({
        emptyLabel: z.string(),
        items: z.array(
          z.object({
            title: z.string(),
            meta: z.string(),
            body: z.string(),
            tone: z.enum(["default", "ok", "error"]).nullable(),
          })
        ),
      }),
      description: "List of events with metadata and body",
    },
    GraphStats: {
      props: z.object({
        nodeCount: z.string(),
        edgeCount: z.string(),
        updatedAt: z.string(),
      }),
      description: "Graph counters",
    },
    GraphView: {
      props: z.object({
        nodes: z.array(z.record(z.string(), z.unknown())),
        edges: z.array(z.record(z.string(), z.unknown())),
      }),
      description: "SVG graph renderer",
    },
    JsonBlock: {
      props: z.object({
        label: z.string(),
        value: z.unknown(),
      }),
      description: "Preformatted JSON",
    },
  },
  actions: {},
});

const { registry } = defineRegistry(catalog, {
  components: {
    Stack: ({ children }) => <div className="jr-stack">{children}</div>,
    DashboardGrid: ({ children }) => <div className="jr-dashboard-grid">{children}</div>,
    Panel: ({ props, children }) => (
      <article className={`jr-panel ${props.span === "2" ? "span-2" : ""}`}>
        <h2>{props.title}</h2>
        {props.subtitle ? <p className="jr-subtitle">{props.subtitle}</p> : null}
        {children}
      </article>
    ),
    RunSummary: ({ props }) => (
      <div className="jr-run-summary">
        <div className="jr-meta-row">
          <span className="jr-meta-label">Status:</span>
          <strong>{props.status} (steps: {props.steps})</strong>
        </div>
        <div className="jr-meta-row">
          <span className="jr-meta-label">Request:</span>
          <span>{props.requestStatus || "-"}</span>
        </div>
        <div className="jr-meta-row">
          <span className="jr-meta-label">Final response:</span>
        </div>
        <pre className="jr-pre">{props.finalResponse || "No final response yet."}</pre>
      </div>
    ),
    EventList: ({ props }) => {
      if (!props.items.length) {
        return <p className="jr-empty">{props.emptyLabel}</p>;
      }
      return (
        <ul className="jr-event-list">
          {props.items.map((item, idx) => (
            <li key={`${item.title}-${idx}`} className={`jr-event-item tone-${item.tone || "default"}`}>
              <strong>{item.title}</strong>
              <div className="jr-event-meta">{item.meta}</div>
              <div className="jr-event-body">{item.body}</div>
            </li>
          ))}
        </ul>
      );
    },
    GraphStats: ({ props }) => (
      <div className="jr-stats-row">
        <div className="jr-stat-item">
          <span>Node Count</span>
          <strong>{props.nodeCount}</strong>
        </div>
        <div className="jr-stat-item">
          <span>Edge Count</span>
          <strong>{props.edgeCount}</strong>
        </div>
        <div className="jr-stat-item">
          <span>Updated</span>
          <strong>{props.updatedAt}</strong>
        </div>
      </div>
    ),
    GraphView: ({ props }) => {
      const width = 1180;
      const height = 440;
      const nodes = props.nodes
        .map((node, index) => ({
          id: nodeId(node, index),
          type: nodeType(node),
          raw: node,
        }))
        .filter((node) => node.id);
      const edges = props.edges
        .map((edge, index) => ({
          id: safeText(edge?.edge_id || `edge_${index + 1}`),
          from: safeText(edge?.from_id || ""),
          to: safeText(edge?.to_id || ""),
          label: safeText(edge?.edge_type || ""),
        }))
        .filter((edge) => edge.from && edge.to);

      if (!nodes.length) {
        return <p className="jr-empty">No graph nodes to render yet.</p>;
      }

      const { positioned, byId } = computeGraphLayout(nodes, width, height);
      const visibleEdges = edges.filter((edge) => byId.has(edge.from) && byId.has(edge.to)).slice(0, 96);

      return (
        <div className="jr-graph-wrap">
          <svg className="jr-graph-canvas" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Session graph">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#839cc1" />
              </marker>
            </defs>
            {visibleEdges.map((edge) => {
              const from = byId.get(edge.from);
              const to = byId.get(edge.to);
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              return (
                <g key={edge.id}>
                  <line
                    className="jr-graph-edge"
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    markerEnd="url(#arrowhead)"
                  />
                  {edge.label ? (
                    <text className="jr-graph-edge-label" x={midX} y={midY - 3} textAnchor="middle">
                      {edge.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {positioned.map((node) => (
              <g key={node.id} className="jr-graph-node" transform={`translate(${node.x}, ${node.y})`}>
                <circle r="22" className={`jr-node-dot type-${safeText(node.type).toLowerCase()}`} />
                <text className="jr-node-title" y="-30" textAnchor="middle">
                  {node.type}
                </text>
                <text className="jr-node-subtitle" y="42" textAnchor="middle">
                  {node.id.length > 26 ? `${node.id.slice(0, 23)}...` : node.id}
                </text>
              </g>
            ))}
          </svg>
          <p className="jr-hint">
            Rendering {positioned.length} nodes and {visibleEdges.length} edges (trimmed for readability).
          </p>
        </div>
      );
    },
    JsonBlock: ({ props }) => (
      <details className="jr-json-block">
        <summary>{props.label}</summary>
        <pre className="jr-pre">{pretty(props.value)}</pre>
      </details>
    ),
  },
});

function buildDashboardSpec({ runData, graphData, memoryData, requestStatus }) {
  const graph = pickGraph(graphData);
  const nodes = asArray(graph.nodes);
  const edges = asArray(graph.edges);
  const runStatus = runData ? (runData.ok ? "Completed" : "Needs attention") : "No run yet";
  const steps = runData && runData.steps_executed !== undefined ? safeText(runData.steps_executed) : "-";
  const finalResponse = safeText(runData?.final_response || runData?.response || runData?.output || runData?.error || "");

  const timelineItems = buildTimelineItems(runData);
  const toolItems = buildToolItems(runData);
  const memoryItems = buildMemoryItems(memoryData);
  const recentNodeItems = buildRecentNodeItems(graphData);

  const nodeCount = safeText(graph?.counts?.nodes ?? graph?.node_count ?? graph?.nodes_count ?? nodes.length ?? "-");
  const edgeCount = safeText(graph?.counts?.edges ?? graph?.edge_count ?? graph?.edges_count ?? edges.length ?? "-");
  const updatedAt = safeText(graph?.updated_at || graph?.updatedAt || graph?.ts || new Date().toLocaleTimeString());

  return {
    root: "root",
    elements: {
      root: {
        type: "Stack",
        props: {},
        children: ["grid"],
      },
      grid: {
        type: "DashboardGrid",
        props: {},
        children: ["runPanel", "timelinePanel", "toolsPanel", "memoryPanel", "graphPanel"],
      },
      runPanel: {
        type: "Panel",
        props: { title: "Run Status + Final Response", subtitle: null, span: "1" },
        children: ["runSummary", "runRaw"],
      },
      runSummary: {
        type: "RunSummary",
        props: {
          status: runStatus,
          steps,
          requestStatus: requestStatus || "-",
          finalResponse,
        },
      },
      runRaw: {
        type: "JsonBlock",
        props: {
          label: "Raw run payload",
          value: runData || {},
        },
      },
      timelinePanel: {
        type: "Panel",
        props: { title: "Timeline (Turns / Actions / Tool Calls)", subtitle: null, span: "1" },
        children: ["timelineList"],
      },
      timelineList: {
        type: "EventList",
        props: {
          emptyLabel: "No timeline turns found in run payload.",
          items: timelineItems,
        },
      },
      toolsPanel: {
        type: "Panel",
        props: { title: "Tool Events", subtitle: null, span: "1" },
        children: ["toolsList"],
      },
      toolsList: {
        type: "EventList",
        props: {
          emptyLabel: "No tool events found.",
          items: toolItems,
        },
      },
      memoryPanel: {
        type: "Panel",
        props: { title: "Session Memory Turns (Decision Nodes)", subtitle: null, span: "1" },
        children: ["memoryList"],
      },
      memoryList: {
        type: "EventList",
        props: {
          emptyLabel: "No session memory turns returned.",
          items: memoryItems,
        },
      },
      graphPanel: {
        type: "Panel",
        props: { title: "Graph Snapshot", subtitle: null, span: "2" },
        children: ["graphStats", "graphView", "graphRecent", "graphRaw"],
      },
      graphStats: {
        type: "GraphStats",
        props: { nodeCount, edgeCount, updatedAt },
      },
      graphView: {
        type: "GraphView",
        props: { nodes, edges },
      },
      graphRecent: {
        type: "EventList",
        props: {
          emptyLabel: "No recent nodes yet.",
          items: recentNodeItems,
        },
      },
      graphRaw: {
        type: "JsonBlock",
        props: {
          label: "Raw graph payload",
          value: graphData || {},
        },
      },
    },
  };
}

function buildComponentRegistrySpec() {
  const catalogItems = Object.entries(COMPONENT_DESCRIPTIONS).map(([name, description]) => ({
    title: name,
    meta: "catalog component",
    body: description,
    tone: "default",
  }));

  const demoEvents = [
    {
      title: "resolve_identity",
      meta: "ok: true | output.status: success",
      body: "Resolved caller identity and returned account metadata.",
      tone: "ok",
    },
    {
      title: "external.crm_lookup",
      meta: "ok: false | output.status: stub_not_implemented",
      body: "Deliberate stub to show placeholder behavior before external connectors land.",
      tone: "error",
    },
  ];

  const demoNodes = [
    { node_id: "task-demo-1", type: "Task", data: { title: "Investigate auth bug", status: "in_progress" } },
    { node_id: "call-demo-1", type: "SkillCall", data: { skill_name: "resolve_identity", status: "success" } },
    { node_id: "receipt-demo-1", type: "Receipt", data: { summary: "Skill completed", checksum: "abc123" } },
    { node_id: "decision-demo-1", type: "Decision", data: { summary: "Proceed to verification" } },
    { node_id: "session-demo-1", type: "Session", data: { phase: "PLAN" } },
  ];

  const demoEdges = [
    { edge_id: "edge-1", from_id: "call-demo-1", to_id: "task-demo-1", edge_type: "performed_by" },
    { edge_id: "edge-2", from_id: "call-demo-1", to_id: "receipt-demo-1", edge_type: "produces" },
    { edge_id: "edge-3", from_id: "decision-demo-1", to_id: "task-demo-1", edge_type: "references" },
    { edge_id: "edge-4", from_id: "call-demo-1", to_id: "session-demo-1", edge_type: "performed_by" },
  ];

  return {
    root: "root",
    elements: {
      root: {
        type: "Stack",
        props: {},
        children: ["grid"],
      },
      grid: {
        type: "DashboardGrid",
        props: {},
        children: [
          "overviewPanel",
          "runSummaryPanel",
          "eventListPanel",
          "graphStatsPanel",
          "graphViewPanel",
          "jsonPanel",
          "stackPanel",
        ],
      },
      overviewPanel: {
        type: "Panel",
        props: { title: "Component Registry", subtitle: "All catalog components hydrated with demo data", span: "2" },
        children: ["overviewList", "overviewRaw"],
      },
      overviewList: {
        type: "EventList",
        props: {
          emptyLabel: "No catalog components configured.",
          items: catalogItems,
        },
      },
      overviewRaw: {
        type: "JsonBlock",
        props: {
          label: "Catalog component map",
          value: COMPONENT_DESCRIPTIONS,
        },
      },
      runSummaryPanel: {
        type: "Panel",
        props: { title: "RunSummary component", subtitle: null, span: "1" },
        children: ["runSummaryDemo"],
      },
      runSummaryDemo: {
        type: "RunSummary",
        props: {
          status: "Completed",
          steps: "3",
          requestStatus: "Demo request completed",
          finalResponse: "This is sample output that demonstrates the RunSummary component in isolation.",
        },
      },
      eventListPanel: {
        type: "Panel",
        props: { title: "EventList component", subtitle: null, span: "1" },
        children: ["eventListDemo"],
      },
      eventListDemo: {
        type: "EventList",
        props: {
          emptyLabel: "No demo events.",
          items: demoEvents,
        },
      },
      graphStatsPanel: {
        type: "Panel",
        props: { title: "GraphStats component", subtitle: null, span: "1" },
        children: ["graphStatsDemo"],
      },
      graphStatsDemo: {
        type: "GraphStats",
        props: {
          nodeCount: safeText(demoNodes.length),
          edgeCount: safeText(demoEdges.length),
          updatedAt: new Date().toLocaleTimeString(),
        },
      },
      graphViewPanel: {
        type: "Panel",
        props: { title: "GraphView component", subtitle: null, span: "1" },
        children: ["graphViewDemo"],
      },
      graphViewDemo: {
        type: "GraphView",
        props: {
          nodes: demoNodes,
          edges: demoEdges,
        },
      },
      jsonPanel: {
        type: "Panel",
        props: { title: "JsonBlock component", subtitle: null, span: "1" },
        children: ["jsonDemo"],
      },
      jsonDemo: {
        type: "JsonBlock",
        props: {
          label: "Demo payload",
          value: {
            route: ROUTES.REGISTRY,
            purpose: "Showcase json-render registry components",
            sample: { phase: "PLAN", run_id: "demo-run" },
          },
        },
      },
      stackPanel: {
        type: "Panel",
        props: { title: "Stack component", subtitle: "Nested stack demo", span: "1" },
        children: ["stackDemo"],
      },
      stackDemo: {
        type: "Stack",
        props: {},
        children: ["stackBlock1", "stackBlock2"],
      },
      stackBlock1: {
        type: "JsonBlock",
        props: {
          label: "Stack child A",
          value: { component: "Stack", index: 1, state: "demo" },
        },
      },
      stackBlock2: {
        type: "EventList",
        props: {
          emptyLabel: "No items.",
          items: [
            {
              title: "Stack child B",
              meta: "component: EventList",
              body: "This item proves nested composition through Stack.",
              tone: "default",
            },
          ],
        },
      },
    },
  };
}

function normalizeChatUiPayload(uiPayload, fallbackReason) {
  if (!isObject(uiPayload)) {
    return {
      mode: "none",
      reason: fallbackReason || "No UI payload returned.",
      spec: null,
    };
  }

  const mode = safeText(uiPayload.mode).toLowerCase() === "spec" && isObject(uiPayload.spec) ? "spec" : "none";
  const reason = safeText(uiPayload.reason) || fallbackReason || "No UI reason provided.";
  return {
    mode,
    reason,
    spec: mode === "spec" ? uiPayload.spec : null,
  };
}

function normalizeChatThread(threadPayload) {
  if (!isObject(threadPayload)) {
    return null;
  }
  const sessionKey = safeText(threadPayload.session_key).trim();
  if (!sessionKey) {
    return null;
  }
  const turnCount = Number.isFinite(Number(threadPayload.turn_count)) ? Number(threadPayload.turn_count) : 0;
  return {
    session_key: sessionKey,
    title: safeText(threadPayload.title).trim() || `Conversation ${sessionKey}`,
    preview: safeText(threadPayload.preview).trim(),
    turn_count: turnCount,
    last_turn_at: safeText(threadPayload.last_turn_at).trim(),
  };
}

function normalizeChatTurns(turnsPayload) {
  const turns = [];
  for (const turn of asArray(turnsPayload)) {
    if (!isObject(turn)) {
      continue;
    }
    const nodeId = safeText(turn.node_id).trim();
    const turnIndex = safeText(turn.turn_index).trim();
    const userText = safeText(turn.user_message).trim();
    const assistantText = safeText(turn.assistant_text).trim();
    const ui = normalizeChatUiPayload(turn.ui, turn.ui_rejection_reason);
    const meta = {
      model_id: safeText(turn.model_id),
      turn_index: turnIndex,
      ui_parse_ok: Boolean(turn.ui_parse_ok),
      ui_validate_ok: Boolean(turn.ui_validate_ok),
      ui_rendered: Boolean(turn.ui_rendered),
      ui_rejection_reason: safeText(turn.ui_rejection_reason),
      history_turns_used: safeText(turn.history_turns_used),
    };
    const suffix = nodeId || `turn-${turnIndex || turns.length + 1}`;
    if (userText) {
      turns.push({
        id: `user-${suffix}`,
        role: "user",
        text: userText,
      });
    }
    turns.push({
      id: `assistant-${suffix}`,
      role: "assistant",
      text: assistantText || "(empty assistant text)",
      ui,
      meta,
    });
  }
  return turns;
}

async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { text };
  }
}

async function requestJson(endpoint, options) {
  const response = await fetch(endpoint, options);
  const body = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(`${options?.method || "GET"} ${endpoint} failed: ${response.status} ${pretty(body)}`);
  }
  return body;
}

function JsonRenderSurface({ spec }) {
  return (
    <StateProvider initialState={isObject(spec?.state) ? spec.state : {}}>
      <VisibilityProvider>
        <ActionProvider handlers={{}}>
          <Renderer spec={spec} registry={registry} />
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => normalizeRoute(currentPathname()));
  const [controls, setControls] = useState(() => loadControls());

  const [requestStatus, setRequestStatus] = useState("Ready. Fill controls and run harness.");
  const [requestError, setRequestError] = useState(false);
  const [runData, setRunData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [memoryData, setMemoryData] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState("Chat ready.");
  const [chatError, setChatError] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatThreads, setChatThreads] = useState([]);
  const [chatThreadsLoading, setChatThreadsLoading] = useState(false);
  const [chatHydrating, setChatHydrating] = useState(false);

  const dashboardSpec = useMemo(
    () => buildDashboardSpec({ runData, graphData, memoryData, requestStatus }),
    [runData, graphData, memoryData, requestStatus]
  );
  const componentRegistrySpec = useMemo(() => buildComponentRegistrySpec(), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const onPopState = () => {
      setRoute(normalizeRoute(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (route !== ROUTES.CHAT) {
      return undefined;
    }
    const activeControls = normalizedChatControls();
    if (!activeControls.session) {
      setChatThreads([]);
      setChatMessages([]);
      return undefined;
    }

    let cancelled = false;
    const sync = async () => {
      try {
        const threads = await refreshChatThreads(activeControls, { silent: true });
        if (cancelled) {
          return;
        }
        const hasSelectedThread = threads.some((thread) => thread.session_key === activeControls.session_key);
        const preferredKey = hasSelectedThread
          ? activeControls.session_key
          : safeText(threads[0]?.session_key).trim() || activeControls.session_key;
        if (preferredKey !== activeControls.session_key) {
          const nextControls = { ...controls, session_key: preferredKey };
          saveControls(nextControls);
          setControls(nextControls);
          return;
        }
        await hydrateChatHistory({ ...activeControls, session_key: preferredKey }, { silent: true });
      } catch (error) {
        if (!cancelled) {
          setChatStatus(`Conversation sync failed: ${safeText(error?.message || error)}`);
          setChatError(true);
        }
      }
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [route, controls.session, controls.session_key]);

  function navigateTo(path) {
    const normalized = normalizeRoute(path);
    if (typeof window !== "undefined" && window.location.pathname !== normalized) {
      window.history.pushState({}, "", normalized);
    }
    setRoute(normalized);
  }

  function updateControl(name, value) {
    const next = {
      ...controls,
      [name]: name === "max_steps" ? Number(value) : value,
    };
    setControls(next);
    saveControls(next);
  }

  async function refreshGraph(activeControls) {
    const sessionId = encodeURIComponent(activeControls.session.trim());
    const endpoint = `/api/session/${sessionId}/graph?limit=200`;
    setRequestError(false);
    setRequestStatus("Refreshing graph...");
    const body = await requestJson(endpoint, { method: "GET", headers: { Accept: "application/json" } });
    setGraphData(body || {});
    setRequestStatus(`Graph loaded via GET ${endpoint}`);
  }

  async function refreshMemory(activeControls) {
    const sessionId = encodeURIComponent(activeControls.session.trim());
    const sessionKey = encodeURIComponent(activeControls.session_key.trim() || "harness-main");
    const endpoint = `/api/session/${sessionId}/memory?session_key=${sessionKey}`;
    setRequestError(false);
    setRequestStatus("Refreshing memory...");
    const body = await requestJson(endpoint, { method: "GET", headers: { Accept: "application/json" } });
    setMemoryData(body || {});
    setRequestStatus(`Memory loaded via GET ${endpoint}`);
  }

  async function runHarness(event) {
    event.preventDefault();
    const activeControls = {
      ...controls,
      session: safeText(controls.session).trim(),
      goal: safeText(controls.goal).trim(),
      session_key: safeText(controls.session_key).trim() || "harness-main",
      phase: safeText(controls.phase).trim() || "PLAN",
      max_steps: Number.isFinite(Number(controls.max_steps)) && Number(controls.max_steps) > 0 ? Number(controls.max_steps) : 6,
    };

    if (!activeControls.session || !activeControls.goal) {
      setRequestError(true);
      setRequestStatus("Session and goal are required.");
      return;
    }

    saveControls(activeControls);
    setControls(activeControls);

    const payload = {
      session: activeControls.session,
      run_id: activeControls.session,
      phase: activeControls.phase,
      goal: activeControls.goal,
      session_key: activeControls.session_key,
      max_steps: activeControls.max_steps,
    };

    setRequestError(false);
    setRequestStatus("Running harness...");

    try {
      const body = await requestJson("/api/harness/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      setRunData(body || {});
      setRequestStatus(`Run loaded via POST /api/harness/run for session ${activeControls.session}`);
      await refreshGraph(activeControls);
      await refreshMemory(activeControls);
    } catch (error) {
      setRequestError(true);
      setRequestStatus(`Run request failed: ${safeText(error?.message || error)}`);
    }
  }

  async function onRefreshGraph() {
    try {
      await refreshGraph(controls);
    } catch (error) {
      setRequestError(true);
      setRequestStatus(`Graph request failed: ${safeText(error?.message || error)}`);
    }
  }

  async function onRefreshMemory() {
    try {
      await refreshMemory(controls);
    } catch (error) {
      setRequestError(true);
      setRequestStatus(`Memory request failed: ${safeText(error?.message || error)}`);
    }
  }

  function normalizedChatControls(source = controls) {
    return {
      ...source,
      session: safeText(source.session).trim(),
      phase: safeText(source.phase).trim() || "PLAN",
      session_key: safeText(source.session_key).trim() || "chat-main",
    };
  }

  async function refreshChatThreads(activeControls, options = {}) {
    const { silent = false } = options;
    if (!activeControls.session) {
      setChatThreads([]);
      if (!silent) {
        setChatStatus("Session is required.");
        setChatError(true);
      }
      return [];
    }
    if (!silent) {
      setChatStatus("Loading conversations...");
      setChatError(false);
    }
    setChatThreadsLoading(true);
    try {
      const sessionId = encodeURIComponent(activeControls.session);
      const endpoint = `/api/session/${sessionId}/chat/threads`;
      const body = await requestJson(endpoint, { method: "GET", headers: { Accept: "application/json" } });
      const threads = asArray(body?.threads).map(normalizeChatThread).filter(Boolean);
      setChatThreads(threads);
      if (!silent) {
        setChatStatus(`Loaded ${threads.length} conversation${threads.length === 1 ? "" : "s"}.`);
      }
      return threads;
    } catch (error) {
      if (!silent) {
        setChatStatus(`Conversation list failed: ${safeText(error?.message || error)}`);
        setChatError(true);
      }
      throw error;
    } finally {
      setChatThreadsLoading(false);
    }
  }

  async function hydrateChatHistory(activeControls, options = {}) {
    const { silent = false } = options;
    if (!activeControls.session || !activeControls.session_key) {
      setChatMessages([]);
      if (!silent) {
        setChatStatus("Session and Session Key are required.");
        setChatError(true);
      }
      return [];
    }
    if (!silent) {
      setChatStatus(`Loading conversation ${activeControls.session_key}...`);
      setChatError(false);
    }
    setChatHydrating(true);
    try {
      const sessionId = encodeURIComponent(activeControls.session);
      const sessionKey = encodeURIComponent(activeControls.session_key);
      const endpoint = `/api/session/${sessionId}/chat/history?session_key=${sessionKey}`;
      const body = await requestJson(endpoint, { method: "GET", headers: { Accept: "application/json" } });
      const messages = normalizeChatTurns(body?.turns);
      setChatMessages(messages);
      if (!silent) {
        setChatStatus(
          messages.length === 0
            ? `Conversation ${activeControls.session_key} has no turns yet.`
            : `Loaded ${messages.length} message${messages.length === 1 ? "" : "s"} from ${activeControls.session_key}.`
        );
      }
      return messages;
    } catch (error) {
      if (!silent) {
        setChatStatus(`Conversation load failed: ${safeText(error?.message || error)}`);
        setChatError(true);
      }
      throw error;
    } finally {
      setChatHydrating(false);
    }
  }

  function selectChatThread(sessionKey) {
    const nextKey = safeText(sessionKey).trim();
    if (!nextKey) {
      return;
    }
    const nextControls = { ...controls, session_key: nextKey };
    saveControls(nextControls);
    setControls(nextControls);
  }

  function createNewChatThread() {
    const nextKey = `chat-${Date.now()}`;
    const nextControls = { ...controls, session_key: nextKey };
    saveControls(nextControls);
    setControls(nextControls);
    setChatMessages([]);
    setChatStatus(`Created new conversation ${nextKey}.`);
    setChatError(false);
  }

  async function sendChatMessage(event) {
    event.preventDefault();
    if (chatSending) {
      return;
    }
    const userMessage = safeText(chatInput).trim();
    if (!userMessage) {
      setChatError(true);
      setChatStatus("Enter a message before sending.");
      return;
    }

    const now = Date.now();
    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${now}`,
        role: "user",
        text: userMessage,
      },
    ]);
    setChatInput("");
    setChatSending(true);
    setChatError(false);
    setChatStatus("Sending to /api/chat...");

    const activeControls = normalizedChatControls(controls);

    if (!activeControls.session) {
      setChatSending(false);
      setChatError(true);
      setChatStatus("Session is required.");
      return;
    }

    saveControls({ ...controls, ...activeControls });
    setControls((prev) => ({ ...prev, ...activeControls }));

    try {
      const body = await requestJson("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          run_id: activeControls.session,
          session: activeControls.session,
          phase: activeControls.phase,
          session_key: activeControls.session_key,
          message: userMessage,
          max_tokens: 900,
          max_history_turns: 12,
          temperature: 0.15,
        }),
      });

      const ui = normalizeChatUiPayload(body?.ui, body?.ui_rejection_reason);
      const assistantText = safeText(body?.assistant_text).trim() || "(empty assistant text)";
      const assistantMeta = {
        model_id: safeText(body?.model_id),
        turn_index: safeText(body?.turn_index),
        ui_parse_ok: Boolean(body?.ui_parse_ok),
        ui_validate_ok: Boolean(body?.ui_validate_ok),
        ui_rendered: Boolean(body?.ui_rendered),
        ui_rejection_reason: safeText(body?.ui_rejection_reason),
        history_turns_used: safeText(body?.history_turns_used),
      };

      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: assistantText,
          ui,
          meta: assistantMeta,
        },
      ]);

      const uiStatus = ui.mode === "spec" ? "spec rendered" : `text only (${ui.reason})`;
      setChatStatus(`Assistant turn ${assistantMeta.turn_index || "-"}: ${uiStatus}`);
      setChatError(false);
      void refreshChatThreads(activeControls, { silent: true });
    } catch (error) {
      const message = safeText(error?.message || error);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: `Chat request failed: ${message}`,
          ui: { mode: "none", reason: "request_failed", spec: null },
        },
      ]);
      setChatStatus(`Chat request failed: ${message}`);
      setChatError(true);
    } finally {
      setChatSending(false);
    }
  }

  function clearChat() {
    setChatMessages([]);
    setChatStatus("Transcript cleared. Chat memory on backend remains tied to session/session_key.");
    setChatError(false);
  }

  const subtitle =
    route === ROUTES.REGISTRY
      ? "Component registry route powered by json-render demo specs."
      : route === ROUTES.CHAT
        ? "Chat + dynamic json-render UI from agent discretion."
        : "React 19 + json-render runtime for harness observability.";

  return (
    <main className="app-shell">
      <header className="page-header">
        <h1>Workshop Harness GUI</h1>
        <p className="subtitle">{subtitle}</p>
      </header>

      <nav className="route-nav" aria-label="GUI routes">
        <button type="button" className={route === ROUTES.HARNESS ? "is-active" : ""} onClick={() => navigateTo(ROUTES.HARNESS)}>
          Harness
        </button>
        <button type="button" className={route === ROUTES.REGISTRY ? "is-active" : ""} onClick={() => navigateTo(ROUTES.REGISTRY)}>
          Component Registry
        </button>
        <button type="button" className={route === ROUTES.CHAT ? "is-active" : ""} onClick={() => navigateTo(ROUTES.CHAT)}>
          Chat
        </button>
      </nav>

      {route === ROUTES.HARNESS ? (
        <section className="controls-card" aria-label="Harness controls">
          <h2>Controls</h2>
          <form className="control-grid" onSubmit={runHarness}>
            <label>
              Session
              <input value={controls.session} onChange={(event) => updateControl("session", event.target.value)} required />
            </label>

            <label>
              Phase
              <select value={controls.phase} onChange={(event) => updateControl("phase", event.target.value)}>
                <option value="PLAN">PLAN</option>
                <option value="ACT">ACT</option>
                <option value="VERIFY">VERIFY</option>
              </select>
            </label>

            <label className="span-2">
              Goal
              <input value={controls.goal} onChange={(event) => updateControl("goal", event.target.value)} required />
            </label>

            <label>
              Session Key
              <input value={controls.session_key} onChange={(event) => updateControl("session_key", event.target.value)} required />
            </label>

            <label>
              Max Steps
              <input
                type="number"
                min="1"
                max="50"
                value={controls.max_steps}
                onChange={(event) => updateControl("max_steps", event.target.value)}
                required
              />
            </label>

            <div className="button-row span-2">
              <button id="run-harness" type="submit">Run Harness</button>
              <button type="button" onClick={onRefreshGraph}>Refresh Graph</button>
              <button type="button" onClick={onRefreshMemory}>Refresh Memory</button>
            </div>
          </form>
          <p className={`hint ${requestError ? "is-error" : ""}`}>{requestStatus}</p>
        </section>
      ) : null}

      {route === ROUTES.REGISTRY ? (
        <section className="controls-card registry-note" aria-label="Component registry context">
          <h2>Registry Showcase</h2>
          <p className="hint">This route renders every component in the json-render catalog with demo props and data.</p>
        </section>
      ) : null}

      {route === ROUTES.CHAT ? (
        <section className="controls-card chat-controls" aria-label="Chat controls">
          <h2>Chat</h2>
          <div className="control-grid">
            <label>
              Session
              <input value={controls.session} onChange={(event) => updateControl("session", event.target.value)} required />
            </label>
            <label>
              Phase
              <select value={controls.phase} onChange={(event) => updateControl("phase", event.target.value)}>
                <option value="PLAN">PLAN</option>
                <option value="ACT">ACT</option>
                <option value="VERIFY">VERIFY</option>
              </select>
            </label>
            <label className="span-2">
              Session Key
              <input value={controls.session_key} onChange={(event) => updateControl("session_key", event.target.value)} required />
            </label>
            <div className="button-row span-2">
              <button
                type="button"
                onClick={() => {
                  const active = normalizedChatControls();
                  void refreshChatThreads(active);
                  void hydrateChatHistory(active, { silent: true });
                }}
                disabled={chatThreadsLoading || chatHydrating}
              >
                {chatThreadsLoading ? "Refreshing..." : "Refresh Conversations"}
              </button>
              <button type="button" onClick={createNewChatThread}>
                New Conversation
              </button>
              <button
                type="button"
                onClick={() => {
                  const active = normalizedChatControls();
                  void hydrateChatHistory(active);
                }}
                disabled={chatHydrating}
              >
                {chatHydrating ? "Loading..." : "Reload Selected"}
              </button>
            </div>
          </div>

          <form className="chat-input-form" onSubmit={sendChatMessage}>
            <label className="chat-input-label" htmlFor="chat-input">
              Message
            </label>
            <textarea
              id="chat-input"
              className="chat-input"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              rows={4}
              placeholder="Ask for analysis, planning, or a structured UI view."
            />
            <div className="button-row">
              <button type="submit" className="chat-send" disabled={chatSending || chatHydrating}>
                {chatSending ? "Sending..." : "Send"}
              </button>
              <button type="button" onClick={clearChat}>
                Clear Transcript
              </button>
            </div>
          </form>

          <p className={`hint ${chatError ? "is-error" : ""}`}>{chatStatus}</p>
        </section>
      ) : null}

      {route === ROUTES.HARNESS ? (
        <section className="renderer-shell" aria-label="json-render dashboard">
          <JsonRenderSurface spec={dashboardSpec} />
        </section>
      ) : null}

      {route === ROUTES.REGISTRY ? (
        <section className="renderer-shell" aria-label="json-render component registry">
          <JsonRenderSurface spec={componentRegistrySpec} />
        </section>
      ) : null}

      {route === ROUTES.CHAT ? (
        <section className="chat-layout" aria-label="Chat workspace">
          <aside className="chat-thread-list-card" aria-label="Conversation threads">
            <h3>Conversations</h3>
            {chatThreads.length === 0 ? (
              <p className="chat-empty">No persisted conversations yet for this session.</p>
            ) : (
              <div className="chat-thread-list">
                {chatThreads.map((thread) => (
                  <button
                    key={thread.session_key}
                    type="button"
                    className={`chat-thread-item ${controls.session_key === thread.session_key ? "is-active" : ""}`}
                    onClick={() => selectChatThread(thread.session_key)}
                  >
                    <div className="chat-thread-title">{safeText(thread.title)}</div>
                    <div className="chat-thread-preview">{safeText(thread.preview || "(no preview)")}</div>
                    <div className="chat-thread-meta">
                      <span>{thread.turn_count} turns</span>
                      <span>{formatTimestamp(thread.last_turn_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="chat-shell" aria-label="Chat transcript">
            {chatMessages.length === 0 ? <p className="chat-empty">No messages yet. Start a chat turn above.</p> : null}
            {chatMessages.map((message) => (
              <article key={message.id} className={`chat-message role-${message.role}`}>
                <div className="chat-role">{message.role === "user" ? "User" : "Assistant"}</div>
                <pre className="jr-pre chat-text">{safeText(message.text)}</pre>

                {message.role === "assistant" && isObject(message.meta) ? (
                  <div className="chat-meta">
                    <span>model: {safeText(message.meta.model_id || "-")}</span>
                    <span>turn: {safeText(message.meta.turn_index || "-")}</span>
                    <span>history: {safeText(message.meta.history_turns_used || "-")}</span>
                    <span>parse_ok: {String(Boolean(message.meta.ui_parse_ok))}</span>
                    <span>validate_ok: {String(Boolean(message.meta.ui_validate_ok))}</span>
                    <span>ui_rendered: {String(Boolean(message.meta.ui_rendered))}</span>
                    {safeText(message.meta.ui_rejection_reason) ? (
                      <span>ui_rejection: {safeText(message.meta.ui_rejection_reason)}</span>
                    ) : null}
                  </div>
                ) : null}

                {message.role === "assistant" && isObject(message.ui) ? (
                  <div className="chat-ui-meta">
                    <strong>ui.mode:</strong> {safeText(message.ui.mode || "none")} | <strong>reason:</strong>{" "}
                    {safeText(message.ui.reason || "-")}
                  </div>
                ) : null}

                {message.role === "assistant" && message.ui?.mode === "spec" && isObject(message.ui?.spec) ? (
                  <div className="chat-ui-render">
                    <JsonRenderSurface spec={message.ui.spec} />
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        </section>
      ) : null}
    </main>
  );
}
