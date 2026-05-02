/* ─── Circuit Lab Simulation Engine ──────────────────────────────────────
   SVG-based drag-and-drop circuit builder with live simulation.
   Components: Battery, Switch, Light Bulb, Buzzer, Resistor, LED
─────────────────────────────────────────────────────────────────────── */

/* ── Component definitions ── */
const COMP_DEFS = {
  battery: {
    label: 'Battery',
    w: 110, h: 60,
    terminals: { pos: [110, 30], neg: [0, 30] },
    symbol: (st) => `
      <rect class="comp-outline" x="-4" y="-4" width="118" height="68" rx="6"/>
      <line x1="0" y1="30" x2="38" y2="30" stroke="#374151" stroke-width="2"/>
      <line x1="72" y1="30" x2="110" y2="30" stroke="#374151" stroke-width="2"/>
      <line x1="38" y1="14" x2="38" y2="46" stroke="#374151" stroke-width="4"/>
      <line x1="47" y1="20" x2="47" y2="40" stroke="#374151" stroke-width="2"/>
      <line x1="56" y1="14" x2="56" y2="46" stroke="#374151" stroke-width="4"/>
      <line x1="65" y1="20" x2="65" y2="40" stroke="#374151" stroke-width="2"/>
      <text x="15" y="22" font-family="Inter,sans-serif" font-size="9" fill="#6b7280">−</text>
      <text x="84" y="22" font-family="Inter,sans-serif" font-size="11" fill="#6b7280">+</text>
      <text x="55" y="54" class="comp-label-text">9V</text>
    `
  },
  switch: {
    label: 'Switch',
    w: 90, h: 60,
    terminals: { in: [0, 30], out: [90, 30] },
    symbol: (st) => {
      const arm = st === 'closed'
        ? `<line x1="18" y1="30" x2="72" y2="30" stroke="#374151" stroke-width="2.5"/>`
        : `<line x1="18" y1="30" x2="68" y2="12" stroke="#374151" stroke-width="2.5"/>`;
      return `
      <rect class="comp-outline" x="-4" y="-4" width="98" height="68" rx="6"/>
      <line x1="0" y1="30" x2="18" y2="30" stroke="#374151" stroke-width="2"/>
      <line x1="72" y1="30" x2="90" y2="30" stroke="#374151" stroke-width="2"/>
      <circle cx="18" cy="30" r="3.5" fill="#374151"/>
      <circle cx="72" cy="30" r="3.5" fill="#374151"/>
      ${arm}
      <text x="45" y="54" class="comp-label-text">${st === 'closed' ? 'ON' : 'OFF'}</text>
      `;
    }
  },
  bulb: {
    label: 'Light Bulb',
    w: 80, h: 100,
    terminals: { top: [40, 0], bottom: [40, 100] },
    symbol: (st, glowing) => {
      const fill = glowing ? '#fef08a' : 'white';
      const glow = glowing ? 'class="bulb-glow"' : '';
      return `
      <rect class="comp-outline" x="-4" y="-4" width="88" height="108" rx="6"/>
      <line x1="40" y1="0" x2="40" y2="22" stroke="#374151" stroke-width="2"/>
      <line x1="40" y1="78" x2="40" y2="100" stroke="#374151" stroke-width="2"/>
      <circle ${glow} cx="40" cy="50" r="26" fill="${fill}" stroke="#374151" stroke-width="1.8"/>
      <line x1="26" y1="36" x2="54" y2="64" stroke="#374151" stroke-width="1.5"/>
      <line x1="54" y1="36" x2="26" y2="64" stroke="#374151" stroke-width="1.5"/>
      <rect x="28" y="73" width="24" height="8" rx="2" fill="#e5e7eb" stroke="#374151" stroke-width="1.2"/>
      <text x="40" y="96" class="comp-label-text">Bulb</text>
      `;
    }
  },
  wire: {
    label: 'Wire',
    w: 80, h: 40,
    terminals: { left: [0, 20], right: [80, 20] },
    symbol: () => `
      <rect class="comp-outline" x="-4" y="-4" width="88" height="48" rx="6"/>
      <line x1="0" y1="20" x2="80" y2="20" stroke="#374151" stroke-width="2.5" stroke-dasharray="5 3"/>
      <text x="40" y="35" class="comp-label-text">Wire</text>
    `
  },
  buzzer: {
    label: 'Buzzer',
    w: 80, h: 80,
    terminals: { pos: [0, 40], neg: [80, 40] },
    symbol: () => `
      <rect class="comp-outline" x="-4" y="-4" width="88" height="88" rx="6"/>
      <line x1="0" y1="40" x2="20" y2="40" stroke="#374151" stroke-width="2"/>
      <line x1="60" y1="40" x2="80" y2="40" stroke="#374151" stroke-width="2"/>
      <rect x="20" y="22" width="40" height="36" rx="4" fill="#f3f4f6" stroke="#374151" stroke-width="1.8"/>
      <path d="M36,28 Q44,40 36,52" fill="none" stroke="#374151" stroke-width="1.5"/>
      <path d="M42,24 Q52,40 42,56" fill="none" stroke="#374151" stroke-width="1.5"/>
      <text x="40" y="72" class="comp-label-text">Buzzer</text>
    `
  },
  resistor: {
    label: 'Resistor',
    w: 100, h: 50,
    terminals: { left: [0, 25], right: [100, 25] },
    symbol: () => `
      <rect class="comp-outline" x="-4" y="-4" width="108" height="58" rx="6"/>
      <line x1="0" y1="25" x2="22" y2="25" stroke="#374151" stroke-width="2"/>
      <line x1="78" y1="25" x2="100" y2="25" stroke="#374151" stroke-width="2"/>
      <rect x="22" y="15" width="56" height="20" rx="3" fill="#fef3c7" stroke="#374151" stroke-width="1.8"/>
      <text x="50" y="44" class="comp-label-text">10 Ω</text>
    `
  },
  led: {
    label: 'LED',
    w: 80, h: 80,
    terminals: { pos: [0, 40], neg: [80, 40] },
    symbol: (st, glowing) => {
      const fill = glowing ? '#86efac' : 'white';
      return `
      <rect class="comp-outline" x="-4" y="-4" width="88" height="88" rx="6"/>
      <line x1="0" y1="40" x2="24" y2="40" stroke="#374151" stroke-width="2"/>
      <line x1="56" y1="40" x2="80" y2="40" stroke="#374151" stroke-width="2"/>
      <polygon points="24,24 24,56 56,40" fill="${fill}" stroke="#374151" stroke-width="1.8"/>
      <line x1="56" y1="24" x2="56" y2="56" stroke="#374151" stroke-width="2"/>
      ${glowing ? '<line x1="62" y1="20" x2="70" y2="12" stroke="#22c55e" stroke-width="1.5"/><line x1="68" y1="24" x2="76" y2="16" stroke="#22c55e" stroke-width="1.5"/>' : ''}
      <text x="40" y="72" class="comp-label-text">LED</text>
      `;
    }
  }
};

