/* ─── Circuit Lab — Main Application ─────────────────────────────────────
   Single-page app with hash routing.
   Pages: welcome, login, forgot, about, dashboard, lesson,
          simulation, simulation-advanced, presentation, reference
─────────────────────────────────────────────────────────────────────── */

/* ══ State ══════════════════════════════════════════════════════════════ */
const storedLoginState = (() => {
  try {
    return sessionStorage.getItem('circuitLabLoggedIn') === 'true';
  } catch {
    return false;
  }
})();

const state = {
  page:    'welcome',
  user:    { name: 'Nicholas', role: 'Student', initial: 'N' },
  isLoggedIn: storedLoginState,
  lessonProgress: { current: 4, percent: 70 },
  activeNavTab: 'home',
  slideIndex: 0,
  refFilter: 'all',
  refSearch: '',
  refLevel: 'all',
  refSort: 'latest',
  addCompCategory: 'all',
  addCompSearch: '',
  activeLab: 'lab1',
  chatMessages: [
    { from: 'Catherine', time: '4/18 12:55 PM', text: "I've added the battery. Can we test the switch next?" },
    { from: 'Jack', time: '4/18 01:00 PM', text: "I'm online now. Let's connect the bulb back to the battery." },
  ],
  branchActive: 'v1',
  branchCounter: 2,
  branches: [
    { id: 'v1', name: 'Version 1 (Bulb)', desc: 'Base circuit with 1 switch and 1 bulb.' },
    { id: 'v2', name: 'Version 2 (Buzzer)', desc: 'Replacing bulb with buzzer to see results.' },
  ],
  branchSnapshots: {},
  presentationSnapshot: null,
  presStep: 0,
  presSteps: [
    "First, the battery provides the potential energy. When I close the switch, the circuit is completed.",
    "The current flows from the positive terminal through the switch.",
    "The connected output changes electrical energy into light or sound.",
    "What happens if we add a second switch or swap in a buzzer? Let's compare versions.",
  ],
  presComments: [
    { from: 'Teacher', text: 'Nicholas, can you show the electron flow again?' },
    { from: 'Catherine', text: 'Nicholas, can you show the electron flow again?' },
  ],
  teamMembers: [
    { name: 'Nicholas',  role: 'Me', status: 'online',  initial: 'N', badge: null,     self: true  },
    { name: 'Catherine', role: '',   status: 'online',  initial: 'C', badge: null,     self: false },
    { name: 'Jack',      role: '',   status: 'online',  initial: 'J', badge: null,     self: false },
  ],
};

/* ══ Router ═════════════════════════════════════════════════════════════ */
const ROUTE_PAGES = [
  'welcome',
  'login',
  'forgot',
  'about',
  'dashboard',
  'lab',
  'lesson',
  'simulation',
  'simulation-advanced',
  'presentation',
  'reference',
];

let suppressHashChange = false;

function pageRequiresLogin(page) {
  return !['welcome', 'login', 'forgot', 'about'].includes(page);
}

function normalizePage(page) {
  return ROUTE_PAGES.includes(page) ? page : 'welcome';
}

