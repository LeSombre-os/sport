const STORAGE_KEY = 'force_v6';
const FORM_KEY = 'force_form_v2';

const PR = {
  A: {
    label: 'Séance A',
    focus: 'Force de Tirage & Cuisses',
    color: 'a',
    ex: [
      { num: 1, name: 'Pistol Squat Assisté (chaise)', sets: 4, reps: '5 / jambe', iw: 0, rest: 150, note: 'Placé en premier. Léger appui main pour l\'équilibre. Focus poussée pure.' },
      { num: 2, name: 'Tractions lestées (Pronation)', sets: 5, reps: '4', iw: 6, rest: 180, note: 'Tirage explosif, menton au-dessus de la barre. Descente freinée en 2s.' },
      { num: 3, name: 'Tractions Australiennes', sets: 4, reps: '6-8', iw: 5, rest: 120, note: 'Augmentation du volume (4 séries). Rétraction scapulaire maximale en haut.' },
      { num: 4, name: 'Relevés de jambes suspendu', sets: 3, reps: '8 (alterné G/D)', iw: 0, rest: 90, note: 'Monter les jambes lentement en pivotant légèrement le bassin de gauche à droite.' }
    ]
  },
  B: {
    label: 'Séance B',
    focus: 'Force de Poussée',
    color: 'b',
    ex: [
      { num: 1, name: 'Pike Push-Ups (pieds surélevés)', sets: 4, reps: '5-7', iw: 0, rest: 180, note: 'Pieds surélevés. Trajectoire de tête en triangle (plongeant devant les mains).' },
      { num: 2, name: 'Dips profonds (Chaise Romaine)', sets: 5, reps: '4', iw: 7, rest: 180, note: 'Casser la parallèle (épaules sous les coudes) à chaque rep.' },
      { num: 3, name: 'Pompes Déficitaires Lestées', sets: 3, reps: '6-8', iw: 5, rest: 120, note: 'Mains surélevées sur supports. Descendre la poitrine sous le niveau des mains.' },
      { num: 4, name: 'Planche Hardstyle (RKC)', sets: 3, reps: '30-45s', iw: 0, rest: 90, note: 'RÉTROVERSION DU BASSIN forcée. Serrer fessiers et abdos. Aucun creux lombaire.' }
    ]
  }
};

const TD = [3, 5, 0];
const BADGES = [
  { id: 'first', name: 'Première séance', desc: 'en ayant enregistré ta toute première séance !', icon: '🏅' },
  { id: 'motivated', name: 'Motivé', desc: 'en atteignant 3 séances enregistrées.', icon: '⚡' },
  { id: 'addict', name: 'Accro', desc: 'en atteignant 10 séances enregistrées.', icon: '💪' },
  { id: 'overload', name: 'Surcharge', desc: 'en ajoutant +1kg sur un exercice par rapport à la séance précédente.', icon: '📈' },
  { id: 'challenge', name: 'Défi relevé', desc: 'en terminant une séance avec un RPE ≥ 4 sur tous les exercices.', icon: '🔥' },
  { id: 'polyvalent', name: 'Polyvalent', desc: 'en faisant les deux séances A et B dans la même semaine.', icon: '🔄' },
  { id: 'fullweek', name: 'Semaine complète', desc: 'en faisant 3 séances dans la même semaine.', icon: '✅' },
  { id: 'monthly', name: 'Mois solide', desc: 'en atteignant 10+ séances dans le mois.', icon: '📅' },
  { id: 'streak7', name: 'Streak 7', desc: 'en enchaînant 7 jours consécutifs de sport.', icon: '🔗' },
  { id: 'fullpdc', name: 'Full PDC', desc: 'en faisant une séance complète sans aucun leste (poids du corps).', icon: '🪶' },
  { id: 'fast', name: 'Chronomètre', desc: 'en terminant une séance en moins de 60 minutes.', icon: '⏱' },
  { id: 'notes', name: 'Perfectionniste', desc: 'en ajoutant une note à chaque exercice d\'une séance.', icon: '✍️' }
];

let ss = [];
let nT = 'A';
let userStats = null;

function load() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r) {
      const d = JSON.parse(r);
      ss = d.logs || [];
      migrateLogs();
      userStats = d.stats || null;
    }
  } catch (e) {}
  if (!userStats) {
    userStats = { totalWorkouts: 0, currentStreak: 0, longestStreak: 0, lastWorkoutDate: '', badges: [] };
  }
}

function deduplicateLogs() {
  const seen = new Map();
  let changed = false;
  ss.forEach(s => {
    const key = s.d;
    if (seen.has(key)) { changed = true; return; }
    seen.set(key, s);
  });
  if (changed) {
    ss = Array.from(seen.values());
  }
  return changed;
}

function migrateExIds() {
  let changed = false;
  ss.forEach(s => {
    if (!s.ex) return;
    s.ex.forEach((e, i) => {
      if (e && e.ei === undefined) {
        e.ei = i;
        changed = true;
      }
    });
  });
  return changed;
}

function migrateLogs() {
  let changed = deduplicateLogs();
  if (migrateExIds()) changed = true;
  ss.forEach(s => {
    if (s.ex) {
      s.ex.forEach(e => {
        if (e.w !== undefined && e.weight === undefined) {
          e.weight = e.w;
          changed = true;
        }
        if (e.r !== undefined && e.performed === undefined) {
          e.performed = e.r;
          changed = true;
        }
        if (e.n !== undefined && e.note === undefined) {
          e.note = e.n;
          changed = true;
        }
      });
    }
  });
  if (changed) save();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ logs: ss, stats: userStats }));
  } catch (e) {}
}

