const TEMPLATE_CSV = `Date,,3,6,8,10,12,14,17,19,21,24,26,28,REPOS,FORMAT,Leste initial,Note Technique,
Jour,,M,S,L,M,S,D,M,V,D,M,V,D,,,,,
Séance (A/B),,-,-,-,-,-,A,,,,,,,,,,,
Pistol Squat Assisté (chaise),LESTE (kg),5,5,5,5,,,,,,,,,2 min 30 sec,4 x 5 (par jambe),PDC,Placé en premier. Léger appui main pour l'équilibre. Focus poussée pure.,
,REP,3x5,3x5,3x5,3x5,,,,,,,,,,,,,
Tractions lestées (Pronation),LESTE (kg),5,5,5,5,,,,,,,,,3 min,5 x 4,6,"Tirage explosif, menton au-dessus de la barre. Descente freinée en 2s.",
,REP,4x6,4x6,4x6,4x6,,,,,,,,,,,,,
Tractions Australiennes,LESTE (kg),5,5,5,5,,,,,,,,,2 min,4 x 6 à 8,5,Rétraction scapulaire maximale en haut.,
,REP,3x9,3x9,3x9,3x10,,,,,,,,,,,,,
Relevés de jambes suspendu,LESTE (kg),5,5,5,5,,,,,,,,,1 min 30 sec,3 x 8 (alterné G/D),PDC,Monter les jambes lentement en pivotant légèrement le bassin de gauche à droite.,
,REP,3x9,3x9,3x9,3x10,,,,,,,,,,,,,
Pike Push-Ups (pieds surélevés),LESTE (kg),-,-,-,-,,,,,,,,,3 min,4 x 5 à 7,PDC,Pieds surélevés. Trajectoire de tête en triangle (plongeant devant les mains).,
,REP,-,-,-,-,,,,,,,,,,,,,
Dips,LESTE (kg),5,5,5,5,,,,,,,,,3 min,5 x 4,7,Casser la parallèle (épaules sous les coudes) à chaque rep.,
,REP,4x7,4x7,4x7,4x7,,,,,,,,,,,,,
Pompes Déficitaires Lestées,LESTE (kg),5,5,5,5,,,,,,,,,2 min,3 x 6 à 8,5,Mains surélevées sur supports. Descendre la poitrine sous le niveau des mains.,
,REP,3x10,3x10,3x10,3x10,,,,,,,,,,,,,
Planche Hardstyle (RKC),LESTE (kg),-,-,-,-,,,,,,,,,1 min 30 sec,3 x 30 à 45 sec,PDC,RETROVERSION DU BASSIN forcée. Serrer fessiers et abdos. Aucun creux lombaire.,
,REP,-,-,-,-,,,,,,,,,,,,,
Notes,,,,,,,,,,,,,,ÉCHAUFFEMENT,Mobilité articulaire ,2x4 tractions,2x5 dips,2x5 squats
`;

const EXERCISE_MAP = [
  { ei: 0, type: 'A' },
  { ei: 1, type: 'A' },
  { ei: 2, type: 'A' },
  { ei: 3, type: 'A' },
  { ei: 0, type: 'B' },
  { ei: 1, type: 'B' },
  { ei: 2, type: 'B' },
  { ei: 3, type: 'B' },
];

function parseCSV(text) {
  const rows = [];
  let inQuote = false;
  let cur = '';
  let row = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuote && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      row.push(cur.trim());
      cur = '';
    } else if ((ch === '\n' || (ch === '\r' && next === '\n')) && !inQuote) {
      if (ch === '\r') i++;
      row.push(cur.trim());
      cur = '';
      rows.push(row);
      row = [];
    } else {
      cur += ch;
    }
  }
  if (cur || row.length) {
    row.push(cur.trim());
    rows.push(row);
  }
  return rows;
}

