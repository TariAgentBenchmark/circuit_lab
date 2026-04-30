/* ─── Circuit Lab Simulation Engine ──────────────────────────────────────
   SVG-based drag-and-drop circuit builder with live simulation.
   Components: Battery, Switch, Light Bulb, Wire, Buzzer, Resistor, LED
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
  wiringFrom: null,     // {compId, terminal, x, y}
  mouseX: 0, mouseY: 0,
  running: false,
  animOffset: 0,
  animTimer: null,
  svgEl: null,
  canvasEl: null,
  onStatsChange: null,  // callback
};

/* ── Public API ── */
window.CircuitSim = {
  init,
  addComponent,
  reset,
  runSimulation,
  stopSimulation,
  getStats,
  exportState,
  importState,
};

function init(svgId, canvasId, onStatsChange) {
  simState.svgEl = document.getElementById(svgId);
  simState.canvasEl = document.getElementById(canvasId);
  simState.onStatsChange = onStatsChange || (() => {});
  simState.components = [];
  simState.wires = [];
  simState.nextId = 1;
  simState.running = false;
  simState.wiringFrom = null;
  simState.dragging = null;

  setupDefaultCircuit();
  bindEvents();
  render();
}

function setupDefaultCircuit() {
  const svg = simState.svgEl;
  const W = svg ? (svg.getBoundingClientRect().width  || 600) : 600;
  const H = svg ? (svg.getBoundingClientRect().height || 480) : 480;

  // Responsive positions: use proportions of the canvas
  const cx = W / 2;
  const cy = H / 2;

  simState.components = [
    { id: 'bat1',  type: 'battery', x: Math.max(20, cx - W * 0.38), y: cy - 20, state: null },
    { id: 'sw1',   type: 'switch',  x: Math.max(20, cx - W * 0.06), y: Math.max(30, cy - H * 0.25), state: 'open' },
    { id: 'bulb1', type: 'bulb',    x: Math.min(W - 100, cx + W * 0.22), y: cy - 40, state: null },
  ];
  simState.wires = [
    { id: 'w1', from: { compId: 'bat1',  terminal: 'pos'    }, to: { compId: 'sw1',   terminal: 'in'     } },
    { id: 'w2', from: { compId: 'sw1',   terminal: 'out'    }, to: { compId: 'bulb1', terminal: 'top'    } },
    { id: 'w3', from: { compId: 'bulb1', terminal: 'bottom' }, to: { compId: 'bat1',  terminal: 'neg'    } },
  ];
  simState.nextId = 10;
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
  render();
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
  simState.dragging = null;
  render();
  updateStats();
  return true;
}

function reset() {
  stopSimulation();
  simState.wiringFrom = null;
  simState.dragging = null;
  setupDefaultCircuit();
  render();
  updateStats();
}

function runSimulation() {
  const valid = validateCircuit();
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

/* ── Circuit analysis ── */
function validateCircuit() {
  const comps = simState.components;
  const wires = simState.wires;

  const batteries = comps.filter(c => c.type === 'battery');
  const hasBattery = batteries.length > 0;
  const hasLoad = comps.some(c => isLoadType(c.type));
  const switches = comps.filter(c => c.type === 'switch');
  const switchOpen = switches.some(c => c.state === 'open');

  if (!hasBattery) return { closed: false, reason: 'no_battery' };
  if (!hasLoad) return { closed: false, reason: 'no_load' };

  const adj = {};
  const addAdj = (from, to, throughLoad = false) => {
    if (!adj[from]) adj[from] = [];
    adj[from].push({ key: to, throughLoad });
  };
  const addEdge = (a, b, throughLoad = false) => {
    addAdj(a, b, throughLoad);
    addAdj(b, a, throughLoad);
  };

  const terminalKey = (compId, terminal) => `${compId}:${terminal}`;

  // External wires connect two component terminals.
  for (const w of wires) {
    addEdge(
      terminalKey(w.from.compId, w.from.terminal),
      terminalKey(w.to.compId, w.to.terminal),
      false
    );
  }

  // Internal component behavior controls whether current can pass through it.
  for (const comp of comps) {
    const def = COMP_DEFS[comp.type];
    if (!def) continue;
    const terminals = Object.keys(def.terminals);
    if (terminals.length < 2 || comp.type === 'battery') continue;
    if (comp.type === 'switch' && comp.state !== 'closed') continue;

    const throughLoad = isLoadType(comp.type);
    addEdge(
      terminalKey(comp.id, terminals[0]),
      terminalKey(comp.id, terminals[1]),
      throughLoad
    );
  }

  const bat = batteries[0];
  const startKey = bat.id + ':pos';
  const endKey = bat.id + ':neg';
  const visited = new Set([startKey + '|0']);
  const queue = [{ key: startKey, seenLoad: false }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.key === endKey && current.seenLoad) {
      return { closed: true, reason: 'closed' };
    }

    for (const edge of adj[current.key] || []) {
      const seenLoad = current.seenLoad || edge.throughLoad;
      const visitKey = edge.key + '|' + (seenLoad ? '1' : '0');
      if (visited.has(visitKey)) continue;
      visited.add(visitKey);
      queue.push({ key: edge.key, seenLoad });
    }
  }

  return { closed: false, reason: switchOpen ? 'switch_open' : 'incomplete' };
}

function isLoadType(type) {
  return type === 'bulb' || type === 'buzzer' || type === 'led' || type === 'resistor';
}

