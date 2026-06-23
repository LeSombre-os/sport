function rJ() {
  const c = document.getElementById('jC');
  let h = '<button class="j-add-btn" id="jAddBtn">+ Ajouter une séance manuelle</button>';

  if (!ss.length) {
    h += '<div class="cd"><div class="cd-b"><div class="j-empty"><p>Aucune séance enregistrée.</p><p style="font-size:.7rem;margin-top:4px;color:var(--text3)">Ajoutes-en une manuellement ci-dessus ou va dans Saisir !</p></div></div></div>';
    c.innerHTML = h;
    document.getElementById('jAddBtn')?.addEventListener('click', showManualLog);
    return;
  }

  const sorted = [...ss].sort((a, b) => b.d.localeCompare(a.d));
  const months = getAvailableMonths(sorted);

  h += renderMonthNav(months);

  let filtered = filterByMonth(sorted, currentJournalMonth);
  filtered = filterByType(filtered, journalFilterType);
  h += renderSessionList(filtered);
  c.innerHTML = h;

  attachJournalEvents();
}

function getAvailableMonths(sorted) {
  const months = [];
  sorted.forEach(s => {
    const key = s.d.slice(0, 7);
    if (!months.find(m => m.key === key)) {
      const d = new Date(s.d);
      const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      months.push({ key, label });
    }
  });
  return months;
}

let currentJournalMonth = '';
let journalFilterType = '';

function renderMonthNav(months) {
  if (!currentJournalMonth && months.length) currentJournalMonth = months[0].key;
  let h = '<div class="j-month-nav">';
  h += '<button class="j-month-btn" id="jMonthPrev">◀</button>';
  h += '<span class="j-month-label">' + (months.find(m => m.key === currentJournalMonth)?.label || 'Toutes') + '</span>';
  h += '<button class="j-month-btn" id="jMonthNext">▶</button>';
  h += '<select class="j-month-select" id="jMonthSelect">';
  h += '<option value="">Toutes les séances</option>';
  months.forEach(m => {
    h += '<option value="' + m.key + '"' + (m.key === currentJournalMonth ? ' selected' : '') + '>' + m.label + '</option>';
  });
  h += '</select>';
  h += '<div class="j-type-filter">';
  h += '<button class="j-type-btn' + (!journalFilterType ? ' act' : '') + '" data-jt="">Tout</button>';
  h += '<button class="j-type-btn' + (journalFilterType === 'A' ? ' act' : '') + '" data-jt="A">A</button>';
  h += '<button class="j-type-btn' + (journalFilterType === 'B' ? ' act' : '') + '" data-jt="B">B</button>';
  h += '</div></div>';
  return h;
}

function filterByType(sorted, type) {
  if (!type) return sorted;
  return sorted.filter(s => s.t === type);
}

let openSessionId = null;

function filterByMonth(sorted, monthKey) {
  if (!monthKey) return sorted;
  return sorted.filter(s => s.d.startsWith(monthKey));
}

let journalPageSize = 20;
let journalShowAll = false;