function pageFromHash() {
  return normalizePage(window.location.hash.replace(/^#/, '') || 'welcome');
}

function navTabForPage(page) {
  if (page === 'dashboard' || page === 'welcome') return 'home';
  if (page === 'reference' || page === 'lesson') return 'lessons';
  if (page === 'lab' || page === 'simulation' || page === 'simulation-advanced' || page === 'presentation') return 'lab';
  if (page === 'about') return 'about';
  return state.activeNavTab;
}

function navigate(page, extra = {}, options = {}) {
  const nextPage = normalizePage(page);
  if ((state.page === 'simulation' || state.page === 'simulation-advanced') && window.CircuitSim?.exportState) {
    state.presentationSnapshot = CircuitSim.exportState();
  }
  if (state.page === 'simulation-advanced' && nextPage !== 'simulation-advanced') {
    saveActiveBranchSnapshot();
  }
  Object.assign(state, extra);
  state.page = nextPage;
  const app = document.getElementById('app');
  app.innerHTML = '';             // triggers fadeIn animation
  void app.offsetHeight;
  app.innerHTML = renderPage(nextPage);
  bindGlobal();
  bindPage(nextPage);
  window.scrollTo(0, 0);

  if (options.syncHash !== false) {
    const targetHash = `#${nextPage}`;
    if (window.location.hash !== targetHash) {
      suppressHashChange = true;
      window.location.hash = targetHash;
    }
  }
}

function renderPage(page) {
  switch (page) {
    case 'welcome':              return renderWelcome();
    case 'login':                return renderLogin();
    case 'forgot':               return renderForgot();
    case 'about':                return renderAbout();
    case 'dashboard':            return renderDashboard();
    case 'lab':                  return renderLabHome();
    case 'lesson':               return renderLesson();
    case 'simulation':           return renderSimulation();
    case 'simulation-advanced':  return renderSimAdvanced();
    case 'presentation':         return renderPresentation();
    case 'reference':            return renderReference();
    default:                     return renderWelcome();
  }
}

/* ══ Shared helpers ═════════════════════════════════════════════════════ */
function navTabs() {
  return [
    { id: 'home',    label: 'Home',    page: 'dashboard', items: [
      { label: 'Dashboard',   page: 'dashboard' },
    ]},
    { id: 'lessons', label: 'Lessons', page: 'reference', items:
      REF_LESSONS.map(l => ({
        label: `Lesson ${l.num} · ${l.title}`,
        page:  'lesson',
      })).concat([{ label: 'View all lessons', page: 'reference' }])
    },
    { id: 'lab',     label: 'Lab',     page: 'lab', items: [
      { label: 'Lab Overview',   page: 'lab'                 },
      { label: 'Lab 01 · Simple Switch Circuit', page: 'simulation', activeLab: 'lab1' },
      { label: 'Lab 02 · Buzzer Alert Circuit',  page: 'simulation', activeLab: 'lab2' },
      { label: 'Lab 03 · LED Signal Circuit',    page: 'simulation', activeLab: 'lab3' },
      { label: 'Selected Lab Task', page: 'simulation'       },
      { label: 'Simulation Lab', page: 'simulation-advanced' },
      { label: 'Presentation',   page: 'presentation'        },
    ]},
    { id: 'about',   label: 'About',   page: 'about', items: [
      { label: 'About Circuit Lab', page: 'about' },
    ]},
  ];
}

function navItemsHTML(active, linkStyle = '') {
  const itemHTML = (it) => `
    <a class="nav-dropdown-item"
       onclick="navigate('${it.page}',{activeNavTab:'${navTabForPage(it.page)}'${it.activeLab ? `,activeLab:'${it.activeLab}'` : ''}})"
       href="javascript:void(0)">${it.label}</a>`;
  const styleAttr = linkStyle ? ` style="${linkStyle}"` : '';
  return navTabs().map(t => `
    <div class="nav-item">
      <a class="nav-link ${active === t.id ? 'active' : ''}"
         onclick="navigate('${t.page}',{activeNavTab:'${t.id}'})"
         href="javascript:void(0)"${styleAttr}>
        ${t.label}
        <span class="nav-caret"
              role="button"
              tabindex="0"
              aria-label="Open ${t.label} menu"
              onclick="toggleNavDropdown(event)"
              onkeydown="handleNavCaretKey(event)">▾</span>
      </a>
      <div class="nav-dropdown">
        ${t.items.map(itemHTML).join('')}
      </div>
    </div>
  `).join('');
}

function navHTML(active) {
  return `
  <header class="app-header">
    <div class="header-logo">
      <div class="logo-icon">
        ${svgIcon('zap', 18, 'white')}
      </div>
      Circuit Lab
    </div>
    <nav class="main-nav">
      ${navItemsHTML(active)}
    </nav>
    <div class="header-right">
      ${profileMenuHTML()}
    </div>
  </header>`;
}

function profileMenuHTML() {
  return `
  <div class="profile-menu">
    <button class="profile-trigger" onclick="toggleProfileMenu(event)" aria-label="Open profile menu">
      <span class="user-badge">${state.user.name} (${state.user.role})</span>
      <span class="avatar" title="Profile">${state.user.initial}</span>
    </button>
    <div class="profile-dropdown" role="menu">
      <button class="profile-dropdown-item" onclick="logout()" role="menuitem">
        ${svgIcon('logOut', 15)} Logout
      </button>
    </div>
  </div>`;
}

function publicHeaderHTML(active = '') {
  return `
  <header class="app-header">
    <div class="header-logo">
      <div class="logo-icon">${svgIcon('zap', 18, 'white')}</div>
      Circuit Lab
    </div>
    <nav class="main-nav">
      <a class="nav-link ${active === 'home' ? 'active' : ''}" onclick="goHome()" href="javascript:void(0)">Home</a>
      <a class="nav-link ${active === 'about' ? 'active' : ''}" onclick="navigate('about',{activeNavTab:'about'})" href="javascript:void(0)">About</a>
    </nav>
    <div class="header-right">
      <button class="btn btn-primary btn-sm" onclick="navigate('login')">Login</button>
    </div>
  </header>`;
}

function footerHTML() {
  return `
  <footer class="app-footer">
    © 2025 Circuit Lab. All rights reserved.
    <div class="footer-links">
      <a href="javascript:void(0)">Privacy Policy</a>
      <a href="javascript:void(0)">Terms of Use</a>
      <a href="javascript:void(0)">Contact Us</a>
    </div>
  </footer>`;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHTML(value);
}

function teamSidebarHTML() {
  return `
  <div class="sidebar-section">
    <div class="sidebar-section-title">Team Status</div>
    ${teamStatusCardHTML()}
  </div>
  <div class="sidebar-section">
    <div class="sidebar-section-title">Lab Tasks</div>
    <div class="lab-shortcut-card">
      <div class="lab-shortcut-header">Simple Switch Circuit</div>
      <div class="lab-shortcut-diagram">
        ${miniCircuitSVG()}
      </div>
      <div class="lab-shortcut-body">
        Review Lab 01, Lab 02, and Lab 03 task briefs before opening the advanced simulation.
      </div>
      <div class="lab-shortcut-footer">
        <button class="btn btn-ghost btn-sm btn-full" onclick="navigate('lab',{activeNavTab:'lab'})">
          Go to Lab Overview →
        </button>
      </div>
    </div>
  </div>`;
}

function teamStatusCardHTML(extraClass = '') {
  const members = state.teamMembers;
  return `
  <div class="team-status-card ${extraClass}">
    <div class="team-status-header">
      Project Group
      <span class="badge badge-info">${members.length}</span>
    </div>
    <div class="team-member-list">
      ${members.map(m => `
        <div class="team-member">
          <div class="team-member-avatar">
            ${m.initial}
            <span class="status-dot ${m.status}"></span>
          </div>
          <div class="team-member-info">
            <div class="team-member-name">${m.name}${m.role ? ` <span style="color:var(--text-muted);font-weight:400">(${m.role})</span>` : ''}</div>
            <div class="team-member-role">${m.status === 'online' ? 'Online' : 'Offline'}</div>
          </div>
          ${m.badge ? `<span class="team-member-badge">${m.badge}</span>` : ''}
        </div>
      `).join('')}
    </div>
    <div class="team-actions-row">
      <button class="btn btn-outline btn-sm btn-full" onclick="openModal('invite')">+ Invite</button>
      <button class="btn btn-outline btn-sm btn-full team-remove-action" onclick="openModal('remove-member')">Remove</button>
    </div>
  </div>`;
}

function teamAvatarMenuHTML() {
  return `
  <div class="team-avatar-menu">
    <button class="avatar-group-trigger" onclick="toggleTeamMenu(event)" aria-label="Open team status">
      <span class="avatar-group" aria-hidden="true">
        <span class="avatar" title="Nicholas" style="background:#2563eb">N</span>
        <span class="avatar" title="Catherine" style="background:#7c3aed">C</span>
        <span class="avatar" title="Jack" style="background:#d97706">J</span>
      </span>
    </button>
    <div class="team-dropdown">
      ${teamStatusCardHTML('compact')}
    </div>
  </div>`;
}

function chatHTML(containerId) {
  return `
  <div class="team-chat">
    <div class="chat-header">
      ${svgIcon('message', 14)}
      Team Chat
      <span class="badge badge-success" style="margin-left:auto">Live</span>
    </div>
    <div class="chat-messages" id="${containerId}">
      ${state.chatMessages.map(m => `
        <div class="chat-msg">
          <div class="chat-avatar">${m.from[0]}</div>
          <div class="chat-msg-body">
            <div class="chat-msg-header">
              <span class="chat-msg-name">${m.from}</span>
              <span class="chat-msg-time">${m.time}</span>
            </div>
            <div class="chat-msg-text">${m.text}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="chat-input-row">
      <input class="chat-input" id="chat-inp" placeholder="Please click to enter…" type="text"/>
      <button class="chat-send-btn" onclick="sendChat()">
        ${svgIcon('send', 13, 'white')} Send
      </button>
    </div>
  </div>`;
}

function miniCircuitSVG() {
  return `
  <svg width="160" height="90" class="circuit-mini-svg" viewBox="0 0 160 90">
    <rect x="2" y="22" width="30" height="46" rx="4" fill="white" stroke="#374151" stroke-width="1.5"/>
    <line x1="6"  y1="38" x2="14" y2="38" stroke="#374151" stroke-width="2"/>
    <line x1="18" y1="32" x2="18" y2="58" stroke="#374151" stroke-width="3"/>
    <line x1="25" y1="36" x2="25" y2="54" stroke="#374151" stroke-width="1.5"/>
    <text x="17" y="74" font-family="Inter" font-size="8" fill="#9ca3af" text-anchor="middle">Battery</text>
    <line x1="32" y1="45" x2="62" y2="45" stroke="#374151" stroke-width="1.5"/>
    <line x1="62" y1="45" x2="62" y2="12" stroke="#374151" stroke-width="1.5"/>
    <line x1="62" y1="12" x2="98" y2="12" stroke="#374151" stroke-width="1.5"/>
    <circle cx="72" cy="12" r="3" fill="#374151"/>
    <line x1="85" y1="12" x2="81" y2="5" stroke="#374151" stroke-width="1.5"/>
    <circle cx="85" cy="12" r="3" fill="#374151"/>
    <line x1="98" y1="12" x2="98" y2="30" stroke="#374151" stroke-width="1.5"/>
    <circle cx="98" cy="45" r="16" fill="white" stroke="#374151" stroke-width="1.5"/>
    <line x1="89" y1="36" x2="107" y2="54" stroke="#374151" stroke-width="1.2"/>
    <line x1="107" y1="36" x2="89" y2="54" stroke="#374151" stroke-width="1.2"/>
    <line x1="98" y1="61" x2="98" y2="78" stroke="#374151" stroke-width="1.5"/>
    <line x1="98" y1="78" x2="32" y2="78" stroke="#374151" stroke-width="1.5"/>
    <line x1="32" y1="78" x2="32" y2="55" stroke="#374151" stroke-width="1.5"/>
    <text x="98" y="83" font-family="Inter" font-size="8" fill="#9ca3af" text-anchor="middle">Bulb</text>
  </svg>`;
}

/* ══ Icons ═══════════════════════════════════════════════════════════════ */
function svgIcon(name, size = 16, color = 'currentColor') {
  const icons = {
    zap:     `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>`,
    user:    `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    mail:    `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`,
    lock:    `<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
    eye:     `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`,
    eyeOff:  `<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>`,
    back:    `<path d="m15 18-6-6 6-6"/>`,
    help:    `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
    message: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
    send:    `<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`,
    play:    `<polygon points="5 3 19 12 5 21 5 3"/>`,
    book:    `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
    flask:   `<path d="M9 3h6"/><path d="M10 3v7l-3.5 7A2 2 0 0 0 8.1 20h7.8a2 2 0 0 0 1.6-3L14 10V3"/>`,
    home:    `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    plus:    `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
    x:       `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
    check:   `<polyline points="20 6 9 17 4 12"/>`,
    info:    `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
    star:    `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    search:  `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
    filter:  `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
    target:  `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
    users:   `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    cpu:     `<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/>`,
    layers:  `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
    award:   `<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>`,
    globe:   `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,
    trash:   `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,
    bolt:    `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>`,
    logOut:  `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
    settings:`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  };
  const d = icons[name] || icons['zap'];
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${d}</svg>`;
}

/* ══ PAGES ═══════════════════════════════════════════════════════════════ */

/* ── Welcome ── */
function renderWelcome() {
  return renderLogin();
}

/* ── Login ── */
function renderLogin() {
  return `
  <div class="auth-page">
    <header class="app-header">
      <div class="header-logo">
        <div class="logo-icon">${svgIcon('zap', 18, 'white')}</div>
        Circuit Lab Learning Platform
      </div>
      <div class="header-right">
        <button class="header-help-btn">${svgIcon('help', 15)} Help</button>
      </div>
    </header>

    <main class="auth-main">
      <div class="auth-card">
        <div class="auth-brand">
          <h1 class="auth-brand-title">Welcome to Circuit Lab</h1>
          <p class="auth-brand-tagline">Learn. Simulate. Collaborate. Present.</p>
        </div>
        <p class="auth-subtitle">Sign in to continue.</p>

        <form class="auth-form" id="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-wrapper">
              <span class="input-icon">${svgIcon('mail', 16)}</span>
              <input class="form-input" type="email" id="login-email"
                     placeholder="Enter your email" required/>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              Password
            </label>
            <div class="input-wrapper">
              <span class="input-icon">${svgIcon('lock', 16)}</span>
              <input class="form-input" type="password" id="login-pass"
                     placeholder="Enter your password" required/>
              <span class="input-suffix" id="pass-toggle" onclick="togglePassword()">
                ${svgIcon('eye', 16)}
              </span>
            </div>
          </div>
          <div class="form-row">
            <label class="form-checkbox">
              <input type="checkbox" id="remember-me"/>
              Remember me
            </label>
            <a class="form-link" onclick="navigate('forgot')">Forgot password?</a>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Login</button>
        </form>

        <div class="divider" style="margin:16px 0">or</div>

        <button class="google-btn" onclick="handleGoogleLogin()">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Login with Google
        </button>

        <p class="auth-footer-note" style="margin-top:16px">
          Don't have an account?
          <a class="form-link" href="javascript:void(0)">Contact your teacher.</a>
        </p>
      </div>
    </main>
    ${footerHTML()}
  </div>`;
}

/* ── Forgot Password ── */
function renderForgot() {
  return `
  <div class="auth-page">
    <header class="app-header">
      <div class="header-logo">
        <div class="logo-icon">${svgIcon('zap', 18, 'white')}</div>
        Circuit Lab Learning Platform
      </div>
      <div class="header-right">
        <button class="header-help-btn">${svgIcon('help', 15)} Help</button>
      </div>
    </header>

    <div class="auth-back" onclick="navigate('login')">
      ${svgIcon('back', 15)} <span>Back</span> to Login
    </div>

    <main class="auth-main">
      <div class="auth-card">
        <h1 style="font-size:1.5rem">Forgot Password?</h1>
        <p class="auth-subtitle">No worries! Enter your email and we'll send you a link to reset your password.</p>

        <form class="auth-form" id="forgot-form" onsubmit="handleForgot(event)">
          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-wrapper">
              <span class="input-icon">${svgIcon('mail', 16)}</span>
              <input class="form-input" type="email" id="forgot-email"
                     placeholder="Enter your email" required/>
            </div>
            <div class="form-hint">
              ${svgIcon('info', 13)} We'll send a password reset link to your email address.
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">send reset link</button>
        </form>

        <div class="divider" style="margin:16px 0">or</div>
        <button class="btn btn-outline btn-full" onclick="navigate('login')">back to login</button>

        <p class="auth-footer-note" style="margin-top:20px">
          ${svgIcon('help', 14)} Still need help?<br/>
          <a class="form-link" href="javascript:void(0)">Contact your teacher</a>
        </p>
      </div>
    </main>
    ${footerHTML()}
  </div>`;
}

/* ── About ── */
function renderAbout() {
  return `
  <div class="page-wrapper">
    ${state.isLoggedIn ? navHTML('about') : publicHeaderHTML('about')}

    <main class="page-content" style="background:var(--surface)">
      <div class="container py-12">
        <div class="about-hero">
          <h1>About Circuit Lab</h1>
          <p>Empowering learners through interactive electronics education.<br/>
          Circuit Lab is an online platform designed to help students learn electronics through hands-on simulations, interactive lessons, and collaborative projects.</p>
          <button class="btn btn-primary btn-lg" onclick="tryCircuitLab()">Try the circuit lab</button>
          <div class="about-hero-image">
            ${heroCircuitSVG()}
          </div>
        </div>

        <div>
          <h2 class="section-title">Our Mission, Vision & Values</h2>
          <div class="mvv-grid">
            <div class="mvv-card">
              <div class="mvv-icon">${svgIcon('target', 24)}</div>
              <h3>Our Mission</h3>
              <p>Make electronics education accessible, engaging, and effective for every learner.</p>
            </div>
            <div class="mvv-card">
              <div class="mvv-icon">${svgIcon('globe', 24)}</div>
              <h3>Our Vision</h3>
              <p>Create a world where every student can explore, understand, and innovate with electronics.</p>
            </div>
            <div class="mvv-card">
              <div class="mvv-icon">${svgIcon('star', 24)}</div>
              <h3>Our Values</h3>
              <ul>
                <li>Learning First</li>
                <li>Collaboration</li>
                <li>Innovation</li>
                <li>Accessibility</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="team-section">
          <div class="team-desc">
            <h2 class="section-title">Who We Are</h2>
            <h3 style="font-weight:500;margin-bottom:12px">A Team Passionate About Education</h3>
            <p>We are educators, engineers, and designers working together to build tools that inspire curiosity and empower students. Our platform combines technology and pedagogy to deliver an interactive learning experience that fits modern classrooms and online learning.</p>
          </div>
          <div class="team-roles">
            <div class="team-role">
              <div class="team-role-icon">${svgIcon('users', 22)}</div>
              <div>
                <h4>Educators</h4>
                <p>Experienced teachers and mentors</p>
              </div>
            </div>
            <div class="team-role">
              <div class="team-role-icon">${svgIcon('cpu', 22)}</div>
              <div>
                <h4>Engineers</h4>
                <p>Building reliable and intuitive tools</p>
              </div>
            </div>
            <div class="team-role">
              <div class="team-role-icon">${svgIcon('layers', 22)}</div>
              <div>
                <h4>Designers</h4>
                <p>Creating simple and engaging experiences</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 class="section-title">Our Impact</h2>
          <div class="impact-grid">
            <div class="impact-card">
              <div class="impact-icon">${svgIcon('users', 28)}</div>
              <div class="impact-number">10K+</div>
              <div class="impact-label">Students Learning</div>
            </div>
            <div class="impact-card">
              <div class="impact-icon">${svgIcon('home', 28)}</div>
              <div class="impact-number">500+</div>
              <div class="impact-label">Schools & Institutions</div>
            </div>
            <div class="impact-card">
              <div class="impact-icon">${svgIcon('book', 28)}</div>
              <div class="impact-number">300+</div>
              <div class="impact-label">Interactive Lessons</div>
            </div>
            <div class="impact-card">
              <div class="impact-icon">${svgIcon('flask', 28)}</div>
              <div class="impact-number">50K+</div>
              <div class="impact-label">Simulations Run</div>
            </div>
          </div>
        </div>
      </div>
    </main>

    ${footerHTML()}
  </div>`;
}

function heroCircuitSVG() {
  return `
  <svg width="420" height="160" viewBox="0 0 420 160" fill="none">
    <rect x="30" y="55" width="50" height="50" rx="6" fill="white" stroke="#d1d5db" stroke-width="1.5"/>
    <line x1="33" y1="75" x2="40" y2="75" stroke="#374151" stroke-width="2"/>
    <line x1="40" y1="62" x2="40" y2="88" stroke="#374151" stroke-width="4"/>
    <line x1="48" y1="68" x2="48" y2="92" stroke="#374151" stroke-width="1.8"/>
    <line x1="55" y1="62" x2="55" y2="88" stroke="#374151" stroke-width="4"/>
    <line x1="63" y1="68" x2="63" y2="92" stroke="#374151" stroke-width="1.8"/>
    <line x1="70" y1="75" x2="77" y2="75" stroke="#374151" stroke-width="2"/>
    <text x="55" y="114" font-family="Inter" font-size="9" fill="#9ca3af" text-anchor="middle">Battery 9V</text>
    <line x1="80" y1="80" x2="155" y2="80" stroke="#374151" stroke-width="1.8"/>
    <line x1="155" y1="80" x2="155" y2="30" stroke="#374151" stroke-width="1.8"/>
    <line x1="155" y1="30" x2="250" y2="30" stroke="#374151" stroke-width="1.8"/>
    <circle cx="200" cy="30" r="4" fill="#374151"/>
    <line cx="215" cy="30" x1="214" y1="30" x2="210" y2="18" stroke="#374151" stroke-width="1.8"/>
    <circle cx="215" cy="30" r="4" fill="#374151"/>
    <line x1="250" y1="30" x2="250" y2="55" stroke="#374151" stroke-width="1.8"/>
    <circle cx="250" cy="80" r="25" fill="white" stroke="#d1d5db" stroke-width="1.5"/>
    <circle id="hero-bulb" cx="250" cy="80" r="23" fill="#fef9c3" stroke="#374151" stroke-width="1.5"/>
    <line x1="238" y1="68" x2="262" y2="92" stroke="#374151" stroke-width="1.3"/>
    <line x1="262" y1="68" x2="238" y2="92" stroke="#374151" stroke-width="1.3"/>
    <line x1="250" y1="105" x2="250" y2="130" stroke="#374151" stroke-width="1.8"/>
    <line x1="250" y1="130" x2="80" y2="130" stroke="#374151" stroke-width="1.8"/>
    <line x1="80" y1="130" x2="80" y2="80" stroke="#374151" stroke-width="1.8" stroke-dasharray="4 3"/>
    <text x="250" y="148" font-family="Inter" font-size="9" fill="#9ca3af" text-anchor="middle">Light Bulb</text>
    <rect x="315" y="60" width="60" height="40" rx="5" fill="white" stroke="#d1d5db" stroke-width="1.5"/>
    <line x1="275" y1="80" x2="315" y2="80" stroke="#374151" stroke-width="1.8"/>
    <path d="M326,70 Q335,80 326,90" fill="none" stroke="#374151" stroke-width="1.3"/>
    <path d="M334,66 Q345,80 334,94" fill="none" stroke="#374151" stroke-width="1.3"/>
    <text x="345" y="114" font-family="Inter" font-size="9" fill="#9ca3af" text-anchor="middle">Buzzer</text>
  </svg>`;
}

/* ── Dashboard ── */
function renderDashboard() {
  const lessons = [
    { num: '04', title: 'Switches & Circuits', desc: 'Learn how switches control the flow of electricity in a circuit.', pct: 70, level: 'Beginner', time: '25 min', icon: '⚡', action: 'RESUME LESSON', page: 'lesson' },
  ];
  return `
  <div class="page-wrapper">
    ${navHTML('home')}
    <div class="dashboard-layout page-content">
      <main class="dashboard-main">
        <div class="welcome-banner">
          <h2>Welcome back, ${state.user.name}! 👋</h2>
          <p>Continue your learning journey in Electronics</p>
          <div class="welcome-actions">
            <button class="welcome-btn-primary" onclick="navigate('lab',{activeNavTab:'lab'})">
              ENTER SIMULATION LAB
            </button>
            <button class="welcome-btn-outline" onclick="navigate('lesson',{activeNavTab:'lessons'})">
              VIEW LESSON 04
            </button>
          </div>
        </div>

        <div>
          <div class="section-header">
            <h3>Continue learning</h3>
            <a class="form-link" onclick="navigate('reference',{activeNavTab:'reference'})">View all →</a>
          </div>
          ${lessons.map(l => `
            <div class="lesson-card" onclick="navigate('lesson',{activeNavTab:'lessons'})">
              <div class="lesson-card-thumb">${l.icon}</div>
              <div class="lesson-card-body">
                <div class="lesson-card-meta">
                  <span class="badge badge-info">Lesson ${l.num}</span>
                  <span class="badge badge-gray">${l.level}</span>
                  <span style="font-size:.75rem;color:var(--text-muted)">${svgIcon('book',12)} ${l.time}</span>
                </div>
                <h4>${l.title}</h4>
                <p>${l.desc}</p>
                <div class="lesson-progress-row">
                  <div class="progress-bar"><div class="progress-fill green" style="width:${l.pct}%"></div></div>
                  <span class="lesson-progress-pct">${l.pct}% Complete</span>
                </div>
                <button class="btn btn-accent btn-sm" onclick="navigate('lesson')">${l.action}</button>
              </div>
            </div>
          `).join('')}
        </div>

        ${chatHTML('dashboard-chat')}
      </main>

      <aside class="dashboard-sidebar">
        ${teamSidebarHTML()}
      </aside>
    </div>
    ${footerHTML()}
  </div>`;
}

/* ── Lesson ── */
const SLIDES = [
  {
    title: 'Switch Principle Demonstration',
    content: lessonSlide1SVG,
    note: 'A switch is a device that can open or close an electrical circuit.',
  },
  {
    title: 'Current Flow Diagram',
    content: lessonSlide2SVG,
    note: 'When the switch is closed, current flows from the battery through the circuit.',
  },
  {
    title: 'Open vs Closed Circuit',
    content: lessonSlide3SVG,
    note: 'An open circuit has a break — no current flows. A closed circuit allows full current.',
  },
  {
    title: 'Practical Application',
    content: lessonSlide4SVG,
    note: 'Light switches in your home use this exact principle to control lighting.',
  },
];

function lessonSlide1SVG() {
  return `
  <div class="slide-diagram">
    <svg width="280" height="130" viewBox="0 0 280 130">
      <rect x="10" y="40" width="50" height="50" rx="5" fill="white" stroke="#374151" stroke-width="1.5"/>
      <line x1="13" y1="60" x2="20" y2="60" stroke="#374151" stroke-width="2"/>
      <line x1="20" y1="47" x2="20" y2="73" stroke="#374151" stroke-width="3.5"/>
      <line x1="28" y1="53" x2="28" y2="77" stroke="#374151" stroke-width="1.8"/>
      <line x1="36" y1="47" x2="36" y2="73" stroke="#374151" stroke-width="3.5"/>
      <line x1="44" y1="53" x2="44" y2="77" stroke="#374151" stroke-width="1.8"/>
      <line x1="52" y1="60" x2="60" y2="60" stroke="#374151" stroke-width="2"/>
      <text x="30" y="102" font-family="Inter" font-size="9" fill="#6b7280" text-anchor="middle">Battery</text>
      <line x1="60" y1="65" x2="100" y2="65" stroke="#374151" stroke-width="1.8"/>
      <line x1="100" y1="65" x2="100" y2="25" stroke="#374151" stroke-width="1.8"/>
      <line x1="100" y1="25" x2="160" y2="25" stroke="#374151" stroke-width="1.8"/>
      <circle cx="118" cy="25" r="4" fill="#374151"/>
      <line x1="130" y1="25" x2="125" y2="10" stroke="#374151" stroke-width="1.8"/>
      <circle cx="130" cy="25" r="4" fill="#374151"/>
      <line x1="160" y1="25" x2="160" y2="50" stroke="#374151" stroke-width="1.8"/>
      <circle cx="160" cy="65" r="22" fill="white" stroke="#374151" stroke-width="1.5"/>
      <line x1="148" y1="53" x2="172" y2="77" stroke="#374151" stroke-width="1.2"/>
      <line x1="172" y1="53" x2="148" y2="77" stroke="#374151" stroke-width="1.2"/>
      <line x1="160" y1="87" x2="160" y2="110" stroke="#374151" stroke-width="1.8"/>
      <line x1="160" y1="110" x2="60" y2="110" stroke="#374151" stroke-width="1.8"/>
      <line x1="60" y1="110" x2="60" y2="65" stroke="#374151" stroke-width="1.8"/>
      <text x="160" y="126" font-family="Inter" font-size="9" fill="#6b7280" text-anchor="middle">Light Bulb</text>
      <text x="124" y="44" font-family="Inter" font-size="9" fill="#6b7280" text-anchor="middle">Switch (open)</text>
    </svg>
    <p style="font-size:.82rem;color:var(--text-secondary);text-align:center;max-width:260px">
      The switch is <strong>open</strong> — current cannot flow, bulb is off.
    </p>
  </div>`;
}
function lessonSlide2SVG() {
  return `
  <div class="slide-diagram">
    <svg width="280" height="130" viewBox="0 0 280 130">
      <rect x="10" y="40" width="50" height="50" rx="5" fill="white" stroke="#374151" stroke-width="1.5"/>
      <line x1="13" y1="60" x2="20" y2="60" stroke="#374151" stroke-width="2"/>
      <line x1="20" y1="47" x2="20" y2="73" stroke="#374151" stroke-width="3.5"/>
      <line x1="28" y1="53" x2="28" y2="77" stroke="#374151" stroke-width="1.8"/>
      <line x1="36" y1="47" x2="36" y2="73" stroke="#374151" stroke-width="3.5"/>
      <line x1="44" y1="53" x2="44" y2="77" stroke="#374151" stroke-width="1.8"/>
      <line x1="52" y1="60" x2="60" y2="60" stroke="#374151" stroke-width="2"/>
      <line x1="60" y1="65" x2="100" y2="65" stroke="#374151" stroke-width="1.8" stroke-dasharray="6 3"/>
      <line x1="100" y1="65" x2="100" y2="25" stroke="#374151" stroke-width="1.8" stroke-dasharray="6 3"/>
      <line x1="100" y1="25" x2="160" y2="25" stroke="#374151" stroke-width="1.8" stroke-dasharray="6 3"/>
      <circle cx="118" cy="25" r="4" fill="#374151"/>
      <line x1="118" y1="25" x2="130" y2="25" stroke="#374151" stroke-width="2"/>
      <circle cx="130" cy="25" r="4" fill="#374151"/>
      <line x1="160" y1="25" x2="160" y2="50" stroke="#374151" stroke-width="1.8" stroke-dasharray="6 3"/>
      <circle cx="160" cy="65" r="22" fill="#fef9c3" stroke="#374151" stroke-width="1.5"/>
      <line x1="148" y1="53" x2="172" y2="77" stroke="#374151" stroke-width="1.2"/>
      <line x1="172" y1="53" x2="148" y2="77" stroke="#374151" stroke-width="1.2"/>
      <line x1="160" y1="87" x2="160" y2="110" stroke="#374151" stroke-width="1.8" stroke-dasharray="6 3"/>
      <line x1="160" y1="110" x2="60" y2="110" stroke="#374151" stroke-width="1.8" stroke-dasharray="6 3"/>
      <line x1="60" y1="110" x2="60" y2="65" stroke="#374151" stroke-width="1.8" stroke-dasharray="6 3"/>
      <text x="124" y="40" font-family="Inter" font-size="9" fill="#059669" text-anchor="middle">Switch (closed) ✓</text>
      <text x="160" y="126" font-family="Inter" font-size="9" fill="#6b7280" text-anchor="middle">Glowing!</text>
    </svg>
    <p style="font-size:.82rem;color:var(--text-secondary);text-align:center;max-width:260px">
      The switch is <strong>closed</strong> — current flows, bulb lights up!
    </p>
  </div>`;
}
function lessonSlide3SVG() {
  return `
  <div class="slide-diagram">
    <div style="display:flex;gap:24px;align-items:center">
      <div style="text-align:center">
        <div style="font-size:.78rem;font-weight:600;color:var(--danger);margin-bottom:8px">Open Circuit ✗</div>
        <svg width="100" height="80" viewBox="0 0 100 80">
          <rect x="5" y="25" width="30" height="30" rx="4" fill="white" stroke="#374151" stroke-width="1.5"/>
          <line x1="35" y1="40" x2="50" y2="40" stroke="#374151" stroke-width="1.5"/>
          <circle cx="55" cy="40" r="3" fill="#374151"/>
          <line x1="65" y1="40" x2="62" y2="30" stroke="#374151" stroke-width="1.5"/>
          <circle cx="65" cy="40" r="3" fill="#374151"/>
          <line x1="95" y1="40" x2="75" y2="40" stroke="#e5e7eb" stroke-width="1.5" stroke-dasharray="3 2"/>
          <circle cx="75" cy="40" r="12" fill="white" stroke="#d1d5db" stroke-width="1.2"/>
          <line x1="68" y1="33" x2="82" y2="47" stroke="#d1d5db" stroke-width="1"/>
          <line x1="82" y1="33" x2="68" y2="47" stroke="#d1d5db" stroke-width="1"/>
        </svg>
      </div>
      <div style="text-align:center">
        <div style="font-size:.78rem;font-weight:600;color:var(--success);margin-bottom:8px">Closed Circuit ✓</div>
        <svg width="100" height="80" viewBox="0 0 100 80">
          <rect x="5" y="25" width="30" height="30" rx="4" fill="white" stroke="#374151" stroke-width="1.5"/>
          <line x1="35" y1="40" x2="50" y2="40" stroke="#374151" stroke-width="1.8"/>
          <circle cx="55" cy="40" r="3" fill="#374151"/>
          <line x1="55" y1="40" x2="65" y2="40" stroke="#374151" stroke-width="1.8"/>
          <circle cx="65" cy="40" r="3" fill="#374151"/>
          <line x1="95" y1="40" x2="75" y2="40" stroke="#374151" stroke-width="1.8"/>
          <circle cx="75" cy="40" r="12" fill="#fef9c3" stroke="#374151" stroke-width="1.2"/>
          <line x1="68" y1="33" x2="82" y2="47" stroke="#374151" stroke-width="1"/>
          <line x1="82" y1="33" x2="68" y2="47" stroke="#374151" stroke-width="1"/>
        </svg>
      </div>
    </div>
  </div>`;
}
function lessonSlide4SVG() {
  return `
  <div class="slide-diagram">
    <div style="font-size:3rem;margin-bottom:12px">💡</div>
    <p style="font-size:.87rem;color:var(--text-secondary);text-align:center;max-width:240px;line-height:1.6">
      The light switch in your room works exactly like this — it opens and closes a circuit to control the light.
    </p>
  </div>`;
}

const LABS = [
  {
    id: 'lab1',
    num: '01',
    title: 'Simple Switch Circuit',
    level: 'Beginner',
    time: '15 min',
    desc: 'Build one complete loop where a switch controls a light bulb.',
    task: 'Create a circuit with a battery, switch, wires, and a light bulb. Run the simulation and explain why the bulb only turns on when the switch is closed.',
    components: ['Battery', 'Switch', 'Light Bulb', 'Wires'],
    hints: [
      'Connect the battery positive terminal to the switch first.',
      'The bulb must connect back to the battery negative terminal.',
      'An open switch breaks the loop, so current cannot flow.',
    ],
    checkpoint: 'The bulb glows only after the switch is closed.',
  },
  {
    id: 'lab2',
    num: '02',
    title: 'Buzzer Alert Circuit',
    level: 'Beginner',
    time: '18 min',
    desc: 'Swap the bulb for a buzzer and compare light output with sound output.',
    task: 'Design a switch-controlled buzzer circuit. Test whether the buzzer activates only when the circuit is complete.',
    components: ['Battery', 'Switch', 'Buzzer', 'Wires'],
    hints: [
      'A buzzer is still a load, so it needs a closed path.',
      'Use the same loop idea from Lab 01.',
      'If the buzzer is disconnected from either side, it will not activate.',
    ],
    checkpoint: 'The buzzer activates only on a closed circuit.',
  },
  {
    id: 'lab3',
    num: '03',
    title: 'LED Signal Circuit',
    level: 'Challenge',
    time: '20 min',
    desc: 'Use an LED as the output and think about component placement.',
    task: 'Build a switch-controlled LED circuit. Add a resistor if needed and compare the layout with other groups.',
    components: ['Battery', 'Switch', 'LED', 'Resistor', 'Wires'],
    hints: [
      'The LED should be part of the closed path.',
      'A resistor can be placed in series with the LED.',
      'Check both terminals before running the simulation.',
    ],
    checkpoint: 'The LED turns on only when it is correctly connected in the loop.',
  },
];

function getActiveLab() {
  return LABS.find(lab => lab.id === state.activeLab) || LABS[0];
}

function listItemsHTML(items) {
  return items.map(item => `<li>${escapeHTML(item)}</li>`).join('');
}

function componentChipsHTML(items) {
  return items.map(item => `<span class="lab-component-chip">${escapeHTML(item)}</span>`).join('');
}

function renderLabHome() {
  return `
  <div class="page-wrapper lab-home-page">
    ${navHTML('lab')}
    <div class="lab-page-layout page-content">
      <main class="lab-main">
        <div class="lesson-header-block">
          <div class="lesson-num">Lab Overview</div>
          <h2>Electronics Lab Tasks</h2>
          <p>Choose a lab to review the task, components, and hints before opening the advanced simulation.</p>
        </div>

        <div class="lab-list-grid">
          ${LABS.map(lab => `
            <button class="lab-card"
                    onclick="selectLab('${lab.id}')">
              <div class="lab-card-index">Lab ${lab.num}</div>
              <div class="lab-card-body">
                <div class="lab-card-meta">
                  <span class="badge ${lab.level === 'Challenge' ? 'badge-warning' : 'badge-info'}">${lab.level}</span>
                  <span class="badge badge-gray">${lab.time}</span>
                </div>
                <h3>${escapeHTML(lab.title)}</h3>
                <p>${escapeHTML(lab.desc)}</p>
              </div>
            </button>
          `).join('')}
        </div>
      </main>

      <aside class="dashboard-sidebar">
        ${teamSidebarHTML()}
      </aside>
    </div>

  </div>`;
}

function renderLesson() {
  const slide = SLIDES[state.slideIndex] || SLIDES[0];
  return `
  <div class="page-wrapper">
    <header class="app-header">
      <div class="header-logo" style="min-width:auto;margin-right:8px">
        <a class="btn btn-ghost btn-sm" onclick="navigate('dashboard',{activeNavTab:'home'})"
           href="javascript:void(0)" style="display:flex;align-items:center;gap:4px">
          ${svgIcon('back', 14)} back
        </a>
      </div>
      <nav class="main-nav">
        ${navItemsHTML(state.activeNavTab)}
      </nav>
      <div class="header-right">
        ${profileMenuHTML()}
      </div>
    </header>

    <div class="lesson-page-layout page-content">
      <main class="lesson-main">
        <div class="lesson-header-block">
          <div class="lesson-num">Lesson 04</div>
          <h2>Switches & Circuits</h2>
          <p>"${state.user.name}, today we will learn how electrical energy flows through practical experiments."</p>
        </div>

        <div class="slide-viewer">
          <div class="slide-title">${slide.title}</div>
          <div class="slide-content">
            ${slide.content()}
          </div>
          <div class="slide-nav">
            <button class="slide-arrow" id="prev-slide"
              onclick="changeSlide(-1)" ${state.slideIndex===0?'disabled style="opacity:.35;cursor:not-allowed"':''}>◀</button>
            <div class="slide-dots">
              ${SLIDES.map((_, i) => `
                <div class="slide-dot ${i===state.slideIndex?'active':''}"
                     onclick="changeSlide(${i - state.slideIndex})"></div>
              `).join('')}
            </div>
            <button class="slide-arrow" id="next-slide"
              onclick="changeSlide(1)" ${state.slideIndex===SLIDES.length-1?'disabled style="opacity:.35;cursor:not-allowed"':''}>▶</button>
          </div>
        </div>

        <div style="padding:10px 0;background:var(--accent-light);border-radius:var(--radius);padding:12px 16px;font-size:.83rem;color:var(--accent)">
          📚 ${slide.note}
        </div>

        ${chatHTML('lesson-chat')}
      </main>

      <aside class="dashboard-sidebar">
        ${teamSidebarHTML()}
      </aside>
    </div>

    <div class="lesson-enter-lab">
      <button class="btn btn-primary btn-xl" onclick="navigate('lab',{activeNavTab:'lab'})">
        ${svgIcon('flask', 18, 'white')} ENTER SIMULATION LAB
      </button>
    </div>
  </div>`;
}

/* ── Simulation Lab ── */
function renderSimulation() {
  const activeLab = getActiveLab();
  return `
  <div class="page-wrapper lab-task-page">
    ${navHTML('lab')}
    <div class="lab-task-page-layout page-content">
      <main class="lab-task-main">
        <button class="btn btn-ghost btn-sm lab-back-link" onclick="navigate('lab',{activeNavTab:'lab'})">
          ${svgIcon('back', 14)} Back to Lab Overview
        </button>

        <section class="lab-task-hero">
          <div>
            <div class="lesson-num">Lab ${activeLab.num}</div>
            <h2>${escapeHTML(activeLab.title)}</h2>
            <p>${escapeHTML(activeLab.desc)}</p>
          </div>
          <div class="lab-task-badges">
            <span class="badge ${activeLab.level === 'Challenge' ? 'badge-warning' : 'badge-info'}">${activeLab.level}</span>
            <span class="badge badge-gray">${activeLab.time}</span>
            <span class="badge badge-success">Project Group</span>
          </div>
        </section>

        <section class="lab-task-panel standalone">
          <div class="lab-task-header">
            <div>
              <div class="lesson-num">Task Page</div>
              <h3>What Nicholas, Catherine, and Jack need to build</h3>
            </div>
          </div>

          <div class="lab-task-grid">
            <div class="lab-task-section lab-task-focus">
              <div class="lab-task-section-title">Task Brief</div>
              <p>${escapeHTML(activeLab.task)}</p>
              <div class="lab-checkpoint">
                <span>${svgIcon('check', 14, '#047857')}</span>
                ${escapeHTML(activeLab.checkpoint)}
              </div>
            </div>

            <div class="lab-task-section">
              <div class="lab-task-section-title">Components</div>
              <div class="lab-component-list">
                ${componentChipsHTML(activeLab.components)}
              </div>
            </div>

            <div class="lab-task-section">
              <div class="lab-task-section-title">Helpful Hints</div>
              <ul class="lab-hint-list">
                ${listItemsHTML(activeLab.hints)}
              </ul>
            </div>
          </div>
        </section>

        ${chatHTML('lab-task-chat')}
      </main>

      <aside class="dashboard-sidebar">
        ${teamSidebarHTML()}
      </aside>
    </div>

    <div class="lab-start-bar">
      <div class="lab-start-summary">
        <span>Ready for Lab ${activeLab.num}</span>
        <strong>${escapeHTML(activeLab.title)}</strong>
      </div>
      <button class="btn btn-primary btn-xl" onclick="startSelectedLab()">
        START SIMULATION
      </button>
    </div>
  </div>`;
}

const COMP_DEFS_LABELS = {
  battery:'Battery', switch:'Switch', bulb:'Light Bulb',
  buzzer:'Buzzer', resistor:'Resistor', led:'LED'
};
const batteryIcon  = () => `<svg width="44" height="28" viewBox="0 0 110 60"><line x1="0" y1="30" x2="38" y2="30" stroke="#374151" stroke-width="2"/><line x1="72" y1="30" x2="110" y2="30" stroke="#374151" stroke-width="2"/><line x1="38" y1="14" x2="38" y2="46" stroke="#374151" stroke-width="4"/><line x1="47" y1="20" x2="47" y2="40" stroke="#374151" stroke-width="2"/><line x1="56" y1="14" x2="56" y2="46" stroke="#374151" stroke-width="4"/><line x1="65" y1="20" x2="65" y2="40" stroke="#374151" stroke-width="2"/></svg>`;
const switchIcon   = () => `<svg width="40" height="28" viewBox="0 0 90 60"><line x1="0" y1="30" x2="18" y2="30" stroke="#374151" stroke-width="2"/><line x1="72" y1="30" x2="90" y2="30" stroke="#374151" stroke-width="2"/><circle cx="18" cy="30" r="4" fill="#374151"/><circle cx="72" cy="30" r="4" fill="#374151"/><line x1="18" y1="30" x2="68" y2="12" stroke="#374151" stroke-width="2.5"/></svg>`;
const bulbIcon     = () => `<svg width="28" height="40" viewBox="0 0 80 100"><circle cx="40" cy="50" r="26" fill="white" stroke="#374151" stroke-width="1.8"/><line x1="26" y1="36" x2="54" y2="64" stroke="#374151" stroke-width="1.5"/><line x1="54" y1="36" x2="26" y2="64" stroke="#374151" stroke-width="1.5"/></svg>`;
const wireIcon     = () => `<svg width="40" height="14" viewBox="0 0 80 40"><line x1="0" y1="20" x2="80" y2="20" stroke="#374151" stroke-width="2.5" stroke-dasharray="5 3"/></svg>`;
const buzzerIcon   = () => `<svg width="30" height="30" viewBox="0 0 80 80"><rect x="20" y="22" width="40" height="36" rx="4" fill="#f3f4f6" stroke="#374151" stroke-width="1.8"/><path d="M36,28 Q44,40 36,52" fill="none" stroke="#374151" stroke-width="1.5"/><path d="M42,24 Q52,40 42,56" fill="none" stroke="#374151" stroke-width="1.5"/></svg>`;
const resistorIcon = () => `<svg width="40" height="18" viewBox="0 0 100 50"><line x1="0" y1="25" x2="22" y2="25" stroke="#374151" stroke-width="2"/><rect x="22" y="15" width="56" height="20" rx="3" fill="#fef3c7" stroke="#374151" stroke-width="1.8"/><line x1="78" y1="25" x2="100" y2="25" stroke="#374151" stroke-width="2"/></svg>`;
const ledIcon      = () => `<svg width="30" height="30" viewBox="0 0 80 80"><polygon points="24,24 24,56 56,40" fill="white" stroke="#374151" stroke-width="1.8"/><line x1="56" y1="24" x2="56" y2="56" stroke="#374151" stroke-width="2"/></svg>`;

function componentLibrary() {
  return [
    { type: 'battery',  label: 'Battery',    category: 'power',   tags: 'cell voltage dc source', icon: batteryIcon(), frequent: true },
    { type: 'switch',   label: 'Switch',     category: 'input',   tags: 'toggle open close control', icon: switchIcon(), frequent: true },
    { type: 'bulb',     label: 'Light Bulb', category: 'output',  tags: 'lamp load glow light', icon: bulbIcon(), frequent: true },
    { type: 'buzzer',   label: 'Buzzer',     category: 'output',  tags: 'sound alarm load', icon: buzzerIcon(), frequent: false },
    { type: 'resistor', label: 'Resistor',   category: 'passive', tags: 'ohm resistance load', icon: resistorIcon(), frequent: false },
    { type: 'led',      label: 'LED',        category: 'output',  tags: 'diode light load', icon: ledIcon(), frequent: false },
  ];
}

const COMPONENT_CATEGORIES = [
  { id: 'all', label: 'All Components' },
  { id: 'power', label: 'Power' },
  { id: 'input', label: 'Input' },
  { id: 'output', label: 'Output' },
  { id: 'passive', label: 'Passive' },
];

function getFilteredComponents() {
  const term = state.addCompSearch.trim().toLowerCase();
  return componentLibrary().filter(c => {
    const categoryOk = state.addCompCategory === 'all' || c.category === state.addCompCategory;
    const text = `${c.label} ${c.type} ${c.tags}`.toLowerCase();
    const searchOk = !term || text.includes(term);
    return categoryOk && searchOk;
  });
}

function componentGridHTML(items) {
  if (!items.length) {
    return `<div class="empty-state compact">No matching components</div>`;
  }
  return `
  <div class="add-comp-grid">
    ${items.map(c => `
      <div class="add-comp-item" onclick="addComponentFromLibrary('${c.type}','${escapeAttr(c.label)}')">
        ${c.icon}<span>${escapeHTML(c.label)}</span>
      </div>
    `).join('')}
  </div>`;
}

function addComponentSectionsHTML() {
  const comps = getFilteredComponents();
  const frequent = comps.filter(c => c.frequent);
  return `
    ${frequent.length ? `
      <div style="font-size:.78rem;font-weight:600;color:var(--text-muted);margin-bottom:8px">Frequently Used</div>
      ${componentGridHTML(frequent)}
      <div style="font-size:.78rem;font-weight:600;color:var(--text-muted);margin:14px 0 8px">All Components</div>
    ` : ''}
    ${componentGridHTML(comps)}
  `;
}

function getActiveBranch() {
  return state.branches.find(b => b.id === state.branchActive) || state.branches[0];
}

/* ── Simulation Advanced ── */
function renderSimAdvanced() {
  const activeBranch = getActiveBranch();
  const branches = state.branches.map(b => ({
    ...b,
    active: b.id === activeBranch.id,
    badge: b.id === activeBranch.id ? 'Active' : 'Draft',
  }));
  return `
  <div class="sim-page">
    <header class="sim-header">
      <div class="sim-header-left">
        <div class="header-logo" style="min-width:auto">
          <div class="logo-icon">${svgIcon('zap',16,'white')}</div>
          Circuit Lab
        </div>
        <span style="color:var(--text-muted);font-size:.83rem">←</span>
        <span style="font-size:.83rem;color:var(--text-secondary)">Project: Simple Switch Circuit / Project Group</span>
      </div>
      <nav class="sim-header-center">
        ${navItemsHTML('lab', 'font-size:.83rem;padding:5px 12px')}
      </nav>
      <div class="sim-header-right">
        <button class="btn btn-primary btn-sm" onclick="preparePresentation()">
          FINALIZE & PRESENT
        </button>
        ${teamAvatarMenuHTML()}
      </div>
    </header>

    <div class="adv-sim-body">
      <!-- Branches panel -->
      <div class="branches-panel">
        <div class="branches-title">Design Branches ${svgIcon('info',13)}</div>
        ${branches.map(b => `
          <div class="branch-card ${b.active?'active':''}" onclick="selectBranch('${b.id}')">
            <div class="branch-card-name">
              ${b.name}
              <span class="badge ${b.active?'badge-success':'badge-gray'}">${b.badge}</span>
            </div>
            <div class="branch-card-desc">${b.desc}</div>
          </div>
        `).join('')}
        <button class="btn btn-outline btn-sm btn-full" onclick="createBranch()" style="margin-top:4px">
          + CREATE NEW BRANCH
        </button>
        <button class="btn btn-outline btn-sm btn-full branch-delete-btn"
                onclick="deleteBranch()"
                ${branches.length <= 1 ? 'disabled' : ''}
                title="${branches.length <= 1 ? 'Keep at least one branch' : 'Delete the active branch'}">
          ${svgIcon('trash',13)} DELETE BRANCH
        </button>
        <div style="font-size:.72rem;color:var(--text-muted);line-height:1.5;padding-top:8px">
          💡 Tip: Create branches to try new ideas without changing your main design.
        </div>
      </div>

      <!-- Canvas -->
      <div class="canvas-area">
        <div class="canvas-toolbar">
          <span class="canvas-title">Project: Simple Switch Circuit — ${activeBranch.name}</span>
          <button class="btn btn-ghost btn-sm" onclick="openModal('add-component')" title="Add Component">
            ${svgIcon('plus',14)} Add
          </button>
          <button class="btn btn-ghost btn-sm" id="wiring-mode-btn" onclick="toggleWiringMode()"
                  title="Tap two terminals to connect them">
            ${svgIcon('zap',14)} Connect
          </button>
          <button class="btn btn-ghost btn-sm delete-component-btn" id="delete-component-btn"
                  onclick="deleteSelectedComponent()" disabled
                  title="Select a component to delete it">
            ${svgIcon('trash',14)} Delete
          </button>
          <button class="btn btn-ghost btn-sm delete-wire-btn" id="delete-wire-btn"
                  onclick="deleteSelectedWire()" disabled
                  title="Select a wire to delete it">
            ${svgIcon('x',14)} Delete Wire
          </button>
          <button class="btn btn-ghost btn-sm clear-wires-btn" id="clear-wires-btn"
                  onclick="clearCircuitWires()" disabled
                  title="Remove all wire connections">
            Reset Wires
          </button>
          <button class="btn btn-ghost btn-sm" onclick="resetSimulation()">Reset</button>
          <span class="wire-mode-hint" id="wire-mode-hint">
            Tap Connect, then tap two terminals.
          </span>
        </div>
        <div id="circuit-canvas-container">
          <div id="canvas-feedback" class="canvas-feedback neutral">
            Test each version before presenting it to the class.
          </div>
          <svg id="circuit-svg" xmlns="http://www.w3.org/2000/svg"></svg>
        </div>
        <div class="collab-bar">
          <span class="collab-dot"></span>
          Project Group online &nbsp;|&nbsp; Nicholas editing &nbsp;|&nbsp; Catherine and Jack watching
        </div>
        <div class="canvas-bottom-bar">
          <button class="btn btn-primary" id="run-btn" onclick="runSim()">▶ RUN SIMULATION</button>
          <button class="btn btn-outline" onclick="resetSimulation()">Reset</button>
        </div>
      </div>

      <!-- Stats + Peers -->
      <div class="peer-panel">
        <div class="stats-panel" style="width:auto;border:none;padding:0;gap:10px">
          <div class="stats-panel-title">Live Stats</div>
          <div class="stat-block">
            <div class="stat-label">Voltage Output</div>
            <div><span class="stat-value" id="stat-voltage">9.0</span> <span class="stat-unit">V</span></div>
          </div>
          <div class="stat-block">
            <div class="stat-label">Current</div>
            <div><span class="stat-value" id="stat-current">0.00</span> <span class="stat-unit">A</span></div>
            <div class="stat-status-row">
              <span class="status-dot offline" id="stat-dot"></span>
              <span id="stat-status">Open circuit</span>
            </div>
          </div>
        </div>

        <div style="border-top:1px solid var(--border);padding-top:12px">
          <div class="peer-panel-title">
            Other Groups (Peer Inspiration) ${svgIcon('info',12)}
          </div>
        </div>
        ${[
          { name:'Group 1 (Series Circuit)', thumb: miniCircuitSVG(), note:'Miniature Canvas', live:true },
          { name:'Group 2 (Buzzer Circuit)', thumb: miniCircuitSVG(), note:'Buzzer Active', live:true },
        ].map(g => `
          <div class="peer-group-card">
            <div class="peer-group-header">
              ${g.name}
              <span class="badge ${g.live?'badge-success':'badge-gray'}">${g.live?'Live':''}</span>
            </div>
            <div class="peer-group-thumb">${g.thumb}</div>
            <div class="peer-group-name">${g.note} ›</div>
          </div>
        `).join('')}
        <div class="peer-quote">
          "Nicholas, close the switch and check whether the bulb is really connected back to the battery."
          <br/><span style="font-size:.72rem;opacity:.7;margin-top:4px;display:block">— Catherine</span>
        </div>
        <div class="peer-inspire-link">
          ${svgIcon('star',13,'#2563eb')} Explore ideas from other groups to spark new inspiration!
        </div>
      </div>
    </div>
  </div>`;
}

/* ── Presentation ── */
function renderPresentation() {
  const snapshot = getPresentationSnapshot();
  const steps = getPresentationSteps(snapshot);
  if (state.presStep >= steps.length) state.presStep = steps.length - 1;
  const step = steps[state.presStep];
  let fallbackWidth = Math.max(340, Math.min(620, window.innerWidth ? window.innerWidth - 48 : 620));
  if (fallbackWidth < 620) fallbackWidth = Math.min(fallbackWidth, 390);
  const circuitSVG = window.CircuitSim?.snapshotToSVG
    ? CircuitSim.snapshotToSVG(snapshot, { width: fallbackWidth, height: 380 })
    : miniCircuitSVG();
  const notes = getPresentationNotes(snapshot);
  return `
  <div class="pres-page">
    <header class="pres-header">
      <div>
        <div class="pres-presenter">Presenter: ${state.user.name} / Project Group</div>
        <h2>PROJECT GROUP SWITCH CIRCUIT</h2>
      </div>
      <button class="btn btn-outline btn-sm" style="color:white;border-color:rgba(255,255,255,.4)"
              onclick="navigate('simulation-advanced')">
        EXIT PRESENTATION
      </button>
    </header>

    <div class="pres-body flex-1">
      <div class="pres-stage">
        <div class="pres-circuit-frame">
          ${circuitSVG}
        </div>

        <div class="pres-step-bar">
          <div class="pres-step-text">
            <strong>Current Step:</strong> ${step}
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px">
          <button class="pres-step-btn" onclick="presNav(-1)" ${state.presStep===0?'disabled style="opacity:.4"':''}>
            ← PREV STEP
          </button>
          <div class="pres-progress-dots">
            ${steps.map((_,i)=>`<div class="pres-pdot ${i===state.presStep?'active':''}" onclick="presNav(${i-state.presStep})"></div>`).join('')}
          </div>
          <button class="pres-step-btn primary" onclick="presNav(1)" ${state.presStep===steps.length-1?'disabled style="opacity:.4"':''}>
            ${state.presStep < steps.length-1 ? 'NEXT: FLOW →' : 'DONE'}
          </button>
        </div>
      </div>

      <div class="pres-sidebar">
        <div>
          <div class="pres-notes-title">Presenter Notes</div>
          ${notes.map((n,i) => `
            <div class="pres-note-item">
              <div class="pres-note-num">${i+1}</div>
              <div>${n}</div>
            </div>
          `).join('')}
        </div>

        <div class="pres-qa">
          <div class="pres-qa-title">Q&A / Comments</div>
          <div id="pres-comment-list" class="pres-comment-list">
            ${state.presComments.map(c => `
              <div class="pres-comment">
                <div class="pres-comment-name">${escapeHTML(c.from)}:</div>
                ${escapeHTML(c.text)}
              </div>
            `).join('')}
          </div>
          <input class="pres-comment-input" placeholder="Add a comment…" id="pres-comment-inp"
                 onkeydown="if(event.key==='Enter')addPresComment()"/>
        </div>
      </div>
    </div>
  </div>`;
}

function getPresentationSnapshot() {
  return state.presentationSnapshot || state.branchSnapshots[state.branchActive] || null;
}

function getSnapshotLoadLabels(snapshot) {
  const labels = {
    bulb: 'light bulb',
    buzzer: 'buzzer',
    led: 'LED',
    resistor: 'resistor',
  };
  const found = (snapshot?.components || [])
    .filter(c => labels[c.type])
    .map(c => labels[c.type]);
  return found.length ? Array.from(new Set(found)) : ['light bulb'];
}

function getPresentationSteps(snapshot) {
  const outputs = getSnapshotLoadLabels(snapshot).join(' and ');
  return [
    'First, the battery provides electrical energy for our circuit.',
    'When the switch is closed, the circuit loop is complete.',
    `Current flows through the connected ${outputs}, so we can see the result immediately.`,
    'If a wire is missing or placed incorrectly, the loop breaks and the output stays off.',
  ];
}

function getPresentationNotes(snapshot) {
  const outputs = getSnapshotLoadLabels(snapshot).join(' / ');
  return [
    'Point out the battery, switch, connected wires, and output component.',
    'Show how closing the switch changes the circuit from open to closed.',
    `Explain why this design uses ${outputs} as the output.`,
    'Compare it with another group version, such as a buzzer or second switch design.',
  ];
}

/* ── Reference ── */
const REF_LESSONS = [
  { num:'01', title:'Introduction to Circuits',  desc:'Learn the basics of electric circuits and how they work.',             level:'Beginner',     duration:'12:45', pct:100, topic:'basics',   color:'#0ea5e9', bg:'#e0f2fe' },
  { num:'02', title:'Circuit Components',        desc:'Explore common circuit components and their symbols.',                level:'Beginner',     duration:'15:30', pct:75,  topic:'basics',   color:'#06b6d4', bg:'#cffafe' },
  { num:'03', title:'Series Circuits',           desc:'Understand how components work in series circuits.',                  level:'Intermediate', duration:'18:20', pct:50,  topic:'series',   color:'#8b5cf6', bg:'#ede9fe' },
  { num:'04', title:'Parallel Circuits',         desc:'Learn about parallel circuits and current flow.',                     level:'Intermediate', duration:'14:55', pct:0,   topic:'parallel', color:'#6366f1', bg:'#e0e7ff' },
  { num:'05', title:"Kirchhoff's Laws",          desc:"Apply Kirchhoff's voltage and current laws to circuits.",             level:'Advanced',     duration:'22:10', pct:0,   topic:'advanced', color:'#f59e0b', bg:'#fef3c7' },
  { num:'06', title:'Capacitors and Inductors',  desc:'Understand capacitors, inductors, and their applications.',          level:'Advanced',     duration:'28:05', pct:0,   topic:'advanced', color:'#ef4444', bg:'#fee2e2' },
];

/* ── Course cover thumbnail ── */
function lessonCoverHTML(l) {
  const levelColor = l.level === 'Beginner' ? '#10b981' : l.level === 'Intermediate' ? '#6366f1' : '#f59e0b';
  return `
  <div class="lesson-cover" style="background:${l.bg};border-right:1px solid var(--border)"
       onclick="navigate('lesson',{activeNavTab:'lessons'})">
    <!-- decorative circuit lines -->
    <svg width="100%" height="100%" viewBox="0 0 130 90" style="position:absolute;inset:0;opacity:.18">
      <line x1="10" y1="45" x2="40" y2="45" stroke="${l.color}" stroke-width="2"/>
      <line x1="40" y1="45" x2="40" y2="20" stroke="${l.color}" stroke-width="2"/>
      <line x1="40" y1="20" x2="90" y2="20" stroke="${l.color}" stroke-width="2"/>
      <circle cx="65" cy="20" r="8" fill="none" stroke="${l.color}" stroke-width="2"/>
      <line x1="90" y1="20" x2="90" y2="45" stroke="${l.color}" stroke-width="2"/>
      <line x1="90" y1="45" x2="120" y2="45" stroke="${l.color}" stroke-width="2"/>
      <line x1="10" y1="70" x2="120" y2="70" stroke="${l.color}" stroke-width="1.5" stroke-dasharray="4 3"/>
    </svg>
    <!-- lesson number -->
    <div style="position:absolute;top:8px;left:10px;font-size:.7rem;font-weight:700;color:${l.color};opacity:.8;letter-spacing:.05em">
      LESSON ${l.num}
    </div>
    <!-- play button -->
    <div class="lesson-cover-play">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${l.color}" stroke="none">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    </div>
    <!-- duration badge -->
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.45);color:white;
                font-size:.68rem;font-weight:600;padding:2px 6px;border-radius:3px;">
      ${l.duration}
    </div>
    ${l.pct === 100 ? `<div style="position:absolute;top:8px;right:8px;background:${levelColor};color:white;font-size:.62rem;font-weight:700;padding:2px 6px;border-radius:3px;">✓ DONE</div>` : ''}
  </div>`;
}

function getTopicCounts() {
  return REF_LESSONS.reduce((acc, lesson) => {
    acc.all += 1;
    acc[lesson.topic] = (acc[lesson.topic] || 0) + 1;
    return acc;
  }, { all: 0 });
}

function getFilteredLessons() {
  const term = state.refSearch.trim().toLowerCase();
  const lessons = REF_LESSONS.filter(l => {
    const topicOk = state.refFilter === 'all' || l.topic === state.refFilter;
    const levelOk = state.refLevel === 'all' || l.level.toLowerCase() === state.refLevel;
    const text = `${l.num} ${l.title} ${l.desc} ${l.level} ${l.topic}`.toLowerCase();
    const searchOk = !term || text.includes(term);
    return topicOk && levelOk && searchOk;
  });

  return lessons.sort((a, b) => {
    if (state.refSort === 'az') return a.title.localeCompare(b.title);
    if (state.refSort === 'progress') return b.pct - a.pct || a.num.localeCompare(b.num);
    return b.num.localeCompare(a.num);
  });
}

function referenceLessonCardHTML(l) {
  return `
  <div class="ref-lesson-card" style="align-items:stretch;padding:0;overflow:hidden">
    ${lessonCoverHTML(l)}
    <div class="ref-lesson-body" style="padding:14px 16px">
      <div class="ref-lesson-meta">
        <span class="badge badge-gray" style="font-size:.68rem">Lesson ${l.num}</span>
        <span class="badge ${l.level==='Beginner'?'badge-success':l.level==='Intermediate'?'badge-info':'badge-warning'}"
              style="font-size:.68rem">${l.level}</span>
        <span style="font-size:.72rem;color:var(--text-muted);margin-left:auto">
          ⏱ ${l.duration.replace(':',' min ')} sec
        </span>
      </div>
      <h4 style="margin:6px 0 4px">${l.title}</h4>
      <p style="font-size:.8rem;color:var(--text-secondary);margin-bottom:10px;line-height:1.5">${l.desc}</p>
      ${l.pct > 0 ? `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <div class="progress-bar" style="flex:1">
            <div class="progress-fill ${l.pct===100?'green':''}" style="width:${l.pct}%"></div>
          </div>
          <span style="font-size:.72rem;color:var(--text-muted);white-space:nowrap">${l.pct}% Complete</span>
        </div>` : `<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:10px">Not Started</div>`}
    </div>
    <div class="ref-lesson-action" style="padding:0 14px;align-self:center;flex-shrink:0">
      <button class="btn ${l.pct===100?'btn-outline':l.pct>0?'btn-accent':'btn-primary'} btn-sm"
              onclick="event.stopPropagation();navigate('lesson',{activeNavTab:'lessons'})">
        ${l.pct===100?'REVIEW LESSON':l.pct>0?'CONTINUE LESSON':'START LESSON'}
      </button>
    </div>
  </div>`;
}

function referenceListHTML(lessons) {
  return lessons.length
    ? lessons.map(referenceLessonCardHTML).join('')
    : `<div class="empty-state">No lessons match the current filters.</div>`;
}

function referenceCountText(lessons) {
  return lessons.length
    ? `Showing 1-${lessons.length} of ${REF_LESSONS.length} lessons`
    : `Showing 0 of ${REF_LESSONS.length} lessons`;
}

function renderReference() {
  const topicCounts = getTopicCounts();
  const topics = [
    { id:'all',        label:'All Topics',           count: topicCounts.all || 0 },
    { id:'basics',     label:'Basics & DC Circuits', count: topicCounts.basics || 0 },
    { id:'series',     label:'Series Circuits',      count: topicCounts.series || 0 },
    { id:'parallel',   label:'Parallel Circuits',    count: topicCounts.parallel || 0 },
    { id:'advanced',   label:'Advanced',             count: topicCounts.advanced || 0 },
  ];
  const filtered = getFilteredLessons();

  return `
  <div class="page-wrapper">
    ${navHTML('lessons')}
    <div class="reference-layout page-content">
      <main class="reference-main">
        <div class="reference-header">
          <h2>Lessons</h2>
          <p>Track your progress and continue your learning journey.</p>
        </div>

        <div class="reference-filters">
          <div class="search-box">
            ${svgIcon('search', 15, 'var(--text-muted)')}
            <input type="text" id="ref-search" placeholder="Search lessons, topics, or keywords…"
                   value="${escapeAttr(state.refSearch)}" oninput="filterRef(this.value)"/>
          </div>
          <select class="filter-select" id="topic-select" onchange="setRefTopic(this.value)">
            <option value="all" ${state.refFilter==='all'?'selected':''}>ALL topic</option>
            <option value="basics" ${state.refFilter==='basics'?'selected':''}>Basic concept</option>
            <option value="series" ${state.refFilter==='series'?'selected':''}>DC circuits</option>
            <option value="parallel" ${state.refFilter==='parallel'?'selected':''}>components</option>
            <option value="advanced" ${state.refFilter==='advanced'?'selected':''}>Advanced</option>
          </select>
          <select class="filter-select" onchange="filterRefLevel(this.value)">
            <option value="all" ${state.refLevel==='all'?'selected':''}>All Levels</option>
            <option value="beginner" ${state.refLevel==='beginner'?'selected':''}>Beginner</option>
            <option value="intermediate" ${state.refLevel==='intermediate'?'selected':''}>Intermediate</option>
            <option value="advanced" ${state.refLevel==='advanced'?'selected':''}>Advanced</option>
          </select>
          <button class="clear-filters-btn" onclick="clearRefFilters()">
            ${svgIcon('x',12)} CLEAR FILTERS
          </button>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <span id="ref-results-count" style="font-size:.83rem;color:var(--text-muted)">
            ${referenceCountText(filtered)}
          </span>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:.8rem;color:var(--text-muted)">Sort by:</span>
            <select class="filter-select" onchange="setRefSort(this.value)" style="padding:5px 8px;font-size:.78rem">
              <option value="latest" ${state.refSort==='latest'?'selected':''}>Latest</option>
              <option value="az" ${state.refSort==='az'?'selected':''}>A-Z</option>
              <option value="progress" ${state.refSort==='progress'?'selected':''}>Progress</option>
            </select>
          </div>
        </div>

        <div class="ref-lesson-list" id="ref-lesson-list">
          ${referenceListHTML(filtered)}
        </div>
      </main>

      <aside class="reference-sidebar">
        <div>
          <div class="ref-side-title">Browse by Topic</div>
          <div class="ref-topic-list">
            ${topics.map(t => `
              <div class="ref-topic-item ${state.refFilter===t.id?'active':''}"
                   onclick="setRefTopic('${t.id}')">
                ${t.label}
                <span class="ref-topic-count">${t.count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <div class="ref-side-title" style="margin-top:4px">My Progress</div>
          <div class="progress-widget">
            <div style="font-size:.8rem;color:var(--text-secondary);margin-bottom:8px">Overall Progress</div>
            <div class="progress-widget-pct">${state.lessonProgress.percent}%</div>
            <div class="progress-bar" style="margin-bottom:10px">
              <div class="progress-fill green" style="width:${state.lessonProgress.percent}%"></div>
            </div>
            <button class="btn btn-ghost btn-sm btn-full">VIEW MY PROGRESS</button>
          </div>
        </div>

        <div>
          <div class="ref-side-title">Reference Materials</div>
          ${[
            {icon:'📊', name:'Circuit Symbols', type:'PDF'},
            {icon:'⚖️', name:"Ohm's Law",        type:'Video (45s)'},
            {icon:'📐', name:'Basic Formulas',   type:'Cheat Sheet'},
          ].map(m => `
            <div class="ref-material-item">
              <div class="ref-material-icon">${m.icon}</div>
              <div>
                <div class="ref-material-name">${m.name}</div>
                <div class="ref-material-type">${m.type}</div>
              </div>
              <span style="margin-left:auto;color:var(--text-muted);font-size:.8rem">›</span>
            </div>
          `).join('')}
        </div>

        <div>
          <div class="ref-side-title">Recently Viewed</div>
          ${[
            {name:'Lesson 02: Circuit Components', time:'Today, 10:30 AM'},
            {name:'Lesson 03: Series Circuits',    time:'Today, 9:00 AM'},
            {name:'Lesson 05: Series Circuits',    time:'May 10, 2026'},
          ].map(h => `
            <div class="ref-history-item" onclick="navigate('lesson')">
              <div class="ref-history-name">${h.name}</div>
              <div class="ref-history-meta">${h.time}</div>
            </div>
          `).join('')}
          <button class="btn btn-ghost btn-sm btn-full" style="margin-top:8px">VIEW ALL HISTORY</button>
        </div>
      </aside>
    </div>
    ${footerHTML()}
  </div>`;
}

/* ══ Modals ══════════════════════════════════════════════════════════════ */
function openModal(type) {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modal-box');
  overlay.classList.remove('hidden');

  if (type === 'invite') {
    box.className = 'modal-box';
    box.innerHTML = `
    <div class="modal-header">
      <h3>Invite Member</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p class="text-secondary text-sm">Invite a classmate to join Project Group.</p>
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <div class="input-wrapper">
          <span class="input-icon">${svgIcon('mail',15)}</span>
          <input class="form-input" type="email" placeholder="Enter email address" id="invite-email"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Role (Optional)</label>
        <select class="form-input no-icon">
          <option>Member</option>
          <option>Editor</option>
          <option>Viewer</option>
        </select>
      </div>
      <div class="form-hint">
        ${svgIcon('info',13)} The invited member will be able to view and collaborate on the project.
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="sendInvite()">Invite</button>
    </div>`;
  }

  if (type === 'remove-member') {
    box.className = 'modal-box';
    const removableMembers = state.teamMembers
      .map((member, index) => ({ member, index }))
      .filter(item => !item.member.self);
    box.innerHTML = `
    <div class="modal-header">
      <h3>Remove Member</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p class="text-secondary text-sm">Choose a classmate to remove from Project Group.</p>
      <div class="member-remove-list">
        ${removableMembers.length ? removableMembers.map(({ member, index }) => `
          <div class="member-remove-option">
            <div class="team-member-avatar">
              ${member.initial}
              <span class="status-dot ${member.status}"></span>
            </div>
            <div class="member-remove-meta">
              <div class="team-member-name">${escapeHTML(member.name)}</div>
              <div class="team-member-role">${member.status === 'online' ? 'Online' : 'Offline'}</div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="removeTeamMember(${index})">Remove</button>
          </div>
        `).join('') : `
          <div class="empty-state compact">No classmates to remove</div>
        `}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Done</button>
    </div>`;
  }

  if (type === 'add-component') {
    state.addCompCategory = 'all';
    state.addCompSearch = '';
    box.className = 'modal-box modal-wide';
    box.innerHTML = `
    <div class="modal-header">
      <h3>Add Component</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" style="flex-direction:row;gap:16px;padding:16px 20px">
      <div class="comp-categories" style="min-width:130px">
        ${COMPONENT_CATEGORIES.map(c => `
          <div class="comp-cat-item ${state.addCompCategory===c.id?'active':''}"
               data-comp-category="${c.id}" onclick="setAddComponentCategory('${c.id}')">${c.label}</div>
        `).join('')}
      </div>
      <div style="flex:1">
        <div style="margin-bottom:12px">
          <div class="search-box">
            ${svgIcon('search',14,'var(--text-muted)')}
            <input type="text" id="component-search" placeholder="Search components"
                   oninput="setAddComponentSearch(this.value)"
                   style="border:none;background:none;font-size:.875rem;flex:1"/>
          </div>
        </div>
        <div id="component-results">
          ${addComponentSectionsHTML()}
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">close</button>
    </div>`;
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  document.getElementById('modal-box').className = 'modal-box';
  document.getElementById('modal-box').innerHTML = '';
}

/* ══ Event Handlers ══════════════════════════════════════════════════════ */
let globalEventsBound = false;

function bindGlobal() {
  if (globalEventsBound) return;
  globalEventsBound = true;
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-item')) closeNavDropdowns();
    if (!e.target.closest('.profile-menu')) closeProfileMenu();
    if (!e.target.closest('.team-avatar-menu')) closeTeamMenu();
  });
}

function bindPage(page) {
  if (page === 'simulation' || page === 'simulation-advanced') {
    setTimeout(() => {
      const svg = document.getElementById('circuit-svg');
      const container = document.getElementById('circuit-canvas-container');
      if (svg && container) {
        CircuitSim.init('circuit-svg', 'circuit-canvas-container', updateSimStats, updateSelectionUI);
        if (page === 'simulation-advanced' && state.branchSnapshots[state.branchActive]) {
          CircuitSim.importState(state.branchSnapshots[state.branchActive]);
        }
        updateWireModeUI();
        updateSelectionUI();
        updateSimStats(CircuitSim.getStats());
      }
    }, 50);
  }

  if (page === 'dashboard' || page === 'lesson') {
    setTimeout(() => {
      const chatEl = document.getElementById('dashboard-chat') || document.getElementById('lesson-chat');
      if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
    }, 100);
  }

  if (page === 'login') {
    const form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', handleLogin);
  }
}

/* ── Lab overview ── */
function selectLab(id) {
  if (!LABS.some(lab => lab.id === id)) return;
  state.activeLab = id;
  navigate('simulation', { activeNavTab: 'lab', activeLab: id });
}

function startSelectedLab() {
  const lab = getActiveLab();
  navigate('simulation-advanced', { activeNavTab: 'lab' });
  showToast(`Starting Lab ${lab.num}: ${lab.title}`, 'info');
}

/* ── Auth handlers ── */
function toggleNavDropdown(event) {
  event.preventDefault();
  event.stopPropagation();
  const item = event.currentTarget.closest('.nav-item');
  const isOpen = item?.classList.contains('open');
  closeNavDropdowns();
  closeProfileMenu();
  if (!isOpen) item?.classList.add('open');
}

function handleNavCaretKey(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    toggleNavDropdown(event);
  }
}

function closeNavDropdowns() {
  document.querySelectorAll('.nav-item.open').forEach(item => item.classList.remove('open'));
}

function toggleTeamMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  const menu = event.currentTarget.closest('.team-avatar-menu');
  const isOpen = menu?.classList.contains('open');
  closeTeamMenu();
  closeNavDropdowns();
  closeProfileMenu();
  if (!isOpen) menu?.classList.add('open');
}

function closeTeamMenu() {
  document.querySelectorAll('.team-avatar-menu.open').forEach(menu => menu.classList.remove('open'));
}

function toggleProfileMenu(event) {
  event.stopPropagation();
  const menu = event.currentTarget.closest('.profile-menu');
  const isOpen = menu?.classList.contains('open');
  closeProfileMenu();
  if (!isOpen) menu?.classList.add('open');
}

function closeProfileMenu() {
  document.querySelectorAll('.profile-menu.open').forEach(menu => menu.classList.remove('open'));
}

function setLoggedIn(value) {
  state.isLoggedIn = value;
  try {
    if (value) {
      sessionStorage.setItem('circuitLabLoggedIn', 'true');
    } else {
      sessionStorage.removeItem('circuitLabLoggedIn');
    }
  } catch {}
}

function goHome() {
  navigate(state.isLoggedIn ? 'dashboard' : 'login', { activeNavTab: 'home' });
}

function tryCircuitLab() {
  navigate(state.isLoggedIn ? 'dashboard' : 'login', { activeNavTab: 'home' });
}

function logout() {
  closeProfileMenu();
  setLoggedIn(false);
  state.presentationSnapshot = null;
  navigate('login', { activeNavTab: 'home' });
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email')?.value;
  const pass  = document.getElementById('login-pass')?.value;
  if (!email || !pass) return;
  showToast('Signing in…');
  setLoggedIn(true);
  setTimeout(() => navigate('dashboard', { activeNavTab: 'home' }), 800);
}

function handleGoogleLogin() {
  showToast('Signing in with Google…');
  setLoggedIn(true);
  setTimeout(() => navigate('dashboard', { activeNavTab: 'home' }), 800);
}

function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email')?.value;
  if (!email) return;
  showToast('Reset link sent to ' + email, 'success');
  setTimeout(() => navigate('login'), 2000);
}