function calcStats() {
  if (!simState.running) {
    const valid = validateCircuit();
    const statusByReason = {
      no_battery: 'No battery',
      no_load: 'No load',
      switch_open: 'Open circuit',
      incomplete: 'Incomplete circuit',
    };
    return {
      voltage: valid.reason === 'no_battery' ? '0.0' : '9.0',
      current: '0.00',
      status: statusByReason[valid.reason] || 'Not running',
      ok: false,
    };
  }
  const bulbs  = simState.components.filter(c => c.type === 'bulb').length  || 0;
  const leds   = simState.components.filter(c => c.type === 'led').length   || 0;
  const buzzers= simState.components.filter(c => c.type === 'buzzer').length || 0;
  const resistors = simState.components.filter(c => c.type === 'resistor').length || 0;

  const R = (bulbs * 10) + (leds * 5) + (buzzers * 8) + (resistors * 10) || 10;
  const V = 9.0;
  const I = V / R;
  return { voltage: V.toFixed(1), current: I.toFixed(2), status: 'Running', ok: true };
}

function updateStats() {
  simState.onStatsChange(calcStats());
}

/* ── Animation ── */
function startAnimation() {
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

function renderWires() {
  const wireGroup = simState.svgEl?.querySelector('#sim-wires');
  if (!wireGroup) return;
  wireGroup.innerHTML = '';

  for (const w of simState.wires) {
    const fp = getTerminalPos(w.from.compId, w.from.terminal);
    const tp = getTerminalPos(w.to.compId, w.to.terminal);
    if (!fp || !tp) continue;

    const path = mkSvg('path');
    path.setAttribute('d', orthoPath(fp, tp));
    path.setAttribute('class', 'circuit-wire' + (simState.running ? ' animated' : ''));
    if (simState.running) {
      path.style.strokeDashoffset = -simState.animOffset;
    }
    path.dataset.wireId = w.id;
    wireGroup.appendChild(path);
  }
}

function renderComponents() {
  const compGroup = simState.svgEl?.querySelector('#sim-comps');
  if (!compGroup) return;
  compGroup.innerHTML = '';

  for (const comp of simState.components) {
    const def = COMP_DEFS[comp.type];
    if (!def) continue;
    const isGlowing = simState.running &&
      (comp.type === 'bulb' || comp.type === 'led' || comp.type === 'buzzer');

    const g = mkSvg('g');
    g.setAttribute('transform', `translate(${Math.round(comp.x)},${Math.round(comp.y)})`);
    g.setAttribute('class', 'comp-group');
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
      tc.setAttribute('r', 8);
      tc.setAttribute('class', 'comp-terminal');
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

  // Pointer events for drag + wire
  svg.addEventListener('mousedown', onMouseDown);
  svg.addEventListener('mousemove', onMouseMove);
  svg.addEventListener('mouseup', onMouseUp);
  svg.addEventListener('mouseleave', onMouseLeave);

  // Drag from component sidebar
  const canvasEl = simState.canvasEl;
  if (canvasEl) {
    canvasEl.addEventListener('dragover', e => e.preventDefault());
    canvasEl.addEventListener('drop', onDrop);
  }
}

function onMouseDown(e) {
  const svg = simState.svgEl;
  if (!svg) return;

  // Terminal click → start wiring
  const terminal = e.target.closest('[data-terminal]');
  if (terminal) {
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
        render();
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
    const comp = simState.components.find(c => c.id === switchHit.dataset.switchId);
    if (comp) {
      comp.state = comp.state === 'open' ? 'closed' : 'open';
      if (simState.running) stopSimulation();
      render();
      updateStats();
    }
    return;
  }

  // Component drag
  const compGroup = e.target.closest('[data-comp-id]');
  if (compGroup && !e.target.dataset.switchId) {
    e.preventDefault();
    const compId = compGroup.dataset.compId;
    const comp = simState.components.find(c => c.id === compId);
    if (!comp) return;
    const pos = svgCoords(simState.svgEl, e.clientX, e.clientY);
    simState.dragging = {
      compId,
      offsetX: pos.x - comp.x,
      offsetY: pos.y - comp.y,
    };
    return;
  }

  // Click on empty space → cancel wiring
  if (simState.wiringFrom) {
    simState.wiringFrom = null;
    render();
  }
}

function onMouseMove(e) {
  const svg = simState.svgEl;
  if (!svg) return;
  const pos = svgCoords(svg, e.clientX, e.clientY);
  simState.mouseX = pos.x;
  simState.mouseY = pos.y;

  if (simState.dragging) {
    const comp = simState.components.find(c => c.id === simState.dragging.compId);
    if (comp) {
      comp.x = Math.max(0, pos.x - simState.dragging.offsetX);
      comp.y = Math.max(0, pos.y - simState.dragging.offsetY);
      renderWires();
      renderComponents();
    }
  } else if (simState.wiringFrom) {
    renderTempWire();
  }
}

function onMouseUp(e) {
  simState.dragging = null;
}

function onMouseLeave() {
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
  render();
  updateStats();
}

/* ── Delete wire on double-click ── */
document.addEventListener('dblclick', (e) => {
  const wireEl = e.target.closest('[data-wire-id]');
  if (!wireEl) return;
  const wireId = wireEl.dataset.wireId;
  simState.wires = simState.wires.filter(w => w.id !== wireId);
  if (simState.running) stopSimulation();
  render();
  updateStats();
});