function renderSessionList(filtered) {
  if (!filtered.length) {
    return '<div class="cd"><div class="cd-b"><div class="j-empty"><p>Aucune séance ce mois-ci.</p></div></div></div>';
  }

  const lastId = filtered.length ? filtered[0].id : null;
  if (openSessionId === null) {
    openSessionId = lastId;
  } else if (openSessionId !== -1 && !filtered.some(s => s.id === openSessionId)) {
    openSessionId = lastId;
  }

  const total = filtered.length;
  const limit = journalShowAll ? total : Math.min(journalPageSize, total);
  const displayList = filtered.slice(0, limit);

  let h = '<div class="j-list">';
  displayList.forEach(s => {
    const isOpen = s.id === openSessionId;
    const isA = s.t === 'A';
    const cc = isA ? 'ha' : 'hb';
    const sec = PR[s.t];
    if (!sec) return;
    const d = new Date(s.d);
    const isSkipped = !!s.skipped;
    const isManual = !!s.manual;

    const doneCount = s.ex ? s.ex.filter(e => e && e.performed && e.performed.split(',').some(v => v.trim())).length : 0;

    h += '<div class="je' + (isOpen ? ' je-open' : '') + (isManual ? ' je-manual' : '') + '" data-sid="' + s.id + '">';
    h += '<div class="jh je-toggle">';
    h += '<div class="lft">';
    h += '<span class="jd">' + fdFR(d) + '</span>';
    h += '<span class="jt ' + cc + '">' + s.t + '</span>';
    if (isManual) h += '<span class="jt hc">Manuelle</span>';
    h += '</div>';
    h += '<div class="jh-right">';
    if (!isOpen && !isSkipped) h += '<span class="jh-summary">' + doneCount + '/' + sec.ex.length + ' exos</span>';
    if (isSkipped) h += '<span class="jh-skip-label">Passée</span>';
    h += '<span class="jh-arrow">' + (isOpen ? '▲' : '▼') + '</span>';
    h += '<button class="h-edit" data-sid="' + s.id + '">✏️</button>';
    h += '<button class="h-del" data-di="' + s.id + '">✕</button>';
    h += '</div></div>';

    if (isOpen && !isSkipped) {
      h += '<div class="jb">';
      sec.ex.forEach((ex, ei) => {
        const lg = getExLog(s, ei);
        const w = (lg && lg.weight !== undefined) ? (lg.weight > 0 ? '+' + lg.weight + ' kg' : 'PDC') : '—';
        const r = (lg && lg.performed) ? lg.performed : '—';
        const rpe = (lg && lg.rpe) ? lg.rpe : 0;
        const note = (lg && lg.note) ? lg.note : '';
        const isTimeEx = ex.reps && (ex.reps.includes('s') || ex.reps.includes('sec'));
        let rpeH = '—';
        if (isTimeEx && r) {
          const vals = r.split(',').map(v => parseInt(v.trim())).filter(v => v > 0);
          if (vals.length) {
            const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
            const range = parseRepRange(ex.reps);
            const ok = range ? avg >= range.min && avg <= range.max : false;
            rpeH = '<span class="rkc-summary-sm">Moy: ' + avg + 's' + (ok ? ' ✅' : ' ❌') + '</span>';
            if (rpe) {
              rpeH += ' <span class="rpe-dots">' + '●'.repeat(rpe) + '○'.repeat(5 - rpe) + '</span><span class="rpe-num"> ' + rpe + '/5</span>';
            }
          }
        } else if (rpe) {
          const dots = '●'.repeat(rpe) + '○'.repeat(5 - rpe);
          rpeH = '<span class="rpe-dots">' + dots + '</span><span class="rpe-num">' + rpe + '/5</span>';
        }
        const filled = r !== '—' && r.split(',').some(v => v.trim());
        h += '<div class="je-exo je-exo-' + (isA ? 'a' : 'b') + '">';
        h += '<div class="je-exo-hdr">';
        h += '<span class="je-exo-check">' + (filled ? '✓' : '✗') + '</span>';
        h += '<span class="je-exo-name">' + ex.name.split(' (')[0] + '</span>';
        h += '</div>';
        h += '<div class="je-exo-detail">';
        h += '<span class="je-tag">' + w + '</span>';
        h += '<span class="je-tag je-reps">' + r + '</span>';
        h += '<span class="je-rpe">' + rpeH + '</span>';
        h += '</div>';
        if (note) h += '<div class="je-note">' + note + '</div>';
        h += '</div>';
      });
      h += '</div>';
    } else if (isOpen && isSkipped) {
      h += '<div class="jb"><p style="color:var(--text3);font-size:.78rem;font-weight:500;padding:8px 0;text-align:center">Séance passée — aucun exercice enregistré</p></div>';
    }
    h += '</div>';
  });
  h += '</div>';

  if (total > limit) {
    h += '<button class="j-more-btn" id="jMoreBtn">Afficher les ' + (total - limit) + ' séances suivantes ▼</button>';
  } else if (journalShowAll && total > journalPageSize) {
    h += '<button class="j-more-btn" id="jLessBtn">Afficher moins ▲</button>';
  }

  return h;
}