function togglePassword() {
  const inp = document.getElementById('login-pass');
  const btn = document.getElementById('pass-toggle');
  if (!inp || !btn) return;
  const isText = inp.type === 'text';
  inp.type = isText ? 'password' : 'text';
  btn.innerHTML = svgIcon(isText ? 'eye' : 'eyeOff', 16);
}

/* ── Chat ── */
function sendChat() {
  const inp = document.getElementById('chat-inp');
  if (!inp || !inp.value.trim()) return;
  const msg = inp.value.trim();
  inp.value = '';
  const now = new Date();
  const time = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')} ${now.getHours()>=12?'PM':'AM'}`;
  state.chatMessages.push({ from: state.user.name, time, text: msg });
  const chatEl = document.getElementById('dashboard-chat') || document.getElementById('lesson-chat');
  if (chatEl) {
    chatEl.innerHTML += `
    <div class="chat-msg">
      <div class="chat-avatar" style="background:var(--primary);color:white">${state.user.initial}</div>
      <div class="chat-msg-body">
        <div class="chat-msg-header">
          <span class="chat-msg-name">${state.user.name}</span>
          <span class="chat-msg-time">${time}</span>
        </div>
        <div class="chat-msg-text">${msg}</div>
      </div>
    </div>`;
    chatEl.scrollTop = chatEl.scrollHeight;
  }
}

