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

    const doneCount = s.ex ? s.ex.filter(e => e && e.performed && e.performed.split(',').some(v => v.trim())).length : 0;

    h += '<div class="je' + (isOpen ? ' je-open' : '') + '" data-sid="' + s.id + '">';
    h += '<div class="jh je-toggle">';
    h += '<div class="lft">';
    h += '<span class="jd">' + fdFR(d) + '</span>';
    h += '<span class="jt ' + cc + '">' + s.t + '</span>';
    h += '</div>';
    h += '<div class="jh-right">';
    if (!isOpen && !isSkipped) h += '<span class="jh-summary">' + doneCount + '/' + sec.ex.length + ' exos</span>';
    if (isSkipped) h += '<span class="jh-skip-label">Passée</span>';
    h += '<span class="jh-arrow">' + (isOpen ? '▲' : '▼') + '</span>';
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
        let rpeH = '—';
        if (rpe) {
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
      if (e.target.closest('.h-del')) return;
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
  const c = modal.querySelector('.modal-c');
  renderManualForm();
  modal.classList.add('show');
  document.querySelector('.modal-bg')?.addEventListener('click', closeManual);
}

function closeManual() {
  document.getElementById('modal').classList.remove('show');
}

function renderManualForm() {
  const sec = PR[manualType];
  const c = document.getElementById('modal').querySelector('.modal-c');
  const bc = manualType === 'A' ? 'ba' : 'bb';
  const savedDate = document.getElementById('manualDate')?.value || fdISO(new Date());
  let h = '<div class="manual-form">';
  h += '<div class="manual-hdr"><h3>Ajouter une séance</h3><span class="bdg ' + bc + '" style="font-size:.7rem">' + manualType + '</span></div>';
  h += '<div class="manual-date"><label>Date</label><input type="date" id="manualDate" value="' + savedDate + '"></div>';
  h += '<div class="manual-type"><label>Type</label><div class="manual-type-btns">';
  h += '<button class="j-type-btn' + (manualType === 'A' ? ' act' : '') + '" data-mt="A">Séance A</button>';
  h += '<button class="j-type-btn' + (manualType === 'B' ? ' act' : '') + '" data-mt="B">Séance B</button>';
  h += '</div></div>';
  h += '<div class="manual-exos">';
  sec.ex.forEach((ex, i) => {
    h += '<div class="manual-exo">';
    const isTimeBased = ex.reps && (ex.reps.includes('s') || ex.reps.includes('sec'));
    h += '<div class="manual-exo-name">' + ex.num + '. ' + ex.name + '</div>';
    h += '<div class="manual-exo-row">';
    h += '<div class="manual-field"><label>Leste (kg)</label><input type="number" id="mw_' + i + '" value="' + ex.iw + '" min="0"></div>';
    h += '<div class="manual-field"><label>Réalisé' + (isTimeBased ? ' (sec)' : '') + '</label><input type="text" id="mr_' + i + '" placeholder="' + (isTimeBased ? 'ex: 35,30,40' : 'ex: 4,4,3,4') + '" inputmode="numeric"></div>';
    h += '<div class="manual-field"><label>RPE</label><select id="mrpe_' + i + '"><option value="0">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></div>';
    h += '</div>';
    h += '<input type="text" id="mn_' + i + '" placeholder="Note (optionnelle)" class="manual-note">';
    h += '</div>';
  });
  h += '</div>';
  h += '<div class="modal-acts">';
  h += '<button class="ebtn ebtn-p" id="manualSaveBtn">✅ Enregistrer</button>';
  h += '<button class="ebtn" id="manualCancelBtn">Annuler</button>';
  h += '</div></div>';
  c.innerHTML = h;

  document.getElementById('manualCancelBtn')?.addEventListener('click', closeManual);
  document.getElementById('manualSaveBtn')?.addEventListener('click', saveManualLog);
  document.querySelectorAll('[data-mt]').forEach(b => {
    b.addEventListener('click', function() {
      manualType = this.dataset.mt;
      renderManualForm();
    });
  });
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
    const r = (document.getElementById('mr_' + i)?.value || '').trim();
    const rpe = Number(document.getElementById('mrpe_' + i)?.value) || 0;
    const n = (document.getElementById('mn_' + i)?.value || '').trim();
    const filled = r.split(',').some(v => v.trim());
    if (!filled || !rpe) ok = false;
    ex[i] = { weight: w, performed: r, rpe: rpe, note: n, ei: i };
  });

  if (!ok) { toast('Remplis "Réalisé" et le RPE pour chaque exercice', true); return; }

  const existing = ss.findIndex(s => s.d === dateStr);
  if (existing !== -1) {
    const prevType = ss[existing].t;
    ss[existing] = { id: Date.now(), d: dateStr, t: manualType, ex: ex };
    if (prevType !== manualType) toast('Remplace la séance ' + prevType + ' par ' + manualType + ' sur ce jour', false);
  } else {
    ss.push({ id: Date.now(), d: dateStr, t: manualType, ex: ex });
  }
  save();
  updateStreak();
  checkBadges();
  save();
  closeManual();
  renderAll();
  toast('Séance du ' + dateStr + ' enregistrée !');
}