function attachJournalEvents() {
  document.querySelectorAll('.je-toggle').forEach(el => {
    el.addEventListener('click', function(e) {
      if (e.target.closest('.h-del') || e.target.closest('.h-edit')) return;
      const card = this.closest('.je');
      if (!card) return;
      const sid = Number(card.dataset.sid);
      openSessionId = openSessionId === sid ? -1 : sid;
      currentJournalMonth = document.getElementById('jMonthSelect')?.value || currentJournalMonth || '';
      rJ();
    });
  });

  const select = document.getElementById('jMonthSelect');
  if (select) {
    select.addEventListener('change', function() {
      currentJournalMonth = this.value;
      rJ();
    });
  }

  document.getElementById('jMonthPrev')?.addEventListener('click', () => {
    const select = document.getElementById('jMonthSelect');
    if (!select) return;
    const idx = select.selectedIndex;
    if (idx > 0) { select.selectedIndex = idx - 1; select.dispatchEvent(new Event('change')); }
  });

  document.getElementById('jMonthNext')?.addEventListener('click', () => {
    const select = document.getElementById('jMonthSelect');
    if (!select) return;
    const idx = select.selectedIndex;
    if (idx < select.options.length - 1) { select.selectedIndex = idx + 1; select.dispatchEvent(new Event('change')); }
  });

  document.querySelectorAll('.j-type-btn').forEach(b => {
    b.addEventListener('click', function() {
      journalFilterType = this.dataset.jt;
      rJ();
    });
  });

  document.getElementById('jAddBtn')?.addEventListener('click', showManualLog);

  document.getElementById('jMoreBtn')?.addEventListener('click', () => {
    journalShowAll = true;
    rJ();
  });
  document.getElementById('jLessBtn')?.addEventListener('click', () => {
    journalShowAll = false;
    rJ();
  });

  document.querySelectorAll('.h-edit').forEach(b => {
    b.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = Number(this.dataset.sid);
      const session = ss.find(s => s.id === id);
      if (!session) return;
      if (session.manual) {
        editManualSession(session);
      } else {
        editExistingSession(session);
      }
    });
  });

  document.querySelectorAll('.h-del').forEach(b => {
    b.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = Number(this.dataset.di);
      if (confirm('Supprimer cette séance ?')) {
        ss = ss.filter(s => s.id !== id);
        save();
        updateStreak();
        renderAll();
        toast('Séance supprimée');
      }
    });
  });
}

let manualType = 'A';

function showManualLog() {
  manualType = 'A';
  const modal = document.getElementById('modal');
  renderManualForm();
  modal.classList.add('show');
  document.querySelector('.modal-bg')?.addEventListener('click', closeManual);
}

function saveManualForm() {
  var data = {
    type: manualType,
    date: document.getElementById('manualDate')?.value || '',
    exercises: {}
  };
  var sec = PR[manualType];
  if (!sec) return;
  sec.ex.forEach(function(ex, i) {
    var w = document.getElementById('mw_' + i);
    var sets = [];
    for (var si = 0; si < ex.sets; si++) {
      var inp = document.getElementById('ms_' + i + '_' + si);
      sets.push(inp ? inp.value : '');
    }
    var rpeEl = document.querySelector('.ec[data-m-ei="' + i + '"] .rpe-btn.sel');
    data.exercises[i] = {
      weight: w ? Number(w.value) || 0 : 0,
      sets: sets,
      rpe: rpeEl ? Number(rpeEl.dataset.rv) : 0,
      note: (document.getElementById('mn_' + i)?.value || '').trim()
    };
  });
  try { localStorage.setItem(MANUAL_FORM_KEY, JSON.stringify(data)); } catch (e) {}
}

