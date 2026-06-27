const DRAFT_KEY = 'force_v3_draft';
let logState = null;

function setAccent(sessionId) {
  var root = document.documentElement;
  if (sessionId === 'A') {
    root.style.setProperty('--accent', '#5a9aaa');
    root.style.setProperty('--accent-bg', 'rgba(90,154,170,0.15)');
  } else if (sessionId === 'B') {
    root.style.setProperty('--accent', '#c99550');
    root.style.setProperty('--accent-bg', 'rgba(201,149,80,0.15)');
  } else {
    root.style.setProperty('--accent', '#d4a373');
    root.style.setProperty('--accent-bg', 'rgba(212,163,115,0.15)');
  }
}

function startLog(sessionId) {
  setAccent(sessionId);

  var draft = loadDraft();
  if (draft && draft.sessionId === sessionId) {
    logState = draft;
    renderLogStep();
    requestWakeLock();
    return;
  }

  const exercises = getSessionExercises(sessionId).map(function(ex) {
    const lastEx = getExerciseHistory(ex.num, sessionId);
    const lastWeight = lastEx.length ? lastEx[lastEx.length - 1].weight : ex.weight;
    return {
      num: ex.num,
      name: ex.name,
      sets: ex.sets,
      weight: lastWeight,
      rest: ex.rest,
      performed: [],
      rpe: null,
      note: ''
    };
  });

  logState = {
    sessionId: sessionId,
    currentEx: 0,
    exercises: exercises,
    startTime: Date.now()
  };

  renderLogStep();
  requestWakeLock();
}

function saveDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(logState)); } catch (e) {}
}

function loadDraft() {
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
}

function requestWakeLock() {
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').catch(function() {});
  }
}

function renderLogHome() {
  setAccent(getNextSession().id);
  const next = getNextSession();
  var html =
    '<div style="padding-top:30px;text-align:center">' +
    '<div style="font-size:3rem;margin-bottom:16px">💪</div>' +
    '<h2 style="font-family:var(--ff-h);font-weight:700;font-size:1.3rem;margin-bottom:8px">Prêt pour l\'entraînement ?</h2>' +
    '<p style="color:var(--text2);font-size:.85rem;margin-bottom:24px">Choisis une séance pour commencer</p>' +
    '<div style="display:flex;flex-direction:column;gap:10px;max-width:280px;margin:0 auto">' +
    '<button class="btn btn-p" id="logStartA" style="width:100%;padding:16px;font-size:1rem">Séance A — Tirage & Cuisses</button>' +
    '<button class="btn" id="logStartB" style="width:100%;padding:16px;font-size:1rem;border-color:var(--b);color:var(--b)">Séance B — Poussée</button>' +
    '</div>' +
    '</div>';

  document.getElementById('logContent').innerHTML = html;

  document.getElementById('logStartA').addEventListener('click', function() { startLog('A'); });
  document.getElementById('logStartB').addEventListener('click', function() { startLog('B'); });
}

function renderLogStep() {
  if (!logState) { renderLogHome(); return; }
  setAccent(logState.sessionId);
  const ex = logState.exercises[logState.currentEx];
  if (!ex) { finishLog(); return; }

  const total = logState.exercises.length;
  const idx = logState.currentEx;

  var progressHtml = '<div style="margin-bottom:16px;display:flex;gap:4px">';
  for (var i = 0; i < total; i++) {
    progressHtml += '<div style="flex:1;height:3px;border-radius:2px;background:' + (i <= idx ? 'var(--accent)' : 'var(--border)') + ';transition:background .3s"></div>';
  }
  progressHtml += '</div>';

  var setsHtml = '';
  for (var s = 0; s < ex.sets; s++) {
    setsHtml +=
      '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">' +
      '<span style="font-size:.5rem;color:var(--text3);text-transform:uppercase;font-weight:600">S' + (s + 1) + '</span>' +
      '<input type="number" data-idx="' + s + '" class="set-input" min="0" max="999" value="' + (ex.performed[s] || '') + '" style="width:46px;height:46px;border:2px solid var(--border);border-radius:12px;background:rgba(255,255,255,0.06);color:var(--text);font-size:.95rem;font-weight:700;text-align:center;outline:none;-moz-appearance:textfield">' +
      '</div>';
  }

  var rpeHtml = '';
  for (var r = 1; r <= 5; r++) {
    rpeHtml +=
      '<button class="rpe-btn" style="width:40px;height:40px;border-radius:50%;border:2px solid var(--border);background:transparent;color:var(--text3);font-weight:700;font-size:.85rem;cursor:pointer;transition:all .15s cubic-bezier(0.34,1.56,0.64,1);display:flex;align-items:center;justify-content:center">' + r + '</button>';
  }

  // Rest display: just text showing the rest time
  var restText = Math.floor(ex.rest / 60) + 'min' + (ex.rest % 60 > 0 ? ex.rest % 60 : '');

  var html =
    '<div class="hdr" style="display:flex;align-items:center;gap:8px">' +
    '<button id="logBackBtn" style="background:none;border:none;color:var(--text2);font-size:1.2rem;cursor:pointer;padding:4px 8px">←</button>' +
    '<div style="flex:1;text-align:center">' +
    '<h1 style="font-size:1rem;font-weight:700">Séance ' + logState.sessionId + '</h1>' +
    '<div style="font-size:.72rem;color:var(--text3)">' + (idx + 1) + ' / ' + total + '</div>' +
    '</div></div>' +
    progressHtml +
    '<div class="card" style="padding:18px;margin-bottom:14px">' +
    '<h3 style="font-family:var(--ff-h);font-weight:700;font-size:1.1rem;margin-bottom:14px">' + ex.name + '</h3>' +
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
    '<label style="font-size:.75rem;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em">Poids</label>' +
    '<input type="number" id="logWeight" value="' + ex.weight + '" min="0" step="1" style="width:70px;padding:10px;border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,0.06);color:var(--text);font-size:1rem;text-align:center;outline:none;-moz-appearance:textfield">' +
    '<span style="font-size:.75rem;color:var(--text3)">kg</span>' +
    '</div>' +
    '<div style="margin-bottom:14px">' +
    '<label style="font-size:.75rem;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Séries (' + ex.sets + ')</label>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap" id="setsContainer">' + setsHtml + '</div>' +
    '</div>' +
    '<div style="margin-bottom:14px">' +
    '<label style="font-size:.75rem;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">RPE</label>' +
    '<div style="display:flex;gap:6px" id="rpeContainer">' + rpeHtml + '</div>' +
    '</div>' +
    '<div>' +
    '<label style="font-size:.75rem;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:4px">Note</label>' +
    '<input type="text" id="exNote" placeholder="Optionnelle..." class="input" value="' + (ex.note || '') + '">' +
    '</div>' +
    '</div>' +
    '<div style="padding:14px 18px;margin-bottom:14px;background:var(--accent-bg);border-radius:14px;border:1px solid var(--accent);text-align:center">' +
    '<span style="font-size:1.1rem;color:var(--accent);font-weight:700">⏱ Repos : ' + restText + '</span>' +
    '</div>' +
    '<button id="validateExBtn" class="btn btn-p" style="width:100%;padding:16px;font-size:1rem">' +
    (idx < total - 1 ? 'Valider & suivant →' : 'Terminer la séance ✓') +
    '</button>';

  document.getElementById('logContent').innerHTML = html;
  bindLogEvents();
}

