function initApp() {
  load();
  nT = nextT();
  renderAll();

  document.getElementById('nxBtn').onclick = function() {
    editingLog = null;
    switchTab('log');
    rLog(nT);
  };

  document.getElementById('skipBtn').addEventListener('click', skipSession);

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tab = this.dataset.t;
      switchTab(tab);
      if (tab === 'log') { editingLog = null; rLog(nT); }
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
}

function showSwUpdate(reg) {
  var btn = document.getElementById('nxBtn');
  btn.textContent = '🔄 Nouvelle version dispo !';
  btn.onclick = function() {
    reg.waiting.postMessage({ action: 'skipWaiting' });
    btn.textContent = 'Mise à jour...';
    btn.disabled = true;
  };
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    window.location.reload();
  });
}

document.addEventListener('DOMContentLoaded', initApp);
