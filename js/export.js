function expCode() {
  if (!ss.length) { toast('Aucune séance à exporter', true); return; }
  try {
    const json = JSON.stringify(ss);
    const code = btoa(unescape(encodeURIComponent(json)));
    navigator.clipboard.writeText(code).then(() => {
      toast('Code copié !');
    }, () => {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('Code copié !');
    });
  } catch(e) {
    toast("Erreur lors de l'export", true);
  }
}

function impCode() {
  const ta = document.getElementById('codeInput');
  const code = ta.value.trim();
  if (!code) { toast('Colle d\'abord un code', true); return; }
  try {
    const json = decodeURIComponent(escape(atob(code)));
    const data = JSON.parse(json);
    if (Array.isArray(data) && data.length) {
      const valid = data.every(s =>
        s.d && /^\d{4}-\d{2}-\d{2}$/.test(s.d) &&
        ['A', 'B'].includes(s.t) &&
        Array.isArray(s.ex)
      );
      if (!valid) { toast('Code corrompu ou invalide', true); return; }
      data.forEach(newSession => {
        if (newSession.ex) {
          newSession.ex.forEach((e, i) => {
            if (e.w !== undefined && e.weight === undefined) e.weight = e.w;
            if (e.r !== undefined && e.performed === undefined) e.performed = e.r;
            if (e.n !== undefined && e.note === undefined) e.note = e.n;
            if (e.ei === undefined) e.ei = i;
          });
        }
        const existing = ss.findIndex(s => s.d === newSession.d && !s.manual);
        if (existing !== -1) {
          ss[existing] = newSession;
        } else {
          ss.push(newSession);
        }
      });
      save();
      updateStreak();
      closeModal();
      renderAll();
      toast('Données restaurées ! ' + data.length + ' séances');
    } else {
      toast('Code invalide', true);
    }
  } catch(e) {
    toast('Code invalide : vérifie la copie', true);
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

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}
