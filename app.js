/* ─── Circuit Lab — Main Application ─────────────────────────────────────
   Single-page app with hash routing.
   Pages: welcome, login, forgot, about, dashboard, lesson,
          simulation, simulation-advanced, presentation, reference
─────────────────────────────────────────────────────────────────────── */

/* ══ State ══════════════════════════════════════════════════════════════ */
const state = {
  page:    'welcome',
  user:    { name: 'Nicholas', role: 'Student', initial: 'N' },
  lessonProgress: { current: 4, percent: 70 },
  activeNavTab: 'home',
  slideIndex: 0,
  refFilter: 'all',
  refSearch: '',
  refLevel: 'all',
  refSort: 'latest',
  addCompCategory: 'all',
  addCompSearch: '',
  chatMessages: [
    { from: 'Jenny', time: '4/18 12:55 PM', text: "I've added the battery but the switch isn't working yet." },
    { from: 'Cindy', time: '4/18 01:00 PM', text: "I'm joining now! Let's check the wires." },
  ],
  branchActive: 'v1',
  branchCounter: 2,
  branches: [
    { id: 'v1', name: 'Version 1 (Bulb)', desc: 'Base circuit with 1 switch and 1 bulb.' },
    { id: 'v2', name: 'Version 2 (Buzzer)', desc: 'Replacing bulb with buzzer to see results.' },
  ],
  branchSnapshots: {},
  presStep: 0,
  presSteps: [
    "First, the battery provides the potential energy. When I close the switch, the circuit is completed.",
    "The current flows from the positive terminal through the switch.",
    "The light bulb converts electrical energy into light — resistance creates heat and glow.",
    "What happens if we add a second bulb? Let's explore that next.",
  ],
  presComments: [
    { from: 'Teacher', text: 'Nicholas, can you show the electron flow again?' },
    { from: 'Catherine', text: 'Nicholas, can you show the electron flow again?' },
  ],
};

/* ══ Router ═════════════════════════════════════════════════════════════ */
const ROUTE_PAGES = [
  'welcome',
  'login',
  'forgot',
  'about',
  'dashboard',
  'lesson',
  'simulation',
  'simulation-advanced',
  'presentation',
  'reference',
];

let suppressHashChange = false;

function normalizePage(page) {
  return ROUTE_PAGES.includes(page) ? page : 'welcome';
}