/* ── Slide navigation ── */
function changeSlide(delta) {
  const newIdx = state.slideIndex + delta;
  if (newIdx < 0 || newIdx >= SLIDES.length) return;
  state.slideIndex = newIdx;
  navigate('lesson', { activeNavTab: 'lessons' });
}

/* ── Simulation handlers ── */
function dragComp(e, type) {
  e.dataTransfer.setData('comp-type', type);
}

function addCompClick(type) {
  if (window.CircuitSim) {
    CircuitSim.addComponent(type);
    showToast(COMP_DEFS_LABELS[type] + ' added', 'success');
    updateSimStats(CircuitSim.getStats());
    updateSelectionUI();
    saveActiveBranchSnapshot();
  }
}

function addComponentFromLibrary(type, label) {
  if (!window.CircuitSim) return;
  CircuitSim.addComponent(type);
  saveActiveBranchSnapshot();
  closeModal();
  showToast(`${label} added to canvas`, 'success');
  updateSimStats(CircuitSim.getStats());
  updateSelectionUI();
}

function setAddComponentCategory(category) {
  state.addCompCategory = category || 'all';
  updateAddComponentResults();
}

function setAddComponentSearch(value) {
  state.addCompSearch = value;
  updateAddComponentResults();
}

function updateAddComponentResults() {
  const results = document.getElementById('component-results');
  if (results) results.innerHTML = addComponentSectionsHTML();
  document.querySelectorAll('[data-comp-category]').forEach(el => {
    el.classList.toggle('active', el.dataset.compCategory === state.addCompCategory);
  });
}