/* ── Simulation state ── */
let simState = {
  components: [],
  wires: [],
  nextId: 1,
  dragging: null,       // {compId, offsetX, offsetY}
  selectedComponentId: null,
  selectedWireId: null,
  wiringFrom: null,     // {compId, terminal, x, y}
  wiringMode: false,
  mouseX: 0, mouseY: 0,
  running: false,
  lastRunAttempted: false,
  lastResult: null,
  animOffset: 0,
  animTimer: null,
  svgEl: null,
  canvasEl: null,
  onStatsChange: null,  // callback
  onSelectionChange: null,
};

/* ── Public API ── */
window.CircuitSim = {
  init,
  addComponent,
  reset,
  runSimulation,
  stopSimulation,
  getStats,
  getCircuitResult,
  getSelectedComponent,
  getSelectedWire,
  selectComponent,
  selectWire,
  clearSelection,
  deleteComponent,
  deleteSelectedComponent,
  deleteWire,
  deleteSelectedWire,
  clearWires,
  setWiringMode,
  isWiringMode,
  snapshotToSVG,
  exportState,
  importState,
};

function init(svgId, canvasId, onStatsChange, onSelectionChange) {
  simState.svgEl = document.getElementById(svgId);
  simState.canvasEl = document.getElementById(canvasId);
  simState.onStatsChange = onStatsChange || (() => {});
  simState.onSelectionChange = onSelectionChange || (() => {});
  simState.components = [];
  simState.wires = [];
  simState.nextId = 1;
  simState.running = false;
  simState.lastRunAttempted = false;
  simState.lastResult = null;
  simState.wiringFrom = null;
  simState.wiringMode = false;
  simState.dragging = null;
  simState.selectedComponentId = null;
  simState.selectedWireId = null;

  setupBlankCircuit();
  bindEvents();
  render();
  updateStats();
  notifySelectionChange();
}

function createDefaultCircuitData(W = 600, H = 480) {
  // Responsive positions: use proportions of the canvas
  const cx = W / 2;
  const cy = H / 2;
  const compact = W <= 520;
  const batteryX = compact ? Math.max(16, W * 0.08) : Math.max(20, cx - W * 0.38);
  const batteryY = compact ? cy - 30 : cy - 20;
  const switchX = compact ? Math.max(132, W * 0.46) : Math.max(20, cx - W * 0.06);
  const switchY = compact ? Math.max(44, cy - H * 0.22) : Math.max(30, cy - H * 0.25);
  const bulbX = compact ? Math.min(W - 96, W * 0.66) : Math.min(W - 100, cx + W * 0.22);
  const bulbY = compact ? cy - 42 : cy - 40;

  return {
    components: [
      { id: 'bat1',  type: 'battery', x: batteryX, y: batteryY, state: null },
      { id: 'sw1',   type: 'switch',  x: switchX,  y: switchY,  state: 'open' },
      { id: 'bulb1', type: 'bulb',    x: bulbX,    y: bulbY,    state: null },
    ],
    wires: [
      { id: 'w1', from: { compId: 'bat1',  terminal: 'pos'    }, to: { compId: 'sw1',   terminal: 'in'     } },
      { id: 'w2', from: { compId: 'sw1',   terminal: 'out'    }, to: { compId: 'bulb1', terminal: 'top'    } },
      { id: 'w3', from: { compId: 'bulb1', terminal: 'bottom' }, to: { compId: 'bat1',  terminal: 'neg'    } },
    ],
    nextId: 10,
  };
}