function restoreManualForm() {
  try {
    var raw = localStorage.getItem(MANUAL_FORM_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function restoreManualFormFields() {
  var data = restoreManualForm();
  if (!data || !data.exercises) return;
  var dateEl = document.getElementById('manualDate');
  if (dateEl && data.date) dateEl.value = data.date;
  Object.keys(data.exercises).forEach(function(i) {
    var ex = data.exercises[i];
    var idx = parseInt(i);
    var w = document.getElementById('mw_' + i);
    if (w && ex.weight !== undefined) w.value = ex.weight;
    if (ex.sets) {
      ex.sets.forEach(function(val, si) {
        var inp = document.getElementById('ms_' + i + '_' + si);
        if (inp) {
          inp.value = val;
          var sec = PR[manualType];
          if (sec && sec.ex[idx]) repColor(inp, sec.ex[idx], si);
        }
      });
    }
    if (ex.rpe) {
      var btns = document.querySelectorAll('.ec[data-m-ei="' + i + '"] .rpe-btn');
      btns.forEach(function(b) { b.classList.toggle('sel', Number(b.dataset.rv) === ex.rpe); });
    }
    var n = document.getElementById('mn_' + i);
    if (n && ex.note) n.value = ex.note;
    var pdcBtn = document.querySelector('.pdc[data-m-pdc="' + i + '"]');
    if (pdcBtn && Number(ex.weight) === 0) pdcBtn.classList.add('act');
    else if (pdcBtn) pdcBtn.classList.remove('act');
  });
}

function clearManualForm() {
  try { localStorage.removeItem(MANUAL_FORM_KEY); } catch (e) {}
}

function closeManual() {
  var c = document.getElementById('modal').querySelector('.modal-c');
  if (c) c.className = 'modal-c';
  document.getElementById('modal').classList.remove('show');
}

function editManualSession(session) {
  manualType = session.t;
  var cache = { type: session.t, date: session.d, exercises: {} };
  if (session.ex) {
    session.ex.forEach(function(e, i) {
      var sets = [];
      if (e.performed) sets = e.performed.split(',');
      cache.exercises[i] = {
        weight: e.weight || 0,
        sets: sets,
        rpe: e.rpe || 0,
        note: e.note || ''
      };
    });
  }
  try { localStorage.setItem(MANUAL_FORM_KEY, JSON.stringify(cache)); } catch (e) {}
  showManualLog();
}

function renderManualForm() {
  var sec = PR[manualType];
  var c = document.getElementById('modal').querySelector('.modal-c');
  c.className = 'modal-c manual-wide';
  var bc = manualType === 'A' ? 'ba' : 'bb';

  var data = restoreManualForm();
  var savedDate = (data && data.date) || fdISO(new Date());
  var savedType = (data && data.type) || manualType;

  let h = '<div class="manual-form">';
  h += '<div class="manual-hdr"><h3>Ajouter une séance</h3><div style="display:flex;gap:6px">';
  h += '<span class="bdg bcx" style="font-size:.6rem">MANUEL</span>';
  h += '<span class="bdg ' + bc + '" style="font-size:.7rem">' + savedType + '</span></div></div>';
  h += '<div class="manual-date"><label>Date</label><input type="date" id="manualDate" value="' + savedDate + '"></div>';
  h += '<div class="manual-type"><label>Type</label><div class="manual-type-btns">';
  h += '<button class="manual-type-btn' + (savedType === 'A' ? ' act' : '') + '" data-mt="A">Séance A</button>';
  h += '<button class="manual-type-btn' + (savedType === 'B' ? ' act' : '') + '" data-mt="B">Séance B</button>';
  h += '</div></div>';
  h += '<div class="manual-exos">';
  sec.ex.forEach(function(ex, i) {
    var lw = lastW(manualType, i);
    var pw = getProposedWeight(manualType, i);
    var sg = lw !== null ? pw : ex.iw;
    var pdc = sg === 0;
    var isTimeBased = ex.reps && (ex.reps.includes('s') || ex.reps.includes('sec'));

    h += '<div class="ec ec-manual" data-m-ei="' + i + '">';
    h += '<div class="ech"><span class="nm">' + ex.num + '. ' + ex.name + '</span><span class="tg">' + ex.sets + '×' + formatTargetReps(ex.reps) + '</span></div>';
    h += '<div class="ei2">';
    h += '<div class="lg"><l>Leste</l><div class="ww"><input type="number" id="mw_' + i + '" value="' + sg + '" min="0" step="1"><span class="unit">kg</span><button type="button" class="pdc' + (pdc ? ' act' : '') + '" data-m-pdc="' + i + '">PDC</button></div></div>';
    h += '<div class="lg"><l>Réalisé</l><div class="set-row" id="mSetRow_' + i + '">';
    for (var si = 0; si < ex.sets; si++) {
      h += '<div class="set-input"><l>S' + (si + 1) + '</l><input type="text" inputmode="numeric" pattern="[0-9]*" id="ms_' + i + '_' + si + '" placeholder="0" autocomplete="off" maxlength="4"></div>';
    }
    h += '</div></div></div>';
    if (isTimeBased) {
      h += '<div class="lg" style="margin-bottom:4px"><l>Moyenne vs Objectif</l><div class="rkc-summary" id="mRkcSummary_' + i + '">—</div></div>';
    }
    h += '<div class="lg" style="margin-bottom:6px"><l>Ressenti</l><div class="rpe-row" data-m-rpe="' + i + '">';
    for (var v = 1; v <= 5; v++) {
      h += '<button type="button" class="rpe-btn s' + v + '" data-rv="' + v + '">' + v + '</button>';
    }
    h += '</div></div>';
    h += '<div class="lg"><input type="text" id="mn_' + i + '" placeholder="Note (optionnelle)" autocomplete="off"></div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<div class="modal-acts">';
  h += '<button class="ebtn ebtn-p" id="manualSaveBtn">✅ Enregistrer</button>';
  h += '<button class="ebtn" id="manualCancelBtn">Annuler</button>';
  h += '</div></div>';
  c.innerHTML = h;

  if (savedType !== manualType) {
    manualType = savedType;
    renderManualForm();
    return;
  }

  restoreManualFormFields();

  document.querySelectorAll('.pdc[data-m-pdc]').forEach(function(b) {
    b.addEventListener('click', function() {
      var i = this.dataset.mPdc;
      var inp = document.getElementById('mw_' + i);
      var wasAct = this.classList.contains('act');
      if (!wasAct) {
        this.dataset.prevWeight = inp.value;
        inp.value = 0;
      } else {
        inp.value = this.dataset.prevWeight !== undefined ? this.dataset.prevWeight : PR[manualType].ex[parseInt(i)].iw;
      }
      this.classList.toggle('act');
      saveManualForm();
    });
  });

  document.querySelectorAll('.rpe-row .rpe-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var row = this.closest('.rpe-row');
      row.querySelectorAll('.rpe-btn').forEach(function(bb) { bb.classList.remove('sel'); });
      this.classList.add('sel');
      saveManualForm();
    });
  });

  document.querySelectorAll('[id^="ms_"]').forEach(function(el) {
    el.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      var parts = this.id.split('_');
      var exI = parseInt(parts[1]);
      var si = parseInt(parts[2]);
      var p = PR[manualType];
      if (p && p.ex[exI]) {
        repColor(this, p.ex[exI], si);
        if (p.ex[exI].reps && (p.ex[exI].reps.includes('s') || p.ex[exI].reps.includes('sec'))) {
          updateManualRkcSummary(exI);
        }
      }
      saveManualForm();
    });
    el.addEventListener('focus', function() { this.select(); });
  });

  document.getElementById('manualCancelBtn').addEventListener('click', closeManual);
  document.getElementById('manualSaveBtn').addEventListener('click', saveManualLog);

  document.querySelectorAll('[data-mt]').forEach(function(b) {
    b.addEventListener('click', function() {
      manualType = this.dataset.mt;
      try { localStorage.setItem(MANUAL_FORM_KEY, JSON.stringify({ type: manualType, date: document.getElementById('manualDate')?.value || fdISO(new Date()) })); } catch (e) {}
      renderManualForm();
    });
  });

  document.querySelectorAll('#manualDate, [id^="mw_"], [id^="ms_"], [id^="mn_"]').forEach(function(el) {
    el.addEventListener('input', saveManualForm);
    el.addEventListener('change', saveManualForm);
  });
}