function bindLogEvents() {
  document.getElementById('logBackBtn').addEventListener('click', function() {
    if (confirm('Annuler la saisie en cours ?')) {
      clearDraft();
      logState = null;
      switchTab('program');
    }
  });

  document.querySelectorAll('.rpe-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.rpe-btn').forEach(function(b) {
        b.style.background = 'transparent';
        b.style.color = 'var(--text3)';
        b.style.borderColor = 'var(--border)';
      });
      var v = parseInt(btn.textContent);
      var colors = ['var(--r1)', 'var(--r2)', 'var(--r3)', 'var(--r4)', 'var(--r5)'];
      btn.style.background = colors[v - 1];
      btn.style.color = '#fff';
      btn.style.borderColor = 'transparent';
      logState.exercises[logState.currentEx].rpe = v;
      saveDraft();
    });
  });

  document.getElementById('validateExBtn').addEventListener('click', validateExercise);

  // Auto-save on weight change
  var weightInput = document.getElementById('logWeight');
  if (weightInput) {
    weightInput.addEventListener('input', function() {
      if (logState) {
        logState.exercises[logState.currentEx].weight = parseInt(this.value) || 0;
        saveDraft();
      }
    });
  }

  // Auto-save on set inputs
  document.querySelectorAll('#setsContainer input').forEach(function(inp) {
    inp.addEventListener('input', function() {
      if (logState) {
        var inputs = document.querySelectorAll('#setsContainer input');
        var performed = [];
        inputs.forEach(function(el) { performed.push(parseInt(el.value) || 0); });
        logState.exercises[logState.currentEx].performed = performed;
        saveDraft();
      }
    });
  });

  // Auto-save on note
  var noteInput = document.getElementById('exNote');
  if (noteInput) {
    noteInput.addEventListener('input', function() {
      if (logState) {
        logState.exercises[logState.currentEx].note = this.value;
        saveDraft();
      }
    });
  }
}

function validateExercise() {
  var ex = logState.exercises[logState.currentEx];
  var weight = parseInt(document.getElementById('logWeight')?.value) || 0;
  var inputs = document.querySelectorAll('#setsContainer input');
  var performed = [];
  inputs.forEach(function(inp) {
    var v = parseInt(inp.value) || 0;
    if (v > 0) performed.push(v);
  });
  var note = document.getElementById('exNote')?.value?.trim() || '';

  if (performed.length === 0) {
    showToast('Saisis au moins une série', 'ko');
    return;
  }

  ex.weight = weight;
  ex.performed = performed;
  ex.rpe = ex.rpe || 3;
  ex.note = note;

  if (logState.currentEx >= logState.exercises.length - 1) {
    finishLog();
  } else {
    logState.currentEx++;
    renderLogStep();
  }
}

function finishLog() {
  if (!logState) return;

  var now = new Date();
  var log = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    d: now.toISOString().slice(0, 10),
    t: logState.sessionId,
    ex: logState.exercises.map(function(ex, i) {
      return {
        ei: i + 1,
        weight: ex.weight,
        performed: ex.performed,
        rpe: ex.rpe,
        note: ex.note
      };
    })
  };

  DATA.logs.push(log);
  saveData();
  clearDraft();
  logState = null;

  showToast('Séance enregistrée !', 'ok');
  setTimeout(function() {
    renderProgram();
    switchTab('program');
  }, 800);
}