function setupDefaultCircuit() {
  const svg = simState.svgEl;
  const svgRect = svg?.getBoundingClientRect();
  const canvasRect = simState.canvasEl?.getBoundingClientRect();
  const measuredW = canvasRect?.width || svgRect?.width || 600;
  const viewportW = window.innerWidth || measuredW;
  let W = Math.max(320, Math.min(measuredW, viewportW));
  if (W < 620) W = Math.min(W, 390);
  const H = Math.max(360, canvasRect?.height || svgRect?.height || 480);
  const defaults = createDefaultCircuitData(W, H);
  simState.components = defaults.components;
  simState.wires = defaults.wires;
  simState.nextId = defaults.nextId;
}

function setupBlankCircuit() {
  simState.components = [];
  simState.wires = [];
  simState.nextId = 1;
}

function addComponent(type) {
  const def = COMP_DEFS[type];
  if (!def) return;
  const svg = simState.svgEl;
  const rect = svg.getBoundingClientRect();
  const cx = (rect.width / 2 - def.w / 2) + (Math.random() - 0.5) * 60;
  const cy = (rect.height / 2 - def.h / 2) + (Math.random() - 0.5) * 60;
  const id = type.slice(0, 3) + (simState.nextId++);
  simState.components.push({ id, type, x: Math.max(10, cx), y: Math.max(10, cy), state: type === 'switch' ? 'open' : null });
  if (simState.running) stopSimulation();
  simState.lastRunAttempted = false;
  selectComponent(id);
  render();
  updateStats();
  return id;
}

function cloneCircuitData() {
  return {
    components: simState.components.map(c => ({ ...c })),
    wires: simState.wires.map(w => ({
      id: w.id,
      from: { ...w.from },
      to: { ...w.to },
    })),
    nextId: simState.nextId,
    lastResult: getCircuitResult(),
  };
}

function exportState() {
  return cloneCircuitData();
}

function importState(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.components) || !Array.isArray(snapshot.wires)) {
    return false;
  }
  stopSimulation();
  simState.components = snapshot.components.map(c => ({ ...c }));
  simState.wires = snapshot.wires.map(w => ({
    id: w.id,
    from: { ...w.from },
    to: { ...w.to },
  }));
  simState.nextId = snapshot.nextId || 1;
  simState.wiringFrom = null;
  simState.wiringMode = false;
  simState.dragging = null;
  simState.selectedComponentId = null;
  simState.selectedWireId = null;
  simState.lastRunAttempted = false;
  simState.lastResult = snapshot.lastResult || null;
  render();
  updateStats();
  notifySelectionChange();
  return true;
}

function reset() {
  stopSimulation();
  simState.wiringFrom = null;
  simState.wiringMode = false;
  simState.dragging = null;
  simState.selectedComponentId = null;
  simState.selectedWireId = null;
  simState.lastRunAttempted = false;
  simState.lastResult = null;
  setupBlankCircuit();
  render();
  updateStats();
  notifySelectionChange();
}

function runSimulation() {
  if (simState.animTimer) {
    cancelAnimationFrame(simState.animTimer);
    simState.animTimer = null;
  }
  const valid = analyzeCircuit();
  simState.lastRunAttempted = true;
  simState.lastResult = valid;
  simState.running = valid.closed;
  if (simState.running) {
    startAnimation();
  }
  render();
  updateStats();
  return valid;
}

function stopSimulation() {
  simState.running = false;
  if (simState.animTimer) {
    cancelAnimationFrame(simState.animTimer);
    simState.animTimer = null;
  }
  render();
  updateStats();
}

function getStats() {
  return calcStats();
}

function getCircuitResult() {
  const result = analyzeCircuit();
  simState.lastResult = result;
  return result;
}

function getSelectedComponent() {
  return simState.components.find(c => c.id === simState.selectedComponentId) || null;
}

function getSelectedWire() {
  return simState.wires.find(w => w.id === simState.selectedWireId) || null;
}

function selectComponent(compId) {
  const nextId = simState.components.some(c => c.id === compId) ? compId : null;
  if (simState.selectedComponentId === nextId && !simState.selectedWireId) return getSelectedComponent();
  simState.selectedComponentId = nextId;
  simState.selectedWireId = null;
  renderComponents();
  renderWires();
  notifySelectionChange();
  return getSelectedComponent();
}

function selectWire(wireId) {
  const nextId = simState.wires.some(w => w.id === wireId) ? wireId : null;
  if (simState.selectedWireId === nextId && !simState.selectedComponentId) return getSelectedWire();
  simState.selectedWireId = nextId;
  simState.selectedComponentId = null;
  renderWires();
  renderComponents();
  notifySelectionChange();
  return getSelectedWire();
}

function clearSelection() {
  if (!simState.selectedComponentId && !simState.selectedWireId) return;
  simState.selectedComponentId = null;
  simState.selectedWireId = null;
  renderComponents();
  renderWires();
  notifySelectionChange();
}

function deleteSelectedComponent() {
  return deleteComponent(simState.selectedComponentId);
}

