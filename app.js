"use strict";

const state = {
  data: null,
  taskId: null,
  pair: "all",
  model: "all",
  view: "results",
  search: ""
};

const elements = {
  viewFilter: document.querySelector("#view-filter"),
  taskFilter: document.querySelector("#task-filter"),
  modelFilter: document.querySelector("#model-filter"),
  pairFilter: document.querySelector("#pair-filter"),
  searchFilter: document.querySelector("#search-filter"),
  clearFilters: document.querySelector("#clear-filters"),
  taskNumber: document.querySelector("#task-number"),
  taskTitle: document.querySelector("#task-title"),
  taskDescription: document.querySelector("#task-description"),
  taskProtocol: document.querySelector("#task-protocol"),
  leaderboardHead: document.querySelector("#leaderboard-head"),
  leaderboardBody: document.querySelector("#leaderboard-body"),
  resultCount: document.querySelector("#result-count"),
  tableNote: document.querySelector("#table-note"),
  resultsView: document.querySelector("#results-view"),
  entityView: document.querySelector("#entity-view"),
  entityKicker: document.querySelector("#entity-kicker"),
  entityTitle: document.querySelector("#entity-title"),
  entityDescription: document.querySelector("#entity-description"),
  entityGrid: document.querySelector("#entity-grid"),
  filteredCount: document.querySelector("#filtered-count"),
  rankingMetric: document.querySelector("#ranking-metric"),
  modelCoverage: document.querySelector("#model-coverage"),
  modelTabCount: document.querySelector("#model-tab-count"),
  workflowCount: document.querySelector("#workflow-count"),
  modelCount: document.querySelector("#model-count"),
  pairCount: document.querySelector("#pair-count")
};

function getCurrentTask() {
  return state.data.tasks.find((task) => task.id === state.taskId);
}

function getRowModel(row, task) {
  return row.model || task.defaultModel || "Not reported";
}

function getTrackedModels() {
  return state.data.benchmark.models || [];
}

function getPrimaryColumn(task) {
  return task.columns.find((column) => column.key === task.rankBy);
}

