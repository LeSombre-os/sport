function rStats() {
  const c = document.getElementById('sC');
  const cc = completedSessions();
  if (cc.length < 2) {
    c.innerHTML = '<div class="cd"><div class="cd-b"><div class="st-empty"><p>Pas assez de données pour les statistiques.</p><p style="font-size:.7rem;margin-top:4px;color:var(--text3)">Enregistre au moins 2 séances.</p></div></div></div>';
    return;
  }

  c.innerHTML =
    '<div class="cd st-cd"><div class="cd-h"><h2>Progression des charges</h2></div><p class="st-desc">Évolution du poids par exercice (28 derniers jours).</p><canvas id="chW"></canvas></div>' +
    '<div class="cd st-cd"><div class="cd-h"><h2>Volume par séance</h2></div><p class="st-desc">Volume total estimé (poids × répétitions) — 28 derniers jours.</p><canvas id="chV"></canvas></div>' +
    '<div class="cd st-cd"><div class="cd-h"><h2>Ressenti moyen (RPE)</h2></div><p class="st-desc">Moyenne RPE par séance — 28 derniers jours.</p><canvas id="chR"></canvas></div>';

  requestAnimationFrame(() => { drawW(); drawV(); drawR(); });
}

function setupC(id) {
  const c = document.getElementById(id);
  const rect = c.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  c.width = rect.width * dpr;
  c.height = rect.height * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);
  return { ctx, c, r: rect };
}

function recentFilter(entries) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);
  const cutoffStr = fdISO(cutoff);
  return entries.filter(e => e.d >= cutoffStr);
}

function fmtDateDDMM(dStr) {
  return dStr.slice(8, 10) + '-' + dStr.slice(5, 7);
}

function dateScalePadding(dates) {
  const min = new Date(dates[0]).getTime();
  const max = new Date(dates[dates.length - 1]).getTime();
  const range = max - min || 1;
  const extra = Math.max(range * 0.12, 86400000 * 3);
  return { paddedMin: min - extra, paddedMax: max + extra, paddedRange: (max - min) + extra * 2 };
}

function xPosDate(d, pad, cw, scale) {
  return pad + ((new Date(d).getTime() - scale.paddedMin) / scale.paddedRange) * cw;
}

const COLORS = ['#e8455b', '#4a9ac8', '#f0b848', '#7ac07a', '#b07aac', '#e8874a', '#5ab8b0', '#d06070'];