function pageFromHash() {
  return normalizePage(window.location.hash.replace(/^#/, '') || 'welcome');
}

function navTabForPage(page) {
  if (page === 'dashboard' || page === 'welcome') return 'home';
  if (page === 'reference' || page === 'lesson') return 'lessons';
  if (page === 'simulation' || page === 'simulation-advanced' || page === 'presentation') return 'lab';
  if (page === 'about') return 'about';
  return state.activeNavTab;
}

function navigate(page, extra = {}, options = {}) {
  const nextPage = normalizePage(page);
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
    case 'lesson':               return renderLesson();
    case 'simulation':           return renderSimulation();
    case 'simulation-advanced':  return renderSimAdvanced();
    case 'presentation':         return renderPresentation();
    case 'reference':            return renderReference();
    default:                     return renderWelcome();
  }
}

/* ══ Shared helpers ═════════════════════════════════════════════════════ */
function navHTML(active) {
  const tabs = [
    { id: 'home',    label: 'Home',    page: 'dashboard', items: [
      { label: 'Dashboard',   page: 'dashboard' },
      { label: 'Welcome',     page: 'welcome'   },
    ]},
    { id: 'lessons', label: 'Lessons', page: 'reference', items:
      REF_LESSONS.map(l => ({
        label: `Lesson ${l.num} · ${l.title}`,
        page:  'lesson',
      })).concat([{ label: 'View all lessons', page: 'reference' }])
    },
    { id: 'lab',     label: 'Lab',     page: 'simulation', items: [
      { label: 'Simulation Lab', page: 'simulation'          },
      { label: 'Advanced Mode',  page: 'simulation-advanced' },
      { label: 'Presentation',   page: 'presentation'        },
    ]},
    { id: 'about',   label: 'About',   page: 'about', items: [
      { label: 'About Circuit Lab', page: 'about' },
    ]},
  ];
  const itemHTML = (it) => `
    <a class="nav-dropdown-item"
       onclick="navigate('${it.page}',{activeNavTab:'${navTabForPage(it.page)}'})"
       href="javascript:void(0)">${it.label}</a>`;
  return `
  <header class="app-header">
    <div class="header-logo">
      <div class="logo-icon">
        ${svgIcon('zap', 18, 'white')}
      </div>
      Circuit Lab
    </div>
    <nav class="main-nav">
      ${tabs.map(t => `
        <div class="nav-item">
          <a class="nav-link ${active === t.id ? 'active' : ''}"
             onclick="navigate('${t.page}',{activeNavTab:'${t.id}'})"
             href="javascript:void(0)">
            ${t.label}
            <span class="nav-caret">▾</span>
          </a>
          <div class="nav-dropdown">
            ${t.items.map(itemHTML).join('')}
          </div>
        </div>
      `).join('')}
    </nav>
    <div class="header-right">
      <span class="user-badge">${state.user.name} (${state.user.role})</span>
      <div class="avatar" title="Profile">${state.user.initial}</div>
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
  const members = [
    { name: 'Nicholas', role: 'Me', status: 'online',  initial: 'N', badge: null },
    { name: 'Catherine', role: '',  status: 'online',  initial: 'C', badge: null },
    { name: 'Jack',      role: '',  status: 'offline', initial: 'J', badge: 'remote' },
  ];
  return `
  <div class="sidebar-section">
    <div class="sidebar-section-title">Team Status</div>
    <div class="team-status-card">
      <div class="team-status-header">
        Project Group 4
        <span class="badge badge-info">3</span>
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
      <div class="team-invite-row">
        <button class="btn btn-outline btn-sm btn-full" onclick="openModal('invite')">+ Invite</button>
      </div>
    </div>
  </div>
  <div class="sidebar-section">
    <div class="sidebar-section-title">Lesson Reference</div>
    <div class="lesson-ref-card">
      <div class="lesson-ref-header">Lesson 04 Notes</div>
      <div class="lesson-ref-diagram">
        <span class="lesson-ref-nav prev">◀</span>
        ${miniCircuitSVG()}
        <span class="lesson-ref-nav next">▶</span>
      </div>
      <div class="lesson-ref-note">
        "A switch interrupts the flow of electrons to turn off the circuit."
      </div>
      <div class="lesson-ref-footer">
        <button class="btn btn-ghost btn-sm btn-full" onclick="navigate('reference')">View Full Notes →</button>
      </div>
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
    <header class="app-header">
      <div class="header-logo">
        <div class="logo-icon">${svgIcon('zap', 18, 'white')}</div>
        Circuit Lab
      </div>
      <nav class="main-nav">
        <a class="nav-link" onclick="navigate('welcome')" href="javascript:void(0)">Home</a>
        <a class="nav-link active" href="javascript:void(0)">About</a>
      </nav>
      <div class="header-right">
        <button class="btn btn-primary btn-sm" onclick="navigate('login')">Login</button>
      </div>
    </header>

    <main class="page-content" style="background:var(--surface)">
      <div class="container py-12">
        <div class="about-hero">
          <h1>About Circuit Lab</h1>
          <p>Empowering learners through interactive electronics education.<br/>
          Circuit Lab is an online platform designed to help students learn electronics through hands-on simulations, interactive lessons, and collaborative projects.</p>
          <button class="btn btn-primary btn-lg" onclick="navigate('login')">Try the circuit lab</button>
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
            <button class="welcome-btn-primary" onclick="navigate('simulation',{activeNavTab:'lab'})">
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
        ${['home','lessons','lab','about'].map(t => `
          <a class="nav-link ${state.activeNavTab===t?'active':''}"
             onclick="navigate('${t==='home'?'dashboard':t==='lessons'?'reference':t==='lab'?'simulation':t}',{activeNavTab:'${t}'})"
             href="javascript:void(0)">${t.charAt(0).toUpperCase()+t.slice(1)}</a>
        `).join('')}
      </nav>
      <div class="header-right">
        <span class="user-badge">${state.user.name} (${state.user.role})</span>
        <div class="avatar">${state.user.initial}</div>
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
      <button class="btn btn-primary btn-xl" onclick="navigate('simulation',{activeNavTab:'lab'})">
        ${svgIcon('flask', 18, 'white')} ENTER SIMULATION LAB
      </button>
    </div>
  </div>`;
}

/* ── Simulation Lab ── */
function renderSimulation() {
  return `
  <div class="sim-page">
    <header class="sim-header">
      <div class="sim-header-left">
        <button class="btn btn-ghost btn-sm" onclick="navigate('lesson',{activeNavTab:'lessons'})"
                style="display:flex;align-items:center;gap:4px">
          ${svgIcon('back', 14)} back
        </button>
        <div class="sim-project-title">Project: <span>Simple Switch Circuit</span></div>
      </div>
      <nav class="sim-header-center">
        ${['home','lessons','lab','about'].map(t => `
          <a class="nav-link ${t==='lab'?'active':''}"
             onclick="navigate('${t==='home'?'dashboard':t==='lessons'?'reference':t==='lab'?'simulation':t}',{activeNavTab:'${t}'})"
             href="javascript:void(0)" style="font-size:.83rem;padding:5px 12px">${t.charAt(0).toUpperCase()+t.slice(1)}</a>
        `).join('')}
      </nav>
      <div class="sim-header-right">
        <button class="btn btn-outline btn-sm" onclick="navigate('simulation-advanced')">
          Advanced Mode →
        </button>
        <div class="avatar-group">
          <div class="avatar" title="Nicholas" style="background:#2563eb">N</div>
          <div class="avatar" title="Catherine" style="background:#7c3aed">C</div>
        </div>
      </div>
    </header>

    <div class="sim-body">
      <!-- Component sidebar -->
      <div class="component-panel">
        <div class="comp-panel-title">Components</div>
        ${[
          {type:'battery',  icon: batteryIcon()},
          {type:'switch',   icon: switchIcon()},
          {type:'bulb',     icon: bulbIcon()},
          {type:'wire',     icon: wireIcon()},
          {type:'buzzer',   icon: buzzerIcon()},
          {type:'resistor', icon: resistorIcon()},
          {type:'led',      icon: ledIcon()},
        ].map(c => `
          <div class="comp-item"
               draggable="true"
               ondragstart="dragComp(event,'${c.type}')"
               onclick="addCompClick('${c.type}')"
               title="Drag or click to add ${c.type}">
            ${c.icon}
            <span class="comp-item-label">${COMP_DEFS_LABELS[c.type]||c.type}</span>
          </div>
        `).join('')}
      </div>

      <!-- Canvas -->
      <div class="canvas-area">
        <div class="canvas-toolbar">
          <span class="canvas-title">Circuit Canvas</span>
          <button class="btn btn-ghost btn-sm" onclick="openModal('add-component')" title="Add Component">
            ${svgIcon('plus',14)} Add
          </button>
          <button class="btn btn-ghost btn-sm" id="wiring-mode-btn" onclick="toggleWiringMode()"
                  title="Click two terminals to connect them">
            ${svgIcon('zap',14)} Wire
          </button>
          <span style="margin-left:auto;font-size:.75rem;color:var(--text-muted)">
            Drag components • Click switch to toggle • Double-click wire to delete
          </span>
        </div>
        <div id="circuit-canvas-container">
          <svg id="circuit-svg" xmlns="http://www.w3.org/2000/svg"></svg>
        </div>
      </div>

      <!-- Task panel -->
      <div class="stats-panel">
        <div class="stats-panel-title">Lesson Task</div>
        <div class="task-brief">
          <div class="task-brief-meta">
            <span class="badge badge-info">Lesson 04</span>
            <span class="badge badge-gray">Beginner</span>
          </div>
          <h4 class="task-brief-title">Switches &amp; Circuits</h4>
          <p class="task-brief-desc">
            Build a simple circuit and observe how a switch controls the flow of electricity to the bulb.
          </p>
          <div class="task-brief-section-title">Objectives</div>
          <ul class="task-brief-list">
            <li>Place the battery, switch, and bulb on the canvas.</li>
            <li>Wire the components into a closed loop.</li>
            <li>Toggle the switch and run the simulation.</li>
            <li>Note when the bulb turns on and explain why.</li>
          </ul>
        </div>
        <div class="ai-hint-box">
          <div class="ai-hint-header">
            ${svgIcon('star', 13, '#92400e')} Experimental assistant
          </div>
          <span id="ai-hint-text">Try toggling the switch to close the circuit. Observe the change in brightness of the bulb.</span>
        </div>
        <div class="canvas-bottom-bar" style="flex-direction:column;gap:6px;border:none;padding:0">
          <button class="btn btn-primary btn-full" id="run-btn" onclick="runSim()">
            ▶ RUN SIMULATION
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

const COMP_DEFS_LABELS = {
  battery:'Battery', switch:'Switch', bulb:'Light Bulb',
  wire:'Wire', buzzer:'Buzzer', resistor:'Resistor', led:'LED'
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
    { type: 'wire',     label: 'Wire',       category: 'wires',   tags: 'connection conductor lead', icon: wireIcon(), frequent: true },
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
  { id: 'wires', label: 'Wires & Connections' },
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
        <span style="font-size:.83rem;color:var(--text-secondary)">Project: Simple Switch Circuit / Group 4</span>
      </div>
      <nav class="sim-header-center">
        ${['home','lessons','lab','about'].map(t => `
          <a class="nav-link ${t==='lab'?'active':''}"
             onclick="navigate('${t==='home'?'dashboard':t==='lessons'?'reference':t==='lab'?'simulation':t}',{activeNavTab:'${t}'})"
             href="javascript:void(0)" style="font-size:.83rem;padding:5px 12px">${t.charAt(0).toUpperCase()+t.slice(1)}</a>
        `).join('')}
      </nav>
      <div class="sim-header-right">
        <button class="btn btn-primary btn-sm" onclick="navigate('presentation')">
          FINALIZE & PRESENT
        </button>
        <div class="avatar-group">
          <div class="avatar" title="Nicholas" style="background:#2563eb">N</div>
          <div class="avatar" title="Catherine" style="background:#7c3aed">C</div>
          <div class="avatar" title="Jack" style="background:#d97706">J</div>
        </div>
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
        <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px">
          <div class="branches-title">Add Component</div>
          <button class="btn btn-outline btn-sm btn-full" onclick="openModal('add-component')" style="margin-top:8px">
            ${svgIcon('plus',13)} Add Component
          </button>
        </div>
        <div style="font-size:.72rem;color:var(--text-muted);line-height:1.5;padding-top:8px">
          💡 Tip: Create branches to try new ideas without changing your main design.
        </div>
      </div>

      <!-- Canvas -->
      <div class="canvas-area">
        <div class="canvas-toolbar">
          <span class="canvas-title">Project: Simple Switch Circuit — ${activeBranch.name}</span>
          <button class="btn btn-ghost btn-sm" onclick="CircuitSim.reset()">Reset</button>
          <span style="margin-left:auto;font-size:.75rem;color:var(--text-muted)">
            Drag • Wire • Toggle switch
          </span>
        </div>
        <div id="circuit-canvas-container">
          <svg id="circuit-svg" xmlns="http://www.w3.org/2000/svg"></svg>
        </div>
        <div class="collab-bar">
          <span class="collab-dot"></span>
          Live Collaboration Active &nbsp;|&nbsp; You are editing &nbsp;|&nbsp; 3 members online
        </div>
        <div class="canvas-bottom-bar">
          <button class="btn btn-primary" id="run-btn" onclick="runSim()">▶ RUN SIMULATION</button>
          <button class="btn btn-outline" onclick="CircuitSim.reset();updateSimStats()">Reset</button>
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
          "Nicholas, try to move that switch to close the circuit. Observe the change in the brightness of the bulb."
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
  const step = state.presSteps[state.presStep];
  return `
  <div class="pres-page">
    <header class="pres-header">
      <div>
        <div class="pres-presenter">Presenter: ${state.user.name} / Group 4</div>
        <h2>FINAL PRESENTATION</h2>
      </div>
      <button class="btn btn-outline btn-sm" style="color:white;border-color:rgba(255,255,255,.4)"
              onclick="navigate('simulation-advanced')">
        EXIT MODERATOR
      </button>
    </header>

    <div class="pres-body flex-1">
      <div class="pres-stage">
        <div class="pres-circuit-frame">
          <svg width="340" height="230" viewBox="0 0 340 230" fill="none">
            <text x="85" y="18" font-family="Inter" font-size="11" fill="#6b7280">battery</text>
            <rect x="40" y="25" width="90" height="55" rx="6" fill="white" stroke="#374151" stroke-width="1.5"/>
            <line x1="43" y1="50" x2="54" y2="50" stroke="#374151" stroke-width="2"/>
            <line x1="54" y1="38" x2="54" y2="62" stroke="#374151" stroke-width="4"/>
            <line x1="63" y1="44" x2="63" y2="68" stroke="#374151" stroke-width="1.8"/>
            <line x1="72" y1="38" x2="72" y2="62" stroke="#374151" stroke-width="4"/>
            <line x1="81" y1="44" x2="81" y2="68" stroke="#374151" stroke-width="1.8"/>
            <line x1="118" y1="50" x2="130" y2="50" stroke="#374151" stroke-width="2"/>
            <line x1="40" y1="52" x2="20" y2="52" stroke="#374151" stroke-width="2"/>
            <line x1="130" y1="52" x2="220" y2="52" stroke="#374151" stroke-width="1.8"/>
            <text x="174" y="34" font-family="Inter" font-size="10" fill="#6b7280">Switch</text>
            <circle cx="190" cy="52" r="4" fill="#374151"/>
            <line x1="194" y1="52" x2="214" y2="52" stroke="#374151" stroke-width="2"/>
            <circle cx="215" cy="52" r="4" fill="#374151"/>
            <line x1="220" y1="52" x2="260" y2="52" stroke="#374151" stroke-width="1.8"/>
            <line x1="260" y1="52" x2="260" y2="100" stroke="#374151" stroke-width="1.8"/>
            <circle cx="260" cy="145" r="42" fill="${state.presStep>=1?'#fef08a':'white'}" stroke="#374151" stroke-width="2"/>
            ${state.presStep>=1?`<circle cx="260" cy="145" r="38" fill="#fef9c3" stroke="none"/>` : ''}
            <line x1="240" y1="125" x2="280" y2="165" stroke="#374151" stroke-width="1.8"/>
            <line x1="280" y1="125" x2="240" y2="165" stroke="#374151" stroke-width="1.8"/>
            <text x="260" y="200" font-family="Inter" font-size="11" fill="#6b7280" text-anchor="middle">Light Bulb</text>
            <line x1="260" y1="187" x2="260" y2="210" stroke="#374151" stroke-width="1.8"/>
            <line x1="260" y1="210" x2="20" y2="210" stroke="#374151" stroke-width="1.8"/>
            <line x1="20" y1="210" x2="20" y2="52" stroke="#374151" stroke-width="1.8"/>
          </svg>
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
            ${state.presSteps.map((_,i)=>`<div class="pres-pdot ${i===state.presStep?'active':''}" onclick="presNav(${i-state.presStep})"></div>`).join('')}
          </div>
          <button class="pres-step-btn primary" onclick="presNav(1)" ${state.presStep===state.presSteps.length-1?'disabled style="opacity:.4"':''}>
            NEXT STEP: ${state.presStep < state.presSteps.length-1 ? 'SHOW FLOW →' : 'DONE'}
          </button>
        </div>
      </div>

      <div class="pres-sidebar">
        <div>
          <div class="pres-notes-title">Presenter Notes</div>
          ${[
            'Explain the "Broken Wire" issue I found earlier.',
            'Demonstrate how the switch controls the light.',
            'Mention why we chose a light over a buzzer.',
            'Tell the class: "What happens if we add a second?"',
          ].map((n,i) => `
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
    box.innerHTML = `
    <div class="modal-header">
      <h3>Change Team Member</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p class="text-secondary text-sm">Invite a classmate to join Project Group 4.</p>
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
      <button class="btn btn-primary" onclick="sendInvite()">Change</button>
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
}

function bindPage(page) {
  if (page === 'simulation' || page === 'simulation-advanced') {
    setTimeout(() => {
      const svg = document.getElementById('circuit-svg');
      const container = document.getElementById('circuit-canvas-container');
      if (svg && container) {
        CircuitSim.init('circuit-svg', 'circuit-canvas-container', updateSimStats);
        if (page === 'simulation-advanced' && state.branchSnapshots[state.branchActive]) {
          CircuitSim.importState(state.branchSnapshots[state.branchActive]);
        }
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

/* ── Auth handlers ── */
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email')?.value;
  const pass  = document.getElementById('login-pass')?.value;
  if (!email || !pass) return;
  showToast('Signing in…');
  setTimeout(() => navigate('dashboard', { activeNavTab: 'home' }), 800);
}

function handleGoogleLogin() {
  showToast('Signing in with Google…');
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
    btn.onclick = stopSimWrapper;
    showToast('Circuit complete! Current is flowing.', 'success');
  } else {
    const reason = {
      no_battery: 'add a battery',
      no_load: 'add a load (bulb/buzzer/resistor)',
      switch_open: 'switch is open',
      incomplete: 'check terminal connections',
    }[result.reason] || 'check connections';
    showToast('Circuit incomplete — ' + reason, 'warning');
  }
  updateSimStats(CircuitSim.getStats());
}

function stopSimWrapper() {
  CircuitSim.stopSimulation();
  const btn = document.getElementById('run-btn');
  if (btn) { btn.textContent = '▶ RUN SIMULATION'; btn.onclick = runSim; }
  updateSimStats(CircuitSim.getStats());
}

function updateSimStats(stats) {
  if (!stats) stats = CircuitSim?.getStats?.() || {};
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
      hEl.textContent = `Great work! The circuit is complete. Current = ${stats.voltage}V ÷ R = ${stats.current}A flowing through the load.`;
    } else if (stats.status === 'Open circuit') {
      hEl.textContent = 'Toggle the switch to close the circuit. Then press RUN to see the simulation.';
    } else if (stats.status === 'Incomplete circuit') {
      hEl.textContent = 'Complete the loop by connecting the battery, switch, load, and return path with wires.';
    } else if (stats.status === 'No battery') {
      hEl.textContent = 'Add a battery to provide voltage for the circuit.';
    } else if (stats.status === 'No load') {
      hEl.textContent = 'Add a load such as a bulb, buzzer, LED, or resistor before running the circuit.';
    } else {
      hEl.textContent = 'Try adding a battery and a light bulb, then connect them with wires.';
    }
  }
}

function toggleWiringMode() {
  const btn = document.getElementById('wiring-mode-btn');
  if (btn) btn.classList.toggle('active');
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

/* ── Presentation ── */
function presNav(delta) {
  const newIdx = state.presStep + delta;
  if (newIdx < 0 || newIdx >= state.presSteps.length) return;
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
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && document.getElementById('chat-inp') === document.activeElement) sendChat();
});