function formatValue(value, type) {
  if (value === null || value === undefined) return "—";
  if (type === "percent") return `${Number(value).toFixed(value % 1 ? 2 : 1)}%`;
  if (type === "decimal") return Number(value).toFixed(4);
  return String(value);
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function readHash() {
  const [taskId, pair = "all", model = "all", view = "results"] =
    window.location.hash.slice(1).split("/");
  return {
    taskId,
    pair: decodeURIComponent(pair),
    model: decodeURIComponent(model),
    view: ["results", "models", "workflows"].includes(view) ? view : "results"
  };
}

function updateHash() {
  const hash = [
    state.taskId,
    encodeURIComponent(state.pair),
    encodeURIComponent(state.model),
    state.view
  ].join("/");
  if (window.location.hash.slice(1) !== hash) {
    history.replaceState(null, "", `#${hash}`);
  }
}

function getFilteredRows(task) {
  const query = state.search.trim().toLowerCase();
  return task.rows
    .map((row, sourceIndex) => ({
      ...row,
      model: getRowModel(row, task),
      sourceIndex
    }))
    .filter((row) => state.pair === "all" || row.pair === state.pair)
    .filter((row) => state.model === "all" || row.model === state.model)
    .filter((row) => {
      if (!query) return true;
      return [row.model, row.workflow, row.pair]
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .sort((a, b) => b[task.rankBy] - a[task.rankBy] || a.sourceIndex - b.sourceIndex);
}

function renderSelects(task) {
  const pairs = [...new Set(task.rows.map((row) => row.pair))];
  const rowModels = new Set(task.rows.map((row) => getRowModel(row, task)));
  const trackedModels = getTrackedModels();
  const trackedNames = new Set(trackedModels.map((model) => model.name));
  const legacyModels = [...rowModels].filter((model) => !trackedNames.has(model));

  elements.taskFilter.replaceChildren(
    ...state.data.tasks.map((item) => createOption(item.id, `${item.label} · ${item.title}`))
  );
  elements.modelFilter.replaceChildren(
    createOption("all", "All models"),
    ...trackedModels.map((model) =>
      createOption(
        model.name,
        rowModels.has(model.name) ? model.name : `${model.name} · awaiting runs`
      )
    ),
    ...legacyModels.map((model) => createOption(model, model))
  );
  elements.pairFilter.replaceChildren(
    createOption("all", "All ontology pairs"),
    ...pairs.map((pair) => createOption(pair, pair))
  );

  elements.taskFilter.value = state.taskId;
  elements.modelFilter.value = state.model;
  elements.pairFilter.value = state.pair;
  elements.searchFilter.value = state.search;
}

function makeCell(text, className) {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function makeDetailsRow(row, task, button) {
  const detailRow = document.createElement("tr");
  detailRow.className = "detail-row";
  detailRow.hidden = true;

  const detailCell = document.createElement("td");
  detailCell.colSpan = 6;
  const metricGrid = document.createElement("div");
  metricGrid.className = "metric-grid";

  task.columns
    .filter((column) => !["workflow", "model", "pair"].includes(column.key))
    .forEach((column) => {
      const metric = document.createElement("div");
      const label = document.createElement("span");
      const value = document.createElement("strong");
      label.textContent = column.label;
      value.textContent = formatValue(row[column.key], column.type);
      metric.append(label, value);
      metricGrid.append(metric);
    });

  detailCell.append(metricGrid);
  detailRow.append(detailCell);
  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    button.textContent = isOpen ? "View metrics" : "Hide metrics";
    detailRow.hidden = isOpen;
  });
  return detailRow;
}

function renderTable(task, rows) {
  const primary = getPrimaryColumn(task);
  const workflowColumn = task.columns.find((column) => column.key === "workflow");
  const headerRow = document.createElement("tr");
  ["Rank", "Model", workflowColumn.label, "Ontology pair", primary.label, "Details"]
    .forEach((label) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = label;
      headerRow.append(th);
    });
  elements.leaderboardHead.replaceChildren(headerRow);

  const bestScore = rows.length ? Math.max(...rows.map((row) => row[task.rankBy])) : null;
  const bodyRows = [];
  let previousScore;
  let previousRank = 0;

  rows.forEach((row, index) => {
    const rank = row[task.rankBy] === previousScore ? previousRank : index + 1;
    previousScore = row[task.rankBy];
    previousRank = rank;

    const resultRow = document.createElement("tr");
    resultRow.className = "result-row";
    resultRow.append(makeCell(String(rank).padStart(2, "0"), "rank"));

    const modelCell = makeCell(row.model, "model-name");
    if (row.model === "Not reported") modelCell.classList.add("model-missing");
    resultRow.append(
      modelCell,
      makeCell(row.workflow, "workflow-name"),
      makeCell(row.pair, "pair-name")
    );

    const scoreCell = makeCell(
      formatValue(row[task.rankBy], primary.type),
      `score${row[task.rankBy] === bestScore ? " best" : ""}`
    );
    resultRow.append(scoreCell);

    const detailCell = document.createElement("td");
    const detailButton = document.createElement("button");
    detailButton.className = "detail-button";
    detailButton.type = "button";
    detailButton.textContent = "View metrics";
    detailButton.setAttribute("aria-expanded", "false");
    detailCell.append(detailButton);
    resultRow.append(detailCell);

    bodyRows.push(resultRow, makeDetailsRow(row, task, detailButton));
  });

  if (!rows.length) {
    const emptyRow = document.createElement("tr");
    const emptyCell = makeCell("No runs match the current filters.", "empty-state");
    emptyCell.colSpan = 6;
    emptyRow.append(emptyCell);
    bodyRows.push(emptyRow);
  }

  elements.leaderboardBody.replaceChildren(...bodyRows);
  elements.resultCount.textContent = rows.length;
}

function groupRows(rows, key) {
  return rows.reduce((groups, row) => {
    const value = row[key];
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(row);
    return groups;
  }, new Map());
}

function makeEntityCard(name, rows, task, kind) {
  const card = document.createElement("article");
  card.className = "entity-card";
  if (name === "Not reported") card.classList.add("entity-card-missing");
  if (!rows.length) card.classList.add("entity-card-awaiting");

  const top = document.createElement("div");
  const type = document.createElement("span");
  const title = document.createElement("h4");
  const modelMetadata = getTrackedModels().find((model) => model.name === name);
  type.textContent =
    kind === "models" && modelMetadata
      ? modelMetadata.provider
      : kind === "models" ? "Model identity" : "Workflow";
  title.textContent = name;
  top.append(type, title);

  const primary = getPrimaryColumn(task);
  const best = rows.length ? Math.max(...rows.map((row) => row[task.rankBy])) : null;
  const score = document.createElement("div");
  score.className = "entity-score";
  const scoreLabel = document.createElement("span");
  const scoreValue = document.createElement("strong");
  scoreLabel.textContent = rows.length ? `Best ${primary.label}` : "Status";
  scoreValue.textContent = rows.length
    ? formatValue(best, primary.type)
    : "Awaiting runs";
  score.append(scoreLabel, scoreValue);

  const stats = document.createElement("dl");
  const statsData = [
    ["Runs", rows.length],
    ["Models", new Set(rows.map((row) => row.model)).size],
    ["Workflows", new Set(rows.map((row) => row.workflow)).size],
    ["Pairs", new Set(rows.map((row) => row.pair)).size]
  ];
  statsData
    .filter(([label]) => !(kind === "models" && label === "Models"))
    .forEach(([label, value]) => {
      const item = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      item.append(dt, dd);
      stats.append(item);
    });

  card.append(top, score, stats);
  return card;
}

function renderEntityView(task, rows) {
  const kind = state.view;
  const key = kind === "models" ? "model" : "workflow";
  const groups = groupRows(rows, key);
  elements.entityKicker.textContent = kind === "models" ? "Model coverage" : "Workflow index";
  elements.entityTitle.textContent = kind === "models" ? "Models" : "Workflows";
  elements.entityDescription.textContent =
    kind === "models"
      ? "Model cards summarize coverage within the selected task and protocol."
      : "Workflow cards condense repeated runs across the selected ontology pairs.";

  let cards;
  if (kind === "models") {
    const query = state.search.trim().toLowerCase();
    const trackedNames = getTrackedModels().map((model) => model.name);
    const allNames = [...new Set([...trackedNames, ...groups.keys()])]
      .filter((name) => state.model === "all" || name === state.model)
      .filter((name) => !query || name.toLowerCase().includes(query));
    cards = allNames.map((name) =>
      makeEntityCard(name, groups.get(name) || [], task, kind)
    );
  } else {
    cards = [...groups.entries()].map(([name, group]) =>
      makeEntityCard(name, group, task, kind)
    );
  }

  if (!cards.length) {
    const empty = document.createElement("div");
    empty.className = "entity-empty";
    empty.textContent = "No groups match the current filters.";
    cards.push(empty);
  }
  elements.entityGrid.replaceChildren(...cards);
}

function render() {
  const task = getCurrentTask();
  if (!task) return;

  const validPairs = new Set(task.rows.map((row) => row.pair));
  const validModels = new Set([
    ...getTrackedModels().map((model) => model.name),
    ...task.rows.map((row) => getRowModel(row, task))
  ]);
  if (state.pair !== "all" && !validPairs.has(state.pair)) state.pair = "all";
  if (state.model !== "all" && !validModels.has(state.model)) state.model = "all";

  const rows = getFilteredRows(task);
  const reportedRows = rows.filter((row) => row.model !== "Not reported");
  const primary = getPrimaryColumn(task);

  elements.taskNumber.textContent = task.shortLabel;
  elements.taskTitle.textContent = task.title;
  elements.taskDescription.textContent = task.description;
  elements.taskProtocol.textContent = task.protocol;
  elements.tableNote.textContent = task.rows.some((row) => row.model)
    ? task.note
    : `${task.note} Model identities were not reported in the source results.`;
  elements.filteredCount.textContent = rows.length;
  elements.rankingMetric.textContent = primary.label;
  elements.modelCoverage.textContent = rows.length
    ? `${reportedRows.length} / ${rows.length} runs`
    : "No evaluated runs";

  renderSelects(task);
  renderTable(task, rows);
  renderEntityView(task, rows);

  elements.resultsView.hidden = state.view !== "results";
  elements.entityView.hidden = state.view === "results";
  elements.viewFilter.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  updateHash();
}

function attachEvents() {
  elements.viewFilter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    state.view = button.dataset.view;
    render();
  });
  elements.taskFilter.addEventListener("change", () => {
    state.taskId = elements.taskFilter.value;
    state.model = "all";
    state.pair = "all";
    state.search = "";
    render();
  });
  elements.modelFilter.addEventListener("change", () => {
    state.model = elements.modelFilter.value;
    render();
  });
  elements.pairFilter.addEventListener("change", () => {
    state.pair = elements.pairFilter.value;
    render();
  });
  elements.searchFilter.addEventListener("input", () => {
    state.search = elements.searchFilter.value;
    render();
  });
  elements.clearFilters.addEventListener("click", () => {
    state.model = "all";
    state.pair = "all";
    state.search = "";
    render();
  });
}