function completedSessions() { return ss.filter(s => !s.skipped); }

function autoCompleted() {
  return ss.filter(s => !s.skipped && !s.manual);
}

function getProgramWeek(dateStr) {
  const ref = new Date(2026, 5, 1);
  const d = new Date(dateStr);
  const diff = Math.floor((d - ref) / (7 * 86400000));
  return diff + 1;
}

function getSessionForDate(dateStr) {
  const pw = getProgramWeek(dateStr);
  const isWeek1 = pw % 2 === 1;
  const day = new Date(dateStr).getDay();
  let pos;
  if (day === 3) pos = 0;
  else if (day === 5) pos = 1;
  else if (day === 0) pos = 2;
  else return null;
  if (isWeek1) return pos === 1 ? 'B' : 'A';
  return pos === 1 ? 'A' : 'B';
}

function lastSession() {
  const filtered = ss.filter(s => !s.manual);
  const all = [...filtered].sort((a, b) => b.d.localeCompare(a.d));
  return all.length ? all[0] : null;
}

function nextT() {
  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (!TD.includes(d.getDay())) continue;
    const dStr = fdISO(d);
    if (ss.some(s => !s.manual && s.d === dStr)) continue;
    const expected = getSessionForDate(dStr);
    if (!expected) continue;
    return expected;
  }
  const last = lastSession();
  return last ? (last.t === 'A' ? 'B' : 'A') : 'A';
}

function nextD() {
  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (!TD.includes(d.getDay())) continue;
    const dStr = fdISO(d);
    if (ss.some(s => !s.manual && s.d === dStr)) continue;
    const expected = getSessionForDate(dStr);
    if (!expected) continue;
    return d;
  }
  const last = lastSession();
  if (last) {
    const f = new Date(last.d);
    for (let i = 1; i <= 14; i++) {
      const d = new Date(f);
      d.setDate(f.getDate() + i);
      if (TD.includes(d.getDay())) return d;
    }
  }
  const r = new Date();
  r.setDate(r.getDate() + 1);
  return r;
}

function getExLog(s, ei) {
  if (!s || !s.ex) return null;
  return s.ex.find(e => e && e.ei === ei) || s.ex[ei] || null;
}

function lastW(ty, ix) {
  const same = completedSessions().filter(s => s.t === ty);
  if (!same.length) return null;
  const l = same[same.length - 1];
  const lg = getExLog(l, ix);
  return lg && lg.weight !== undefined ? lg.weight : null;
}

function getWeekNumber(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = (d - start + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000) / 86400000;
  return Math.ceil((diff + start.getDay() + 1) / 7);
}

function getWeekId(d) {
  return `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}`;
}

function dayAbbr(d) {
  return ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()];
}

function fdFR(d) {
  const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()];
}

function fdISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function getProgramVersion() {
  return 'Force_Juin2026';
}

function renderCalendar() {
  const today = new Date();
  const todayStr = fdISO(today);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const dayIdx = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayIdx === 0 ? 6 : dayIdx - 1));

  const weekTDs = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (TD.includes(d.getDay())) weekTDs.push(d);
  }
  const allLogged = weekTDs.length > 0 && weekTDs.every(d => ss.some(s => s.d === fdISO(d)));

  if (allLogged) {
    monday.setDate(monday.getDate() + 7);
  }

  let h = '<div class="cal">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = fdISO(d);
    const isToday = dStr === todayStr;
    const isTrainingDay = TD.includes(d.getDay());
    const isPast = d < new Date(todayStr);

    let sessionType = '';
    let sessionClass = 'off';
    let hasLog = false;
    let isSkipped = false;
    if (isTrainingDay) {
      const dayLogs = ss.filter(s => s.d === dStr);
      hasLog = dayLogs.length > 0;
      const lastLog = dayLogs.length ? dayLogs[dayLogs.length - 1] : null;
      if (lastLog) {
        isSkipped = !!lastLog.skipped;
        sessionType = lastLog.t;
        sessionClass = lastLog.t.toLowerCase();
      } else {
        const expectedT = getExpectedSession(dStr);
        sessionType = expectedT;
        sessionClass = expectedT.toLowerCase();
      }
    }

    h += '<div class="cal-day">';
    h += `<span class="cal-dn">${dayNames[i]}</span>`;
    h += `<div class="cal-badge ${sessionClass}${isToday ? ' today' : ''}${isPast ? ' past' : ''}${isSkipped ? ' skipped' : ''}">`;
    h += isTrainingDay ? sessionType : '·';
    h += '</div>';
    if (hasLog && !isSkipped) h += '<span class="cal-done">✓</span>';
    if (isSkipped) h += '<span class="cal-skip">✕</span>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function getExpectedSession(dateStr) {
  const r = getSessionForDate(dateStr);
  if (r) return r;
  const logsBefore = completedSessions().filter(s => s.d <= dateStr).sort((a, b) => a.d.localeCompare(b.d));
  const lastLog = logsBefore.length ? logsBefore[logsBefore.length - 1] : null;
  return lastLog ? (lastLog.t === 'A' ? 'B' : 'A') : 'A';
}
