// Tab navigation
const TABS = ['program', 'log', 'settings'];
let currentTab = 'program';

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.t));
});

function switchTab(tabId) {
  if (tabId === currentTab) return;
  document.querySelectorAll('.tc').forEach(el => el.classList.remove('act', 'slide-in'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('act'));

  const map = { program: 'tProgram', log: 'tLog', settings: 'tSettings' };
  document.getElementById(map[tabId]).classList.add('act', 'slide-in');
  document.querySelector(`[data-t="${tabId}"]`).classList.add('act');
  currentTab = tabId;
  if (tabId === 'program') renderProgram();
  if (tabId === 'settings') renderSettings();
  if (tabId === 'log') renderLogStep();
}

// Swipe gesture
let touchStartX = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});
document.addEventListener('touchend', e => {
  const diff = touchStartX - e.changedTouches[0].screenX;
  if (Math.abs(diff) > 60) {
    const idx = TABS.indexOf(currentTab);
    if (diff > 0 && idx < TABS.length - 1) switchTab(TABS[idx + 1]);
    else if (diff < 0 && idx > 0) switchTab(TABS[idx - 1]);
  }
});

// Toast
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(t._hide);
  t._hide = setTimeout(() => t.classList.remove('show'), 2500);
}

// Calendar
function renderCalendar() {
  const days = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfWeek = getMondayOfWeek(today);

  let html = '<div class="cal">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const isTraining = TRAINING_DAYS.includes(d.getDay());
    const log = DATA.logs.find(l => l.d === dateStr);
    const isToday = dateStr === today.toISOString().slice(0, 10);
    const isPast = d < today;

    let cls = 'cal-badge';
    if (log) cls += log.t === 'A' ? ' a' : ' b';
    else if (isTraining) {
      const expected = getSessionForDay(d);
      cls += expected === 'A' ? ' a' : ' b';
      cls += ' upcoming';
    }
    if (!isTraining && !log) cls += ' off';
    if (isToday) cls += ' today';
    if (isPast && !log) cls += ' past';

    html += '<div class="cal-day">';
    html += '<span class="cal-dn">' + days[d.getDay()] + '</span>';
    html += '<div class="' + cls + '">' + (isTraining ? (log ? log.t : getSessionForDay(d)) : '·') + '</div>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// Program next session with date
function getNextSessionDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const todaySession = getSessionForDay(today);
  if (todaySession) {
    const alreadyDone = DATA.logs.some(l => l.d === todayStr && l.t === todaySession);
    if (!alreadyDone) return { date: today, label: "Aujourd'hui" };
  }
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (getSessionForDay(d)) {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      return { date: d, label: days[d.getDay()] + ' ' + d.getDate() };
    }
  }
  return { date: today, label: "Aujourd'hui" };
}

// Program view
function renderProgram() {
  const next = getNextSession();
  const nextDateInfo = getNextSessionDate();
  const streak = getStreak();
  const isA = next.id === 'A';
  setAccent(next.id);

  // Next session card
  document.getElementById('nextSession').innerHTML =
    '<p style="font-size:.6rem;text-transform:uppercase;letter-spacing:.14em;color:var(--text3);font-weight:600;margin-bottom:4px">' + nextDateInfo.label + '</p>' +
    '<h2 style="font-family:var(--ff-h);font-size:1.8rem;font-weight:800;color:' + (isA ? 'var(--a)' : 'var(--b)') + ';margin:4px 0">SÉANCE ' + next.id + '</h2>' +
    '<p style="font-size:.8rem;color:var(--text2);font-weight:500;margin-bottom:2px">' + next.focus + '</p>' +
    '<p style="font-size:.65rem;color:var(--text3);margin-bottom:10px">' + next.exercises.length + ' exercices</p>' +
    '<button class="btn btn-p" id="startSessionBtn" data-session="' + next.id + '" style="min-width:160px">Saisir cette séance</button>';

  document.getElementById('startSessionBtn')?.addEventListener('click', () => {
    if (typeof startLog === 'function') {
      startLog(next.id);
      switchTab('log');
    }
  });

  // Calendar
  document.getElementById('calendar').innerHTML = renderCalendar();

  // Exercises
  renderProgramExercises(next);

  // Streak
  document.getElementById('streakDisplay').innerHTML = streak > 0
    ? '<div class="card streak-card"><span class="streak-icon">🔥</span><span class="streak-text">' + streak + ' séance' + (streak > 1 ? 's' : '') + ' consécutive' + (streak > 1 ? 's' : '') + '</span></div>'
    : '<div class="card streak-card"><span class="streak-icon">🔥</span><span class="streak-text" style="color:var(--text3)">Aucune séance encore</span></div>';
}

