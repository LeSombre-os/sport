let chronoInterval = null;
let chronoRemaining = 0;
let chronoTotal = 0;
let chronoRunning = false;

function initChrono(container, totalSeconds, sessionType, onDone) {
  const colorClass = sessionType === 'B' ? 'play-b' : 'play-a';
  chronoRemaining = totalSeconds;
  chronoTotal = totalSeconds;
  chronoRunning = false;
  if (chronoInterval) { clearInterval(chronoInterval); chronoInterval = null; }

  container.innerHTML = `
    <div class="chrono-row">
      <span class="chrono-display" id="chronoDisp">${fmtTime(totalSeconds)}</span>
      <button class="chrono-btn play ${colorClass}" id="chronoPlay">▶ Démarrer</button>
      <button class="chrono-btn reset" id="chronoReset">↺</button>
    </div>
  `;

  const disp = document.getElementById('chronoDisp');
  const playBtn = document.getElementById('chronoPlay');
  const resetBtn = document.getElementById('chronoReset');

  playBtn.addEventListener('click', () => {
    if (chronoRunning) {
      clearInterval(chronoInterval);
      chronoInterval = null;
      chronoRunning = false;
      playBtn.textContent = '▶ Reprendre';
      playBtn.className = 'chrono-btn play ' + colorClass;
      disp.classList.remove('running', 'alert', 'done');
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
  });

  return {
    getRemaining: () => chronoRemaining,
    isRunning: () => chronoRunning,
    stop: () => {
      if (chronoInterval) { clearInterval(chronoInterval); chronoInterval = null; }
      chronoRunning = false;
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
