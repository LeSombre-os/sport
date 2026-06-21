function checkBadges() {
  if (!userStats) return [];
  const earned = userStats.badges || [];
  const newBadges = [];
  const today = fdISO(new Date());
  const cc = completedSessions();
  const cLen = cc.length;

  const check = (id) => {
    if (earned.find(b => b.id === id)) return false;
    return true;
  };

  if (check('first') && cLen >= 1) {
    newBadges.push({ id: 'first', earnedDate: today });
  }
  if (check('motivated') && cLen >= 3) {
    newBadges.push({ id: 'motivated', earnedDate: today });
  }
  if (check('addict') && cLen >= 10) {
    newBadges.push({ id: 'addict', earnedDate: today });
  }
  if (check('fullweek')) {
    const weeks = new Set();
    cc.forEach(s => {
      const d = new Date(s.d);
      weeks.add(getWeekId(d));
    });
    const mostRecentLog = cc.length ? new Date(cc[cc.length - 1].d) : null;
    if (mostRecentLog) {
      const currentWeek = getWeekId(mostRecentLog);
      const countThisWeek = cc.filter(s => getWeekId(new Date(s.d)) === currentWeek).length;
      if (countThisWeek >= 3) newBadges.push({ id: 'fullweek', earnedDate: today });
    }
  }
  if (check('monthly') && cLen >= 10) {
    newBadges.push({ id: 'monthly', earnedDate: today });
  }
  if (check('streak7') && userStats.longestStreak >= 7) {
    newBadges.push({ id: 'streak7', earnedDate: today });
  }
  if (check('polyvalent')) {
    const lastLog = cc.length ? cc[cc.length - 1] : null;
    if (lastLog) {
      const lastWeek = getWeekId(new Date(lastLog.d));
      const weekLogs = cc.filter(s => getWeekId(new Date(s.d)) === lastWeek);
      const types = new Set(weekLogs.map(s => s.t));
      if (types.has('A') && types.has('B')) newBadges.push({ id: 'polyvalent', earnedDate: today });
    }
  }

  if (newBadges.length) {
    userStats.badges = [...earned, ...newBadges];
    save();
  }
  return newBadges;
}

function showBadgeUnlock(badges) {
  if (!badges.length) return;
  const modal = document.getElementById('modal');
  const c = modal.querySelector('.modal-c');
  let h = '<div class="badge-unlock">';
  badges.forEach(b => {
    const bd = BADGES.find(x => x.id === b.id);
    if (bd) {
      h += `<span class="bu-icon">${bd.icon}</span>`;
      h += `<div class="bu-name">Badge d&eacute;bloqu&eacute;&nbsp;: ${bd.name}</div>`;
      h += `<p style="font-size:.78rem;color:var(--text2);margin:4px 0 12px">Obtenu ${bd.desc}</p>`;
    }
  });
  h += '<button class="ebtn ebtn-p" id="badgeCloseBtn">Super !</button></div>';
  c.innerHTML = h;
  modal.classList.add('show');
  document.getElementById('badgeCloseBtn').addEventListener('click', () => {
    modal.classList.remove('show');
  });
  document.querySelector('.modal-bg').addEventListener('click', () => {
    modal.classList.remove('show');
  });
}

function renderBadges() {
  const earned = userStats.badges || [];
  let h = '<div class="badge-grille">';
  BADGES.forEach(b => {
    const e = earned.find(x => x.id === b.id);
    h += `<div class="badge-item${e ? '' : ' locked'}">`;
    h += `<span class="bi-icon">${b.icon}</span>`;
    h += `<span class="bi-name">${b.name}</span>`;
    h += '</div>';
  });
  h += '</div>';
  return h;
}

function updateStreak() {
  const cc = completedSessions();
  if (!cc.length) {
    userStats.currentStreak = 0;
    userStats.lastWorkoutDate = '';
    save();
    return;
  }
  const sorted = cc.slice().sort((a, b) => a.d.localeCompare(b.d));
  const last = sorted[sorted.length - 1];
  userStats.lastWorkoutDate = last.d;
  let streak = 1;
  for (let i = sorted.length - 2; i >= 0; i--) {
    const cur = new Date(sorted[i].d);
    const next = new Date(sorted[i + 1].d);
    const diff = (next - cur) / 86400000;
    if (diff <= 3) {
      streak++;
    } else {
      break;
    }
  }
  userStats.currentStreak = streak;
  if (streak > userStats.longestStreak) {
    userStats.longestStreak = streak;
  }
  save();
}