function updateManualRkcSummary(exIdx) {
  var sec = PR[manualType];
  if (!sec || !sec.ex[exIdx]) return;
  var ex = sec.ex[exIdx];
  var el = document.getElementById('mRkcSummary_' + exIdx);
  if (!el) return;
  var vals = [];
  for (var si = 0; si < ex.sets; si++) {
    var inp = document.getElementById('ms_' + exIdx + '_' + si);
    var v = inp ? parseInt(inp.value) : 0;
    if (v > 0) vals.push(v);
  }
  if (!vals.length) { el.textContent = '—'; el.className = 'rkc-summary'; return; }
  var avg = Math.round(vals.reduce(function(a, b) { return a + b; }, 0) / vals.length);
  var range = parseRepRange(ex.reps);
  var ok = false;
  if (range) ok = avg >= range.min && avg <= range.max;
  el.textContent = 'Moy: ' + avg + 's' + (range ? ' · ' + range.min + '-' + range.max + 's' : '') + (ok ? ' ✅' : ' ❌');
  el.className = 'rkc-summary' + (ok ? ' ok' : ' ko');
}

function saveManualLog() {
  const dateStr = document.getElementById('manualDate').value;
  if (!dateStr) { toast('Choisis une date', true); return; }
  if (dateStr > fdISO(new Date())) { toast('La date ne peut pas être dans le futur', true); return; }

  const sec = PR[manualType];
  if (!sec) return;

  const ex = [];
  let ok = true;
  sec.ex.forEach((exDef, i) => {
    const w = Number(document.getElementById('mw_' + i)?.value) || 0;
    const sets = [];
    for (let si = 0; si < exDef.sets; si++) {
      const inp = document.getElementById('ms_' + i + '_' + si);
      sets.push(inp ? inp.value.trim() : '');
    }
    const performed = sets.join(',');
    const rpeEl = document.querySelector('.ec[data-m-ei="' + i + '"] .rpe-btn.sel');
    const rpe = rpeEl ? Number(rpeEl.dataset.rv) : 0;
    const n = (document.getElementById('mn_' + i)?.value || '').trim();
    const filled = sets.some(v => v.trim());
    const isTimeBased = exDef.reps && (exDef.reps.includes('s') || exDef.reps.includes('sec'));
    if (!filled) ok = false;
    if (!isTimeBased && !rpe) ok = false;
    ex[i] = { weight: w, performed: performed, rpe: rpe, note: n, ei: i };
  });

  if (!ok) { toast('Remplis tous les champs pour chaque exercice', true); return; }

  const existing = ss.findIndex(s => s.d === dateStr);
  if (existing !== -1) {
    const prevType = ss[existing].t;
    ss[existing] = { ...ss[existing], d: dateStr, t: manualType, ex: ex, manual: true };
    if (prevType !== manualType) toast('Remplace la séance ' + prevType + ' par ' + manualType + ' sur ce jour', false);
  } else {
    ss.push({ id: Date.now(), d: dateStr, t: manualType, ex: ex, manual: true });
  }
  clearManualForm();
  updateStreak();
  checkBadges();
  save();
  closeManual();
  renderAll();
  toast('Séance du ' + dateStr + ' enregistrée !');
}
