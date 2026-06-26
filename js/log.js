let currentExoIndex = 0;
let editingLog = null;
let formCache = null;
let manualMode = false;
let manualDate = '';
function getSid(ty) { return manualMode ? 'M-' + ty : ty; }

function getStoreKey() { return manualMode ? MANUAL_FORM_KEY : FORM_KEY; }

function saveFormSession(ty) {
  const sec = PR[ty];
  if (!sec) return;
  const sid = getSid(ty);
  const cache = (formCache && formCache.sessionId === sid) ? JSON.parse(JSON.stringify(formCache)) : { sessionId: sid, manual: manualMode || undefined, date: manualDate, lastUpdated: Date.now(), exercises: {} };
  if (manualMode) cache.date = document.getElementById('manualDate')?.value || manualDate;
  sec.ex.forEach((ex, i) => {
    const w = document.getElementById('w_' + i);
    if (!w) return;
    const r = getSetValues(i, ty);
    const n = document.getElementById('n_' + i);
    const rpeEl = document.querySelector(`.ec[data-ei="${i}"] .rpe-btn.sel`);
    cache.exercises[i] = {
      weight: w ? Number(w.value) || 0 : 0,
      performed: r,
      rpe: rpeEl ? Number(rpeEl.dataset.rv) : 0,
      note: n ? n.value.trim() : ''
    };
  });
  cache.currentExoIndex = currentExoIndex;
  formCache = cache;
  try { localStorage.setItem(getStoreKey(), JSON.stringify(cache)); } catch (e) {}
}

function restoreFormSession(ty) {
  try {
    const raw = localStorage.getItem(getStoreKey());
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.sessionId !== getSid(ty)) return false;
    formCache = data;
    if (data.manual) { manualMode = true; if (data.date) manualDate = data.date; }
    const sec = PR[ty];
    if (!sec) return false;
    sec.ex.forEach((ex, i) => {
      const d = data.exercises[i];
      if (!d) return;
      const w = document.getElementById('w_' + i);
      const n = document.getElementById('n_' + i);
      if (w) w.value = d.weight;
      if (n) n.value = d.note;
      if (d.rpe) {
        const btns = document.querySelectorAll(`.ec[data-ei="${i}"] .rpe-btn`);
        btns.forEach(b => b.classList.toggle('sel', Number(b.dataset.rv) === d.rpe));
      }
      const pdcBtn = document.querySelector(`.pdc[data-pdc="${i}"]`);
      if (pdcBtn && d.weight === 0) pdcBtn.classList.add('act');
      else if (pdcBtn) pdcBtn.classList.remove('act');
      if (d.performed) {
        const vals = d.performed.split(',');
        for (let si = 0; si < ex.sets; si++) {
          const inp = document.getElementById('s_' + i + '_' + si);
          if (inp) {
            inp.value = vals[si] !== undefined ? vals[si] : '';
            repColor(inp, ex, si);
          }
        }
      }
    });
    return true;
  } catch (e) { return false; }
}

function clearFormSession() {
  formCache = null;
  try { localStorage.removeItem(FORM_KEY); } catch (e) {}
  try { localStorage.removeItem(MANUAL_FORM_KEY); } catch (e) {}
  manualMode = false;
  manualDate = '';
}

function editExistingSession(session) {
  editingLog = JSON.parse(JSON.stringify(session));
  manualMode = !!session.manual;
  manualDate = session.d || fdISO(new Date());
  if (!manualMode) nT = session.t;
  const key = manualMode ? MANUAL_FORM_KEY : FORM_KEY;
  const sid = manualMode ? 'M-' + session.t : session.t;
  const cache = { sessionId: sid, manual: manualMode || undefined, date: manualDate, lastUpdated: Date.now(), exercises: {} };
  if (session.ex) {
    session.ex.forEach((e, i) => {
      cache.exercises[i] = {
        weight: e.weight || 0,
        performed: e.performed || '',
        rpe: e.rpe || 0,
        note: e.note || ''
      };
    });
  }
  formCache = cache;
  try { localStorage.setItem(key, JSON.stringify(cache)); } catch (e) {}
  switchTab('log');
  rLog(session.t, { manual: manualMode, date: manualDate });
}

