import React, { useEffect, useMemo, useRef, useState } from "react";
import { defineCatalog } from "@json-render/core";
import { ActionProvider, Renderer, StateProvider, VisibilityProvider, defineRegistry } from "@json-render/react";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

const STORAGE_KEY = "workshop_gui_controls_v2";
const ROUTES = {
  HARNESS: "/",
  SWARM: "/swarm",
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

function safeInt(value, fallback = 0) {
  const parsed = Number.parseInt(safeText(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  if (pathname === ROUTES.SWARM) {
    return ROUTES.SWARM;
  }
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
      badge: "turn",
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
      badge: "tool",
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
      badge: "memory",
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
    badge: safeText(nodeType(node)).toLowerCase(),
  }));
}

function pickProjections(glassCaseData) {
  if (!isObject(glassCaseData)) {
    return {};
  }
  return isObject(glassCaseData.projections) ? glassCaseData.projections : {};
}

function pickCommunicationProjection(glassCaseData) {
  const communication = pickProjections(glassCaseData).communication;
  return isObject(communication) ? communication : {};
}

function buildRuntimeTimelineItems(glassCaseData, fallbackRunData) {
  const projectionTimeline = asArray(pickProjections(glassCaseData).runtime_timeline);
  if (projectionTimeline.length > 0) {
    return projectionTimeline.slice(-30).map((event, idx) => ({
      title: `${safeText(event.kind || "event")} | ${safeText(event.node_id || `event_${idx + 1}`)}`,
      meta: `ts: ${safeText(event.ts_utc || "-")} | status: ${safeText(event.status || "-")} | actor: ${safeText(event.actor || "-")}`,
      body: safeText(event.summary || pretty(event)),
      tone: safeText(event.status).toLowerCase().includes("fail") || safeText(event.status).toLowerCase().includes("blocked") ? "error" : "default",
      badge: safeText(event.kind || "event"),
    }));
  }
  return buildTimelineItems(fallbackRunData);
}

function buildOntologyItems(glassCaseData) {
  const ontology = pickProjections(glassCaseData).ontology;
  if (!isObject(ontology)) {
    return [];
  }
  const nodeTypes = asArray(ontology.node_types).slice(0, 20).map((entry) => ({
    title: `NodeType: ${safeText(entry.node_type)}`,
    meta: `required_fields: ${asArray(entry.required_fields).length}`,
    body: asArray(entry.required_fields).join(", ") || "(none)",
    tone: "default",
    badge: "node",
  }));
  const edgeTypes = asArray(ontology.edge_types).slice(0, 16).map((entry) => ({
    title: `EdgeType: ${safeText(entry.edge_type)}`,
    meta: `from: ${asArray(entry.from_types).length} | to: ${asArray(entry.to_types).length}`,
    body: `from=[${asArray(entry.from_types).join(", ")}] to=[${asArray(entry.to_types).join(", ")}]`,
    tone: "default",
    badge: "edge",
  }));
  const constraints = asArray(ontology.constraints).slice(0, 10).map((entry) => ({
    title: `Constraint: ${safeText(entry.id || "unnamed")}`,
    meta: "ontology constraint",
    body: safeText(entry.description || ""),
    tone: "ok",
    badge: "constraint",
  }));
  return [...nodeTypes, ...edgeTypes, ...constraints];
}

function buildCoordinationItems(glassCaseData) {
  const coordination = pickProjections(glassCaseData).coordination;
  if (!isObject(coordination)) {
    return [];
  }
  const tasks = asArray(coordination.tasks).slice(0, 24).map((task) => ({
    title: `${safeText(task.task_id)} | ${safeText(task.state)}`,
    meta: `owner: ${safeText(task.assigned_to || "-")} | claims: ${safeText(task.claim_count || 0)} | bucket: ${safeText(task.coordination_bucket || "-")}`,
    body: safeText(task.title || "(untitled task)"),
    tone: safeText(task.state).toLowerCase().includes("blocked") ? "error" : safeText(task.state).toLowerCase().includes("done") ? "ok" : "default",
    badge: safeText(task.state || "task"),
  }));
  const timeouts = asArray(coordination.timeouts).slice(0, 8).map((timeout) => ({
    title: `Timeout | task: ${safeText(timeout.task_id)}`,
    meta: `agent: ${safeText(timeout.agent_id || "-")} | lease_expires_at: ${safeText(timeout.lease_expires_at || "-")}`,
    body: `State at timeout: ${safeText(timeout.state || "-")}`,
    tone: "error",
    badge: "timeout",
  }));
  const reassignments = asArray(coordination.reassignments).slice(0, 8).map((event) => ({
    title: `Reassign | task: ${safeText(event.task_id)}`,
    meta: `claim_count: ${safeText(event.claim_count || 0)} | resolved_to: ${safeText(event.resolved_to || "-")}`,
    body: `Agents: ${asArray(event.agents).join(", ") || "-"}`,
    tone: "ok",
    badge: "reassign",
  }));
  return [...tasks, ...timeouts, ...reassignments];
}

function buildToolAccessItems(glassCaseData) {
  const matrix = pickProjections(glassCaseData).tool_access_matrix;
  if (!isObject(matrix)) {
    return [];
  }
  return asArray(matrix.roles).map((role) => ({
    title: `Role: ${safeText(role.role)}`,
    meta: `phases: ${asArray(role.phases).join(", ")} | allowed: ${safeText(role.allowed_count || 0)} | blocked: ${safeText(role.blocked_count || 0)}`,
    body: `Allowed: ${asArray(role.allowed_skills).slice(0, 12).join(", ") || "-"}${asArray(role.allowed_skills).length > 12 ? " ..." : ""}`,
    tone: "default",
    badge: "access",
  }));
}

function buildReceiptArtifactItems(glassCaseData) {
  const projection = pickProjections(glassCaseData).receipts_artifacts;
  if (!isObject(projection)) {
    return [];
  }
  const receipts = asArray(projection.receipts).slice(0, 20).map((receipt) => ({
    title: `Receipt: ${safeText(receipt.receipt_id)}`,
    meta: `skill: ${safeText(receipt.skill_name || "-")} | status: ${safeText(receipt.status || "-")} | ts: ${safeText(receipt.ts_utc || "-")}`,
    body: `${safeText(receipt.summary || "")}${asArray(receipt.artifact_uris).length ? `\nArtifacts: ${asArray(receipt.artifact_uris).join(", ")}` : ""}`,
    tone: safeText(receipt.status).toLowerCase().includes("success") ? "ok" : "error",
    badge: "receipt",
  }));
  const artifacts = asArray(projection.artifacts).slice(0, 12).map((artifact) => ({
    title: `Artifact: ${safeText(artifact.artifact_id)}`,
    meta: `name: ${safeText(artifact.name || "-")} | ts: ${safeText(artifact.ts_utc || "-")}`,
    body: `${safeText(artifact.s3_uri || "-")}\nsha256: ${safeText(artifact.sha256 || "-")}`,
    tone: "default",
    badge: "artifact",
  }));
  return [...receipts, ...artifacts];
}

function buildVerificationGateItems(glassCaseData) {
  const projection = pickProjections(glassCaseData).verification_gates;
  if (!isObject(projection)) {
    return [];
  }
  return asArray(projection.tasks).slice(0, 24).map((task) => ({
    title: `${safeText(task.task_id)} | local_gate=${safeText(task.local_completion_gate)} | promotion_gate=${safeText(task.promotion_gate_open)}`,
    meta: `state: ${safeText(task.state)} | verification: ${safeText(task.verification_status || "-")} | blocked: ${safeText(task.blocked)}`,
    body: `Reason: ${safeText(task.gate_reason || "-")} | test_result: ${safeText(task.test_result_id || "-")}`,
    tone: task.promotion_gate_open ? "ok" : task.blocked ? "error" : "default",
    badge: "gate",
  }));
}