function deleteSelectedWire() {
  return deleteWire(simState.selectedWireId);
}

function deleteComponent(compId) {
  if (!compId) return null;
  const comp = simState.components.find(c => c.id === compId);
  if (!comp) return null;

  if (simState.running) stopSimulation();
  simState.components = simState.components.filter(c => c.id !== compId);
  simState.wires = simState.wires.filter(w => w.from.compId !== compId && w.to.compId !== compId);
  if (simState.wiringFrom?.compId === compId) simState.wiringFrom = null;
  simState.dragging = null;
  simState.selectedComponentId = null;
  simState.selectedWireId = null;
  simState.lastRunAttempted = false;
  simState.lastResult = null;
  render();
  updateStats();
  notifySelectionChange();
  return { ...comp };
}

function deleteWire(wireId) {
  if (!wireId) return null;
  const wire = simState.wires.find(w => w.id === wireId);
  if (!wire) return null;

  if (simState.running) stopSimulation();
  simState.wires = simState.wires.filter(w => w.id !== wireId);
  if (simState.selectedWireId === wireId) simState.selectedWireId = null;
  simState.wiringFrom = null;
  simState.lastRunAttempted = false;
  simState.lastResult = null;
  render();
  updateStats();
  notifySelectionChange();
  return {
    id: wire.id,
    from: { ...wire.from },
    to: { ...wire.to },
  };
}

function clearWires() {
  if (!simState.wires.length) return 0;
  const count = simState.wires.length;
  if (simState.running) stopSimulation();
  simState.wires = [];
  simState.selectedWireId = null;
  simState.wiringFrom = null;
  simState.lastRunAttempted = false;
  simState.lastResult = null;
  render();
  updateStats();
  notifySelectionChange();
  return count;
}

function setWiringMode(enabled) {
  simState.wiringMode = Boolean(enabled);
  if (!simState.wiringMode) simState.wiringFrom = null;
  render();
  return simState.wiringMode;
}

function isWiringMode() {
  return simState.wiringMode;
}

function notifySelectionChange() {
  if (typeof simState.onSelectionChange === 'function') {
    simState.onSelectionChange(getSelectedComponent(), getSelectedWire());
  }
}

/* ── Circuit analysis ── */
function analyzeCircuit(data = simState) {
  const comps = data.components || [];
  const wires = data.wires || [];

  const batteries = comps.filter(c => c.type === 'battery');
  const hasBattery = batteries.length > 0;
  const hasLoad = comps.some(c => isLoadType(c.type));
  const switches = comps.filter(c => c.type === 'switch');
  const switchOpen = switches.some(c => c.state === 'open');

  const disconnectedTerminals = getDisconnectedTerminals(comps, wires);
  const baseResult = {
    closed: false,
    reason: 'incomplete',
    activeLoadIds: [],
    activeWireIds: [],
    warningWireIds: [],
    disconnectedTerminals,
    openSwitchIds: switches.filter(c => c.state === 'open').map(c => c.id),
    message: 'Complete the loop by connecting the battery, switch, load, and return path.',
  };

  if (!hasBattery) {
    return {
      ...baseResult,
      reason: 'no_battery',
      message: 'Add a battery to provide voltage for the circuit.',
    };
  }
  if (!hasLoad) {
    return {
      ...baseResult,
      reason: 'no_load',
      message: 'Add a load such as a light bulb, buzzer, LED, or resistor.',
    };
  }

  const bat = batteries[0];
  const startKey = terminalKey(bat.id, 'pos');
  const endKey = terminalKey(bat.id, 'neg');
  const activeLoadIds = new Set();
  const activeWireIds = new Set();
  const activePathNodeKeys = new Set();

  for (const load of comps.filter(c => isLoadType(c.type))) {
    const terminals = getComponentTerminals(load);
    if (terminals.length < 2) continue;

    const graphWithoutLoad = buildGraph(comps, wires, { excludedLoadId: load.id });
    const a = terminalKey(load.id, terminals[0]);
    const b = terminalKey(load.id, terminals[1]);
    const posToA = isReachable(graphWithoutLoad, startKey, a);
    const negToB = isReachable(graphWithoutLoad, endKey, b);
    const posToB = isReachable(graphWithoutLoad, startKey, b);
    const negToA = isReachable(graphWithoutLoad, endKey, a);

    if ((posToA && negToB) || (posToB && negToA)) {
      activeLoadIds.add(load.id);
      const path = findPathThroughLoad(comps, wires, startKey, endKey, load.id);
      for (const wireId of path.wireIds) activeWireIds.add(wireId);
      for (const nodeKey of path.nodeKeys) activePathNodeKeys.add(nodeKey);
    }
  }

  if (activeLoadIds.size > 0) {
    return {
      ...baseResult,
      closed: true,
      reason: 'closed',
      activeLoadIds: Array.from(activeLoadIds),
      activeWireIds: Array.from(activeWireIds),
      activePathNodeKeys: Array.from(activePathNodeKeys),
      warningWireIds: [],
      message: 'Circuit complete. Current is flowing through the connected load.',
    };
  }

  if (switchOpen) {
    return {
      ...baseResult,
      reason: 'switch_open',
      warningWireIds: [],
      message: 'Close the switch to complete the circuit.',
    };
  }

  return {
    ...baseResult,
    warningWireIds: wires.map(w => w.id),
    message: disconnectedTerminals.length
      ? 'A terminal is not connected. Complete the loop back to the battery.'
      : 'This load is not connected back to the battery. Check the wire path.',
  };
}