function showLoadError(error) {
  console.error("Unable to load leaderboard data", error);
  elements.taskTitle.textContent = "Benchmark data unavailable";
  elements.taskDescription.textContent =
    "The leaderboard could not load data/leaderboard.json. Serve the project through a web server and try again.";
  elements.taskProtocol.textContent = "Data load failed";
}

async function initialize() {
  try {
    const response = await fetch("data/leaderboard.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();

    const hashState = readHash();
    state.taskId = state.data.tasks.some((task) => task.id === hashState.taskId)
      ? hashState.taskId
      : state.data.tasks[0].id;
    state.pair = hashState.pair;
    state.model = hashState.model;
    state.view = hashState.view;

    const allRows = state.data.tasks.flatMap((task) => task.rows);
    const trackedModels = getTrackedModels();
    elements.workflowCount.textContent = allRows.length;
    elements.modelCount.textContent = trackedModels.length;
    elements.modelTabCount.textContent = trackedModels.length;
    elements.pairCount.textContent = new Set(allRows.map((row) => row.pair)).size;

    attachEvents();
    render();
  } catch (error) {
    showLoadError(error);
  }
}

window.addEventListener("hashchange", () => {
  if (!state.data) return;
  const hashState = readHash();
  if (state.data.tasks.some((task) => task.id === hashState.taskId)) {
    state.taskId = hashState.taskId;
    state.pair = hashState.pair;
    state.model = hashState.model;
    state.view = hashState.view;
    state.search = "";
    render();
  }
});

initialize();
