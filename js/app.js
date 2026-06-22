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
  const tabContent = document.getElementById('t' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
  if (tabContent) tabContent.classList.add('act');
}

function renderAll() {
  rNext();
  rProg();
  rJ();
  const st = document.getElementById('tStats');
  if (st && st.classList.contains('act')) rStats();
  renderStreak();
}

function renderStreak() {
  const el = document.getElementById('streakDisplay');
  if (!userStats) return;
  if (userStats.currentStreak > 0) {
    el.textContent = '🔥 ' + userStats.currentStreak + ' séances consécutives';
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

function rNext() {
  nT = nextT();
  const card = document.getElementById('nx');
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

  const cardSession = ss.find(s => s.d === cardDateStr);

  document.getElementById('skipBtn').style.display = cardSession ? 'none' : '';
  document.getElementById('nxBtn').textContent = 'Saisir cette séance';
  document.getElementById('nxBtn').disabled = false;

  const pw = getProgramWeek(todayStr);
  document.getElementById('nxW').textContent = 'Semaine programme ' + pw;
}

function rProg() {
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

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

function initApp() {
  load();
  nT = nextT();
  updateStreak();

  renderAll();

  document.getElementById('nxBtn').addEventListener('click', () => {
    editingLog = null;
    switchTab('log');
    rLog(nT);
  });

  document.getElementById('skipBtn').addEventListener('click', skipSession);

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tab = this.dataset.t;
      switchTab(tab);
      if (tab === 'log') { editingLog = null; rLog(nT); }
      if (tab === 'stats') rStats();
      if (tab === 'settings') renderSettingsBadges();
    });
  });

  function renderSettingsBadges() {
    const el = document.getElementById('badgesSettings');
    if (el) el.innerHTML = renderBadges();
  }

  document.getElementById('rstBtn').addEventListener('click', () => {
    if (confirm('Tout effacer ? Cette action est irréversible.') && confirm('Confirmer la suppression de toutes les données ?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FORM_KEY);
      localStorage.removeItem(MANUAL_FORM_KEY);
      ss = [];
      userStats = { totalWorkouts: 0, currentStreak: 0, longestStreak: 0, lastWorkoutDate: '', badges: [] };
      switchTab('program');
      renderAll();
      renderSettingsBadges();
      toast('Données effacées');
    }
  });

  document.getElementById('exBtn').addEventListener('click', expCSV);
  document.getElementById('expCodeBtn').addEventListener('click', expCode);
  document.getElementById('impCodeBtn').addEventListener('click', openModal);
  document.getElementById('modalBg').addEventListener('click', closeModal);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(function(reg) {
        if (reg.waiting) showSwUpdate(reg);
        reg.addEventListener('updatefound', function() {
          var sw = reg.installing;
          sw.addEventListener('statechange', function() {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              showSwUpdate(reg);
            }
          });
        });
      }).catch(function(err) {
        console.error('Erreur SW :', err);
      });
    });
  }

function showSwUpdate(reg) {
  var btn = document.getElementById('nxBtn');
  btn.textContent = '🔄 Nouvelle version dispo !';
  btn.onclick = function() {
    reg.waiting.postMessage({ action: 'skipWaiting' });
  };
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    window.location.reload();
  });
}
}

function openModal() {
  const mc = document.getElementById('modalContent');
  mc.innerHTML = `
    <h3>Restaurer des donn&eacute;es</h3>
    <p>Colle le code re&ccedil;u par WhatsApp</p>
    <textarea id="codeInput" rows="4" placeholder="Colle le code ici..."></textarea>
    <div class="modal-acts">
      <button class="ebtn ebtn-p" id="restoreBtn">Restaurer</button>
      <button class="ebtn" id="modalCancel">Annuler</button>
    </div>
  `;
  document.getElementById('modal').classList.add('show');
  document.getElementById('codeInput').focus();
  document.getElementById('codeInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) impCode();
  });
  document.getElementById('restoreBtn').addEventListener('click', impCode);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
}

document.addEventListener('DOMContentLoaded', initApp);