function renderProgramExercises(session) {
  const exs = getSessionExercises(session.id);
  let html = '<div class="card" style="overflow:hidden;margin-top:10px">';
  exs.forEach(function(ex, i) {
    const history = getExerciseHistory(ex.num, session.id);
    const lastWeight = history.length ? history[history.length - 1].weight : null;
    const displayWeight = lastWeight !== null ? lastWeight : ex.weight;
    const weightDisplay = displayWeight > 0 ? displayWeight + 'kg' : 'PDC';
    const progressHtml = (lastWeight && lastWeight > ex.weight)
      ? '<div style="margin-top:4px"><span style="color:var(--success);font-size:.7rem;font-weight:600">↑ ' + ex.weight + 'kg → ' + lastWeight + 'kg</span></div>'
      : '';

    var restMin = Math.floor(ex.rest / 60);
    var restSec = ex.rest % 60;
    var restDisplay = restMin + 'min' + (restSec > 0 ? restSec : '');

    html += '<div style="padding:14px 16px' + (i < exs.length - 1 ? ';border-bottom:1px solid var(--border)' : '') + '">';
    html += '<div style="display:flex;align-items:center;gap:10px">';
    html += '<span style="width:24px;height:24px;border-radius:50%;background:' + (session.id === 'A' ? 'var(--a-bg)' : 'var(--b-bg)') + ';color:' + (session.id === 'A' ? 'var(--a)' : 'var(--b)') + ';display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700">' + ex.num + '</span>';
    html += '<div style="flex:1">';
    html += '<div style="font-weight:600;font-size:.9rem">' + ex.name + '</div>';
    html += '<div style="font-size:.8rem;color:var(--text2);margin-top:2px">' + ex.sets + '×' + ex.reps + ' · ' + weightDisplay + ' · ⏱ ' + restDisplay + '</div>';
    html += progressHtml;
    html += '</div></div>';
    if (ex.note) {
      html += '<div style="font-size:.72rem;color:var(--text3);margin-top:6px;padding:6px 10px;background:var(--bg);border-radius:8px;border-left:3px solid var(--text3);line-height:1.5">' + ex.note + '</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  document.getElementById('programExercises').innerHTML = html;
}

// Settings
function renderSettings() {
  const streak = getStreak();
  document.getElementById('settingsStreak').innerHTML = streak > 0
    ? '<div class="card" style="padding:16px;margin-bottom:12px;text-align:center"><div style="font-size:2rem">🔥</div><div style="font-weight:700;font-size:1.2rem;margin:4px 0">' + streak + ' séance' + (streak > 1 ? 's' : '') + '</div><div style="font-size:.75rem;color:var(--text3)">consécutive' + (streak > 1 ? 's' : '') + '</div></div>'
    : '<div class="card" style="padding:16px;margin-bottom:12px;text-align:center"><div style="font-size:2rem">🔥</div><div style="font-size:.85rem;color:var(--text3);margin-top:4px">Aucune séance encore</div></div>';
}

// Export/Import
document.getElementById('expCodeBtn').addEventListener('click', function() {
  try {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(DATA.logs))));
    navigator.clipboard.writeText(code).then(function() {
      showToast('Code copié !', 'ok');
    }).catch(function() {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Code copié !', 'ok');
    });
  } catch (e) {
    showToast('Erreur d\'export', 'ko');
  }
});

document.getElementById('impCodeBtn').addEventListener('click', function() {
  const modal = document.getElementById('modal');
  document.getElementById('modalContent').innerHTML =
    '<h3>Importer des données</h3>' +
    '<p>Colle le code reçu par WhatsApp</p>' +
    '<textarea id="codeInput" rows="4" placeholder="Colle le code ici..."></textarea>' +
    '<div class="modal-acts"><button class="btn btn-p" id="restoreBtn">Restaurer</button><button class="btn" id="modalCancel">Annuler</button></div>';
  modal.classList.add('show');

  document.getElementById('restoreBtn').addEventListener('click', importCode);
  document.getElementById('modalCancel').addEventListener('click', function() { modal.classList.remove('show'); });
  document.getElementById('modalBg').addEventListener('click', function() { modal.classList.remove('show'); });
});

function importCode() {
  const code = document.getElementById('codeInput')?.value?.trim();
  if (!code) { showToast('Colle un code d\'abord', 'ko'); return; }
  try {
    const logs = JSON.parse(decodeURIComponent(escape(atob(code))));
    if (!Array.isArray(logs)) throw new Error('Invalid');
    const map = {};
    DATA.logs.forEach(function(l) { map[l.d + l.t] = l; });
    logs.forEach(function(l) { if (!map[l.d + l.t]) { map[l.d + l.t] = l; } });
    DATA.logs = Object.values(map).sort(function(a, b) { return a.d.localeCompare(b.d); });
    saveData();
    document.getElementById('modal').classList.remove('show');
    showToast(logs.length + ' séance(s) importée(s)', 'ok');
    renderProgram();
    renderSettings();
  } catch (e) {
    showToast('Code invalide', 'ko');
  }
}

document.getElementById('rstBtn').addEventListener('click', function() {
  if (confirm('Tout effacer ? Cette action est irréversible.')) {
    DATA = getDefaultData();
    saveData();
    renderProgram();
    renderSettings();
    showToast('Données effacées', 'ok');
  }
});

// Init
document.addEventListener('DOMContentLoaded', function() {
  renderProgram();
  renderSettings();
});