function getSetValues(exIdx, ty) {
  const p = PR[ty || nT];
  if (!p || !p.ex[exIdx]) return '';
  const ex = p.ex[exIdx];
  const vals = [];
  for (let si = 0; si < ex.sets; si++) {
    const inp = document.getElementById('s_' + exIdx + '_' + si);
    vals.push(inp ? inp.value.trim() : '');
  }
  return vals.join(',');
}

function getExoData(i) {
  if (formCache && formCache.exercises[i]) {
    return formCache.exercises[i];
  }
  return {
    weight: Number(document.getElementById('w_' + i)?.value) || 0,
    performed: getSetValues(i),
    rpe: 0,
    note: (document.getElementById('n_' + i)?.value || '').trim()
  };
}

function repColor(inp, ex, si) {
  const val = parseInt(inp.value);
  if (inp.value === '0' || (val && val <= 0)) {
    inp.classList.remove('filled', 'mid', 'empty');
    inp.classList.add('low');
    return;
  }
  if (!val) {
    inp.classList.remove('filled', 'mid', 'low');
    inp.classList.add('empty');
    return;
  }
  const isTimeBased = ex.reps && (ex.reps.includes('s') || ex.reps.includes('sec'));
  if (isTimeBased) {
    const range = parseRepRange(ex.reps);
    if (range) {
      inp.classList.remove('empty');
      if (val >= range.max) {
        inp.classList.remove('mid', 'low');
        inp.classList.add('filled');
      } else if (val >= range.min) {
        inp.classList.remove('filled', 'low');
        inp.classList.add('mid');
      } else {
        inp.classList.remove('filled', 'mid');
        inp.classList.add('low');
      }
    }
    return;
  }
  const target = parseRepTarget(ex.reps);
  if (!target || target === 0) {
    inp.classList.remove('empty', 'mid', 'low');
    inp.classList.add('filled');
    return;
  }
  const ratio = val / target;
  inp.classList.remove('empty');
  if (ratio >= 1) {
    inp.classList.remove('mid', 'low');
    inp.classList.add('filled');
  } else if (ratio >= 0.5) {
    inp.classList.remove('filled', 'low');
    inp.classList.add('mid');
  } else {
    inp.classList.remove('filled', 'mid');
    inp.classList.add('low');
  }
}

function updateRkcSummary(exIdx, ty) {
  const sec = PR[ty];
  if (!sec || !sec.ex[exIdx]) return;
  const ex = sec.ex[exIdx];
  const el = document.getElementById('rkcSummary_' + exIdx);
  if (!el) return;
  const vals = [];
  for (let si = 0; si < ex.sets; si++) {
    const inp = document.getElementById('s_' + exIdx + '_' + si);
    const v = inp ? parseInt(inp.value) : 0;
    if (v > 0) vals.push(v);
  }
  if (!vals.length) { el.textContent = '—'; el.className = 'rkc-summary'; return; }
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const range = parseRepRange(ex.reps);
  let ok = false;
  if (range) ok = avg >= range.min && avg <= range.max;
  el.textContent = 'Moy: ' + avg + 's' + (range ? ' · ' + range.min + '-' + range.max + 's' : '') + (ok ? ' ✅' : ' ❌');
  el.className = 'rkc-summary' + (ok ? ' ok' : ' ko');
}