function buildFreshnessConflictItems(glassCaseData) {
  const projection = pickProjections(glassCaseData).freshness_conflicts;
  if (!isObject(projection)) {
    return [];
  }
  const staleNodes = asArray(projection.stale_nodes).slice(0, 18).map((node) => ({
    title: `Stale node: ${safeText(node.node_id)} | ${safeText(node.type)}`,
    meta: `age_minutes: ${safeText(node.age_minutes)} | trust: ${safeText(node.trust_level || "-")} | version: ${safeText(node.version || "-")}`,
    body: `${safeText(node.summary || "")}\nsupersedes: ${safeText(node.supersedes || "-")} | fresh_until: ${safeText(node.fresh_until || "-")}`,
    tone: "error",
    badge: "stale",
  }));
  const conflicts = asArray(projection.conflicts).slice(0, 12).map((conflict) => ({
    title: `Conflict task: ${safeText(conflict.task_id)} | claims: ${safeText(conflict.claim_count || 0)}`,
    meta: `resolved_to: ${safeText(conflict.resolved_to || "-")} | verification: ${safeText(conflict.verification_status || "-")}`,
    body: `Agents: ${asArray(conflict.agents).join(", ") || "-"} | policy: ${safeText(conflict.resolution_policy || "-")}`,
    tone: "default",
    badge: "conflict",
  }));
  return [...staleNodes, ...conflicts];
}

function buildSwarmHeartbeatItems(glassCaseData) {
  const projections = pickProjections(glassCaseData);
  const timeline = asArray(projections.runtime_timeline);
  const coordination = isObject(projections.coordination) ? projections.coordination : {};
  const freshness = isObject(projections.freshness_conflicts) ? projections.freshness_conflicts : {};
  const gates = isObject(projections.verification_gates) ? projections.verification_gates : {};
  const now = Date.now();
  const recentWindowMs = 60_000;
  const recentEvents = timeline.filter((event) => {
    const ts = safeText(event?.ts_utc || "");
    const parsed = ts ? new Date(ts).getTime() : Number.NaN;
    return Number.isFinite(parsed) && now - parsed <= recentWindowMs;
  });
  const activeAgents = new Set();
  for (const task of asArray(coordination.tasks)) {
    asArray(task?.claim_agents).forEach((agent) => {
      const id = safeText(agent).trim();
      if (id) {
        activeAgents.add(id);
      }
    });
    const assigned = safeText(task?.assigned_to || "").trim();
    if (assigned) {
      activeAgents.add(assigned);
    }
  }

  const stateCounts = isObject(coordination.state_counts)
    ? coordination.state_counts
    : isObject(coordination.counts)
      ? coordination.counts
      : {};
  const gateCounts = isObject(gates.counts) ? gates.counts : {};
  const freshnessCounts = isObject(freshness.counts) ? freshness.counts : {};
  const lastEvent = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  return [
    {
      title: "Heartbeat",
      meta: `events_last_60s: ${recentEvents.length} | active_agents: ${activeAgents.size}`,
      body: lastEvent
        ? `last_event: ${safeText(lastEvent.kind || "-")} @ ${safeText(lastEvent.ts_utc || "-")} by ${safeText(lastEvent.actor || "-") || "-"}`
        : "No runtime events recorded yet for this session.",
      tone: recentEvents.length > 0 ? "ok" : "default",
      badge: "heartbeat",
    },
    {
      title: "Coordination Buckets",
      meta: "queue / claimed / active / verify_pending / done / failed",
      body: `queue=${safeText(stateCounts.queue || 0)}, claimed=${safeText(stateCounts.claimed || 0)}, active=${safeText(
        stateCounts.active || 0
      )}, verify_pending=${safeText(stateCounts.verify_pending || 0)}, done=${safeText(stateCounts.done || 0)}, failed=${safeText(
        stateCounts.failed || 0
      )}`,
      tone: Number(stateCounts.failed || 0) > 0 ? "error" : "default",
      badge: "coordination",
    },
    {
      title: "Verification Gates",
      meta: "promotion outcomes",
      body: `promoted=${safeText(gateCounts.promoted || 0)}, blocked=${safeText(gateCounts.blocked || 0)}, pending=${safeText(
        gateCounts.pending || 0
      )}`,
      tone: Number(gateCounts.blocked || 0) > 0 ? "error" : "ok",
      badge: "gates",
    },
    {
      title: "Freshness + Conflict Risk",
      meta: "stale nodes / conflicts",
      body: `stale_nodes=${safeText(freshnessCounts.stale_nodes || 0)}, conflicts=${safeText(freshnessCounts.conflicts || 0)}`,
      tone: Number(freshnessCounts.conflicts || 0) > 0 || Number(freshnessCounts.stale_nodes || 0) > 0 ? "error" : "default",
      badge: "risk",
    },
  ];
}

function buildSwarmChannelItems(glassCaseData) {
  const communication = pickCommunicationProjection(glassCaseData);
  const channels = [];
  const channelRows = asArray(communication.channels).slice(0, 20);
  for (const channel of channelRows) {
    const participants = asArray(channel?.participants).map((item) => safeText(item).trim()).filter(Boolean);
    channels.push({
      title: `channel:${safeText(channel?.channel_name || channel?.channel_id || "unnamed")}`,
      meta: `participants=${participants.length} | messages=${safeText(channel?.message_count || 0)}`,
      body: `topic: ${safeText(channel?.topic || "-")}\nparticipants: ${participants.join(", ") || "-"}`,
      tone: participants.length > 1 ? "ok" : "default",
      badge: "channel",
    });
  }
  const recentMessages = asArray(communication.recent_messages).slice(0, 10).map((message) => ({
    title: `message:${safeText(message?.message_id || "-")}`,
    meta: `channel=${safeText(message?.channel_id || "-")} | agent=${safeText(message?.agent_id || "-")} | task=${safeText(
      message?.task_id || "-"
    )}`,
    body: safeText(message?.message || ""),
    tone: "default",
    badge: "message",
  }));
  if (channels.length > 0 || recentMessages.length > 0) {
    return [...channels, ...recentMessages];
  }

  const coordination = pickProjections(glassCaseData).coordination;
  if (!isObject(coordination)) {
    return [];
  }

  const fallbackChannels = [];
  for (const task of asArray(coordination.tasks)) {
    const taskId = safeText(task?.task_id || "").trim();
    if (!taskId) {
      continue;
    }
    const agents = Array.from(
      new Set(
        [
          ...asArray(task?.claim_agents).map((agent) => safeText(agent).trim()),
          safeText(task?.assigned_to || "").trim(),
          safeText(task?.completed_by || "").trim(),
        ].filter(Boolean)
      )
    );
    if (agents.length <= 1) {
      continue;
    }
    fallbackChannels.push({
      title: `channel:${taskId}`,
      meta: `participants=${agents.length} | claims=${safeText(task?.claim_count || 0)} | state=${safeText(task?.state || "-")}`,
      body: `agents: ${agents.join(", ")}\npolicy: explicit handoff + verification gate`,
      tone: "default",
      badge: "channel",
    });
  }

  for (const event of asArray(coordination.reassignments)) {
    fallbackChannels.push({
      title: `reassign:${safeText(event?.task_id || "")}`,
      meta: `claim_count=${safeText(event?.claim_count || 0)} | resolved_to=${safeText(event?.resolved_to || "-")}`,
      body: `agents: ${asArray(event?.agents).map((agent) => safeText(agent)).join(", ") || "-"}`,
      tone: "ok",
      badge: "reassign",
    });
  }

  return fallbackChannels.slice(0, 30);
}

function buildSwarmAgentActivityItems(glassCaseData) {
  const timeline = asArray(pickProjections(glassCaseData).runtime_timeline);
  const byActor = new Map();
  for (const event of timeline) {
    const actor = safeText(event?.actor || "").trim();
    if (!actor) {
      continue;
    }
    if (!byActor.has(actor)) {
      byActor.set(actor, { actor, count: 0, kinds: new Set(), lastTs: "", lastStatus: "", lastSummary: "" });
    }
    const row = byActor.get(actor);
    row.count += 1;
    row.kinds.add(safeText(event?.kind || "event"));
    row.lastTs = safeText(event?.ts_utc || row.lastTs);
    row.lastStatus = safeText(event?.status || row.lastStatus);
    row.lastSummary = safeText(event?.summary || row.lastSummary);
  }

  return Array.from(byActor.values())
    .sort((a, b) => b.count - a.count)
    .map((row) => ({
      title: `agent:${row.actor}`,
      meta: `events=${row.count} | kinds=${Array.from(row.kinds).slice(0, 4).join(", ") || "-"}`,
      body: `last_ts=${row.lastTs || "-"} | last_status=${row.lastStatus || "-"}\nlast_summary=${row.lastSummary || "-"}`,
      tone: safeText(row.lastStatus).toLowerCase().includes("fail") ? "error" : "default",
      badge: "agent",
    }))
    .slice(0, 24);
}