function serializeCSV(rows) {
  return rows.map(row =>
    row.map(cell => {
      if (/[",\n\r]/.test(cell)) return '"' + cell.replace(/"/g, '""') + '"';
      return cell;
    }).join(',')
  ).join('\n');
}

function findContextMonth() {
  const cc = completedSessions();
  if (cc.length) {
    const last = cc[cc.length - 1];
    return last.d.slice(0, 7);
  }
  return fdISO(new Date()).slice(0, 7);
}

const DAY_SHORT = { 0: 'D', 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S' };
const METADATA_COLS = 5;

function expCSV() {
  const tRows = parseCSV(TEMPLATE_CSV);
  const ctxMonth = findContextMonth();

  const monthLogs = ss
    .filter(s => s.d.startsWith(ctxMonth))
    .sort((a, b) => a.d.localeCompare(b.d));

  if (!monthLogs.length) {
    toast('Aucune séance en ' + ctxMonth, true);
    return;
  }

  const N = monthLogs.length;
  const totalCols = 2 + N + METADATA_COLS;

  function copyRow(src, tgt) {
    tgt[0] = src[0] || '';
    tgt[1] = src[1] || '';
    for (let c = 0; c < METADATA_COLS; c++) {
      const si = src.length - METADATA_COLS + c;
      tgt[2 + N + c] = si >= 2 && si < src.length ? src[si] : '';
    }
    for (let c = 2; c < 2 + N; c++) {
      tgt[c] = '';
    }
  }

  const newRows = [];

  // Row 0: Date
  const r0 = []; r0.length = totalCols;
  copyRow(tRows[0], r0);
  monthLogs.forEach((log, i) => { r0[2 + i] = String(parseInt(log.d.slice(8, 10), 10)); });
  newRows.push(r0);

  // Row 1: Jour
  const r1 = []; r1.length = totalCols;
  copyRow(tRows[1], r1);
  monthLogs.forEach((log, i) => {
    const dw = new Date(log.d).getDay();
    r1[2 + i] = DAY_SHORT[dw] || '';
  });
  newRows.push(r1);

  // Row 2: Séance (A/B)
  const r2 = []; r2.length = totalCols;
  copyRow(tRows[2], r2);
  monthLogs.forEach((log, i) => { r2[2 + i] = log.skipped ? '-' : log.t; });
  newRows.push(r2);

  // Exercise rows
  EXERCISE_MAP.forEach((m, idx) => {
    const tLeste = tRows[3 + idx * 2];
    const tRep = tRows[4 + idx * 2];

    const lRow = []; lRow.length = totalCols;
    const rRow = []; rRow.length = totalCols;
    copyRow(tLeste, lRow);
    copyRow(tRep, rRow);

    monthLogs.forEach((log, ci) => {
      const col = 2 + ci;
      if (log.skipped) { lRow[col] = ''; rRow[col] = ''; return; }
      const lg = getExLog(log, m.ei);
      if (lg) {
        if (lg.weight !== undefined) lRow[col] = String(lg.weight);
        if (lg.performed) rRow[col] = lg.performed;
      }
    });

    newRows.push(lRow);
    newRows.push(rRow);
  });

  // Notes row
  const tNotes = tRows[tRows.length - 1];
  const nRow = []; nRow.length = totalCols;
  copyRow(tNotes, nRow);
  monthLogs.forEach((log, ci) => {
    const col = 2 + ci;
    if (log.ex) {
      const notes = log.ex.filter(e => e && e.note).map(e => e.note).join('; ');
      nRow[col] = notes || '';
    }
  });
  newRows.push(nRow);

  const csv = '\uFEFF' + serializeCSV(newRows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'Planning_Force_' + ctxMonth + '.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('CSV exporté ! (' + N + ' séances)');
}

function expCode() {
  if (!ss.length) { toast('Aucune séance à exporter', true); return; }
  try {
    const json = JSON.stringify(ss);
    const code = btoa(unescape(encodeURIComponent(json)));
    navigator.clipboard.writeText(code).then(() => {
      toast('Code copié ! Envoie-le par WhatsApp');
    }, () => {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('Code copié ! Envoie-le par WhatsApp');
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
      ss = data.sort((a, b) => a.d.localeCompare(b.d));
      save();
      updateStreak();
      closeModal();
      renderAll();
      toast('Données restaurées ! ' + ss.length + ' séances');
    } else {
      toast('Code invalide', true);
    }
  } catch(e) {
    toast('Code invalide : vérifie la copie', true);
  }
}