function rLog(ty, options = {}) {
  manualMode = !!options.manual;
  manualDate = options.date || fdISO(new Date());
  if (!manualMode) nT = ty;
  currentExoIndex = 0;
  const c = document.getElementById('lC');
  const sec = PR[ty];
  if (!sec) { c.innerHTML = '<div class="l-empty">Sélectionne une séance</div>'; return; }

  let h = '<div class="l-session">';
  if (manualMode) h += '<span class="bdg" style="font-size:.6rem;margin-right:6px;background:rgba(245,158,11,0.12);color:var(--ui-accent)">MANUEL</span>';
  h += sec.label + ' — ' + sec.focus + '</div>';

  if (manualMode) {
    h += '<div class="mf-date" style="margin-bottom:8px"><label>Date</label><input type="date" id="manualDate" value="' + manualDate + '"></div>';
    h += '<div class="mf-type" style="margin-bottom:8px"><label>Type</label><div class="mf-type-btns">';
    h += '<button class="mf-type-btn' + (ty === 'A' ? ' act' : '') + '" data-mt="A">Séance A</button>';
    h += '<button class="mf-type-btn' + (ty === 'B' ? ' act' : '') + '" data-mt="B">Séance B</button>';
    h += '</div></div>';
  }

  h += '<div id="exoStep" style="text-align:center;font-size:.72rem;color:var(--text3);margin-bottom:10px">Exercice 1/' + sec.ex.length + '</div>';
  h += '<div class="log-nav"><button id="prevExo" disabled>◀ Précédent</button><button id="nextExo">Suivant ▶</button></div>';
  h += '<div id="lF">';
  h += '<div id="exoContainer"></div>';
  h += '</div>';
  c.innerHTML = h;

  const savedIdx = getSavedExoIndex(ty);
  if (savedIdx !== null) currentExoIndex = savedIdx;

  renderExo(ty, currentExoIndex);

  document.getElementById('prevExo').addEventListener('click', () => {
    saveFormSession(ty);
    if (currentExoIndex > 0) { currentExoIndex--; renderExo(ty, currentExoIndex); attachNextHandler(ty); }
  });

  attachNextHandler(ty);
  restoreFormSession(ty);

  if (manualMode) {
    document.getElementById('manualDate')?.addEventListener('change', function() {
      manualDate = this.value;
      saveFormSession(ty);
    });
    document.querySelectorAll('[data-mt]').forEach(b => {
      b.addEventListener('click', function() {
        saveFormSession(ty);
        manualDate = document.getElementById('manualDate')?.value || manualDate;
        rLog(this.dataset.mt, { manual: true, date: manualDate });
      });
    });
  }
}

function getSavedExoIndex(ty) {
  try {
    const raw = localStorage.getItem(getStoreKey());
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.sessionId !== getSid(ty)) return null;
    if (data.currentExoIndex !== undefined && data.currentExoIndex > 0) return data.currentExoIndex;
  } catch (e) {}
  return null;
}

function attachNextHandler(ty) {
  const sec = PR[ty];
  const nextBtn = document.getElementById('nextExo');
  if (!nextBtn) return;
  const newBtn = nextBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newBtn, nextBtn);
  const idx = currentExoIndex;
  const handler = () => {
    saveFormSession(ty);
    if (idx < sec.ex.length - 1) {
      currentExoIndex = idx + 1;
      renderExo(ty, currentExoIndex);
      attachNextHandler(ty);
    } else {
      let allFilled = true;
      for (let i = 0; i < sec.ex.length; i++) {
        const d = getExoData(i);
        const needsRpe = !(sec.ex[i].reps && (sec.ex[i].reps.includes('s') || sec.ex[i].reps.includes('sec')));
        if (!d.performed || !d.performed.split(',').some(v => v.trim()) || (needsRpe && !d.rpe)) {
          allFilled = false;
          break;
        }
      }
      if (allFilled) {
        showRecap(ty);
      } else {
        toast('Remplis tous les champs obligatoires pour chaque exercice avant le récap', true);
      }
    }
  };
  newBtn.addEventListener('click', handler);
}