function buildSwarmNetwork(glassCaseData, graphData) {
  const projections = pickProjections(glassCaseData);
  const communication = pickCommunicationProjection(glassCaseData);
  const coordination = isObject(projections.coordination) ? projections.coordination : {};
  const tasks = asArray(coordination.tasks);
  const networkNodes = [];
  const networkEdges = [];
  const seenNodes = new Set();
  const seenEdges = new Set();

  const addNode = (id, type, raw = {}) => {
    const key = safeText(id).trim();
    if (!key || seenNodes.has(key)) {
      return;
    }
    seenNodes.add(key);
    networkNodes.push({ node_id: key, type, data: raw });
  };

  const addEdge = (from, to, edgeType) => {
    const fromId = safeText(from).trim();
    const toId = safeText(to).trim();
    if (!fromId || !toId) {
      return;
    }
    const edgeId = `${fromId}|${edgeType}|${toId}`;
    if (seenEdges.has(edgeId)) {
      return;
    }
    seenEdges.add(edgeId);
    networkEdges.push({ edge_id: edgeId, from_id: fromId, to_id: toId, edge_type: edgeType });
  };

  addNode("swarm:hub", "SwarmHub", {
    summary: "Session coordination heartbeat",
    session_id: safeText(glassCaseData?.session_id || graphData?.session_id || ""),
  });

  for (const channel of asArray(communication.channels)) {
    const rawId = safeText(channel?.channel_id || channel?.channel_name || "").trim();
    if (!rawId) {
      continue;
    }
    const channelNodeId = `channel:${rawId}`;
    addNode(channelNodeId, "Channel", channel);
    addEdge("swarm:hub", channelNodeId, "TRACKS_CHANNEL");

    for (const participant of asArray(channel?.participants)) {
      const agentIdRaw = safeText(participant).trim();
      if (!agentIdRaw) {
        continue;
      }
      const agentNodeId = `agent:${agentIdRaw}`;
      addNode(agentNodeId, "Agent", { agent_id: agentIdRaw });
      addEdge(agentNodeId, channelNodeId, "PARTICIPATES_IN");
    }
  }

  for (const message of asArray(communication.recent_messages)) {
    const messageRawId = safeText(message?.message_id || "").trim();
    if (!messageRawId) {
      continue;
    }
    const messageNodeId = `message:${messageRawId}`;
    addNode(messageNodeId, "Message", message);

    const channelRawId = safeText(message?.channel_id || "").trim();
    if (channelRawId) {
      const channelNodeId = `channel:${channelRawId}`;
      addNode(channelNodeId, "Channel", { channel_id: channelRawId });
      addEdge(channelNodeId, messageNodeId, "CHANNEL_HAS_MESSAGE");
    }

    const agentIdRaw = safeText(message?.agent_id || "").trim();
    if (agentIdRaw) {
      const agentNodeId = `agent:${agentIdRaw}`;
      addNode(agentNodeId, "Agent", { agent_id: agentIdRaw });
      addEdge(agentNodeId, messageNodeId, "AUTHORED");
    }

    const taskRawId = safeText(message?.task_id || "").trim();
    if (taskRawId) {
      const taskNodeId = `task:${taskRawId}`;
      addNode(taskNodeId, "Task", { task_id: taskRawId });
      addEdge(messageNodeId, taskNodeId, "MESSAGE_RELATES_TO_TASK");
    }
  }

  for (const task of tasks) {
    const taskIdRaw = safeText(task?.task_id || "").trim();
    if (!taskIdRaw) {
      continue;
    }
    const taskNodeId = `task:${taskIdRaw}`;
    addNode(taskNodeId, "Task", task);
    addEdge("swarm:hub", taskNodeId, "TRACKS_TASK");

    const participants = Array.from(
      new Set(
        [
          ...asArray(task?.claim_agents).map((agent) => safeText(agent).trim()),
          safeText(task?.assigned_to || "").trim(),
          safeText(task?.completed_by || "").trim(),
        ].filter(Boolean)
      )
    );

    if (participants.length > 1) {
      const channelNodeId = `channel:${taskIdRaw}`;
      addNode(channelNodeId, "Channel", {
        task_id: taskIdRaw,
        participants,
        claim_count: safeText(task?.claim_count || 0),
      });
      addEdge(channelNodeId, taskNodeId, "CHANNEL_FOR_TASK");
      for (const agentIdRaw of participants) {
        const agentNodeId = `agent:${agentIdRaw}`;
        addNode(agentNodeId, "Agent", { agent_id: agentIdRaw });
        addEdge(agentNodeId, channelNodeId, "SENDS_UPDATE");
      }
      continue;
    }

    for (const agentIdRaw of participants) {
      const agentNodeId = `agent:${agentIdRaw}`;
      addNode(agentNodeId, "Agent", { agent_id: agentIdRaw });
      addEdge(agentNodeId, taskNodeId, "CLAIMS_TASK");
    }
  }

  for (const timeoutEvent of asArray(coordination.timeouts)) {
    const taskIdRaw = safeText(timeoutEvent?.task_id || "").trim();
    const agentIdRaw = safeText(timeoutEvent?.agent_id || "").trim();
    if (!taskIdRaw || !agentIdRaw) {
      continue;
    }
    const agentNodeId = `agent:${agentIdRaw}`;
    const taskNodeId = `task:${taskIdRaw}`;
    addNode(agentNodeId, "Agent", { agent_id: agentIdRaw });
    addNode(taskNodeId, "Task", { task_id: taskIdRaw });
    addEdge(agentNodeId, taskNodeId, "LEASE_TIMEOUT");
  }

  for (const reassignEvent of asArray(coordination.reassignments)) {
    const taskIdRaw = safeText(reassignEvent?.task_id || "").trim();
    if (!taskIdRaw) {
      continue;
    }
    const taskNodeId = `task:${taskIdRaw}`;
    addNode(taskNodeId, "Task", { task_id: taskIdRaw });
    for (const agent of asArray(reassignEvent?.agents)) {
      const agentIdRaw = safeText(agent).trim();
      if (!agentIdRaw) {
        continue;
      }
      const agentNodeId = `agent:${agentIdRaw}`;
      addNode(agentNodeId, "Agent", { agent_id: agentIdRaw });
      addEdge(agentNodeId, taskNodeId, "REASSIGN_CANDIDATE");
    }
  }

  return { nodes: networkNodes, edges: networkEdges };
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

function computeLayeredLayout(nodes, edges, width, height) {
  const safeNodes = nodes.slice(0, 48);
  const adjacency = new Map();
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from).push(edge.to);
  }

  const layers = new Map();
  const roots = safeNodes.filter((node) => {
    return !edges.some((edge) => edge.to === node.id);
  });

  const queue = [...roots];
  for (const root of roots) {
    layers.set(root.id, 0);
  }
  while (queue.length > 0) {
    const current = queue.shift();
    const currentLayer = layers.get(current.id) || 0;
    const targets = adjacency.get(current.id) || [];
    for (const targetId of targets) {
      const nextLayer = currentLayer + 1;
      if (!layers.has(targetId) || (layers.get(targetId) || 0) < nextLayer) {
        layers.set(targetId, nextLayer);
        const targetNode = safeNodes.find((node) => node.id === targetId);
        if (targetNode) {
          queue.push(targetNode);
        }
      }
    }
  }

  const maxLayer = Math.max(1, ...Array.from(layers.values(), (value) => value));
  const grouped = new Map();
  for (const node of safeNodes) {
    const layer = layers.has(node.id) ? layers.get(node.id) : maxLayer;
    if (!grouped.has(layer)) {
      grouped.set(layer, []);
    }
    grouped.get(layer).push(node);
  }

  const orderedLayers = Array.from(grouped.keys()).sort((a, b) => a - b);
  const xStart = 110;
  const xEnd = width - 110;
  const usableHeight = height - 120;

  const positioned = [];
  for (const layer of orderedLayers) {
    const layerNodes = grouped.get(layer) || [];
    const x = xStart + ((xEnd - xStart) * layer) / Math.max(1, maxLayer);
    const spacing = usableHeight / Math.max(1, layerNodes.length);
    for (let index = 0; index < layerNodes.length; index += 1) {
      positioned.push({
        ...layerNodes[index],
        x,
        y: 60 + spacing * index + spacing / 2,
      });
    }
  }

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
      props: z.object({
        minColumnWidth: z.number().nullable().optional(),
      }),
      description: "Two-column dashboard grid",
    },
    Panel: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().nullable(),
        span: z.enum(["1", "2"]).nullable(),
        variant: z.enum(["info", "success", "warning", "danger", "system"]).nullable().optional(),
        priority: z.enum(["high", "normal", "low"]).nullable().optional(),
        badge: z.string().nullable().optional(),
      }),
      description: "Semantic card panel with heading and intent styling",
    },
    RunSummary: {
      props: z.object({
        status: z.string(),
        steps: z.string(),
        requestStatus: z.string(),
        finalResponse: z.string(),
        statusTone: z.enum(["neutral", "success", "warning", "danger", "info"]).nullable().optional(),
        progressPct: z.number().int().min(0).max(100).nullable().optional(),
        updatedAt: z.string().nullable().optional(),
        primaryHint: z.string().nullable().optional(),
      }),
      description: "Mission-control summary block for run status",
    },
    EventList: {
      props: z.object({
        emptyLabel: z.string(),
        view: z.enum(["default", "timeline", "ledger", "gate", "conflict"]).nullable().optional(),
        items: z.array(
          z.object({
            title: z.string(),
            meta: z.string(),
            body: z.string(),
            tone: z.enum(["default", "ok", "error"]).nullable(),
            badge: z.string().nullable().optional(),
            secondary: z.string().nullable().optional(),
          })
        ),
      }),
      description: "Role-specific list renderer for timeline, ledger, gate, and conflict views",
    },
    GraphStats: {
      props: z.object({
        nodeCount: z.string(),
        edgeCount: z.string(),
        updatedAt: z.string(),
        staleCount: z.string().nullable().optional(),
        conflictCount: z.string().nullable().optional(),
        promotedCount: z.string().nullable().optional(),
        blockedCount: z.string().nullable().optional(),
      }),
      description: "Graph KPIs and risk badges",
    },
    GraphView: {
      props: z.object({
        nodes: z.array(z.record(z.string(), z.unknown())),
        edges: z.array(z.record(z.string(), z.unknown())),
        initialLayout: z.enum(["radial", "layered"]).nullable().optional(),
      }),
      description: "Interactive graph explorer with layout toggles and node inspector",
    },
    JsonBlock: {
      props: z.object({
        label: z.string(),
        value: z.unknown(),
        openByDefault: z.boolean().nullable().optional(),
        searchable: z.boolean().nullable().optional(),
        maxHeight: z.number().int().positive().nullable().optional(),
      }),
      description: "Debug payload inspector with filter and copy utilities",
    },
  },
  actions: {},
});