function buildGraph(comps, wires, options = {}) {
  const adj = {};
  const addAdj = (from, edge) => {
    if (!adj[from]) adj[from] = [];
    adj[from].push(edge);
  };
  const addEdge = (a, b, meta = {}) => {
    addAdj(a, { key: b, ...meta });
    addAdj(b, { key: a, ...meta });
  };

  for (const w of wires) {
    addEdge(
      terminalKey(w.from.compId, w.from.terminal),
      terminalKey(w.to.compId, w.to.terminal),
      { type: 'wire', wireId: w.id }
    );
  }

  for (const comp of comps) {
    const terminals = getComponentTerminals(comp);
    if (terminals.length < 2 || comp.type === 'battery') continue;
    if (comp.type === 'switch' && comp.state !== 'closed') continue;
    if (isLoadType(comp.type) && comp.id === options.excludedLoadId) continue;

    const isLoad = isLoadType(comp.type);
    addEdge(
      terminalKey(comp.id, terminals[0]),
      terminalKey(comp.id, terminals[1]),
      { type: 'internal', loadId: isLoad ? comp.id : null }
    );
  }

  return adj;
}

function isReachable(adj, startKey, endKey) {
  if (startKey === endKey) return true;
  const visited = new Set([startKey]);
  const queue = [startKey];

  while (queue.length) {
    const current = queue.shift();
    for (const edge of adj[current] || []) {
      if (edge.key === endKey) return true;
      if (visited.has(edge.key)) continue;
      visited.add(edge.key);
      queue.push(edge.key);
    }
  }

  return false;
}

function findPathThroughLoad(comps, wires, startKey, endKey, targetLoadId) {
  const adj = buildGraph(comps, wires);
  const visited = new Set([`${startKey}|0`]);
  const queue = [{ key: startKey, seenTarget: false, path: [] }];

  while (queue.length) {
    const current = queue.shift();
    if (current.key === endKey && current.seenTarget) {
      const wireIds = current.path.filter(e => e.wireId).map(e => e.wireId);
      const nodeKeys = [startKey, ...current.path.map(e => e.to)];
      return { wireIds, nodeKeys };
    }

    for (const edge of adj[current.key] || []) {
      const seenTarget = current.seenTarget || edge.loadId === targetLoadId;
      const visitKey = `${edge.key}|${seenTarget ? 1 : 0}`;
      if (visited.has(visitKey)) continue;
      visited.add(visitKey);
      queue.push({
        key: edge.key,
        seenTarget,
        path: current.path.concat([{ ...edge, from: current.key, to: edge.key }]),
      });
    }
  }

  return { wireIds: [], nodeKeys: [] };
}

function getDisconnectedTerminals(comps, wires) {
  const connected = new Set();
  for (const w of wires) {
    connected.add(terminalKey(w.from.compId, w.from.terminal));
    connected.add(terminalKey(w.to.compId, w.to.terminal));
  }

  const result = [];
  for (const comp of comps) {
    const def = COMP_DEFS[comp.type];
    if (!def) continue;
    for (const terminal of Object.keys(def.terminals)) {
      const key = terminalKey(comp.id, terminal);
      if (!connected.has(key)) {
        result.push({
          compId: comp.id,
          terminal,
          key,
          label: `${def.label} ${terminal}`,
        });
      }
    }
  }
  return result;
}

function terminalKey(compId, terminal) {
  return `${compId}:${terminal}`;
}

function getComponentTerminals(comp) {
  const def = COMP_DEFS[comp.type];
  return def ? Object.keys(def.terminals) : [];
}

function isLoadType(type) {
  return type === 'bulb' || type === 'buzzer' || type === 'led' || type === 'resistor';
}

function calcStats() {
  const result = analyzeCircuit();
  if (!simState.running) {
    const statusByReason = {
      no_battery: 'No battery',
      no_load: 'No load',
      switch_open: 'Open circuit',
      incomplete: 'Incomplete circuit',
    };
    return {
      voltage: result.reason === 'no_battery' ? '0.0' : '9.0',
      current: '0.00',
      status: statusByReason[result.reason] || 'Not running',
      ok: false,
      result,
    };
  }
  const resistanceByType = { bulb: 10, led: 5, buzzer: 8, resistor: 10 };
  const R = result.activeLoadIds
    .map(id => simState.components.find(c => c.id === id))
    .filter(Boolean)
    .reduce((sum, comp) => sum + (resistanceByType[comp.type] || 10), 0) || 10;
  const V = 9.0;
  const I = V / R;
  return { voltage: V.toFixed(1), current: I.toFixed(2), status: 'Running', ok: true, result };
}

function updateStats() {
  simState.onStatsChange(calcStats());
}