function runSim() {
  const result = CircuitSim.runSimulation();
  const btn = document.getElementById('run-btn');
  if (result.closed) {
    if (btn) btn.textContent = '⏹ STOP SIMULATION';
    if (btn) btn.onclick = stopSimWrapper;
    showToast('Circuit complete. Current is flowing.', 'success');
  } else {
    setRunButtonIdle(btn);
    showToast(result.message || 'Circuit incomplete. Check the connections.', 'warning');
  }
  updateSimStats(CircuitSim.getStats());
  saveActiveBranchSnapshot();
}

function stopSimWrapper() {
  CircuitSim.stopSimulation();
  const btn = document.getElementById('run-btn');
  setRunButtonIdle(btn);
  updateSimStats(CircuitSim.getStats());
}

function idleRunButtonLabel() {
  return state.page === 'simulation' ? 'START SIMULATION' : '▶ RUN SIMULATION';
}

function setRunButtonIdle(btn = document.getElementById('run-btn')) {
  if (!btn) return;
  btn.textContent = idleRunButtonLabel();
  btn.onclick = runSim;
}

function updateSimStats(stats) {
  if (!stats) stats = CircuitSim?.getStats?.() || {};
  const result = stats.result || CircuitSim?.getCircuitResult?.();
  const vEl = document.getElementById('stat-voltage');
  const iEl = document.getElementById('stat-current');
  const sEl = document.getElementById('stat-status');
  const dEl = document.getElementById('stat-dot');
  const hEl = document.getElementById('ai-hint-text');
  if (vEl) vEl.textContent = stats.voltage || '0.0';
  if (iEl) iEl.textContent = stats.current || '0.00';
  if (sEl) sEl.textContent = stats.status  || '';
  if (dEl) {
    dEl.className = 'status-dot ' + (stats.ok ? 'online' : 'offline');
  }
  if (hEl) {
    if (stats.ok) {
      const loadCount = result?.activeLoadIds?.length || 1;
      hEl.textContent = `Great work. ${loadCount} connected output${loadCount > 1 ? 's are' : ' is'} active, and current is flowing through the closed loop.`;
    } else if (stats.status === 'Open circuit') {
      hEl.textContent = 'Close the switch, then press Run to see the current flow.';
    } else if (stats.status === 'Incomplete circuit') {
      hEl.textContent = result?.message || 'Complete the loop by connecting the battery, switch, load, and return path.';
    } else if (stats.status === 'No battery') {
      hEl.textContent = 'Add a battery to provide voltage for the circuit.';
    } else if (stats.status === 'No load') {
      hEl.textContent = 'Add a load such as a bulb, buzzer, LED, or resistor before running the circuit.';
    } else {
      hEl.textContent = 'Try adding a battery and a light bulb, then connect them with wires.';
    }
  }
  updateCanvasFeedback(result, stats.ok);
  updateWireModeUI();
}

