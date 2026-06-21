let chronoInterval = null;
let chronoRemaining = 0;
let chronoTotal = 0;
let chronoRunning = false;
let chronoVisibilitySetup = false;
const CHRONO_KEY = 'force_chrono_v1';

let chronoSessionType = '';
let chronoExoIndex = -1;

function saveChronoState() {
  try {
    sessionStorage.setItem(CHRONO_KEY, JSON.stringify({
      remaining: chronoRemaining,
      total: chronoTotal,
      running: chronoRunning,
      sessionType: chronoSessionType,
      exoIndex: chronoExoIndex,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

function clearChronoState() {
  try { sessionStorage.removeItem(CHRONO_KEY); } catch (e) {}
}

function restoreChronoState(totalSeconds, sessionType, exoIndex) {
  try {
    const raw = sessionStorage.getItem(CHRONO_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.total !== totalSeconds) return null;
    if (data.sessionType !== sessionType) return null;
    if (data.exoIndex !== exoIndex) return null;
    if (data.running) {
      const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
      data.remaining = Math.max(0, data.remaining - elapsed);
    }
    return data;
  } catch (e) {
    return null;
  }
}

function setupChronoVisibilityHandlers(totalSeconds, disp, playBtn, colorClass, onDone) {
  if (chronoVisibilitySetup) return;
  chronoVisibilitySetup = true;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (chronoRunning) saveChronoState();
    } else {
      const restored = restoreChronoState(chronoTotal, chronoSessionType, chronoExoIndex);
      if (restored && restored.total === chronoTotal) {
        if (restored.remaining !== chronoRemaining) {
          chronoRemaining = restored.remaining;
          disp.textContent = fmtTime(chronoRemaining);
          if (chronoRemaining <= 0) {
            if (chronoInterval) { clearInterval(chronoInterval); chronoInterval = null; }
            chronoRunning = false;
            disp.textContent = '0:00';
            disp.className = 'chrono-display done';
            playBtn.textContent = '✓ Fini';
            playBtn.className = 'chrono-btn reset';
            try { navigator.vibrate(200); } catch (e) {}
            if (onDone) onDone();
          } else if (chronoRemaining <= 5) {
            disp.className = 'chrono-display alert';
          }
        }
        if (restored.running && !chronoRunning && chronoRemaining > 0) {
          chronoRunning = true;
          playBtn.textContent = '⏸ Pause';
          playBtn.className = 'chrono-btn pause ' + colorClass;
          disp.classList.add('running');
          if (chronoInterval) { clearInterval(chronoInterval); }
          chronoInterval = setInterval(() => {
            chronoRemaining--;
            disp.textContent = fmtTime(chronoRemaining);
            if (chronoRemaining <= 5 && chronoRemaining > 0) {
              disp.className = 'chrono-display alert';
            }
            if (chronoRemaining <= 0) {
              clearInterval(chronoInterval);
              chronoInterval = null;
              chronoRunning = false;
              disp.textContent = '0:00';
              disp.className = 'chrono-display done';
              playBtn.textContent = '✓ Fini';
              playBtn.className = 'chrono-btn reset';
              clearChronoState();
              try { navigator.vibrate(200); } catch (e) {}
              if (onDone) onDone();
            }
          }, 1000);
        }
      }
    }
  });
}

function initChrono(container, totalSeconds, sessionType, onDone, exoIndex) {
  const colorClass = sessionType === 'B' ? 'play-b' : 'play-a';
  chronoTotal = totalSeconds;
  chronoSessionType = sessionType;
  chronoExoIndex = exoIndex !== undefined ? exoIndex : -1;

  const restored = restoreChronoState(totalSeconds, chronoSessionType, chronoExoIndex);
  chronoRemaining = restored ? restored.remaining : totalSeconds;
  chronoRunning = restored ? restored.running : false;
  if (restored) clearChronoState();

  if (chronoInterval) { clearInterval(chronoInterval); chronoInterval = null; }

  container.innerHTML = `
    <div class="chrono-row">
      <span class="chrono-display" id="chronoDisp">${fmtTime(chronoRemaining)}</span>
      <button class="chrono-btn play ${colorClass}" id="chronoPlay">${chronoRunning ? '⏸ Pause' : '▶ Démarrer'}</button>
      <button class="chrono-btn reset" id="chronoReset">↺</button>
    </div>
  `;

  const disp = document.getElementById('chronoDisp');
  const playBtn = document.getElementById('chronoPlay');
  const resetBtn = document.getElementById('chronoReset');

  if (chronoRunning) {
    disp.classList.add('running');
    if (chronoRemaining <= 5 && chronoRemaining > 0) {
      disp.className = 'chrono-display alert';
    }
    if (chronoRemaining <= 0) {
      chronoRunning = false;
      disp.textContent = '0:00';
      disp.className = 'chrono-display done';
      playBtn.textContent = '✓ Fini';
      playBtn.className = 'chrono-btn reset';
    }
  }

  if (chronoRunning && chronoRemaining > 0) {
    chronoInterval = setInterval(() => {
      chronoRemaining--;
      disp.textContent = fmtTime(chronoRemaining);
      if (chronoRemaining <= 5 && chronoRemaining > 0) {
        disp.className = 'chrono-display alert';
      }
      if (chronoRemaining <= 0) {
        clearInterval(chronoInterval);
        chronoInterval = null;
        chronoRunning = false;
        disp.textContent = '0:00';
        disp.className = 'chrono-display done';
        playBtn.textContent = '✓ Fini';
        playBtn.className = 'chrono-btn reset';
        clearChronoState();
        try { navigator.vibrate(200); } catch (e) {}
        if (onDone) onDone();
      }
    }, 1000);
  }

  playBtn.addEventListener('click', () => {
    if (chronoRunning) {
      clearInterval(chronoInterval);
      chronoInterval = null;
      chronoRunning = false;
      playBtn.textContent = '▶ Reprendre';
      playBtn.className = 'chrono-btn play ' + colorClass;
      disp.classList.remove('running', 'alert', 'done');
      clearChronoState();
    } else {
      if (chronoRemaining <= 0) {
        chronoRemaining = chronoTotal;
      }
      chronoRunning = true;
      playBtn.textContent = '⏸ Pause';
      playBtn.className = 'chrono-btn pause ' + colorClass;
      disp.classList.add('running');
      chronoInterval = setInterval(() => {
        chronoRemaining--;
        disp.textContent = fmtTime(chronoRemaining);
        if (chronoRemaining <= 5 && chronoRemaining > 0) {
          disp.className = 'chrono-display alert';
        }
        if (chronoRemaining <= 0) {
          clearInterval(chronoInterval);
          chronoInterval = null;
          chronoRunning = false;
          disp.textContent = '0:00';
          disp.className = 'chrono-display done';
          playBtn.textContent = '✓ Fini';
          playBtn.className = 'chrono-btn reset';
          clearChronoState();
          try { navigator.vibrate(200); } catch (e) {}
          if (onDone) onDone();
        }
      }, 1000);
    }
  });

  resetBtn.addEventListener('click', () => {
    if (chronoInterval) { clearInterval(chronoInterval); chronoInterval = null; }
    chronoRemaining = chronoTotal;
    chronoRunning = false;
    disp.textContent = fmtTime(chronoTotal);
    disp.className = 'chrono-display';
    playBtn.textContent = '▶ Démarrer';
    playBtn.className = 'chrono-btn play ' + colorClass;
    clearChronoState();
  });

  setupChronoVisibilityHandlers(totalSeconds, disp, playBtn, colorClass, onDone);

  return {
    getRemaining: () => chronoRemaining,
    isRunning: () => chronoRunning,
    stop: () => {
      if (chronoInterval) { clearInterval(chronoInterval); chronoInterval = null; }
      chronoRunning = false;
      clearChronoState();
    }
  };
}

function fmtTime(sec) {
  if (sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function showNextExoPopup(name, detail, onContinue, sessionType) {
  const modal = document.getElementById('modal');
  const c = modal.querySelector('.modal-c');
  const colorClass = sessionType === 'B' ? 'cp-btn-b' : 'cp-btn-a';
  c.innerHTML = `
    <div class="chrono-popup">
      <p class="cp-exo">Exercice suivant</p>
      <div class="cp-name">${name}</div>
      <div class="cp-detail">${detail}</div>
      <button class="cp-btn ${colorClass}" id="nextExoBtn">C'est parti !</button>
    </div>
  `;
  modal.classList.add('show');
  document.getElementById('nextExoBtn').addEventListener('click', () => {
    modal.classList.remove('show');
    if (onContinue) onContinue();
  });
  document.querySelector('.modal-bg').addEventListener('click', () => {
    modal.classList.remove('show');
    if (onContinue) onContinue();
  });
}