/* ── Animation ── */
function startAnimation() {
  if (simState.animTimer) cancelAnimationFrame(simState.animTimer);
  const tick = () => {
    if (!simState.running) return;
    simState.animOffset = (simState.animOffset + 2) % 100;
    renderWires();
    simState.animTimer = requestAnimationFrame(tick);
  };
  simState.animTimer = requestAnimationFrame(tick);
}

/* ── Rendering ── */
function render() {
  const svg = simState.svgEl;
  if (!svg) return;
  syncSvgViewport();
  svg.innerHTML = '';

  // Defs for glow filter
  const defs = mkSvg('defs');
  defs.innerHTML = `
    <filter id="bulb-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // Wires
  const wireGroup = mkSvg('g');
  wireGroup.id = 'sim-wires';
  svg.appendChild(wireGroup);

  // Components
  const compGroup = mkSvg('g');
  compGroup.id = 'sim-comps';
  svg.appendChild(compGroup);

  // Temp wire layer
  const tempGroup = mkSvg('g');
  tempGroup.id = 'sim-temp';
  svg.appendChild(tempGroup);

  renderWires();
  renderComponents();
  renderTempWire();
}

function syncSvgViewport() {
  const svg = simState.svgEl;
  if (!svg) return;
  const rect = simState.canvasEl?.getBoundingClientRect() || svg.getBoundingClientRect();
  const width = Math.max(320, Math.round(rect.width || 600));
  const height = Math.max(360, Math.round(rect.height || 480));
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
}

function renderWires() {
  const wireGroup = simState.svgEl?.querySelector('#sim-wires');
  if (!wireGroup) return;
  wireGroup.innerHTML = '';
  const result = analyzeCircuit();
  const activeWireIds = new Set(result.activeWireIds || []);
  const warningWireIds = new Set(result.warningWireIds || []);

  for (const w of simState.wires) {
    const fp = getTerminalPos(w.from.compId, w.from.terminal);
    const tp = getTerminalPos(w.to.compId, w.to.terminal);
    if (!fp || !tp) continue;

    const path = mkSvg('path');
    path.setAttribute('d', orthoPath(fp, tp));
    const classes = ['circuit-wire'];
    if (simState.running && activeWireIds.has(w.id)) classes.push('animated');
    if (simState.lastRunAttempted && !result.closed && warningWireIds.has(w.id)) classes.push('warn');
    if (simState.selectedWireId === w.id) classes.push('selected');
    path.setAttribute('class', classes.join(' '));
    if (simState.running && activeWireIds.has(w.id)) {
      path.style.strokeDashoffset = -simState.animOffset;
    }
    path.dataset.wireId = w.id;
    wireGroup.appendChild(path);

    const hitPath = mkSvg('path');
    hitPath.setAttribute('d', orthoPath(fp, tp));
    hitPath.setAttribute('class', 'circuit-wire-hit');
    hitPath.dataset.wireId = w.id;
    wireGroup.appendChild(hitPath);
  }
}

function renderComponents() {
  const compGroup = simState.svgEl?.querySelector('#sim-comps');
  if (!compGroup) return;
  compGroup.innerHTML = '';
  const result = analyzeCircuit();
  const activeLoadIds = new Set(result.activeLoadIds || []);
  const disconnectedTerminalKeys = new Set(
    simState.lastRunAttempted && !result.closed
      ? (result.disconnectedTerminals || []).map(t => t.key)
      : []
  );

  for (const comp of simState.components) {
    const def = COMP_DEFS[comp.type];
    if (!def) continue;
    const isGlowing = simState.running && activeLoadIds.has(comp.id);

    const g = mkSvg('g');
    g.setAttribute('transform', `translate(${Math.round(comp.x)},${Math.round(comp.y)})`);
    g.setAttribute('class', `comp-group${comp.id === simState.selectedComponentId ? ' comp-selected' : ''}`);
    g.dataset.compId = comp.id;

    g.innerHTML = def.symbol(comp.state, isGlowing);

    if (isGlowing && comp.type === 'bulb') {
      const circle = g.querySelector('circle');
      if (circle) circle.setAttribute('filter', 'url(#bulb-glow-filter)');
    }

    // Terminal hit areas
    for (const [tName, tPos] of Object.entries(def.terminals)) {
      const tc = mkSvg('circle');
      tc.setAttribute('cx', tPos[0]);
      tc.setAttribute('cy', tPos[1]);
      tc.setAttribute('r', simState.wiringMode ? 12 : 10);
      const terminalClasses = ['comp-terminal'];
      if (simState.wiringMode) terminalClasses.push('wiring-enabled');
      if (disconnectedTerminalKeys.has(terminalKey(comp.id, tName))) terminalClasses.push('warn');
      tc.setAttribute('class', terminalClasses.join(' '));
      tc.dataset.compId = comp.id;
      tc.dataset.terminal = tName;
      if (simState.wiringFrom &&
          simState.wiringFrom.compId === comp.id &&
          simState.wiringFrom.terminal === tName) {
        tc.classList.add('active');
      }
      g.appendChild(tc);
    }

    // Switch click area for toggle
    if (comp.type === 'switch') {
      const hit = mkSvg('rect');
      hit.setAttribute('x', 0); hit.setAttribute('y', 0);
      hit.setAttribute('width', def.w); hit.setAttribute('height', def.h);
      hit.setAttribute('fill', 'transparent');
      hit.setAttribute('cursor', 'pointer');
      hit.dataset.switchId = comp.id;
      g.appendChild(hit);
    }

    compGroup.appendChild(g);
  }
}

function renderTempWire() {
  const tempGroup = simState.svgEl?.querySelector('#sim-temp');
  if (!tempGroup) return;
  tempGroup.innerHTML = '';
  if (!simState.wiringFrom) return;

  const path = mkSvg('path');
  const fp = { x: simState.wiringFrom.x, y: simState.wiringFrom.y };
  const tp = { x: simState.mouseX, y: simState.mouseY };
  path.setAttribute('d', orthoPath(fp, tp));
  path.setAttribute('class', 'temp-wire-line');
  tempGroup.appendChild(path);
}

function snapshotToSVG(snapshot, options = {}) {
  const data = snapshot && Array.isArray(snapshot.components) && Array.isArray(snapshot.wires)
    ? snapshot
    : createDefaultCircuitData(options.width || 560, options.height || 360);
  const result = snapshot?.lastResult || analyzeCircuit(data);
  const activeLoadIds = new Set(result.activeLoadIds || []);
  const activeWireIds = new Set(result.activeWireIds || []);
  const bounds = getCircuitBounds(data.components);
  const pad = options.padding ?? 44;
  const viewBox = [
    Math.floor(bounds.minX - pad),
    Math.floor(bounds.minY - pad),
    Math.ceil(bounds.maxX - bounds.minX + pad * 2),
    Math.ceil(bounds.maxY - bounds.minY + pad * 2),
  ].join(' ');

  const wireMarkup = data.wires.map(w => {
    const fp = getTerminalPosFromData(data.components, w.from.compId, w.from.terminal);
    const tp = getTerminalPosFromData(data.components, w.to.compId, w.to.terminal);
    if (!fp || !tp) return '';
    const cls = ['circuit-wire'];
    if (activeWireIds.has(w.id)) cls.push('animated');
    return `<path d="${orthoPath(fp, tp)}" class="${cls.join(' ')}"/>`;
  }).join('');

  const compMarkup = data.components.map(comp => {
    const def = COMP_DEFS[comp.type];
    if (!def) return '';
    const glowing = activeLoadIds.has(comp.id);
    return `<g transform="translate(${Math.round(comp.x)},${Math.round(comp.y)})" class="snapshot-comp">${def.symbol(comp.state, glowing)}</g>`;
  }).join('');

  return `
  <svg class="snapshot-circuit-svg" viewBox="${viewBox}" role="img" aria-label="Group 4 circuit design">
    <defs>
      <filter id="snapshot-bulb-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g class="snapshot-wire-layer">${wireMarkup}</g>
    <g class="snapshot-comp-layer">${compMarkup}</g>
  </svg>`;
}

function getCircuitBounds(components) {
  if (!components.length) return { minX: 0, minY: 0, maxX: 560, maxY: 360 };
  return components.reduce((bounds, comp) => {
    const def = COMP_DEFS[comp.type] || { w: 80, h: 80 };
    return {
      minX: Math.min(bounds.minX, comp.x),
      minY: Math.min(bounds.minY, comp.y),
      maxX: Math.max(bounds.maxX, comp.x + def.w),
      maxY: Math.max(bounds.maxY, comp.y + def.h),
    };
  }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
}

function getTerminalPosFromData(components, compId, terminal) {
  const comp = components.find(c => c.id === compId);
  if (!comp) return null;
  const def = COMP_DEFS[comp.type];
  if (!def || !def.terminals[terminal]) return null;
  const t = def.terminals[terminal];
  return { x: comp.x + t[0], y: comp.y + t[1] };
}

/* ── Path routing ── */
function orthoPath(from, to) {
  const fx = from.x, fy = from.y;
  const tx = to.x, ty = to.y;
  const mx = (fx + tx) / 2;
  return `M ${fx} ${fy} L ${mx} ${fy} L ${mx} ${ty} L ${tx} ${ty}`;
}

/* ── Terminal position lookup ── */
function getTerminalPos(compId, terminal) {
  const comp = simState.components.find(c => c.id === compId);
  if (!comp) return null;
  const def = COMP_DEFS[comp.type];
  if (!def) return null;
  const t = def.terminals[terminal];
  if (!t) return null;
  return { x: comp.x + t[0], y: comp.y + t[1] };
}

/* ── SVG helper ── */
function mkSvg(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function svgCoords(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

/* ── Event binding ── */
function bindEvents() {
  const svg = simState.svgEl;
  if (!svg) return;

  svg.style.touchAction = 'none';
  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', onPointerUp);
  svg.addEventListener('pointercancel', onPointerCancel);
  svg.addEventListener('pointerleave', onPointerCancel);

  // Drag from component sidebar
  const canvasEl = simState.canvasEl;
  if (canvasEl) {
    canvasEl.addEventListener('dragover', e => e.preventDefault());
    canvasEl.addEventListener('drop', onDrop);
  }
}

function onPointerDown(e) {
  const svg = simState.svgEl;
  if (!svg) return;

  // Terminal click -> start or complete wiring when Connect mode is enabled.
  const terminal = e.target.closest('[data-terminal]');
  if (terminal && simState.wiringMode) {
    e.preventDefault();
    const compId = terminal.dataset.compId;
    const tname  = terminal.dataset.terminal;
    const pos = getTerminalPos(compId, tname);
    if (!pos) return;

    if (simState.wiringFrom) {
      // Complete wire if different component
      if (simState.wiringFrom.compId !== compId) {
        simState.wires.push({
          id: 'w' + (simState.nextId++),
          from: { compId: simState.wiringFrom.compId, terminal: simState.wiringFrom.terminal },
          to:   { compId, terminal: tname }
        });
        simState.wiringFrom = null;
        if (simState.running) stopSimulation();
        simState.lastRunAttempted = false;
        render();
        updateStats();
        notifySelectionChange();
      } else {
        simState.wiringFrom = null;
        render();
      }
    } else {
      simState.wiringFrom = { compId, terminal: tname, x: pos.x, y: pos.y };
      render();
    }
    return;
  }

  // Switch toggle click
  const switchHit = e.target.closest('[data-switch-id]');
  if (switchHit) {
    e.preventDefault();
    const comp = simState.components.find(c => c.id === switchHit.dataset.switchId);
    if (comp) {
      selectComponent(comp.id);
      const pos = svgCoords(simState.svgEl, e.clientX, e.clientY);
      if (svg.setPointerCapture) {
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      }
      simState.dragging = {
        compId: comp.id,
        offsetX: pos.x - comp.x,
        offsetY: pos.y - comp.y,
        startClientX: e.clientX,
        startClientY: e.clientY,
        moved: false,
        toggleOnClick: true,
      };
    }
    return;
  }

  const wireHit = e.target.closest('[data-wire-id]');
  if (wireHit) {
    e.preventDefault();
    selectWire(wireHit.dataset.wireId);
    return;
  }

  // Component drag
  const compGroup = e.target.closest('[data-comp-id]');
  if (compGroup && !e.target.dataset.switchId) {
    e.preventDefault();
    const compId = compGroup.dataset.compId;
    const comp = simState.components.find(c => c.id === compId);
    if (!comp) return;
    selectComponent(compId);
    const pos = svgCoords(simState.svgEl, e.clientX, e.clientY);
    if (svg.setPointerCapture) {
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
    }
    simState.dragging = {
      compId,
      offsetX: pos.x - comp.x,
      offsetY: pos.y - comp.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
      toggleOnClick: false,
    };
    return;
  }

  // Click on empty space → cancel wiring
  if (simState.wiringFrom) {
    simState.wiringFrom = null;
    render();
  }
  clearSelection();
}

function onPointerMove(e) {
  const svg = simState.svgEl;
  if (!svg) return;
  const pos = svgCoords(svg, e.clientX, e.clientY);
  simState.mouseX = pos.x;
  simState.mouseY = pos.y;

  if (simState.dragging) {
    const comp = simState.components.find(c => c.id === simState.dragging.compId);
    if (comp) {
      const dx = e.clientX - simState.dragging.startClientX;
      const dy = e.clientY - simState.dragging.startClientY;
      if (Math.hypot(dx, dy) > 4) simState.dragging.moved = true;
      comp.x = Math.max(0, pos.x - simState.dragging.offsetX);
      comp.y = Math.max(0, pos.y - simState.dragging.offsetY);
      if (simState.running) stopSimulation();
      renderWires();
      renderComponents();
    }
  } else if (simState.wiringFrom) {
    renderTempWire();
  }
}

function onPointerUp(e) {
  if (simState.dragging) {
    const drag = simState.dragging;
    if (drag.toggleOnClick && !drag.moved) {
      if (simState.running) stopSimulation();
      const comp = simState.components.find(c => c.id === drag.compId);
      if (comp) comp.state = comp.state === 'open' ? 'closed' : 'open';
    }
    simState.lastRunAttempted = false;
    render();
    updateStats();
  }
  simState.dragging = null;
  if (simState.svgEl?.releasePointerCapture) {
    try { simState.svgEl.releasePointerCapture(e.pointerId); } catch (_) {}
  }
}

function onPointerCancel() {
  simState.dragging = null;
}

function onDrop(e) {
  e.preventDefault();
  const type = e.dataTransfer.getData('comp-type');
  if (!type || !COMP_DEFS[type]) return;
  const def = COMP_DEFS[type];
  const rect = simState.svgEl.getBoundingClientRect();
  const x = e.clientX - rect.left - def.w / 2;
  const y = e.clientY - rect.top  - def.h / 2;
  const id = type.slice(0, 3) + (simState.nextId++);
  simState.components.push({
    id, type,
    x: Math.max(0, x),
    y: Math.max(0, y),
    state: type === 'switch' ? 'open' : null
  });
  if (simState.running) stopSimulation();
  simState.lastRunAttempted = false;
  selectComponent(id);
  render();
  updateStats();
}

/* ── Delete wire on double-click ── */
document.addEventListener('dblclick', (e) => {
  const wireEl = e.target.closest('[data-wire-id]');
  if (!wireEl) return;
  deleteWire(wireEl.dataset.wireId);
});