const { registry } = defineRegistry(catalog, {
  components: {
    Stack: ({ children }) => <div className="jr-stack">{children}</div>,
    DashboardGrid: ({ props, children }) => {
      const minWidth = Number.isFinite(Number(props.minColumnWidth))
        ? Math.max(220, Number(props.minColumnWidth))
        : 330;
      const gridStyle = { "--jr-min-column-width": `${minWidth}px` };
      return (
        <div className="jr-dashboard-grid" style={gridStyle}>
          {children}
        </div>
      );
    },
    Panel: ({ props, children }) => {
      const variant = safeText(props.variant || "info").toLowerCase();
      const priority = safeText(props.priority || "normal").toLowerCase();
      return (
        <article className={`jr-panel ${props.span === "2" ? "span-2" : ""} variant-${variant} priority-${priority}`}>
          <div className="jr-panel-header">
            <h2>{props.title}</h2>
            {props.badge ? <span className="jr-panel-badge">{props.badge}</span> : null}
          </div>
          {props.subtitle ? <p className="jr-subtitle">{props.subtitle}</p> : null}
          {children}
        </article>
      );
    },
    RunSummary: ({ props }) => {
      const tone = safeText(props.statusTone || "neutral").toLowerCase();
      const progressPct = clamp(
        safeInt(props.progressPct, safeText(props.status).toLowerCase() === "completed" ? 100 : 0),
        0,
        100
      );
      return (
        <div className={`jr-run-summary tone-${tone}`}>
          <div className="jr-run-summary-top">
            <div className={`jr-status-chip tone-${tone}`}>{props.status || "Unknown"}</div>
            <div className="jr-run-summary-steps">steps: {props.steps || "-"}</div>
            <div className="jr-run-summary-updated">{props.updatedAt ? `updated: ${props.updatedAt}` : "updated: -"}</div>
          </div>
          <div className="jr-progress-wrap" aria-label="Run progress">
            <div className="jr-progress-bar" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="jr-meta-row">
            <span className="jr-meta-label">Request:</span>
            <span>{props.requestStatus || "-"}</span>
          </div>
          {props.primaryHint ? (
            <div className="jr-meta-row">
              <span className="jr-meta-label">Hint:</span>
              <span>{props.primaryHint}</span>
            </div>
          ) : null}
          <div className="jr-meta-row">
            <span className="jr-meta-label">Final response:</span>
          </div>
          <pre className="jr-pre">{props.finalResponse || "No final response yet."}</pre>
        </div>
      );
    },
    EventList: ({ props }) => {
      if (!props.items.length) {
        return <p className="jr-empty">{props.emptyLabel}</p>;
      }
      const view = safeText(props.view || "default").toLowerCase();
      return (
        <ul className={`jr-event-list view-${view}`}>
          {props.items.map((item, idx) => (
            <li key={`${item.title}-${idx}`} className={`jr-event-item tone-${item.tone || "default"} view-${view}`}>
              <div className="jr-event-item-head">
                <strong>{item.title}</strong>
                {item.badge ? <span className="jr-event-badge">{item.badge}</span> : null}
              </div>
              <div className="jr-event-meta">{item.meta}</div>
              {item.secondary ? <div className="jr-event-secondary">{item.secondary}</div> : null}
              <div className="jr-event-body">{item.body}</div>
            </li>
          ))}
        </ul>
      );
    },
    GraphStats: ({ props }) => {
      const badges = [
        { label: "stale", value: props.staleCount },
        { label: "conflicts", value: props.conflictCount },
        { label: "promoted", value: props.promotedCount },
        { label: "blocked", value: props.blockedCount },
      ].filter((item) => safeText(item.value).trim());
      return (
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
          {badges.length > 0 ? (
            <div className="jr-stat-badges">
              {badges.map((item) => (
                <span key={item.label} className={`jr-stat-badge label-${item.label}`}>
                  {item.label}: {item.value}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      );
    },
    GraphView: ({ props }) => {
      const width = 1320;
      const height = 540;
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

      const [layoutMode, setLayoutMode] = useState(
        safeText(props.initialLayout || "radial").toLowerCase() === "layered" ? "layered" : "radial"
      );
      const [zoomPct, setZoomPct] = useState(100);
      const [panX, setPanX] = useState(0);
      const [panY, setPanY] = useState(0);
      const [selectedNodeId, setSelectedNodeId] = useState("");
      const dragStateRef = useRef(null);

      useEffect(() => {
        if (!selectedNodeId && nodes[0]) {
          setSelectedNodeId(nodes[0].id);
        }
      }, [nodes, selectedNodeId]);

      if (!nodes.length) {
        return <p className="jr-empty">No graph nodes to render yet.</p>;
      }

      const layout = layoutMode === "layered"
        ? computeLayeredLayout(nodes, edges, width, height)
        : computeGraphLayout(nodes, width, height);
      const { positioned, byId } = layout;
      const visibleEdges = edges.filter((edge) => byId.has(edge.from) && byId.has(edge.to)).slice(0, 120);
      const zoom = clamp(zoomPct / 100, 0.45, 2.5);
      const selectedNode = byId.get(selectedNodeId) || positioned[0];
      const relatedEdges = visibleEdges.filter(
        (edge) => edge.from === selectedNode?.id || edge.to === selectedNode?.id
      );

      const onPointerDown = (event) => {
        dragStateRef.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      };

      const onPointerMove = (event) => {
        if (!dragStateRef.current) {
          return;
        }
        const deltaX = event.clientX - dragStateRef.current.x;
        const deltaY = event.clientY - dragStateRef.current.y;
        dragStateRef.current = { x: event.clientX, y: event.clientY };
        setPanX((value) => clamp(value + deltaX, -width / 2, width / 2));
        setPanY((value) => clamp(value + deltaY, -height / 2, height / 2));
      };

      const onPointerUp = (event) => {
        dragStateRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      };

      return (
        <div className="jr-graph-shell">
          <div className="jr-graph-toolbar">
            <div className="jr-graph-toolbar-group">
              <button
                type="button"
                className={layoutMode === "radial" ? "is-active" : ""}
                onClick={() => setLayoutMode("radial")}
              >
                Radial
              </button>
              <button
                type="button"
                className={layoutMode === "layered" ? "is-active" : ""}
                onClick={() => setLayoutMode("layered")}
              >
                Layered
              </button>
            </div>
            <div className="jr-graph-toolbar-group">
              <button type="button" onClick={() => setZoomPct((value) => clamp(value + 10, 50, 250))}>
                Zoom +
              </button>
              <button type="button" onClick={() => setZoomPct((value) => clamp(value - 10, 50, 250))}>
                Zoom -
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomPct(100);
                  setPanX(0);
                  setPanY(0);
                }}
              >
                Reset View
              </button>
            </div>
            <label className="jr-graph-zoom-label">
              Zoom
              <input
                type="range"
                min="50"
                max="250"
                value={zoomPct}
                onChange={(event) => setZoomPct(safeInt(event.target.value, 100))}
              />
              <span>{zoomPct}%</span>
            </label>
          </div>
          <div className="jr-graph-main">
            <div className="jr-graph-wrap">
              <svg
                className="jr-graph-canvas"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Session graph"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#839cc1" />
                  </marker>
                </defs>
                <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
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
                    <g
                      key={node.id}
                      className={`jr-graph-node ${selectedNode?.id === node.id ? "is-selected" : ""}`}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      <circle r="22" className={`jr-node-dot type-${safeText(node.type).toLowerCase()}`} />
                      <text className="jr-node-title" y="-30" textAnchor="middle">
                        {node.type}
                      </text>
                      <text className="jr-node-subtitle" y="42" textAnchor="middle">
                        {node.id.length > 26 ? `${node.id.slice(0, 23)}...` : node.id}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>
            <aside className="jr-graph-inspector" aria-label="Graph node inspector">
              <h3>Node Inspector</h3>
              {selectedNode ? (
                <>
                  <div className="jr-inspector-row">
                    <span>id</span>
                    <strong>{selectedNode.id}</strong>
                  </div>
                  <div className="jr-inspector-row">
                    <span>type</span>
                    <strong>{selectedNode.type}</strong>
                  </div>
                  <div className="jr-inspector-row">
                    <span>connected edges</span>
                    <strong>{relatedEdges.length}</strong>
                  </div>
                  <pre className="jr-pre">{pretty(selectedNode.raw)}</pre>
                </>
              ) : (
                <p className="jr-empty">Select a node to inspect payload details.</p>
              )}
            </aside>
          </div>
          <p className="jr-hint">
            Rendering {positioned.length} nodes and {visibleEdges.length} edges. Drag to pan, click nodes to inspect.
          </p>
        </div>
      );
    },
    JsonBlock: ({ props }) => {
      const [isOpen, setIsOpen] = useState(Boolean(props.openByDefault));
      const [query, setQuery] = useState("");
      const [copyState, setCopyState] = useState("");
      const rawText = pretty(props.value);
      const searchable = props.searchable !== false;
      const filteredText = query.trim()
        ? rawText
            .split("\n")
            .filter((line) => line.toLowerCase().includes(query.toLowerCase()))
            .join("\n")
        : rawText;
      const maxHeight = Number.isFinite(Number(props.maxHeight))
        ? Math.max(120, Number(props.maxHeight))
        : 280;

      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(rawText);
          setCopyState("Copied");
        } catch (_error) {
          setCopyState("Copy failed");
        } finally {
          window.setTimeout(() => setCopyState(""), 1500);
        }
      };

      return (
        <details className="jr-json-block" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
          <summary>{props.label}</summary>
          <div className="jr-json-toolbar">
            {searchable ? (
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter lines..."
                aria-label={`${props.label} filter`}
              />
            ) : (
              <span className="jr-empty">Search disabled</span>
            )}
            <button type="button" onClick={onCopy}>
              {copyState || "Copy"}
            </button>
          </div>
          {query.trim() && !filteredText ? <p className="jr-empty">No lines match "{query}".</p> : null}
          <pre className="jr-pre" style={{ maxHeight: `${maxHeight}px` }}>
            {filteredText || rawText}
          </pre>
        </details>
      );
    },
  },
});

function buildDashboardSpec({ runData, graphData, memoryData, glassCaseData, requestStatus }) {
  const graph = pickGraph(graphData);
  const nodes = asArray(graph.nodes);
  const edges = asArray(graph.edges);
  const runStatus = runData ? (runData.ok ? "Completed" : "Needs attention") : "No run yet";
  const steps = runData && runData.steps_executed !== undefined ? safeText(runData.steps_executed) : "-";
  const finalResponse = safeText(runData?.final_response || runData?.response || runData?.output || runData?.error || "");
  const projections = pickProjections(glassCaseData);
  const timelineItems = buildRuntimeTimelineItems(glassCaseData, runData);
  const toolItems = buildToolItems(runData);
  const memoryItems = buildMemoryItems(memoryData);
  const recentNodeItems = buildRecentNodeItems(graphData);
  const ontologyItems = buildOntologyItems(glassCaseData);
  const coordinationItems = buildCoordinationItems(glassCaseData);
  const toolAccessItems = buildToolAccessItems(glassCaseData);
  const receiptArtifactItems = buildReceiptArtifactItems(glassCaseData);
  const gateItems = buildVerificationGateItems(glassCaseData);
  const freshnessConflictItems = buildFreshnessConflictItems(glassCaseData);
  const verificationCounts = isObject(projections.verification_gates) ? projections.verification_gates.counts || {} : {};
  const freshnessCounts = isObject(projections.freshness_conflicts) ? projections.freshness_conflicts.counts || {} : {};

  const nodeCount = safeText(graph?.counts?.nodes ?? graph?.node_count ?? graph?.nodes_count ?? nodes.length ?? "-");
  const edgeCount = safeText(graph?.counts?.edges ?? graph?.edge_count ?? graph?.edges_count ?? edges.length ?? "-");
  const updatedAt = safeText(graph?.updated_at || graph?.updatedAt || graph?.ts || new Date().toLocaleTimeString());
  const projectionUpdatedAt = safeText(glassCaseData?.generated_at || updatedAt);
  const runStatusTone = runStatus === "Completed" ? "success" : runStatus === "Needs attention" ? "warning" : "neutral";
  const runProgress = runStatus === "Completed" ? 100 : runData ? 78 : 0;
  const primaryHint = runStatus === "Needs attention"
    ? "Inspect tool events and verification gates to unblock promotion."
    : "Use Refresh controls to update projections after each step.";

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
        props: { minColumnWidth: 340 },
        children: [
          "runPanel",
          "timelinePanel",
          "toolsPanel",
          "coordinationPanel",
          "verificationPanel",
          "freshnessPanel",
          "memoryPanel",
          "receiptPanel",
          "ontologyPanel",
          "accessPanel",
          "graphPanel",
        ],
      },
      runPanel: {
        type: "Panel",
        props: { title: "Run Status + Final Response", subtitle: null, span: "1", variant: "system", priority: "high", badge: "Cockpit" },
        children: ["runSummary", "runRaw", "projectionRaw"],
      },
      runSummary: {
        type: "RunSummary",
        props: {
          status: runStatus,
          steps,
          requestStatus: requestStatus || "-",
          finalResponse,
          statusTone: runStatusTone,
          progressPct: runProgress,
          updatedAt: projectionUpdatedAt,
          primaryHint,
        },
      },
      runRaw: {
        type: "JsonBlock",
        props: {
          label: "Raw run payload",
          value: runData || {},
          openByDefault: false,
          searchable: true,
          maxHeight: 260,
        },
      },
      projectionRaw: {
        type: "JsonBlock",
        props: {
          label: "Raw glass-case projections",
          value: projections || {},
          openByDefault: false,
          searchable: true,
          maxHeight: 260,
        },
      },
      timelinePanel: {
        type: "Panel",
        props: { title: "Panel 1: Runtime Timeline", subtitle: `updated: ${projectionUpdatedAt}`, span: "1", variant: "info", priority: "high" },
        children: ["timelineList"],
      },
      timelineList: {
        type: "EventList",
        props: {
          emptyLabel: "No timeline events found.",
          view: "timeline",
          items: timelineItems,
        },
      },
      toolsPanel: {
        type: "Panel",
        props: { title: "Tool Events", subtitle: null, span: "1", variant: "system" },
        children: ["toolsList"],
      },
      toolsList: {
        type: "EventList",
        props: {
          emptyLabel: "No tool events found.",
          view: "ledger",
          items: toolItems,
        },
      },
      coordinationPanel: {
        type: "Panel",
        props: {
          title: "Panel 4: Coordination State (Swarm)",
          subtitle: "queue -> claimed -> verify_pending -> done/failed",
          span: "1",
          variant: "info",
        },
        children: ["coordinationList"],
      },
      coordinationList: {
        type: "EventList",
        props: {
          emptyLabel: "No coordination state yet.",
          view: "timeline",
          items: coordinationItems,
        },
      },
      verificationPanel: {
        type: "Panel",
        props: { title: "Panel 7: Verification Gates", subtitle: "why blocked / why promoted", span: "1", variant: "warning" },
        children: ["verificationList"],
      },
      verificationList: {
        type: "EventList",
        props: {
          emptyLabel: "No verification gate records yet.",
          view: "gate",
          items: gateItems,
        },
      },
      freshnessPanel: {
        type: "Panel",
        props: {
          title: "Panel 8: Freshness + Conflict Resolver",
          subtitle: "stale nodes, lineage, and conflicts",
          span: "1",
          variant: "danger",
        },
        children: ["freshnessList"],
      },
      freshnessList: {
        type: "EventList",
        props: {
          emptyLabel: "No stale/conflict records yet.",
          view: "conflict",
          items: freshnessConflictItems,
        },
      },
      memoryPanel: {
        type: "Panel",
        props: { title: "Session Memory Turns (Decision Nodes)", subtitle: null, span: "1", variant: "system" },
        children: ["memoryList"],
      },
      memoryList: {
        type: "EventList",
        props: {
          emptyLabel: "No session memory turns returned.",
          view: "timeline",
          items: memoryItems,
        },
      },
      receiptPanel: {
        type: "Panel",
        props: { title: "Panel 6: Receipts + Artifacts", subtitle: "Evidence drilldown", span: "1", variant: "success" },
        children: ["receiptList"],
      },
      receiptList: {
        type: "EventList",
        props: {
          emptyLabel: "No receipts or artifacts yet.",
          view: "ledger",
          items: receiptArtifactItems,
        },
      },
      ontologyPanel: {
        type: "Panel",
        props: {
          title: "Panel 2: Ontology Explorer",
          subtitle: "entities, relationships, constraints",
          span: "1",
          variant: "system",
        },
        children: ["ontologyList"],
      },
      ontologyList: {
        type: "EventList",
        props: {
          emptyLabel: "Ontology projection unavailable.",
          view: "ledger",
          items: ontologyItems,
        },
      },
      accessPanel: {
        type: "Panel",
        props: { title: "Panel 5: Tool Access Matrix", subtitle: "role-scoped allow/deny", span: "1", variant: "warning" },
        children: ["accessList"],
      },
      accessList: {
        type: "EventList",
        props: {
          emptyLabel: "No tool access matrix data available.",
          view: "ledger",
          items: toolAccessItems,
        },
      },
      graphPanel: {
        type: "Panel",
        props: {
          title: "Panel 3: Context Graph View",
          subtitle: "interactive explorer: radial/layered layouts + inspector",
          span: "2",
          variant: "info",
          priority: "high",
        },
        children: ["graphStats", "graphView", "graphRecent", "graphRaw"],
      },
      graphStats: {
        type: "GraphStats",
        props: {
          nodeCount,
          edgeCount,
          updatedAt,
          staleCount: safeText(freshnessCounts.stale_nodes || 0),
          conflictCount: safeText(freshnessCounts.conflicts || 0),
          promotedCount: safeText(verificationCounts.promoted || 0),
          blockedCount: safeText(verificationCounts.blocked || 0),
        },
      },
      graphView: {
        type: "GraphView",
        props: { nodes, edges, initialLayout: "radial" },
      },
      graphRecent: {
        type: "EventList",
        props: {
          emptyLabel: "No recent nodes yet.",
          view: "ledger",
          items: recentNodeItems,
        },
      },
      graphRaw: {
        type: "JsonBlock",
        props: {
          label: "Raw graph payload",
          value: graphData || {},
          openByDefault: false,
          searchable: true,
          maxHeight: 260,
        },
      },
    },
  };
}

