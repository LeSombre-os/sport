function toast(msg, isErr) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (isErr ? ' ko' : ' ok');
  requestAnimationFrame(() => {
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('act'));
  document.querySelectorAll('.tc').forEach(c => c.classList.remove('act'));
  const navBtn = document.querySelector(`.nav-btn[data-t="${tabId}"]`);
  if (navBtn) navBtn.classList.add('act');
  const cap = tabId.charAt(0).toUpperCase() + tabId.slice(1);
  const tabContent = document.getElementById('t' + cap);
  if (tabContent) tabContent.classList.add('act');
}

function renderAll() {
  renderProgram();
  rJ();
  updateStreak();
}

function updateStreak() {
  const cc = completedSessions();
  if (!cc.length) {
    userStats.currentStreak = 0;
    userStats.lastWorkoutDate = '';
    save();
  } else {
    const sorted = cc.slice().sort((a, b) => a.d.localeCompare(b.d));
    const last = sorted[sorted.length - 1];
    userStats.lastWorkoutDate = last.d;
    let streak = 1;
    for (let i = sorted.length - 2; i >= 0; i--) {
      const cur = new Date(sorted[i].d);
      const next = new Date(sorted[i + 1].d);
      const diff = (next - cur) / 86400000;
      if (diff <= 3) { streak++; } else { break; }
    }
    userStats.currentStreak = streak;
    if (streak > userStats.longestStreak) {
      userStats.longestStreak = streak;
    }
    save();
  }
  const el = document.getElementById('streakDisplay');
  if (!el) return;
  if (userStats.currentStreak > 0) {
    el.textContent = '🔥 ' + userStats.currentStreak + ' séances consécutives';
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

function renderProgram() {
  const card = document.getElementById('nx');
  nT = nextT();
  const s = PR[nT];
  if (!card || !s) return;
  card.className = 'nx nx-' + s.color;
  document.getElementById('nxT').textContent = s.label.toUpperCase();
  document.getElementById('nxF').textContent = s.focus;
  const d = nextD();
  const todayStr = fdISO(new Date());
  const cardDateStr = fdISO(d);
  const isToday = cardDateStr === todayStr;
  document.getElementById('nxD').textContent = fdFR(d) + (isToday ? ' (aujourd\'hui)' : '');

  const cardSession = ss.find(s => s.d === cardDateStr && !s.skipped);

  document.getElementById('skipBtn').style.display = cardSession ? 'none' : '';
  document.getElementById('nxBtn').textContent = cardSession ? 'Séance déjà enregistrée ✓' : 'Saisir cette séance';
  document.getElementById('nxBtn').disabled = !!cardSession;

  const pw = getProgramWeek(todayStr);
  document.getElementById('nxW').textContent = 'Semaine programme ' + pw;

  const c = document.getElementById('pC');
  if (!c) return;
  let h = '<div class="cd"><div class="cd-h"><h2>Planning de la semaine</h2></div><div class="cd-b">' + renderCalendar() + '</div></div>';
  for (const k in PR) {
    const sec = PR[k];
    const isA = k === 'A';
    const bc = isA ? 'ba' : 'bb';
    const nc = isA ? 'na' : 'nb';
    h += '<div class="cd"><div class="cd-h"><h2>' + sec.label + '</h2><span class="bdg ' + bc + '">' + sec.focus + '</span></div><div class="cd-b"><div class="el">';
    sec.ex.forEach((ex, i) => {
      const wi = ex.iw > 0 ? '+' + ex.iw + ' kg' : 'PDC';
      const lw = lastW(k, i);
      const bonus = getConsecutiveSuccessCount(k, i);
      let progHtml = '';
      if (lw !== null) {
        const nw = lw + (bonus > 0 ? 1 : 0);
        let bonusStr = '';
        if (bonus > 0) bonusStr = ' <span class="prog-bonus">(+1kg)</span>';
        progHtml = '<span class="prog-ind"><span class="last">Dernier : ' + (lw > 0 ? '+' + lw + ' kg' : 'PDC') + '</span> <span class="arr">→</span> <span class="next">Prochain : ' + (nw > 0 ? '+' + nw + ' kg' : 'PDC') + '</span>' + bonusStr + '</span>';
      } else {
        progHtml = '<span class="prog-ind"><span class="init">Leste initial : ' + wi + '</span></span>';
      }
      h += '<div class="ei"><div class="en"><span class="n ' + nc + '">' + ex.num + '</span>' + ex.name + '</div>';
      h += '<div class="ed"><span><span class="lb">Séries</span> ' + ex.sets + '×' + formatTargetReps(ex.reps) + '</span><span><span class="lb">Leste</span> ' + wi + '</span><span><span class="lb">Repos</span> ' + (ex.rest >= 60 ? Math.floor(ex.rest / 60) + 'min' : ex.rest + 's') + '</span></div>';
      h += progHtml;
      h += '<div class="enote">' + ex.note + '</div></div>';
    });
    h += '</div></div></div>';
  }
  h += '<div class="cd"><div class="cd-h"><h2>Échauffement</h2><span class="bdg ba" style="opacity:.5">10 min</span></div><div class="cd-b">';
  h += '<div class="ei" style="border:none;padding:0"><div class="en" style="font-size:.75rem;color:var(--text2);font-weight:500"><span style="display:inline-flex;width:18px;height:18px;border-radius:50%;font-size:.58rem;font-weight:700;background:var(--bg);color:var(--text3);align-items:center;justify-content:center;flex-shrink:0">1</span>Mobilité articulaire (3 min)</div></div>';
  h += '<div class="ei" style="border:none;padding:5px 0 0"><div class="en" style="font-size:.75rem;color:var(--text2);font-weight:500"><span style="display:inline-flex;width:18px;height:18px;border-radius:50%;font-size:.58rem;font-weight:700;background:var(--bg);color:var(--text3);align-items:center;justify-content:center;flex-shrink:0">2</span>Activation nerveuse (sans leste)</div><div class="ed" style="padding-left:26px"><span>2×4 Tractions explosives</span><span>2×5 Dips contrôlés</span><span>2×5 Squats</span></div></div>';
  h += '</div></div>';
  h += '<div class="cd"><div class="cd-h"><h2>Règles de progression</h2></div><div class="cd-b" style="font-size:.75rem;color:var(--text2);line-height:1.7">';
  h += '<p style="margin-bottom:4px"><strong style="color:var(--text)">Surcharge :</strong> Toutes les reps validées → +1 kg au prochain palier.</p>';
  h += '<p><strong style="color:var(--text)">Stagnation :</strong> Blocage 3 séances → deload −20% une semaine.</p></div></div>';
  c.innerHTML = h;
}

function skipSession() {
  const d = nextD();
  const cardDate = fdISO(d);
  const today = fdISO(new Date());
  if (ss.some(s => s.d === cardDate && !s.skipped)) {
    toast('Cette séance est déjà enregistrée !', true);
    return;
  }
  if (ss.some(s => s.d === cardDate && s.skipped)) {
    toast('Cette séance est déjà passée', true);
    return;
  }
  const label = cardDate === today ? " d'aujourd'hui" : ' du ' + fdFR(d);
  if (!confirm('Passer la séance ' + nT + label + ' ?')) return;
  let existing = ss.findIndex(s => s.d === cardDate);
  if (existing !== -1) {
    ss[existing].skipped = true;
  } else {
    ss.push({ id: Date.now(), d: cardDate, t: nT, skipped: true, ex: [] });
  }
  save();
  nT = nextT();
  renderAll();
  if (document.getElementById('tLog').classList.contains('act')) rLog(nT);
  toast('Séance du ' + fdFR(d) + ' passée');
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
  document.getElementById('badgeCloseBtn').addEventListener('click', closeModal);
}

function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: 'icon-192.png' });
  }
}

async function setBadge(count) {
  if (navigator.setAppBadge) {
    try { await navigator.setAppBadge(count); } catch (e) {}
  }
}