function toggleWiringMode() {
  if (!window.CircuitSim?.setWiringMode) return;
  const next = !CircuitSim.isWiringMode();
  CircuitSim.setWiringMode(next);
  updateWireModeUI();
  updateCanvasFeedback(
    next
      ? { closed: false, reason: 'wiring', message: 'Connect mode is on. Tap one terminal, then tap another terminal to add a wire.' }
      : CircuitSim.getCircuitResult(),
    false
  );
}

function updateWireModeUI() {
  const active = Boolean(window.CircuitSim?.isWiringMode?.());
  const btn = document.getElementById('wiring-mode-btn');
  if (btn) {
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  updateCanvasToolHint();
}

function getComponentLabel(comp) {
  if (!comp) return 'component';
  return COMP_DEFS_LABELS[comp.type] || comp.type || 'component';
}

function updateSelectionUI(
  selected = window.CircuitSim?.getSelectedComponent?.() || null,
  selectedWire = window.CircuitSim?.getSelectedWire?.() || null
) {
  const btn = document.getElementById('delete-component-btn');
  const hasSelection = Boolean(selected);
  if (btn) {
    btn.disabled = !hasSelection;
    btn.classList.toggle('delete-ready', hasSelection);
    btn.title = hasSelection
      ? `Delete selected ${getComponentLabel(selected)}`
      : 'Select a component to delete it';
  }
  const wireBtn = document.getElementById('delete-wire-btn');
  const hasWireSelection = Boolean(selectedWire);
  if (wireBtn) {
    wireBtn.disabled = !hasWireSelection;
    wireBtn.classList.toggle('delete-ready', hasWireSelection);
    wireBtn.title = hasWireSelection
      ? 'Delete selected wire connection'
      : 'Select a wire to delete it';
  }
  const clearWiresBtn = document.getElementById('clear-wires-btn');
  const wireCount = window.CircuitSim?.exportState?.()?.wires?.length || 0;
  if (clearWiresBtn) {
    clearWiresBtn.disabled = wireCount === 0;
    clearWiresBtn.title = wireCount
      ? `Remove ${wireCount} wire connection${wireCount > 1 ? 's' : ''}`
      : 'No wire connections to reset';
  }
  updateCanvasToolHint(selected, selectedWire);
}

function updateCanvasToolHint(
  selected = window.CircuitSim?.getSelectedComponent?.() || null,
  selectedWire = window.CircuitSim?.getSelectedWire?.() || null
) {
  const hint = document.getElementById('wire-mode-hint');
  if (!hint) return;
  if (window.CircuitSim?.isWiringMode?.()) {
    hint.textContent = 'Connect mode on: tap two terminals.';
  } else if (selected) {
    hint.textContent = `Selected: ${getComponentLabel(selected)}. Tap Delete or press Delete.`;
  } else if (selectedWire) {
    hint.textContent = 'Selected: wire connection. Tap Delete Wire or press Delete.';
  } else {
    hint.textContent = 'Tap a wire to select it, or tap Connect to add a new wire.';
  }
}

function updateCanvasFeedback(result, ok = false) {
  const el = document.getElementById('canvas-feedback');
  if (!el || !result) return;
  el.className = 'canvas-feedback ' + (ok || result.closed ? 'success' : result.reason === 'wiring' ? 'info' : 'warning');
  el.textContent = result.closed
    ? 'Circuit complete. The connected output is active and current is flowing.'
    : (result.message || 'The circuit is not complete yet.');
}

function resetSimulation() {
  if (!window.CircuitSim) return;
  CircuitSim.reset();
  updateSimStats(CircuitSim.getStats());
  updateWireModeUI();
  updateSelectionUI();
  setRunButtonIdle();
  saveActiveBranchSnapshot();
}

function deleteSelectedComponent() {
  if (!window.CircuitSim?.deleteSelectedComponent) return;
  const deleted = CircuitSim.deleteSelectedComponent();
  if (!deleted) {
    showToast('Select a component first, then tap Delete.', 'info');
    updateSelectionUI();
    return;
  }
  setRunButtonIdle();
  updateSimStats(CircuitSim.getStats());
  updateWireModeUI();
  updateSelectionUI();
  saveActiveBranchSnapshot();
  showToast(`${getComponentLabel(deleted)} deleted. Connected wires were removed.`, 'info');
}

function deleteSelectedWire() {
  if (!window.CircuitSim?.deleteSelectedWire) return;
  const deleted = CircuitSim.deleteSelectedWire();
  if (!deleted) {
    showToast('Select a wire first, then tap Delete Wire.', 'info');
    updateSelectionUI();
    return;
  }
  setRunButtonIdle();
  updateSimStats(CircuitSim.getStats());
  updateWireModeUI();
  updateSelectionUI();
  saveActiveBranchSnapshot();
  showToast('Wire connection deleted.', 'info');
}

function clearCircuitWires() {
  if (!window.CircuitSim?.clearWires) return;
  const removed = CircuitSim.clearWires();
  if (!removed) {
    showToast('There are no wire connections to reset.', 'info');
    updateSelectionUI();
    return;
  }
  setRunButtonIdle();
  updateSimStats(CircuitSim.getStats());
  updateWireModeUI();
  updateSelectionUI();
  saveActiveBranchSnapshot();
  showToast(`${removed} wire connection${removed > 1 ? 's' : ''} reset. Components were kept.`, 'info');
}

function preparePresentation() {
  saveActiveBranchSnapshot();
  if (window.CircuitSim?.exportState) {
    state.presentationSnapshot = CircuitSim.exportState();
  }
  state.presStep = 0;
  navigate('presentation');
}

function saveActiveBranchSnapshot() {
  if (state.page !== 'simulation-advanced' || !window.CircuitSim?.exportState) return;
  state.branchSnapshots[state.branchActive] = CircuitSim.exportState();
}

/* ── Reference filters ── */
function filterRef(val) {
  state.refSearch = val;
  updateReferenceResults();
}

function filterRefLevel(level) {
  state.refLevel = level || 'all';
  updateReferenceResults();
}

function setRefSort(sort) {
  state.refSort = sort || 'latest';
  updateReferenceResults();
}

function setRefTopic(topic) {
  state.refFilter = topic || 'all';
  navigate('reference', { activeNavTab: 'lessons' });
}

function updateReferenceResults() {
  const list = document.getElementById('ref-lesson-list');
  if (!list) return;
  const filtered = getFilteredLessons();
  list.innerHTML = referenceListHTML(filtered);
  const count = document.getElementById('ref-results-count');
  if (count) count.textContent = referenceCountText(filtered);
}

function clearRefFilters() {
  state.refFilter = 'all';
  state.refSearch = '';
  state.refLevel = 'all';
  state.refSort = 'latest';
  navigate('reference');
}

/* ── Invite ── */
function sendInvite() {
  const email = document.getElementById('invite-email')?.value;
  if (!email) { showToast('Enter an email address', 'warning'); return; }
  closeModal();
  showToast('Invitation sent to ' + email, 'success');
}

/* ── Team management ── */
function removeTeamMember(idx) {
  const m = state.teamMembers[idx];
  if (!m || m.self) return;
  if (!confirm(`Remove ${m.name} from Project Group?`)) return;
  state.teamMembers.splice(idx, 1);
  closeModal();
  navigate(state.page);
  showToast(`${m.name} removed from the group`, 'info');
}

/* ── Presentation ── */
function presNav(delta) {
  const steps = getPresentationSteps(getPresentationSnapshot());
  const newIdx = state.presStep + delta;
  if (newIdx < 0 || newIdx >= steps.length) return;
  state.presStep = newIdx;
  navigate('presentation');
}

function addPresComment() {
  const input = document.getElementById('pres-comment-inp');
  const msg = input?.value.trim();
  if (!msg) return;
  state.presComments.push({ from: state.user.name, text: msg });
  if (input) input.value = '';
  const list = document.getElementById('pres-comment-list');
  if (list) {
    list.innerHTML = state.presComments.map(c => `
      <div class="pres-comment">
        <div class="pres-comment-name">${escapeHTML(c.from)}:</div>
        ${escapeHTML(c.text)}
      </div>
    `).join('');
    list.scrollTop = list.scrollHeight;
  }
}

/* ── Branch selection ── */
function selectBranch(id) {
  if (id === state.branchActive) return;
  saveActiveBranchSnapshot();
  state.branchActive = id;
  navigate('simulation-advanced');
}

function createBranch() {
  saveActiveBranchSnapshot();
  const source = getActiveBranch();
  const nextNum = state.branchCounter + 1;
  const id = 'v' + nextNum;
  state.branchCounter = nextNum;
  state.branches.push({
    id,
    name: `Version ${nextNum} (Experiment)`,
    desc: `Copied from ${source?.name || 'the active branch'} for a new circuit idea.`,
  });
  state.branchSnapshots[id] = window.CircuitSim?.exportState ? CircuitSim.exportState() : null;
  state.branchActive = id;
  navigate('simulation-advanced');
  showToast(`Created ${state.branches[state.branches.length - 1].name}`, 'success');
}

function deleteBranch() {
  if (state.branches.length <= 1) {
    showToast('Keep at least one branch for the project.', 'warning');
    return;
  }
  const index = state.branches.findIndex(b => b.id === state.branchActive);
  if (index < 0) return;
  const [removed] = state.branches.splice(index, 1);
  delete state.branchSnapshots[removed.id];
  const nextBranch = state.branches[Math.max(0, index - 1)] || state.branches[0];
  state.branchActive = nextBranch.id;
  navigate('simulation-advanced');
  showToast(`${removed.name} deleted`, 'info');
}

/* ── Help ── */
function showHelp() {
  openModal('help');
  const box = document.getElementById('modal-box');
  box.innerHTML = `
  <div class="modal-header">
    <h3>${svgIcon('help',18)} Help & Getting Started</h3>
    <button class="modal-close" onclick="closeModal()">✕</button>
  </div>
  <div class="modal-body">
    <p class="text-secondary text-sm" style="margin-bottom:14px">Welcome to Circuit Lab! Here's how to get started:</p>
    ${[
      ['1. Choose your role', 'Select "Student" to log in and access lessons, simulations, and team features.'],
      ['2. Complete lessons', 'Navigate through interactive lessons with slides and demonstrations.'],
      ['3. Build circuits', 'Use the Simulation Lab to drag components, connect wires, and run simulations.'],
      ['4. Collaborate', 'Chat with your team, check member status, and work on shared projects.'],
      ['5. Present your work', 'Use Finalize & Present to showcase your circuit to the class.'],
    ].map(([t,d]) => `
      <div style="margin-bottom:10px">
        <div style="font-weight:600;font-size:.87rem;margin-bottom:3px">${t}</div>
        <div style="font-size:.83rem;color:var(--text-secondary)">${d}</div>
      </div>
    `).join('')}
  </div>
  <div class="modal-footer">
    <button class="btn btn-primary" onclick="closeModal()">Got it!</button>
  </div>`;
}

/* ── Toast ── */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3000);
}

/* ══ Boot ════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  const initialPage = pageFromHash();
  if (pageRequiresLogin(initialPage)) setLoggedIn(true);
  navigate(initialPage, { activeNavTab: navTabForPage(initialPage) }, { syncHash: !window.location.hash });
});

window.addEventListener('hashchange', () => {
  if (suppressHashChange) {
    suppressHashChange = false;
    return;
  }
  const page = pageFromHash();
  navigate(page, { activeNavTab: navTabForPage(page) }, { syncHash: false });
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeNavDropdowns();
    closeProfileMenu();
    closeTeamMenu();
  }
  if (e.key === 'Enter' && document.getElementById('chat-inp') === document.activeElement) sendChat();
  if ((e.key === 'Delete' || e.key === 'Backspace') &&
      (state.page === 'simulation' || state.page === 'simulation-advanced')) {
    const target = e.target;
    const isEditing = target?.matches?.('input, textarea, select, [contenteditable="true"]');
    if (!isEditing && window.CircuitSim?.getSelectedComponent?.()) {
      e.preventDefault();
      deleteSelectedComponent();
    } else if (!isEditing && window.CircuitSim?.getSelectedWire?.()) {
      e.preventDefault();
      deleteSelectedWire();
    }
  }
});