function drawW() {
  const o = setupC('chW');
  const ctx = o.ctx, W = o.r.width, H = o.r.height;
  const pad = 48, padR = 18, padT = 44, padB = 42;
  const cw = W - pad - padR, ch = H - padT - padB;

  const series = [];
  ['A', 'B'].forEach(type => {
    const sec = PR[type];
    if (!sec) return;
    sec.ex.forEach((ex, ei) => {
      const hasData = ss.some(s => s.t === type && getExLog(s, ei) && getExLog(s, ei).weight > 0);
      if (hasData) {
        series.push({ name: ex.name.split(' (')[0], key: type, idx: ei, color: COLORS[series.length % COLORS.length] });
      }
    });
  });

  const data = series.map(s => {
    const pts = [];
    recentFilter(ss).forEach(sj => {
      const lg = getExLog(sj, s.idx);
      if (sj.t === s.key && lg && lg.weight > 0) {
        pts.push({ d: sj.d, v: lg.weight });
      }
    });
    return { name: s.name, color: s.color, pts };
  });

  const allPts = data.flatMap(d => d.pts);
  if (!allPts.length) {
    ctx.fillStyle = '#8a8498'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Aucune donnée sur les 28 derniers jours', W / 2, H / 2); return;
  }

  const allDates = [...new Set(allPts.map(p => p.d))].sort();
  const scale = dateScalePadding(allDates);

  let maxW = 0;
  allPts.forEach(p => { if (p.v > maxW) maxW = p.v; });
  maxW = Math.max(maxW + 2, 4);

  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, padT); ctx.lineTo(pad, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();

  ctx.fillStyle = '#9a94a8'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right';
  const stepW = Math.max(2, Math.round(maxW / 4 / 2) * 2);
  for (let w = 0; w <= maxW; w += stepW) {
    const y = padT + ch - (w / maxW) * ch;
    ctx.fillText(w + ' kg', pad - 8, y + 6);
  }

  ctx.textAlign = 'center'; ctx.fillStyle = '#8a8498'; ctx.font = '11px sans-serif';
  allDates.forEach((d, i) => {
    if (i % Math.max(1, Math.floor(allDates.length / 5)) === 0 || i === allDates.length - 1) {
      ctx.fillText(fmtDateDDMM(d), xPosDate(d, pad, cw, scale), H - padB + 22);
    }
  });

  const legendY = 18;
  let legendX = pad;
  data.forEach(d => {
    if (!d.pts.length) return;
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.arc(legendX + 7, legendY - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8c4b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(d.name, legendX + 16, legendY);
    legendX += ctx.measureText(d.name).width + 34;
  });

  data.forEach(d => {
    if (!d.pts.length) return;
    d.pts.sort((a, b) => a.d.localeCompare(b.d));
    ctx.strokeStyle = d.color; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
    ctx.beginPath();
    d.pts.forEach((p, i) => {
      const x = xPosDate(p.d, pad, cw, scale);
      const y = padT + ch - (p.v / maxW) * ch;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    d.pts.forEach(p => {
      const x = xPosDate(p.d, pad, cw, scale);
      const y = padT + ch - (p.v / maxW) * ch;
      ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
    });
  });
}

function drawV() {
  const o = setupC('chV');
  const ctx = o.ctx, W = o.r.width, H = o.r.height;
  const pad = 48, padR = 18, padT = 28, padB = 42;
  const cw = W - pad - padR, ch = H - padT - padB;

  const vsort = recentFilter([...ss]).sort((a, b) => a.d.localeCompare(b.d));
  const vols = [];
  vsort.forEach(s => {
    const sec = PR[s.t];
    if (!sec) return;
    let vol = 0;
    sec.ex.forEach((_, ei) => {
      const lg = getExLog(s, ei);
      if (lg && lg.weight > 0 && lg.performed) {
        const parts = lg.performed.split(',').filter(p => p.trim());
        let sum = 0;
        parts.forEach(p => {
          const val = parseInt(p.trim());
          if (!isNaN(val)) sum += val;
        });
        vol += sum * lg.weight;
      }
    });
    if (vol > 0) vols.push({ d: s.d, v: vol, t: s.t });
  });
  if (!vols.length) {
    ctx.fillStyle = '#8a8498'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Aucune donnée sur les 28 derniers jours', W / 2, H / 2); return;
  }

  const volDates = vols.map(v => v.d);
  const scale = dateScalePadding(volDates);

  let maxV = 0;
  vols.forEach(v => { if (v.v > maxV) maxV = v.v; });
  maxV = Math.max(maxV * 1.1, 10);

  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, padT); ctx.lineTo(pad, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();

  ctx.fillStyle = '#9a94a8'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right';
  const step = Math.max(5, Math.round(maxV / 4 / 10) * 10);
  for (let v = 0; v <= maxV; v += step) {
    ctx.fillText(v, pad - 8, padT + ch - (v / maxV) * ch + 6);
  }

  const bw = Math.min(cw / vols.length * 0.7, 40);
  vols.forEach(v => {
    const x = xPosDate(v.d, pad, cw, scale) - bw / 2;
    const h = (v.v / maxV) * ch;
    ctx.fillStyle = v.t === 'A' ? 'rgba(90,154,170,0.85)' : 'rgba(201,149,80,0.85)';
    ctx.beginPath();
    ctx.roundRect(x, padT + ch - h, bw, h, 5);
    ctx.fill();
  });

  ctx.textAlign = 'center'; ctx.fillStyle = '#8a8498'; ctx.font = '11px sans-serif';
  vols.forEach((v, i) => {
    if (i % Math.max(1, Math.floor(vols.length / 6)) === 0 || i === vols.length - 1) {
      ctx.fillText(fmtDateDDMM(v.d), xPosDate(v.d, pad, cw, scale), H - padB + 22);
    }
  });
}

function drawR() {
  const o = setupC('chR');
  const ctx = o.ctx, W = o.r.width, H = o.r.height;
  const pad = 48, padR = 18, padT = 34, padB = 42;
  const cw = W - pad - padR, ch = H - padT - padB;

  const rsort = recentFilter([...ss]).sort((a, b) => a.d.localeCompare(b.d));
  const rpes = [];
  rsort.forEach(s => {
    if (!s.ex) return;
    const vals = [];
    s.ex.forEach(e => { if (e && e.rpe) vals.push(e.rpe); });
    if (vals.length) {
      const sum = vals.reduce((a, b) => a + b, 0);
      rpes.push({ d: s.d, v: sum / vals.length, t: s.t });
    }
  });
  if (!rpes.length) {
    ctx.fillStyle = '#8a8498'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Aucune donnée RPE sur les 28 derniers jours', W / 2, H / 2); return;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, padT); ctx.lineTo(pad, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();

  ctx.fillStyle = '#9a94a8'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right';
  for (let v = 1; v <= 5; v++) {
    ctx.fillText(v, pad - 8, padT + ch - ((v - 1) / 4) * ch + 6);
  }

  const sA = rpes.filter(r => r.t === 'A');
  const sB = rpes.filter(r => r.t === 'B');
  const allRPE = [...sA, ...sB].sort((a, b) => a.d.localeCompare(b.d));
  const rpeDates = allRPE.map(r => r.d);
  const scale = dateScalePadding([...new Set(rpeDates)].sort());
  const cols = ['#5a9aaa', '#c99550'];

  [sA, sB].forEach((arr, si) => {
    if (!arr.length) return;
    arr.sort((a, b) => a.d.localeCompare(b.d));
    ctx.strokeStyle = cols[si]; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
    ctx.beginPath();
    arr.forEach((p, i) => {
      const x = xPosDate(p.d, pad, cw, scale);
      const y = padT + ch - ((p.v - 1) / 4) * ch;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    arr.forEach(p => {
      const x = xPosDate(p.d, pad, cw, scale);
      const y = padT + ch - ((p.v - 1) / 4) * ch;
      ctx.fillStyle = cols[si]; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
    });
    ctx.fillStyle = cols[si]; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Séance ' + (si === 0 ? 'A' : 'B'), pad + cw * (si + 0.5) / 2, 16);
  });

  ctx.textAlign = 'center'; ctx.fillStyle = '#8a8498'; ctx.font = '11px sans-serif';
  const uniqueRpeDates = [...new Set(allRPE.map(r => r.d))].sort();
  const step = Math.max(1, Math.floor(uniqueRpeDates.length / 5));
  uniqueRpeDates.forEach((d, i) => {
    if (i % step === 0 || i === uniqueRpeDates.length - 1) {
      ctx.fillText(fmtDateDDMM(d), xPosDate(d, pad, cw, scale), H - padB + 22);
    }
  });
}
