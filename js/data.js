const STORAGE_KEY = 'force_v3';

const PROGRAM = {
  id: 'Force_Juin2026',
  sessions: [
    { id: 'A', label: 'Tirage & Cuisses', focus: 'Tractions · Squats',
      exercises: [
        { num: 1, name: 'Pistol Squat Assisté (chaise)', sets: 4, reps: '5/jambe', weight: 0, rest: 150, note: 'Descendre lentement, monter explosif' },
        { num: 2, name: 'Tractions lestées (Pronation)', sets: 5, reps: '4', weight: 6, rest: 180, note: 'Menton au-dessus de la barre' },
        { num: 3, name: 'Tractions Australiennes', sets: 4, reps: '6-8', weight: 5, rest: 120, note: 'Tirer poitrine vers la barre' },
        { num: 4, name: 'Relevés de jambes suspendu', sets: 3, reps: '8 alt G/D', weight: 0, rest: 90, note: 'Ne pas balancer' }
      ]},
    { id: 'B', label: 'Poussée', focus: 'Dips · Pompes',
      exercises: [
        { num: 1, name: 'Pike Push-Ups (pieds surélevés)', sets: 4, reps: '5-7', weight: 0, rest: 180, note: 'Hanches au-dessus des épaules' },
        { num: 2, name: 'Dips profonds (Chaise Romaine)', sets: 5, reps: '4', weight: 7, rest: 180, note: 'Descendre à 90° coudes' },
        { num: 3, name: 'Pompes Déficitaires Lestées', sets: 3, reps: '6-8', weight: 5, rest: 120, note: 'Plaques sous les mains' },
        { num: 4, name: 'Planche Hardstyle (RKC)', sets: 3, reps: '30-45s', weight: 0, rest: 90, note: 'Contraction maximale, respiration costale' }
      ]}
  ]
};

const TRAINING_DAYS = [3, 5, 0]; // Wed, Fri, Sun (getDay())
const PROGRAM_REF = new Date(2026, 5, 1); // June 1, 2026 = Monday

let DATA = loadData();

function getDefaultData() {
  return { logs: [] };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d === 'object' && Array.isArray(d.logs)) {
        return d;
      }
    }
    const oldRaw = localStorage.getItem('force_v2');
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      if (old && Array.isArray(old.logs)) {
        const d = { logs: old.logs };
        migrateV2(d);
        saveData(); // persist migrated data immediately
        return d;
      }
    }
  } catch (e) {}
  return getDefaultData();
}

function migrateV2(d) {
  d.logs.forEach(s => {
    if (s.ex) {
      s.ex.forEach(e => {
        if (e.w !== undefined && e.weight === undefined) e.weight = e.w;
        if (e.r !== undefined && e.performed === undefined) e.performed = e.r;
        if (e.n !== undefined && e.note === undefined) e.note = e.n;
        if (e.ei === undefined) e.ei = e.num ? e.num - 1 : 0;
      });
    }
  });
}

function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA)); } catch (e) {}
}

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekParity(date) {
  const monday = getMondayOfWeek(date);
  const diffDays = Math.floor((monday - PROGRAM_REF) / (7 * 86400000));
  return diffDays % 2 === 0 ? 1 : 2; // 1 = week 1, 2 = week 2
}

function getSessionForDay(date) {
  const day = date.getDay();
  if (!TRAINING_DAYS.includes(day)) return null;
  const week = getWeekParity(date);
  // Week 1: Wed=A, Fri=B, Sun=A | Week 2: Wed=B, Fri=A, Sun=B
  if ((week === 1 && (day === 3 || day === 0)) || (week === 2 && day === 5)) return 'A';
  return 'B';
}

function getNextSession() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today is a training day and session not yet done
  const todayStr = today.toISOString().slice(0, 10);
  const todaySession = getSessionForDay(today);
  if (todaySession) {
    const alreadyDone = DATA.logs.some(l => l.d === todayStr && l.t === todaySession);
    if (!alreadyDone) return PROGRAM.sessions.find(s => s.id === todaySession);
  }

  // Find next training day
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const sessionType = getSessionForDay(d);
    if (sessionType) {
      return PROGRAM.sessions.find(s => s.id === sessionType);
    }
  }
  return PROGRAM.sessions[0];
}

function getSessionExercises(sessionId) {
  const session = PROGRAM.sessions.find(s => s.id === sessionId);
  return session ? session.exercises : [];
}

function getExerciseHistory(exerciseNum, sessionId) {
  return DATA.logs
    .filter(l => l.ex && l.t === sessionId)
    .map(l => l.ex.find(e => e && e.ei === exerciseNum))
    .filter(Boolean)
    .slice(-5);
}

function getStreak() {
  let streak = 0;
  const sorted = [...DATA.logs].sort((a, b) => b.d.localeCompare(a.d));
  if (sorted.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(sorted[0].d + 'T00:00:00');
  const gapFromToday = Math.round((today - lastDate) / 86400000);
  if (gapFromToday > 4) return 0;
  streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].d + 'T00:00:00');
    const curr = new Date(sorted[i].d + 'T00:00:00');
    const gap = Math.round((prev - curr) / 86400000);
    if (gap > 4) break;
    streak++;
  }
  return streak;
}