function renderExo(ty, idx) {
  const sec = PR[ty];
  const ex = sec.ex[idx];
  const container = document.getElementById('exoContainer');
  const step = document.getElementById('exoStep');

  step.textContent = `Exercice ${idx + 1}/${sec.ex.length}`;
  document.getElementById('prevExo').disabled = idx === 0;
  document.getElementById('nextExo').disabled = false;
  document.getElementById('nextExo').textContent = idx === sec.ex.length - 1 ? 'Récap ▶' : 'Suivant ▶';

  const lw = lastW(ty, idx);
  const pw = getProposedWeight(ty, idx);
  const sg = lw !== null ? pw : ex.iw;
  const pdc = sg === 0;

  let h = '';
  h += `<div class="ec${manualMode ? ' ec-manual' : ''}" data-ei="${idx}">`;
  h += '<div class="ech"><span class="nm">' + ex.num + '. ' + ex.name + '</span><span class="tg">' + ex.sets + '×' + formatTargetReps(ex.reps) + '</span></div>';

  h += '<div class="ei2">';
  h += '<div class="lg"><l>Leste</l><div class="ww"><input type="number" name="w_' + idx + '" id="w_' + idx + '" value="' + sg + '" min="0" step="1" onkeypress="return event.charCode >= 48"><span class="unit">kg</span><button type="button" class="pdc' + (pdc ? ' act' : '') + '" data-pdc="' + idx + '">PDC</button></div></div>';
  h += '<div class="lg"><l>Réalisé</l>';
  h += '<div class="set-row" id="setRow_' + idx + '">';
  for (let si = 0; si < ex.sets; si++) {
    h += '<div class="set-input"><l>S' + (si + 1) + '</l><input type="text" inputmode="numeric" pattern="[0-9]*" id="s_' + idx + '_' + si + '" placeholder="0" autocomplete="off" maxlength="4"></div>';
  }
  h += '</div></div></div>';

  h += '<div class="lg" style="margin-bottom:6px"><l>Ressenti</l><div class="rpe-row" data-rpe="' + idx + '">';
  for (let v = 1; v <= 5; v++) {
    h += '<button type="button" class="rpe-btn s' + v + '" data-rv="' + v + '">' + v + '</button>';
  }
  h += '</div></div>';

  if (ex.reps && (ex.reps.includes('s') || ex.reps.includes('sec'))) {
    h += '<div class="lg" style="margin-bottom:4px"><l>Moyenne vs Objectif</l><div class="rkc-summary" id="rkcSummary_' + idx + '">—</div></div>';
  }

  h += '<div class="lg"><input type="text" name="n_' + idx + '" id="n_' + idx + '" placeholder="Note (optionnelle)" autocomplete="off"></div>';
  h += '</div>';

  h += '<div class="rest-display">⏱ ' + Math.floor(ex.rest / 60) + ':' + String(ex.rest % 60).padStart(2, '0') + '</div>';

  container.innerHTML = h;

  restoreFormSession(ty);

  document.querySelectorAll('.pdc').forEach(b => {
    b.addEventListener('click', function() {
      const i = this.dataset.pdc;
      if (i === undefined) return;
      const inp = document.getElementById('w_' + i);
      const wasAct = this.classList.contains('act');
      if (!wasAct) {
        this.dataset.prevWeight = inp.value;
        inp.value = 0;
      } else {
        inp.value = this.dataset.prevWeight !== undefined ? this.dataset.prevWeight : PR[ty].ex[parseInt(i)].iw;
      }
      this.classList.toggle('act');
      saveFormSession(ty);
    });
  });

  document.querySelectorAll('.rpe-btn').forEach(b => {
    b.addEventListener('click', function() {
      const row = this.closest('.rpe-row');
      row.querySelectorAll('.rpe-btn').forEach(bb => bb.classList.remove('sel'));
      this.classList.add('sel');
      saveFormSession(ty);
    });
  });

  document.querySelectorAll('.set-input input').forEach(el => {
    el.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      const p = PR[ty];
      const exI = parseInt(this.id.split('_')[1]);
      const si = parseInt(this.id.split('_')[2]);
      if (p && p.ex[exI]) {
        repColor(this, p.ex[exI], si);
        if (p.ex[exI].reps && (p.ex[exI].reps.includes('s') || p.ex[exI].reps.includes('sec'))) {
          updateRkcSummary(exI, ty);
        }
      }
      saveFormSession(ty);
    });
    el.addEventListener('focus', function() { this.select(); });
  });

  document.querySelectorAll('#exoContainer input, #exoContainer textarea').forEach(el => {
    if (!el.id.startsWith('s_') && !el.id.startsWith('manualDate')) {
      el.addEventListener('input', () => saveFormSession(ty));
      el.addEventListener('change', () => saveFormSession(ty));
    }
  });

}

