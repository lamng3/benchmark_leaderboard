"use strict";

const state = {
  data: null,
  taskId: null,
  pair: "all",
  model: "all"
};

const elements = {
  taskFilter: document.querySelector("#task-filter"),
  modelFilter: document.querySelector("#model-filter"),
  pairFilter: document.querySelector("#pair-filter"),
  taskNumber: document.querySelector("#task-number"),
  taskTitle: document.querySelector("#task-title"),
  taskDescription: document.querySelector("#task-description"),
  taskProtocol: document.querySelector("#task-protocol"),
  leaderboardHead: document.querySelector("#leaderboard-head"),
  leaderboardBody: document.querySelector("#leaderboard-body"),
  resultCount: document.querySelector("#result-count"),
  tableNote: document.querySelector("#table-note"),
  workflowCount: document.querySelector("#workflow-count"),
  modelCount: document.querySelector("#model-count"),
  pairCount: document.querySelector("#pair-count")
};

function makeButton(label, active, onClick) {
  const button = document.createElement("button");
  button.className = `filter-button${active ? " active" : ""}`;
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-pressed", String(active));
  button.addEventListener("click", onClick);
  return button;
}

function getCurrentTask() {
  return state.data.tasks.find((task) => task.id === state.taskId);
}

function getRowModel(row, task) {
  return row.model || task.defaultModel || "Not reported";
}

function readHash() {
  const [taskId, pair = "all", model = "all"] = window.location.hash.slice(1).split("/");
  return {
    taskId,
    pair: decodeURIComponent(pair),
    model: decodeURIComponent(model)
  };
}

function updateHash() {
  const hash = `${state.taskId}/${encodeURIComponent(state.pair)}/${encodeURIComponent(state.model)}`;
  if (window.location.hash.slice(1) !== hash) {
    history.replaceState(null, "", `#${hash}`);
  }
}

function renderTaskFilter() {
  elements.taskFilter.replaceChildren();
  state.data.tasks.forEach((task) => {
    elements.taskFilter.append(
      makeButton(task.label, task.id === state.taskId, () => {
        state.taskId = task.id;
        state.pair = "all";
        state.model = "all";
        render();
      })
    );
  });
}

function renderPairFilter(task) {
  const pairs = [...new Set(task.rows.map((row) => row.pair))];
  elements.pairFilter.replaceChildren();
  elements.pairFilter.append(
    makeButton("Overall", state.pair === "all", () => {
      state.pair = "all";
      render();
    })
  );

  pairs.forEach((pair) => {
    elements.pairFilter.append(
      makeButton(pair, state.pair === pair, () => {
        state.pair = pair;
        render();
      })
    );
  });
}

function renderModelFilter(task) {
  const models = [...new Set(task.rows.map((row) => getRowModel(row, task)))];
  elements.modelFilter.replaceChildren();
  elements.modelFilter.append(
    makeButton("All models", state.model === "all", () => {
      state.model = "all";
      render();
    })
  );

  models.forEach((model) => {
    elements.modelFilter.append(
      makeButton(model, state.model === model, () => {
        state.model = model;
        render();
      })
    );
  });
}

function formatValue(value, type) {
  if (value === null || value === undefined) return "—";
  if (type === "percent") return `${Number(value).toFixed(value % 1 ? 2 : 1)}%`;
  if (type === "decimal") return Number(value).toFixed(4);
  return String(value);
}

function renderTable(task) {
  const rows = task.rows
    .map((row, sourceIndex) => ({
      ...row,
      model: getRowModel(row, task),
      sourceIndex
    }))
    .filter((row) => state.pair === "all" || row.pair === state.pair)
    .filter((row) => state.model === "all" || row.model === state.model)
    .sort((a, b) => b[task.rankBy] - a[task.rankBy] || a.sourceIndex - b.sourceIndex);

  const headerRow = document.createElement("tr");
  ["Rank", ...task.columns.map((column) => column.label)].forEach((label) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    headerRow.append(th);
  });
  elements.leaderboardHead.replaceChildren(headerRow);

  const bestScore = Math.max(...rows.map((row) => row[task.rankBy]));
  let previousScore;
  let previousRank = 0;

  const bodyRows = rows.map((row, index) => {
    const rank =
      row[task.rankBy] === previousScore ? previousRank : index + 1;
    previousScore = row[task.rankBy];
    previousRank = rank;

    const tr = document.createElement("tr");
    const rankCell = document.createElement("td");
    rankCell.className = "rank";
    rankCell.textContent = String(rank).padStart(2, "0");
    tr.append(rankCell);

    task.columns.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = formatValue(row[column.key], column.type);

      if (column.key === "workflow") td.classList.add("workflow-name");
      if (column.type === "model") td.classList.add("model-name");
      if (column.type === "pair") td.classList.add("pair-name");
      if (column.primary) td.classList.add("score");
      if (column.primary && row[column.key] === bestScore) td.classList.add("best");

      tr.append(td);
    });
    return tr;
  });

  if (!bodyRows.length) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.className = "empty-state";
    emptyCell.colSpan = task.columns.length + 1;
    emptyCell.textContent = "No runs match this model and ontology pair.";
    emptyRow.append(emptyCell);
    bodyRows.push(emptyRow);
  }

  elements.leaderboardBody.replaceChildren(...bodyRows);
  elements.resultCount.textContent = rows.length;
}

function render() {
  const task = getCurrentTask();
  if (!task) return;

  const validPairs = new Set(task.rows.map((row) => row.pair));
  const validModels = new Set(task.rows.map((row) => getRowModel(row, task)));
  if (state.pair !== "all" && !validPairs.has(state.pair)) state.pair = "all";
  if (state.model !== "all" && !validModels.has(state.model)) state.model = "all";

  elements.taskNumber.textContent = task.shortLabel;
  elements.taskTitle.textContent = task.title;
  elements.taskDescription.textContent = task.description;
  elements.taskProtocol.textContent = task.protocol;
  const hasReportedModel = task.rows.some((row) => row.model);
  elements.tableNote.textContent = hasReportedModel
    ? task.note
    : `${task.note} Model identities were not reported in the source results.`;

  renderTaskFilter();
  renderModelFilter(task);
  renderPairFilter(task);
  renderTable(task);
  updateHash();
}

function showLoadError(error) {
  console.error("Unable to load leaderboard data", error);
  elements.taskTitle.textContent = "Benchmark data unavailable";
  elements.taskDescription.textContent =
    "The leaderboard could not load data/leaderboard.json. Serve the project through a local web server and try again.";
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

    const allRows = state.data.tasks.flatMap((task) => task.rows);
    const reportedModels = new Set(
      state.data.tasks.flatMap((task) =>
        task.rows.map((row) => row.model).filter(Boolean)
      )
    );
    elements.workflowCount.textContent = allRows.length;
    elements.modelCount.textContent = reportedModels.size;
    elements.pairCount.textContent = new Set(allRows.map((row) => row.pair)).size;
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
    render();
  }
});

initialize();