function buildSwarmSpec({ graphData, glassCaseData, requestStatus }) {
  const projections = pickProjections(glassCaseData);
  const graph = pickGraph(graphData);
  const network = buildSwarmNetwork(glassCaseData, graphData);
  const heartbeatItems = buildSwarmHeartbeatItems(glassCaseData);
  const channelItems = buildSwarmChannelItems(glassCaseData);
  const agentItems = buildSwarmAgentActivityItems(glassCaseData);
  const coordinationItems = buildCoordinationItems(glassCaseData);
  const gateItems = buildVerificationGateItems(glassCaseData);
  const freshnessConflictItems = buildFreshnessConflictItems(glassCaseData);
  const verificationCounts = isObject(projections.verification_gates) ? projections.verification_gates.counts || {} : {};
  const freshnessCounts = isObject(projections.freshness_conflicts) ? projections.freshness_conflicts.counts || {} : {};
  const coordinationCounts = isObject(projections.coordination)
    ? projections.coordination.state_counts || projections.coordination.counts || {}
    : {};
  const generatedAt = safeText(glassCaseData?.generated_at || graph?.updated_at || new Date().toISOString());
  const swarmStatus =
    Number(freshnessCounts.conflicts || 0) > 0 || Number(verificationCounts.blocked || 0) > 0
      ? "Needs attention"
      : network.nodes.length > 0
      ? "Active"
      : "Idle";
  const swarmTone = swarmStatus === "Needs attention" ? "warning" : swarmStatus === "Active" ? "success" : "neutral";
  const swarmHint =
    swarmStatus === "Needs attention"
      ? "Resolve blocked gates/conflicts before promoting shared state."
      : "Use Refresh Glass Case to observe heartbeat and communication updates.";

  const summaryResponse = [
    `agents=${network.nodes.filter((node) => safeText(node?.type).toLowerCase() === "agent").length}`,
    `tasks=${network.nodes.filter((node) => safeText(node?.type).toLowerCase() === "task").length}`,
    `channels=${network.nodes.filter((node) => safeText(node?.type).toLowerCase() === "channel").length}`,
    `conflicts=${safeText(freshnessCounts.conflicts || 0)}`,
  ].join(" | ");

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
        props: { minColumnWidth: 340 },
        children: [
          "swarmSummaryPanel",
          "heartbeatPanel",
          "channelPanel",
          "agentPanel",
          "coordinationPanel",
          "verificationPanel",
          "freshnessPanel",
          "swarmGraphPanel",
          "swarmRawPanel",
        ],
      },
      swarmSummaryPanel: {
        type: "Panel",
        props: { title: "Swarm Status", subtitle: "Heartbeat + coordination posture", span: "1", variant: "system", priority: "high", badge: "Swarm" },
        children: ["swarmSummary"],
      },
      swarmSummary: {
        type: "RunSummary",
        props: {
          status: swarmStatus,
          steps: safeText((coordinationCounts.queue || 0) + (coordinationCounts.claimed || 0) + (coordinationCounts.active || 0)),
          requestStatus: requestStatus || "-",
          finalResponse: summaryResponse,
          statusTone: swarmTone,
          progressPct: swarmStatus === "Idle" ? 0 : swarmStatus === "Needs attention" ? 58 : 88,
          updatedAt: formatTimestamp(generatedAt),
          primaryHint: swarmHint,
        },
      },
      heartbeatPanel: {
        type: "Panel",
        props: { title: "Swarm Heartbeat", subtitle: "event loop + load signals", span: "1", variant: "info" },
        children: ["heartbeatList"],
      },
      heartbeatList: {
        type: "EventList",
        props: {
          emptyLabel: "No heartbeat metrics available yet.",
          view: "timeline",
          items: heartbeatItems,
        },
      },
      channelPanel: {
        type: "Panel",
        props: { title: "Communication Channels", subtitle: "task channels and reassign paths", span: "1", variant: "success" },
        children: ["channelList"],
      },
      channelList: {
        type: "EventList",
        props: {
          emptyLabel: "No multi-agent channels detected in current session.",
          view: "ledger",
          items: channelItems,
        },
      },
      agentPanel: {
        type: "Panel",
        props: { title: "Agent Activity", subtitle: "per-agent event stream summary", span: "1", variant: "system" },
        children: ["agentList"],
      },
      agentList: {
        type: "EventList",
        props: {
          emptyLabel: "No agent activity found.",
          view: "timeline",
          items: agentItems,
        },
      },
      coordinationPanel: {
        type: "Panel",
        props: { title: "Coordination State", subtitle: "queue -> claimed -> verify_pending -> done/failed", span: "1", variant: "warning" },
        children: ["coordinationList"],
      },
      coordinationList: {
        type: "EventList",
        props: {
          emptyLabel: "No coordination state available.",
          view: "timeline",
          items: coordinationItems,
        },
      },
      verificationPanel: {
        type: "Panel",
        props: { title: "Verification Gates", subtitle: "promotion requires evidence", span: "1", variant: "warning" },
        children: ["verificationList"],
      },
      verificationList: {
        type: "EventList",
        props: {
          emptyLabel: "No verification gate records yet.",
          view: "gate",
          items: gateItems,
        },
      },
      freshnessPanel: {
        type: "Panel",
        props: { title: "Freshness + Conflicts", subtitle: "stale state + contradiction handling", span: "1", variant: "danger" },
        children: ["freshnessList"],
      },
      freshnessList: {
        type: "EventList",
        props: {
          emptyLabel: "No freshness/conflict records yet.",
          view: "conflict",
          items: freshnessConflictItems,
        },
      },
      swarmGraphPanel: {
        type: "Panel",
        props: {
          title: "Swarm Network",
          subtitle: "agents ↔ channels ↔ tasks (derived from live projections)",
          span: "2",
          variant: "info",
          priority: "high",
          badge: "Live",
        },
        children: ["swarmGraphStats", "swarmGraphView"],
      },
      swarmGraphStats: {
        type: "GraphStats",
        props: {
          nodeCount: safeText(network.nodes.length),
          edgeCount: safeText(network.edges.length),
          updatedAt: formatTimestamp(generatedAt),
          staleCount: safeText(freshnessCounts.stale_nodes || 0),
          conflictCount: safeText(freshnessCounts.conflicts || 0),
          promotedCount: safeText(verificationCounts.promoted || 0),
          blockedCount: safeText(verificationCounts.blocked || 0),
        },
      },
      swarmGraphView: {
        type: "GraphView",
        props: {
          nodes: network.nodes,
          edges: network.edges,
          initialLayout: "layered",
        },
      },
      swarmRawPanel: {
        type: "Panel",
        props: {
          title: "Raw Swarm Snapshot",
          subtitle: "coordination + gate + conflict payloads",
          span: "2",
          variant: "system",
        },
        children: ["swarmRawJson"],
      },
      swarmRawJson: {
        type: "JsonBlock",
        props: {
          label: "swarm_projection",
          value: {
            coordination: projections.coordination || {},
            verification_gates: projections.verification_gates || {},
            freshness_conflicts: projections.freshness_conflicts || {},
            runtime_timeline: projections.runtime_timeline || [],
          },
          openByDefault: false,
          searchable: true,
          maxHeight: 300,
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
    badge: "registry",
  }));

  const demoTimelineEvents = [
    {
      title: "16:21:04 | bedrock_infer",
      meta: "turn 3 | actor: planner-main",
      body: "Generated tool_call action and routed to resolve_identity.",
      tone: "default",
      badge: "timeline",
    },
    {
      title: "16:21:08 | resolve_identity",
      meta: "ok: true | status: success",
      body: "Caller identity resolved and normalized for the run.",
      tone: "ok",
      badge: "timeline",
    },
  ];

  const demoLedgerEvents = [
    {
      title: "resolve_identity",
      meta: "ok: true | output.status: success",
      body: "Resolved caller identity and returned account metadata.",
      tone: "ok",
      badge: "receipt",
      secondary: "s3://cew-artifacts-demo/workshop-artifacts/run/resolve_identity-call.log",
    },
    {
      title: "external.crm_lookup",
      meta: "ok: false | output.status: stub_not_implemented",
      body: "Deliberate stub to show placeholder behavior before external connectors land.",
      tone: "error",
      badge: "artifact",
      secondary: "Connector TODO remains pending.",
    },
  ];

  const demoGateEvents = [
    {
      title: "task-demo-1 | local_gate=true | promotion_gate=true",
      meta: "state: done | verification: pass | blocked: false",
      body: "Reason: verified_promotion | test_result: node-test-1",
      tone: "ok",
      badge: "gate",
    },
    {
      title: "task-demo-2 | local_gate=true | promotion_gate=false",
      meta: "state: blocked | verification: fail | blocked: true",
      body: "Reason: missing_artifact | test_result: node-test-2",
      tone: "error",
      badge: "gate",
    },
  ];

  const demoConflictEvents = [
    {
      title: "Stale node: decision-17 | Decision",
      meta: "age_minutes: 87 | trust: unverified | version: 1",
      body: "supersedes: - | fresh_until: 2026-02-25T20:00:00Z",
      tone: "error",
      badge: "stale",
    },
    {
      title: "Conflict task: task-22 | claims: 3",
      meta: "resolved_to: worker-2 | verification: pass",
      body: "policy: latest_claim_then_verified_completion",
      tone: "default",
      badge: "conflict",
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
        props: { minColumnWidth: 340 },
        children: [
          "overviewPanel",
          "runSummaryPanel",
          "timelineEventPanel",
          "ledgerEventPanel",
          "gateEventPanel",
          "conflictEventPanel",
          "graphStatsPanel",
          "graphViewPanel",
          "jsonPanel",
          "stackPanel",
        ],
      },
      overviewPanel: {
        type: "Panel",
        props: {
          title: "Component Registry",
          subtitle: "All catalog components hydrated with role-specific demo data",
          span: "2",
          variant: "system",
          priority: "high",
          badge: "Registry",
        },
        children: ["overviewList", "overviewRaw"],
      },
      overviewList: {
        type: "EventList",
        props: {
          emptyLabel: "No catalog components configured.",
          view: "ledger",
          items: catalogItems,
        },
      },
      overviewRaw: {
        type: "JsonBlock",
        props: {
          label: "Catalog component map",
          value: COMPONENT_DESCRIPTIONS,
          openByDefault: false,
          searchable: true,
          maxHeight: 240,
        },
      },
      runSummaryPanel: {
        type: "Panel",
        props: { title: "RunSummary component", subtitle: "Mission-control flavor", span: "1", variant: "info", badge: "Cockpit" },
        children: ["runSummaryDemo"],
      },
      runSummaryDemo: {
        type: "RunSummary",
        props: {
          status: "Completed",
          steps: "3",
          requestStatus: "Demo request completed",
          finalResponse: "This is sample output that demonstrates the RunSummary component in isolation.",
          statusTone: "success",
          progressPct: 100,
          updatedAt: new Date().toLocaleTimeString(),
          primaryHint: "Open Receipts + Artifacts next for evidence drilldown.",
        },
      },
      timelineEventPanel: {
        type: "Panel",
        props: { title: "EventList: timeline", subtitle: "Chronological event rail", span: "1", variant: "info" },
        children: ["timelineEventDemo"],
      },
      timelineEventDemo: {
        type: "EventList",
        props: {
          emptyLabel: "No demo events.",
          view: "timeline",
          items: demoTimelineEvents,
        },
      },
      ledgerEventPanel: {
        type: "Panel",
        props: { title: "EventList: ledger", subtitle: "Receipts + artifacts style", span: "1", variant: "success" },
        children: ["ledgerEventDemo"],
      },
      ledgerEventDemo: {
        type: "EventList",
        props: {
          emptyLabel: "No ledger rows.",
          view: "ledger",
          items: demoLedgerEvents,
        },
      },
      gateEventPanel: {
        type: "Panel",
        props: { title: "EventList: gate", subtitle: "Verification gate outcomes", span: "1", variant: "warning" },
        children: ["gateEventDemo"],
      },
      gateEventDemo: {
        type: "EventList",
        props: {
          emptyLabel: "No gate records.",
          view: "gate",
          items: demoGateEvents,
        },
      },
      conflictEventPanel: {
        type: "Panel",
        props: { title: "EventList: conflict", subtitle: "Freshness and claim conflicts", span: "1", variant: "danger" },
        children: ["conflictEventDemo"],
      },
      conflictEventDemo: {
        type: "EventList",
        props: {
          emptyLabel: "No conflict records.",
          view: "conflict",
          items: demoConflictEvents,
        },
      },
      graphStatsPanel: {
        type: "Panel",
        props: { title: "GraphStats component", subtitle: "KPI + risk badges", span: "1", variant: "info" },
        children: ["graphStatsDemo"],
      },
      graphStatsDemo: {
        type: "GraphStats",
        props: {
          nodeCount: safeText(demoNodes.length),
          edgeCount: safeText(demoEdges.length),
          updatedAt: new Date().toLocaleTimeString(),
          staleCount: "1",
          conflictCount: "1",
          promotedCount: "4",
          blockedCount: "1",
        },
      },
      graphViewPanel: {
        type: "Panel",
        props: {
          title: "GraphView component",
          subtitle: "Interactive graph + inspector demo",
          span: "2",
          variant: "info",
          priority: "high",
          badge: "Interactive",
        },
        children: ["graphViewDemo"],
      },
      graphViewDemo: {
        type: "GraphView",
        props: {
          nodes: demoNodes,
          edges: demoEdges,
          initialLayout: "layered",
        },
      },
      jsonPanel: {
        type: "Panel",
        props: { title: "JsonBlock component", subtitle: "Filter + copy payload", span: "1", variant: "system" },
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
          openByDefault: true,
          searchable: true,
          maxHeight: 240,
        },
      },
      stackPanel: {
        type: "Panel",
        props: { title: "Stack component", subtitle: "Nested composition demo", span: "1", variant: "system" },
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
          openByDefault: true,
          searchable: false,
        },
      },
      stackBlock2: {
        type: "EventList",
        props: {
          emptyLabel: "No items.",
          view: "ledger",
          items: [
            {
              title: "Stack child B",
              meta: "component: EventList",
              body: "This item proves nested composition through Stack.",
              tone: "default",
              badge: "stack",
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

function resolveApiBases() {
  const bases = [];
  if (typeof window !== "undefined") {
    const injectedBase = safeText(window.__CEW_API_BASE_URL).trim();
    const origin = safeText(window.location?.origin).trim();
    if (injectedBase) {
      bases.push(injectedBase);
    }
    if (origin && /^https?:\/\//i.test(origin)) {
      bases.push(origin);
    }
  }

  const envBase = safeText(import.meta?.env?.VITE_CEW_API_BASE_URL).trim();
  if (envBase) {
    bases.push(envBase);
  }

  bases.push("http://127.0.0.1:8765", "http://127.0.0.1:8876");
  const unique = [];
  for (const base of bases) {
    const normalized = safeText(base).trim().replace(/\/+$/, "");
    if (!normalized || unique.includes(normalized)) {
      continue;
    }
    unique.push(normalized);
  }
  return unique;
}

function withApiBase(base, endpoint) {
  const trimmedBase = safeText(base).trim().replace(/\/+$/, "");
  const path = safeText(endpoint);
  if (!trimmedBase) {
    return path;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return path.startsWith("/") ? `${trimmedBase}${path}` : `${trimmedBase}/${path}`;
}

function isRetryableFetchError(error) {
  const message = safeText(error?.message || error).toLowerCase();
  return message.includes("failed to fetch") || message.includes("networkerror") || message.includes("load failed");
}

async function requestJson(endpoint, options) {
  const method = safeText(options?.method || "GET");
  const path = safeText(endpoint);
  const isApiPath = path.startsWith("/api/");
  const targets = isApiPath ? resolveApiBases().map((base) => withApiBase(base, path)) : [path];
  let lastError = null;

  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    const hasFallback = index < targets.length - 1;
    try {
      const response = await fetch(target, options);
      const body = await parseResponseBody(response);
      if (!response.ok) {
        if (isApiPath && hasFallback && response.status === 404) {
          continue;
        }
        throw new Error(`${method} ${target} failed: ${response.status} ${pretty(body)}`);
      }
      return body;
    } catch (error) {
      lastError = error;
      if (isApiPath && hasFallback && isRetryableFetchError(error)) {
        continue;
      }
      if (isApiPath && hasFallback) {
        const message = safeText(error?.message || error);
        if (message.includes("404")) {
          continue;
        }
      }
      throw error;
    }
  }

  if (isApiPath) {
    const lastMessage = safeText(lastError?.message || lastError || "unknown error");
    throw new Error(
      `Unable to reach workshop API for ${path}. Tried ${targets.length} endpoint(s): ${targets.join(", ")}. Last error: ${lastMessage}`
    );
  }

  throw lastError instanceof Error ? lastError : new Error(safeText(lastError || "Request failed"));
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
  const [glassCaseData, setGlassCaseData] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState("Chat ready.");
  const [chatError, setChatError] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatThreads, setChatThreads] = useState([]);
  const [chatThreadsLoading, setChatThreadsLoading] = useState(false);
  const [chatHydrating, setChatHydrating] = useState(false);

  const dashboardSpec = useMemo(
    () => buildDashboardSpec({ runData, graphData, memoryData, glassCaseData, requestStatus }),
    [runData, graphData, memoryData, glassCaseData, requestStatus]
  );
  const swarmSpec = useMemo(
    () => buildSwarmSpec({ graphData, glassCaseData, requestStatus }),
    [graphData, glassCaseData, requestStatus]
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
    if (chatSending) {
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
        if (!hasSelectedThread) {
          // Preserve an explicit new conversation key until the first turn is sent.
          setChatMessages([]);
          return;
        }
        await hydrateChatHistory(activeControls, { silent: true });
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
  }, [route, controls.session, controls.session_key, chatSending]);

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

  async function refreshGlassCase(activeControls) {
    const sessionId = encodeURIComponent(activeControls.session.trim());
    const endpoint = `/api/session/${sessionId}/glass-case?limit=300&ttl_minutes=30`;
    setRequestError(false);
    setRequestStatus("Refreshing glass-case projections...");
    const body = await requestJson(endpoint, { method: "GET", headers: { Accept: "application/json" } });
    setGlassCaseData(body || {});
    setRequestStatus(`Glass-case loaded via GET ${endpoint}`);
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
      await refreshGlassCase(activeControls);
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

  async function onRefreshGlassCase() {
    try {
      await refreshGlassCase(controls);
    } catch (error) {
      setRequestError(true);
      setRequestStatus(`Glass-case request failed: ${safeText(error?.message || error)}`);
    }
  }

  async function onRefreshSwarm() {
    try {
      await refreshGraph(controls);
      await refreshGlassCase(controls);
      setRequestError(false);
      setRequestStatus("Swarm view refreshed.");
    } catch (error) {
      setRequestError(true);
      setRequestStatus(`Swarm refresh failed: ${safeText(error?.message || error)}`);
    }
  }

  useEffect(() => {
    if (route !== ROUTES.SWARM) {
      return undefined;
    }
    const session = safeText(controls.session).trim();
    if (!session) {
      return undefined;
    }

    let cancelled = false;
    const tick = async () => {
      try {
        const active = { ...controls, session };
        await refreshGraph(active);
        await refreshGlassCase(active);
      } catch (error) {
        if (!cancelled) {
          setRequestError(true);
          setRequestStatus(`Swarm heartbeat refresh failed: ${safeText(error?.message || error)}`);
        }
      }
    };

    void tick();
    const intervalId = window.setInterval(() => {
      void tick();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [route, controls.session]);

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
    route === ROUTES.SWARM
      ? "Dedicated swarm observability: heartbeat, channels, coordination, and trust gates."
      : route === ROUTES.REGISTRY
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
        <button type="button" className={route === ROUTES.SWARM ? "is-active" : ""} onClick={() => navigateTo(ROUTES.SWARM)}>
          Swarm
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
              <button type="button" onClick={onRefreshGlassCase}>Refresh Glass Case</button>
            </div>
          </form>
          <p className={`hint ${requestError ? "is-error" : ""}`}>{requestStatus}</p>
        </section>
      ) : null}

      {route === ROUTES.SWARM ? (
        <section className="controls-card" aria-label="Swarm visualization controls">
          <h2>Swarm Visualization Controls</h2>
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
              <button type="button" id="run-harness" onClick={onRefreshSwarm}>
                Refresh Swarm Now
              </button>
              <button type="button" onClick={onRefreshGraph}>Refresh Graph</button>
              <button type="button" onClick={onRefreshGlassCase}>Refresh Glass Case</button>
            </div>
          </div>
          <p className={`hint ${requestError ? "is-error" : ""}`}>
            {requestStatus}
          </p>
          <p className="hint">Heartbeat auto-refresh runs every 3 seconds while this tab is open.</p>
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

      {route === ROUTES.SWARM ? (
        <section className="renderer-shell" aria-label="json-render swarm dashboard">
          <JsonRenderSurface spec={swarmSpec} />
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