function showRecap(ty) {
  saveFormSession(ty);
  const sec = PR[ty];
  const container = document.getElementById('exoContainer');
  const step = document.getElementById('exoStep');
  step.textContent = 'Récapitulatif';
  document.getElementById('prevExo').disabled = true;
  document.getElementById('nextExo').disabled = true;

  const color = ty.toLowerCase();
  let h = '<div class="recap-card"><div class="recap-hdr recap-hdr-' + color + '">';
  if (manualMode) h += '<span class="bdg" style="font-size:.55rem;margin-right:8px;background:rgba(245,158,11,0.12);color:var(--ui-accent)">MANUEL</span>';
  h += '<span class="recap-title">' + sec.label + '</span>';
  h += '<span class="recap-focus">' + sec.focus + '</span>';
  h += '</div><div class="recap-body">';
  sec.ex.forEach((ex, i) => {
    const d = getExoData(i);
    const filled = d.performed && d.performed.length > 0 && d.performed.split(',').some(v => v.trim());
    const w = d.weight > 0 ? '+' + d.weight + ' kg' : 'PDC';
    const reps = d.performed || '—';
    const isTimeEx = ex.reps && (ex.reps.includes('s') || ex.reps.includes('sec'));
    const rpeStr = isTimeEx ? (() => {
      const vals = d.performed ? d.performed.split(',').map(v => parseInt(v.trim())).filter(v => v > 0) : [];
      if (!vals.length) return '—';
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      const range = parseRepRange(ex.reps);
      const ok = range ? avg >= range.min && avg <= range.max : false;
      return 'Moy: ' + avg + 's' + (ok ? ' ✅' : ' ❌') + (d.rpe ? ' · ' + '●'.repeat(d.rpe) + '○'.repeat(5 - d.rpe) + ' ' + d.rpe + '/5' : '');
    })() : (d.rpe ? '●'.repeat(d.rpe) + '○'.repeat(5 - d.rpe) + ' ' + d.rpe + '/5' : '—');
    h += '<div class="recap-row">';
    h += '<div class="recap-left"><span class="recap-check ' + (filled ? 'ok' : 'no') + '">' + (filled ? '✓' : '✗') + '</span>';
    h += '<span class="recap-exname">' + ex.name.split(' (')[0] + '</span></div>';
    h += '<div class="recap-right">';
    h += '<span class="recap-tag">' + w + '</span>';
    h += '<span class="recap-tag">' + reps + '</span>';
    h += '<span class="recap-rpe">' + rpeStr + '</span>';
    h += '</div></div>';
  });
  h += '</div></div>';
  h += '<div class="l-sub"><button class="sub-' + color + '" id="saveSessionBtn">⏳ Enregistrement...</button></div>';
  container.innerHTML = h;

  setTimeout(() => hLog(ty), 2500);
}

function hLog(ty) {
  const t = ty || nT;
  const sec = PR[t];
  if (!sec) return;

  if (!formCache || formCache.sessionId !== getSid(t)) {
    toast('Erreur : données de session introuvables', true);
    return;
  }

  const isManual = !!formCache.manual;

  const ex = [];
  let ok = true;
  sec.ex.forEach((exDef, i) => {
    const d = formCache.exercises[i];
    if (!d) { ok = false; return; }
    const filled = d.performed && d.performed.split(',').some(v => v.trim());
    if (!filled) ok = false;
    const needsRpe = !(exDef.reps && (exDef.reps.includes('s') || exDef.reps.includes('sec')));
    if (needsRpe && !d.rpe) ok = false;
    ex[i] = { ...d, ei: i };
  });

  if (!ok) { toast('Remplis tous les champs obligatoires pour chaque exercice', true); return; }

  const dateKey = isManual ? (formCache.date || fdISO(new Date())) : (editingLog ? editingLog.d : fdISO(new Date()));
  const existing = ss.findIndex(s => s.d === dateKey && s.t === t && !!s.manual === !!isManual);
  if (existing !== -1) {
    const prevType = ss[existing].t;
    ss[existing] = { ...(editingLog || {}), d: dateKey, t: t, ex: ex, manual: isManual || undefined };
    if (prevType !== t) toast('Remplace la séance ' + prevType + ' par ' + t + ' sur ce jour', false);
  } else {
    ss.push({ id: Date.now(), d: dateKey, t: t, ex: ex, manual: isManual || undefined });
  }
  clearFormSession();
  editingLog = null;
  updateStreak();
  const newBadges = checkBadges();
  save();

  renderAll();

  if (newBadges.length) {
    setTimeout(() => showBadgeUnlock(newBadges), 500);
  }

  if (isManual) {
    setTimeout(() => {
      switchTab('journal');
      toast('Séance manuelle enregistrée !');
    }, newBadges.length ? 1200 : 400);
  } else {
    setTimeout(() => {
      switchTab('log');
      rLog(nT);
      toast('Séance enregistrée ! Prochaine : ' + PR[nT].label);
    }, newBadges.length ? 1200 : 400);
  }
}
