// Pagina F1 di "La mia app". Tutto quello che riguarda la F1 sta in questo file:
// per toglierla basta togliere <script src="f1.js"> da index.html e il dataset f1.
// ---- Tabelle ricavate dal file unico f1 ----
const TITOLI = {
  info: 'F1, stato dei dati', sessioni: 'F1, calendario sessioni', piloti: 'F1, classifica piloti', costruttori: 'F1, classifica costruttori',
  risultato: 'F1, risultato ultima sessione', giri: 'F1, posizioni giro per giro', gomme: 'F1, stint e gomme', pit: 'F1, pit stop',
  direzione: 'F1, messaggi direzione gara', meteo: 'F1, meteo ultima sessione', pista: 'F1, tracciato prossimo GP', vincitori: 'F1, vincitori delle gare',
};
dash.calc('f1_info', { inputs: ['f1'], title: TITOLI.info, description: 'Le righe "info" del file F1: quando è stato aggiornato e quali sessioni mostra.', fn: (f1) => f1.filter((r) => r.tabella === 'info') });
dash.calc('f1_sessioni', { inputs: ['f1'], title: TITOLI.sessioni, description: 'Le righe "sessioni" del file F1 (OpenF1): tutte le sessioni dell\'anno.', fn: (f1) => f1.filter((r) => r.tabella === 'sessioni') });
dash.calc('f1_piloti', { inputs: ['f1'], title: TITOLI.piloti, description: 'Le righe "piloti" del file F1 (Jolpica).', fn: (f1) => f1.filter((r) => r.tabella === 'piloti') });
dash.calc('f1_costruttori', { inputs: ['f1'], title: TITOLI.costruttori, description: 'Le righe "costruttori" del file F1 (Jolpica).', fn: (f1) => f1.filter((r) => r.tabella === 'costruttori') });
dash.calc('f1_risultato', { inputs: ['f1'], title: TITOLI.risultato, description: 'Le righe "risultato" del file F1 (OpenF1), con il giro migliore di ogni pilota.', fn: (f1) => f1.filter((r) => r.tabella === 'risultato') });
dash.calc('f1_giri', { inputs: ['f1'], title: TITOLI.giri, description: 'Le righe "giri" del file F1 (OpenF1): posizione a fine giro e tempo.', fn: (f1) => f1.filter((r) => r.tabella === 'giri') });
dash.calc('f1_gomme', { inputs: ['f1'], title: TITOLI.gomme, description: 'Le righe "gomme" del file F1 (OpenF1): uno stint per riga.', fn: (f1) => f1.filter((r) => r.tabella === 'gomme') });
dash.calc('f1_pit', { inputs: ['f1'], title: TITOLI.pit, description: 'Le righe "pit" del file F1 (OpenF1): tempo in corsia box.', fn: (f1) => f1.filter((r) => r.tabella === 'pit') });
dash.calc('f1_direzione', { inputs: ['f1'], title: TITOLI.direzione, description: 'Le righe "direzione" del file F1 (OpenF1), numerate in ordine di tempo.', fn: (f1) => f1.filter((r) => r.tabella === 'direzione').map((r, i) => ({ ...r, n: i })) });
dash.calc('f1_vincitori', { inputs: ['f1'], title: TITOLI.vincitori, description: 'Le righe "vincitori" del file F1 (Jolpica): chi ha vinto ogni gara già corsa quest\'anno.', fn: (f1) => f1.filter((r) => r.tabella === 'vincitori') });
dash.calc('f1_meteo', { inputs: ['f1'], title: TITOLI.meteo, description: 'La riga "meteo" del file F1 (OpenF1): ultimo dato della sessione.', fn: (f1) => f1.filter((r) => r.tabella === 'meteo') });
dash.calc('f1_quote', { inputs: ['f1'], title: 'F1, quote sul vincitore', description: 'Le righe "quote" del file F1: probabilità di vittoria per pilota secondo ogni fonte (bookmaker della rete Kambi e Polymarket), già senza margine.', fn: (f1) => f1.filter((r) => r.tabella === 'quote') });
dash.calc('f1_quote_media', {
  inputs: ['f1_quote'], title: 'F1, probabilità media di vittoria', description: 'Per ogni pilota, la media delle probabilità date dalle fonti che lo quotano (pilota riconosciuto dal cognome, senza Jr./Sr.), in ordine decrescente.',
  fn: (f1_quote) => {
    const fonti = [...new Set(f1_quote.map((r) => r.fonte))];
    const chiave = (n) => String(n).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s,]+(jr|sr)\.?$/i, '').trim().split(/\s+/).pop().toLowerCase();
    const per = {};
    f1_quote.forEach((r) => { const k = chiave(r.pilota); (per[k] = per[k] || { pilota: r.pilota, fonti: {} }).fonti[r.fonte] = r.prob; });
    // media solo sulle fonti che quotano il pilota (se manca in una fonte non vale 0)
    const media = (p) => { const v = fonti.map((f) => p.fonti[f]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
    return Object.values(per).map((p) => ({ pilota: p.pilota, prob: media(p), ...Object.fromEntries(fonti.map((f) => ['p_' + f, p.fonti[f] ?? null])), n_fonti: fonti.length }))
      .sort((a, b) => b.prob - a.prob);
  },
});
dash.calc('f1_albo', { inputs: ['f1'], title: "F1, albo d'oro del prossimo circuito", description: 'Le righe "albo" del file F1 (Jolpica): i vincitori delle ultime edizioni sul circuito del prossimo GP, dalla più recente.', fn: (f1) => f1.filter((r) => r.tabella === 'albo') });
dash.calc('f1_pista', { inputs: ['f1'], title: TITOLI.pista, description: 'Le righe "pista" del file F1 (MultiViewer): punti del tracciato e curve.', fn: (f1) => f1.filter((r) => r.tabella === 'pista') });

(() => {
  const root = document.getElementById('dash-root') || document;
  const sv = root.querySelector('.sv');
  const nav = root.querySelector('.sv-nav');
  if (!sv || !nav) return;
  const MOTO = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: no-preference)').matches : true;

  // ---- Stile ----
  const css = document.createElement('style');
  css.textContent = `
.sv.f1-on > :not(.sv-head, .sv-nav, #f1) { display: none; }
.sv:not(.f1-on) > #f1 { display: none; }
.sv-nav a.f1-tab { font-weight: var(--cds-font-weight-medium); }
/* colore della pagina F1 (STILE.md §1): la scheda F1 aperta diventa rossa come la pillola delle altre pagine */
.sv { --f1-red: var(--acc-f1, #E10600); }
.sv-nav a.f1-tab { transition: background var(--cds-dur-slow), color var(--cds-dur-slow), border-color var(--cds-dur-slow), box-shadow var(--cds-dur-slow); }
.sv-nav a.f1-tab[aria-current] { background: var(--f1-red); color: #fff; border-color: var(--f1-red); box-shadow: 0 4px 14px -6px var(--f1-red); }
#f1 { display: grid; gap: var(--cds-gap-md); }
.f1-card h2::before { content: ""; display: inline-block; width: 4px; height: .95em; border-radius: 2px; background: var(--f1-red); margin-right: 8px; vertical-align: -2px; }
.f1-sub { display: flex; gap: 4px; padding: 4px; background: var(--color-panel); border: 1px solid var(--color-border-line); border-radius: 999px; overflow-x: auto; scrollbar-width: none; }
.f1-sub::-webkit-scrollbar { display: none; }
.f1-sub button { flex: 1 0 auto; font: inherit; font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); background: none; border: 0; border-radius: 999px; padding: 6px 12px; cursor: pointer; transition: background var(--cds-dur-slow), color var(--cds-dur-slow); }
.f1-sub button[aria-selected=true] { background: var(--color-fg); color: var(--color-bg); }
.f1-pane { display: grid; gap: var(--cds-gap-md); }
.f1-pane[hidden] { display: none; }
.f1-card { background: var(--color-panel); border: 1px solid var(--color-border-line); border-radius: var(--cds-radius); padding: var(--cds-pad-lg); display: grid; gap: var(--cds-gap-md); min-width: 0; }
.f1-card h2 { font-size: var(--cds-font-size-heading); font-weight: var(--cds-font-weight-medium); margin: 0; }
.f1-card h3 { font-size: var(--cds-font-size-body); font-weight: var(--cds-font-weight-medium); margin: 0; }
.f1-hero { position: relative; overflow: hidden; }
.f1-hero::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: linear-gradient(90deg, var(--f1-red) 0 60%, var(--color-fg) 60% 62%, transparent 62%); }
.f1-kicker { font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); text-transform: uppercase; letter-spacing: .08em; }
.f1-big { font-family: var(--font-anthropic-serif); font-weight: 400; font-size: var(--cds-font-size-title); line-height: 1.15; margin: 2px 0 0; text-wrap: balance; }
.f1-clock { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--cds-gap-xs); }
.f1-clock div { display: grid; justify-items: center; gap: 2px; padding: var(--cds-pad-sm) 0; border-radius: var(--cds-radius); background: var(--color-bg); border: 1px solid var(--color-border-line); }
.f1-clock b { font-family: var(--font-anthropic-serif); font-weight: 400; font-size: 2rem; line-height: 1; font-variant-numeric: tabular-nums; }
.f1-clock span { font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); }
.f1-live { display: flex; align-items: center; gap: var(--cds-gap-xs); font-family: var(--font-anthropic-serif); font-size: 2rem; }
.f1-live::before { content: ""; width: .7rem; height: .7rem; border-radius: 50%; background: var(--f1-red); }
.f1-tl { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.f1-tl li { display: grid; grid-template-columns: 10px 1fr auto; gap: var(--cds-gap-sm); align-items: center; padding: 7px 0; position: relative; }
.f1-tl li::before { content: ""; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--cds-chart-muted); background: var(--color-panel); box-sizing: border-box; z-index: 1; }
.f1-tl li:not(:last-child)::after { content: ""; position: absolute; left: 4px; top: 50%; height: 100%; width: 2px; background: var(--cds-chart-grid); }
.f1-tl .t { white-space: nowrap; }
.f1-tl li.past { color: var(--color-fg-muted); }
.f1-tl li.past::before { background: var(--cds-chart-muted); }
.f1-tl li.now { font-weight: var(--cds-font-weight-medium); }
.f1-tl li.now::before { border-color: var(--f1-red); background: var(--f1-red); }
.f1-tl .t { font-variant-numeric: tabular-nums; color: var(--color-fg-muted); font-size: var(--cds-font-size-caption); text-align: right; }
.f1-chart { position: relative; min-height: 6rem; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; touch-action: pan-y; }
.f1-chart * { -webkit-user-select: none; user-select: none; }
.f1-chart svg { display: block; overflow: visible; }
.f1-tip { position: absolute; background: var(--cds-surface-popover); border: 1px solid var(--cds-border); border-radius: var(--cds-radius); box-shadow: var(--cds-shadow-popover); padding: var(--cds-pad-xs) var(--cds-pad-sm); font-size: var(--cds-font-size-caption); pointer-events: none; white-space: nowrap; z-index: 2; }
.f1-tip .h { color: var(--cds-text-secondary); }
.f1-podio { display: grid; grid-template-columns: 1fr 1.1fr 1fr; align-items: end; gap: var(--cds-gap-xs); }
.f1-podio > div { display: grid; justify-items: center; gap: 4px; text-align: center; min-width: 0; }
.f1-podio .n { font-weight: var(--cds-font-weight-medium); font-size: var(--cds-font-size-body); }
.f1-podio .s { font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.f1-podio .blk { width: 100%; border-radius: var(--cds-radius) var(--cds-radius) 0 0; display: flex; align-items: flex-start; justify-content: center; padding-top: 6px; font-family: var(--font-anthropic-serif); font-size: 1.6rem; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.35); transform-origin: bottom; }
.f1-list { display: grid; gap: 0; }
.f1-row { display: grid; grid-template-columns: 2rem 1fr auto; gap: var(--cds-gap-sm); align-items: center; padding: 8px 0; border-bottom: 1px solid var(--color-border-line); }
.f1-row:last-child { border-bottom: 0; }
.f1-row .p { font-family: var(--font-anthropic-serif); font-size: 1.15rem; font-variant-numeric: tabular-nums; text-align: center; }
.f1-row .who { display: grid; gap: 3px; min-width: 0; border-left: 3px solid var(--cds-chart-muted); padding-left: var(--cds-pad-sm); }
.f1-row .who b { font-weight: var(--cds-font-weight-medium); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.f1-row .who small { font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); }
.f1-row .v { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.f1-row .v small { display: block; font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); }
.f1-bar { height: 5px; border-radius: 999px; background: var(--cds-chart-grid); overflow: hidden; }
.f1-bar i { display: block; height: 100%; border-radius: 999px; width: 0; transition: width 900ms var(--cds-ease-out); }
.f1-meteo { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--cds-gap-xs); }
.f1-meteo div { display: grid; gap: 2px; justify-items: center; padding: var(--cds-pad-sm) 0; border-radius: var(--cds-radius); background: var(--color-bg); border: 1px solid var(--color-border-line); }
.f1-meteo .k { font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); }
.f1-meteo .v { font-size: var(--cds-font-size-heading); font-variant-numeric: tabular-nums; }
.f1-legend > span { display: inline-flex; align-items: center; }
.f1-legend { display: flex; flex-wrap: wrap; gap: var(--cds-gap-xs) var(--cds-gap-md); font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); }
.f1-sw { display: inline-block; width: .8rem; height: .8rem; border-radius: 50%; margin-right: 4px; vertical-align: -2px; border: 1px solid var(--color-border-line); }
.f1-flag { display: inline-block; font-size: var(--cds-font-size-caption); border-radius: 999px; padding: 0 var(--cds-pad-xs); margin-right: var(--cds-gap-xs); border: 1px solid currentColor; }
.f1-msg { display: grid; grid-template-columns: 3rem 1fr; gap: var(--cds-gap-sm); padding: 8px 0; border-bottom: 1px solid var(--color-border-line); }
.f1-msg:last-child { border-bottom: 0; }
.f1-msg .g { font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); font-variant-numeric: tabular-nums; }
.f1-msg .m { font-size: var(--cds-font-size-body); }
.f1-msg .m::first-letter { text-transform: uppercase; }
.f1-msg .m b { font-weight: var(--cds-font-weight-medium); }
.f1-msg .m small { display: block; color: var(--color-fg-muted); font-size: var(--cds-font-size-caption); }
.f1-dir-sum { display: flex; flex-wrap: wrap; gap: var(--cds-gap-xs); }
.f1-dir-sum span { font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); border: 1px solid var(--color-border-line); border-radius: 999px; padding: 2px 10px; font-variant-numeric: tabular-nums; }
.f1-avviso { display: flex; align-items: flex-start; gap: var(--cds-gap-sm); padding: var(--cds-pad-sm) var(--cds-pad-md); background: var(--color-panel); border: 1px solid var(--color-border-line); border-radius: var(--cds-radius); font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); }
.f1-avviso[hidden] { display: none; }
.f1-avviso::before { content: ""; flex: none; width: .5rem; height: .5rem; margin-top: .3rem; border-radius: 50%; background: var(--color-warn); }
.f1-avviso.live::before { background: var(--f1-red); }
.f1-avviso b { color: var(--color-fg); font-weight: var(--cds-font-weight-medium); }
.f1-cal .f1-row .vince { display: block; font-size: var(--cds-font-size-caption); color: var(--color-fg); }
.f1-more { font: inherit; font-size: var(--cds-font-size-caption); color: var(--color-fg); background: none; border: 1px solid var(--color-border-line); border-radius: 999px; padding: 4px 12px; justify-self: start; cursor: pointer; }
.f1-sel { font: inherit; font-size: var(--cds-font-size-caption); color: var(--color-fg); background: var(--color-panel); border: 1px solid var(--color-border-line); border-radius: 999px; padding: 4px 10px; }
.f1-btn { display: inline-block; text-decoration: none; color: #fff; background: var(--f1-red); border-radius: 999px; padding: var(--cds-pad-sm) var(--cds-pad-lg); font-size: var(--cds-font-size-body); font-weight: var(--cds-font-weight-medium); }
.f1-cal .f1-row { grid-template-columns: 2rem 1fr auto; }
.f1-cal .f1-row.past { opacity: .5; }
.f1-cal .f1-row.next .p { color: #fff; background: var(--f1-red); border-radius: 50%; width: 2rem; height: 2rem; display: grid; place-items: center; font-size: 1rem; }
.f1-note { color: var(--color-fg-muted); font-size: var(--cds-font-size-caption); margin: 0; }
.f1-line { display: flex; flex-wrap: wrap; gap: var(--cds-gap-xs) var(--cds-gap-md); align-items: center; justify-content: space-between; }
.f1-fail { display: flex; align-items: center; justify-content: center; gap: var(--cds-gap-xs); color: var(--color-fg-muted); font-size: var(--cds-font-size-caption); min-height: 4rem; }
.f1-fail::before { content: ""; width: .375rem; height: .375rem; border-radius: 50%; background: var(--color-bad); }
.f1-sub { position: relative; }
.f1-sub button { position: relative; z-index: 1; }
.f1-sub.pill button[aria-selected=true] { background: none; }
.f1-pill { position: absolute; top: 4px; bottom: 4px; left: 0; border-radius: 999px; background: var(--color-fg); pointer-events: none; }
.f1-start { position: relative; display: grid; justify-items: center; gap: 10px; padding: 16px 12px 12px; color: #fff; border-radius: var(--cds-radius); background: radial-gradient(120% 90% at 50% 30%, #262626, #070707 75%); max-height: 260px; overflow: hidden; transition: opacity 500ms ease, max-height 600ms ease, padding 600ms ease, margin 600ms ease, background 400ms; }
.f1-start.out { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; margin-bottom: calc(-1 * var(--cds-gap-md)); }
.f1-start-x { position: absolute; top: 6px; right: 8px; font: inherit; font-size: 14px; color: rgba(255,255,255,.6); background: none; border: 0; padding: 6px; cursor: pointer; }
.f1-gantry { --d: min(30px, 7vw); display: flex; gap: min(8px, 1.8vw); padding: min(10px, 2vw); background: linear-gradient(#1b1b1b, #0c0c0c); border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.6), inset 0 0 0 2px #2a2a2a; }
.f1-gantry .pod { display: grid; gap: min(6px, 1.4vw); padding: min(6px, 1.4vw); background: #000; border-radius: 8px; box-shadow: inset 0 0 0 1px #1d1d1d; }
.f1-gantry i { display: block; width: var(--d); height: var(--d); border-radius: 50%; background: #161616; box-shadow: inset 0 3px 8px rgba(0,0,0,.9); transition: background 40ms, box-shadow 40ms; }
.f1-gantry i.r { background: #2b0505; }
.f1-gantry .pod.on i.r { background: radial-gradient(circle at 38% 32%, #ff8a7a, #ff1e00 45%, #a00400 100%); box-shadow: 0 0 12px 3px rgba(255,30,0,.8), 0 0 36px 10px color-mix(in srgb, var(--f1-red) 35%, transparent); }
.f1-start-t { font-family: var(--font-anthropic-serif); font-size: 1.25rem; min-height: 1.3em; text-align: center; line-height: 1.2; }
.f1-start.via { background: radial-gradient(120% 90% at 50% 30%, #3a0c08, #070707 75%); }
.f1-hero > * { position: relative; z-index: 1; }
.f1-streaks { position: absolute !important; inset: 0; z-index: 0 !important; pointer-events: none; overflow: hidden; }
.f1-streaks i { position: absolute; left: -40%; height: 2px; width: 36%; border-radius: 2px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--f1-red) 22%, transparent)); opacity: 0; }
.f1-actions { display: flex; flex-wrap: wrap; gap: var(--cds-gap-xs); }
.f1-clock { perspective: 400px; }
.f1-clock.soon b { color: var(--f1-red); }
.f1-tag { display: inline-block; font-size: var(--cds-font-size-caption); border-radius: 999px; padding: 0 7px; margin-left: 6px; line-height: 1.5; vertical-align: 1px; }
.f1-tag.fl { background: #8E44AD; color: #fff; }
.f1-tag.su { color: var(--color-ok); }
.f1-tag.giu { color: var(--color-bad); }
.f1-tyre { display: inline-grid; place-items: center; width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 3px solid var(--c); background: #1d1d1d; color: #fff; font-size: 10px; font-weight: 700; margin-right: 5px; vertical-align: -5px; box-sizing: border-box; }
.f1-podio { position: relative; }
.f1-podio .cup { font-size: 1.3rem; line-height: 1; }
.f1-conf { position: absolute; left: 50%; top: 40%; width: 7px; height: 11px; border-radius: 2px; pointer-events: none; }
.f1-race { display: grid; gap: 4px; }
.f1-race .f1-bar { height: 8px; position: relative; overflow: visible; background: var(--cds-chart-grid); }
.f1-race .f1-bar b { position: absolute; top: 0; bottom: 0; border-radius: 999px; opacity: .3; }
.f1-race .f1-bar u { position: absolute; top: -4px; bottom: -4px; width: 2px; background: var(--color-fg); border-radius: 1px; }
.f1-big-n { font-family: var(--font-anthropic-serif); font-size: 2rem; line-height: 1; }
.f1-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--cds-gap-xs); }
.f1-stats div { display: grid; gap: 2px; justify-items: center; padding: var(--cds-pad-sm) 0; border-radius: var(--cds-radius); background: var(--color-bg); border: 1px solid var(--color-border-line); text-align: center; }
.f1-stats .k { font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); }
.f1-duel { display: grid; gap: 4px; padding: 8px 0; border-bottom: 1px solid var(--color-border-line); }
.f1-duel:last-child { border-bottom: 0; }
.f1-duel .nomi { display: flex; justify-content: space-between; gap: var(--cds-gap-sm); font-size: var(--cds-font-size-caption); }
.f1-duel .nomi b { font-weight: var(--cds-font-weight-medium); }
.f1-duel .nomi span:last-child { text-align: right; }
.f1-duel .split { display: flex; height: 8px; border-radius: 999px; overflow: hidden; gap: 2px; }
.f1-duel .split i { display: block; height: 100%; transition: flex-grow 900ms var(--cds-ease-out); }
.f1-duel .team { font-size: var(--cds-font-size-caption); color: var(--color-fg-muted); text-align: center; }
@media (prefers-reduced-motion: no-preference) {
  .f1-pane.enter > .f1-card { animation: f1-in 520ms var(--cds-ease-out) both; }
  .f1-pane.enter > .f1-card:nth-child(2) { animation-delay: 70ms; }
  .f1-pane.enter > .f1-card:nth-child(3) { animation-delay: 140ms; }
  .f1-pane.enter > .f1-card:nth-child(4) { animation-delay: 210ms; }
  .f1-pill { transition: transform 380ms cubic-bezier(.3,1.35,.5,1), width 380ms cubic-bezier(.3,1.35,.5,1); }
  .f1-hero::after { content: ""; position: absolute; top: 0; left: 0; height: 4px; width: 30%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent); animation: f1-sweep 3.2s ease-in-out infinite; }
  .f1-tl li.now::before { animation: f1-ring 1.8s ease-out infinite; }
  .f1-cal .f1-row.next .p { animation: f1-ring 1.8s ease-out infinite; }
  .f1-row, .f1-btn, .f1-more, .f1-sub button { transition: transform 140ms var(--cds-ease-out), background var(--cds-dur-slow), color var(--cds-dur-slow); }
  .f1-row:active, .f1-btn:active, .f1-more:active, .f1-sub button:active { transform: scale(.97); }
  .f1-btn { animation: f1-glow 2.6s ease-in-out infinite; }
  .f1-streaks i { animation: f1-streak var(--t, 2.6s) linear infinite; animation-delay: var(--d, 0s); }
  .f1-clock.soon div { animation: f1-glow 1.6s ease-in-out infinite; }
  .f1-anim .f1-tyre { animation: f1-spin 900ms cubic-bezier(.2,.8,.3,1) both; }
  .f1-tag.fl { animation: f1-pop 500ms cubic-bezier(.3,1.6,.5,1) 600ms both; }
  .f1-start.via .f1-start-t { animation: f1-pop 450ms cubic-bezier(.3,1.6,.5,1) both; }
  .f1-podio.f1-anim .cup { animation: f1-pop 600ms cubic-bezier(.3,1.6,.5,1) 900ms both; }
  .f1-conf { animation: f1-conf 1.3s cubic-bezier(.2,.7,.4,1) both; animation-delay: var(--d, 0ms); }
  .f1-meteo div, .f1-clock div { transition: transform 200ms; }
  .f1-anim .f1-duel, .f1-anim.f1-stats div { animation: f1-up 420ms var(--cds-ease-out) both; animation-delay: calc(var(--i, 0) * 50ms); }
  .f1-anim.f1-meteo div { animation: f1-up 420ms var(--cds-ease-out) both; animation-delay: calc(var(--i, 0) * 60ms); }
  .f1-anim .f1-row, .f1-anim.f1-tl li, .f1-anim .f1-msg { animation: f1-up 420ms var(--cds-ease-out) both; animation-delay: calc(var(--i, 0) * 35ms); }
  .f1-podio.f1-anim .blk { animation: f1-rise 700ms var(--cds-ease-out) both; animation-delay: calc(var(--i, 0) * 120ms + 100ms); }
  .f1-tick { display: inline-block; transform-origin: 50% 60%; animation: f1-tick 450ms cubic-bezier(.2,.8,.3,1.2); }
  .f1-live::before { animation: f1-pulse 1.4s ease-in-out infinite; }
  .f1-avviso.enter, .f1-arr { animation: f1-in 420ms var(--cds-ease-out) both; }
  .f1-avviso.live::before { animation: f1-pulse 1.4s ease-in-out infinite; }
}
@keyframes f1-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes f1-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes f1-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes f1-tick { from { transform: rotateX(-90deg); opacity: .2; } to { transform: none; opacity: 1; } }
@keyframes f1-streak { 0% { transform: translateX(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateX(420%); opacity: 0; } }
@keyframes f1-spin { from { transform: rotate(-540deg) scale(.4); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes f1-pulse { 50% { opacity: .25; } }
@keyframes f1-sweep { 0% { transform: translateX(-100%); } 60%, 100% { transform: translateX(340%); } }
@keyframes f1-ring { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--f1-red) 55%, transparent); } 70%, 100% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--f1-red) 0%, transparent); } }
@keyframes f1-glow { 50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--f1-red) 18%, transparent); } }
@keyframes f1-pop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
@keyframes f1-fold { to { opacity: 0; max-height: 0; padding: 0; margin-bottom: calc(-1 * var(--cds-gap-md)); } }
@keyframes f1-conf { 0% { opacity: 1; transform: translate(-50%, 0) rotate(0); } 100% { opacity: 0; transform: translate(calc(-50% + var(--x)), var(--y)) rotate(var(--r)); } }
`;
  root.append(css);

  // ---- Struttura ----
  const tab = document.createElement('a');
  tab.href = '#f1';
  tab.className = 'f1-tab';
  tab.textContent = 'F1';
  nav.append(tab);

  const page = document.createElement('div');
  page.id = 'f1';
  sv.append(page);
  const PANNELLI = [['weekend', 'Weekend'], ['mondiale', 'Mondiale'], ['gara', 'Ultima gara'], ['strategia', 'Strategia'], ['calendario', 'Calendario']];
  const tpl = document.createElement('template');
  tpl.innerHTML = `
  <div class="f1-sub" role="tablist" aria-label="Sezioni F1">${PANNELLI.map(([k, t]) => `<button type="button" role="tab" id="f1-t-${k}" data-pane="${k}" aria-selected="false">${t}</button>`).join('')}</div>
  <div class="f1-avviso" id="f1-avviso" role="status" data-source="f1_info f1_sessioni" hidden></div>

  <div class="f1-pane" id="f1-weekend" data-pane="weekend" hidden>
    <section class="f1-card f1-hero" id="f1-prossimo">
      <div>
        <div class="f1-kicker" id="f1-round" data-source="f1_sessioni">Prossimo weekend</div>
        <p class="f1-big" id="f1-gp" data-source="f1_info">—</p>
        <div class="f1-note" id="f1-luogo" data-source="f1_sessioni"></div>
      </div>
      <div><div class="f1-note" id="f1-next-lbl">—</div></div>
      <div id="f1-count" aria-live="off"></div>
      <ol class="f1-tl" id="f1-sessioni-wk" data-source="f1_sessioni"></ol>
      <div class="f1-actions"><button type="button" class="f1-more" id="f1-replay">🚦 Rivedi la partenza</button></div>
    </section>
    <section class="f1-card" id="f1-pronostico">
      <div class="f1-line"><h2>Chi vince?</h2><span class="f1-note" id="f1-quote-gara" data-source="f1_quote"></span></div>
      <p class="f1-note">Probabilità di vittoria secondo le quote: media tra bookmaker e mercato di previsione.</p>
      <div class="f1-list" id="f1-quote" data-source="f1_quote_media f1_risultato"></div>
      <p class="f1-note" id="f1-quote-fonti" data-source="f1_quote"></p>
    </section>
    <section class="f1-card" id="f1-circuito">
      <div class="f1-line"><h2 id="f1-circ-tit">Il circuito</h2><span class="f1-note">curve numerate</span></div>
      <div class="f1-chart" id="f1-pista" data-source="f1_pista f1_info" style="min-height:10rem"></div>
    </section>
    <section class="f1-card" id="f1-albo-card">
      <div class="f1-line"><h2>Albo d'oro</h2><span class="f1-note" id="f1-albo-circ" data-source="f1_albo"></span></div>
      <div class="f1-list" id="f1-albo" data-source="f1_albo f1_risultato"></div>
    </section>
    <section class="f1-card" id="f1-onboard">
      <h2>Onboard e diretta</h2>
      <p class="f1-note">Le camere a bordo si vedono solo nelle app ufficiali: da qui le apri con un tocco.</p>
      <div><a class="f1-btn" href="https://f1tv.formula1.com/" target="_blank" rel="noopener">Apri F1 TV</a></div>
    </section>
  </div>

  <div class="f1-pane" id="f1-mondiale" data-pane="mondiale" hidden>
    <section class="f1-card" id="f1-titolo">
      <div class="f1-line"><h2>Corsa al titolo</h2><span class="f1-note">punti ancora in palio</span></div>
      <div class="f1-stats" id="f1-titolo-n" data-source="f1_sessioni f1_piloti"></div>
      <p class="f1-note" id="f1-titolo-frase" data-source="f1_sessioni f1_piloti"></p>
      <div class="f1-list" id="f1-titolo-lista" data-source="f1_sessioni f1_piloti f1_risultato"></div>
      <p class="f1-note">Barra piena: punti di oggi. Parte chiara: il massimo che possono ancora fare. Linea: il leader.</p>
    </section>
    <section class="f1-card" id="f1-classifica">
      <div class="f1-line"><h2>Mondiale piloti</h2><span class="f1-note" id="f1-agg" data-source="f1_info"></span></div>
      <div class="f1-list" id="f1-piloti" data-source="f1_piloti f1_risultato"></div>
    </section>
    <section class="f1-card" id="f1-costr">
      <h2>Costruttori</h2>
      <div class="f1-list" id="f1-costruttori" data-source="f1_costruttori f1_risultato"></div>
    </section>
    <section class="f1-card" id="f1-compagni">
      <h2>Sfida tra compagni</h2>
      <p class="f1-note">Come si dividono i punti i due piloti di ogni squadra.</p>
      <div id="f1-duelli" data-source="f1_piloti f1_risultato"></div>
    </section>
  </div>

  <div class="f1-pane" id="f1-gara" data-pane="gara" hidden>
    <section class="f1-card" id="f1-ultima">
      <div><div class="f1-kicker" id="f1-ult-data" data-source="f1_info">Ultima sessione</div><p class="f1-big" id="f1-ult-tit" data-source="f1_info">—</p></div>
      <div class="f1-podio" id="f1-podio" data-source="f1_risultato"></div>
      <div class="f1-meteo" id="f1-meteo" data-source="f1_meteo"></div>
      <div class="f1-list" id="f1-ris" data-source="f1_risultato f1_giri"></div>
      <p class="f1-note" id="f1-ris-nota">In viola il giro più veloce.</p>
    </section>
    <section class="f1-card" id="f1-direzione">
      <div class="f1-line"><h2>Direzione gara</h2><span class="f1-note" id="f1-dir-tipo"></span></div>
      <div class="f1-dir-sum" id="f1-dir-sum" data-source="f1_direzione"></div>
      <div class="f1-list" id="f1-dir" data-source="f1_direzione f1_risultato"></div>
      <button type="button" class="f1-more" id="f1-dir-more" hidden>Mostra tutti i messaggi</button>
    </section>
  </div>

  <div class="f1-pane" id="f1-strategia" data-pane="strategia" hidden>
    <p class="f1-note" id="f1-str-gara"></p>
    <section class="f1-card" id="f1-posizioni">
      <div class="f1-line"><h2>Posizioni giro per giro</h2><select class="f1-sel" id="f1-pick" aria-label="Pilota da evidenziare"></select></div>
      <p class="f1-note">Colorati il podio e il pilota scelto. Tocca il grafico per leggere un giro.</p>
      <div class="f1-chart" id="f1-lapchart" data-source="f1_giri f1_risultato" style="min-height:20rem"></div>
    </section>
    <section class="f1-card" id="f1-gomme">
      <h2>Strategia gomme</h2>
      <div class="f1-legend" id="f1-leg" data-source="f1_gomme"></div>
      <div class="f1-chart" id="f1-stints" data-source="f1_gomme f1_risultato" style="min-height:20rem"></div>
      <p class="f1-note">Tocca la riga di un pilota per vedere mescola e giri.</p>
    </section>
    <section class="f1-card" id="f1-box">
      <h2>Pit stop</h2>
      <div class="f1-list" id="f1-pit" data-source="f1_pit f1_risultato"></div>
    </section>
  </div>

  <div class="f1-pane" id="f1-calendario" data-pane="calendario" hidden>
    <section class="f1-card f1-cal" id="f1-cal-card">
      <h2>Calendario gare</h2>
      <p class="f1-note">Per le gare già corse c'è il vincitore.</p>
      <div class="f1-list" id="f1-cal" data-source="f1_sessioni f1_vincitori f1_risultato"></div>
    </section>
  </div>`;

  // ---- Formati ----
  const TZ = 'Europe/Rome';
  const NOMI = { 'Practice 1': 'Libere 1', 'Practice 2': 'Libere 2', 'Practice 3': 'Libere 3', 'Qualifying': 'Qualifiche', 'Sprint Qualifying': 'Qualifiche sprint', 'Sprint Shootout': 'Qualifiche sprint', 'Sprint': 'Sprint', 'Race': 'Gara', 'Day 1': 'Test giorno 1', 'Day 2': 'Test giorno 2', 'Day 3': 'Test giorno 3' };
  const nome = (s) => NOMI[s] || s;
  // Nome breve e nome lungo di ogni GP in italiano (se manca: il nome inglese senza "Grand Prix")
  const GPIT = {
    'Pre-Season Testing': ['Test invernali', 'Test invernali'], 'Australian Grand Prix': ['Australia', "GP d'Australia"], 'Chinese Grand Prix': ['Cina', 'GP della Cina'],
    'Japanese Grand Prix': ['Giappone', 'GP del Giappone'], 'Bahrain Grand Prix': ['Bahrein', 'GP del Bahrein'], 'Saudi Arabian Grand Prix': ['Arabia Saudita', "GP dell'Arabia Saudita"],
    'Miami Grand Prix': ['Miami', 'GP di Miami'], 'Emilia Romagna Grand Prix': ['Emilia-Romagna', "GP dell'Emilia-Romagna"], 'Canadian Grand Prix': ['Canada', 'GP del Canada'],
    'Monaco Grand Prix': ['Monaco', 'GP di Monaco'], 'Barcelona Grand Prix': ['Barcellona', 'GP di Barcellona'], 'Spanish Grand Prix': ['Spagna', 'GP di Spagna'],
    'Austrian Grand Prix': ['Austria', "GP d'Austria"], 'British Grand Prix': ['Gran Bretagna', 'GP di Gran Bretagna'], 'Belgian Grand Prix': ['Belgio', 'GP del Belgio'],
    'Hungarian Grand Prix': ['Ungheria', "GP d'Ungheria"], 'Dutch Grand Prix': ['Olanda', "GP d'Olanda"], 'Italian Grand Prix': ['Italia', "GP d'Italia"],
    'Azerbaijan Grand Prix': ['Azerbaigian', "GP dell'Azerbaigian"], 'Singapore Grand Prix': ['Singapore', 'GP di Singapore'], 'United States Grand Prix': ['Stati Uniti', 'GP degli Stati Uniti'],
    'Mexico City Grand Prix': ['Città del Messico', 'GP di Città del Messico'], 'São Paulo Grand Prix': ['San Paolo', 'GP di San Paolo'], 'Las Vegas Grand Prix': ['Las Vegas', 'GP di Las Vegas'],
    'Qatar Grand Prix': ['Qatar', 'GP del Qatar'], 'Abu Dhabi Grand Prix': ['Abu Dhabi', 'GP di Abu Dhabi'],
  };
  const GP = (s) => (GPIT[s] || [])[0] || String(s || '').replace(/ Grand Prix$/, '').trim();
  const gpLungo = (s) => (GPIT[s] || [])[1] || String(s || '').replace('Grand Prix', 'GP').trim();
  const LUOGHI = { 'Mexico City': 'Città del Messico', 'São Paulo': 'San Paolo', 'Miami Gardens': 'Miami', 'Barcelona': 'Barcellona', 'Jeddah': 'Gedda', 'Bahrain': 'Bahrein', 'Monte Carlo': 'Montecarlo', 'Montréal': 'Montréal' };
  const luogo = (l) => LUOGHI[l] || l;
  const PAESI = { 'United States': 'Stati Uniti', 'Mexico': 'Messico', 'Brazil': 'Brasile', 'Qatar': 'Qatar', 'United Arab Emirates': 'Emirati Arabi', 'Australia': 'Australia', 'China': 'Cina', 'Japan': 'Giappone', 'Bahrain': 'Bahrein', 'Saudi Arabia': 'Arabia Saudita', 'Italy': 'Italia', 'Monaco': 'Monaco', 'Spain': 'Spagna', 'Canada': 'Canada', 'Austria': 'Austria', 'United Kingdom': 'Regno Unito', 'Great Britain': 'Regno Unito', 'Belgium': 'Belgio', 'Hungary': 'Ungheria', 'Netherlands': 'Paesi Bassi', 'Azerbaijan': 'Azerbaigian', 'Singapore': 'Singapore', 'Malaysia': 'Malesia' };
  const paese = (p) => PAESI[p] || p;
  const quando = (iso, conGiorno = true) => new Date(iso).toLocaleString('it-IT', { timeZone: TZ, ...(conGiorno ? { weekday: 'short', day: 'numeric', month: 'short' } : {}), hour: '2-digit', minute: '2-digit' });
  const giornoMese = (iso) => new Date(iso).toLocaleDateString('it-IT', { timeZone: TZ, day: 'numeric', month: 'long' });
  const tempo = (s) => { if (s == null) return '—'; const m = Math.floor(s / 60); const r = s - m * 60; return (m ? m + ':' + (r < 10 ? '0' : '') : '') + r.toFixed(3); };
  const punti = (x) => (x == null ? '—' : x.toLocaleString('it-IT', { maximumFractionDigits: 1 }));
  const MESCOLE = { SOFT: ['Soft', '#E8002D'], MEDIUM: ['Medium', '#FFD12E'], HARD: ['Hard', '#F0F0EC'], INTERMEDIATE: ['Intermedia', '#43B02A'], WET: ['Pioggia', '#0067AD'] };
  const gomma = (c) => { const g = el('span', 'f1-tyre', (c || '?')[0]); g.style.setProperty('--c', mescola(c)[1]); if (c === 'HARD') g.style.color = '#fff'; return g; };
  const mescola = (c) => MESCOLE[c] || [c ? c.toLowerCase() : 'sconosciuta', 'var(--cds-chart-muted)'];

  // ---- Utilità ----
  const $ = (s) => page.querySelector(s);
  const ok = (id) => dash.data(id).status === 'ok';
  const rows = (id) => (ok(id) ? dash.data(id).data || [] : []);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const visti = new Set(); // animazioni già fatte: un box si anima solo la prima volta che ha dati
  const primaVolta = (box) => { if (visti.has(box.id)) return false; visti.add(box.id); return MOTO; };
  // Mostra il segnaposto finché i dati non ci sono; true se il box non va disegnato
  function attesa(box, ids) {
    const st = ids.map((id) => dash.data(id).status);
    box.classList.toggle('dash-skeleton', st.includes('loading'));
    if (st.every((s) => s === 'ok')) return false;
    box.replaceChildren();
    if (!st.includes('loading')) box.append(el('div', 'f1-fail', 'Non caricato'));
    return true;
  }
  function anima(box) { box.classList.remove('f1-anim'); if (primaVolta(box)) { void box.offsetWidth; box.classList.add('f1-anim'); } }
  const colori = () => { const m = {}; rows('f1_risultato').forEach((r) => { m[r.sigla] = r.colore; m['team:' + r.team] = r.colore; }); return m; };
  const coloreTeam = (col, t) => col['team:' + t] || col[Object.keys(col).find((k) => k.startsWith('team:') && t && (k.slice(5).includes(t) || t.includes(k.slice(5))))] || '';
  function rigaLista(pos, titolo, sotto, valore, valoreSotto, colore, i) {
    const r = el('div', 'f1-row');
    r.style.setProperty('--i', i);
    r.append(el('div', 'p', pos));
    const who = el('div', 'who');
    if (colore) who.style.borderLeftColor = colore;
    who.append(el('b', '', titolo));
    if (sotto != null) who.append(sotto instanceof Node ? sotto : el('small', '', sotto));
    r.append(who);
    const v = el('div', 'v', valore);
    if (valoreSotto) v.append(el('small', '', valoreSotto));
    r.append(v);
    return r;
  }
  function barra(frac, colore, animare) {
    const b = el('div', 'f1-bar');
    const i = el('i');
    i.style.background = colore || 'var(--cds-chart-muted)';
    b.append(i);
    const w = Math.max(0, Math.min(1, frac)) * 100 + '%';
    if (animare) requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = w; }));
    else { i.style.transition = 'none'; i.style.width = w; }
    return b;
  }
  // Numero che sale da 0 al valore (testo del primo nodo di .v)
  function conta(riga, valore, fmt, ritardo = 0) {
    const nodo = riga.querySelector('.v').firstChild;
    if (!MOTO || !nodo || !(valore > 0)) return;
    const fine = nodo.textContent;
    nodo.textContent = fmt(0);
    const t0 = performance.now() + ritardo;
    const passo = (t) => {
      const k = Math.min(1, Math.max(0, (t - t0) / 900));
      nodo.textContent = k < 1 ? fmt(valore * (1 - Math.pow(1 - k, 3))) : fine;
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }
  // Coriandoli nei colori dei team del podio
  function coriandoli(box, colori) {
    for (let i = 0; i < 28; i++) {
      const c = el('i', 'f1-conf');
      const a = Math.PI * (1.1 + Math.random() * 0.8);
      const v = 70 + Math.random() * 90;
      c.style.background = colori[i % colori.length] || 'var(--f1-red)';
      c.style.setProperty('--x', Math.cos(a) * v * 1.4 + 'px');
      c.style.setProperty('--y', Math.sin(a) * v + 60 + 'px');
      c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      c.style.setProperty('--d', 950 + Math.random() * 150 + 'ms');
      box.append(c);
    }
    setTimeout(() => box.querySelectorAll('.f1-conf').forEach((c) => c.remove()), 2600);
  }
  // Col dito il riquadro resta finché non si tocca fuori dal grafico (sull'iPhone pointerleave arriva subito dopo il tocco)
  const fuoriFatti = new WeakSet();
  function fuori(box, poi) {
    if (fuoriFatti.has(box)) return;
    fuoriFatti.add(box);
    document.addEventListener('pointerdown', (ev) => { if (!box.contains(ev.target)) { togliTip(box); if (poi) poi(); } }, true);
  }
  function tip(box, righe, x, y) {
    let t = box.querySelector('.f1-tip');
    if (!t) { t = el('div', 'f1-tip'); box.append(t); }
    t.replaceChildren(...righe);
    const w = t.offsetWidth;
    t.style.left = Math.max(0, Math.min(box.clientWidth - w, x - w / 2)) + 'px';
    t.style.top = Math.max(0, y - t.offsetHeight - 10) + 'px';
  }
  const togliTip = (box) => { const t = box.querySelector('.f1-tip'); if (t) t.remove(); };
  const asse = (g) => { g.attr('font-size', null).attr('font-family', null); g.selectAll('text').attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)'); g.selectAll('line,path').attr('stroke', 'var(--cds-chart-axis)'); };

  // ---- Weekend ----
  let prossima = null;
  function drawWeekend() {
    const info = rows('f1_info')[0];
    const lista = $('#f1-sessioni-wk');
    prossima = null;
    if (attesa(lista, ['f1_sessioni'])) { tick(); return; }
    lista.replaceChildren();
    const adesso = new Date().toISOString();
    const tutte = rows('f1_sessioni').filter((s) => !s.annullata);
    prossima = tutte.find((s) => s.fine >= adesso) || null;
    if (!prossima) { $('#f1-gp').textContent = '—'; $('#f1-next-lbl').textContent = 'La stagione è finita'; tick(); return; }
    $('#f1-gp').textContent = gpLungo(prossima.gp);
    $('#f1-round').textContent = prossima.round ? 'Round ' + prossima.round + ' · prossimo weekend' : 'Prossimo weekend';
    $('#f1-luogo').textContent = luogo(prossima.luogo) + ', ' + paese(prossima.paese);
    $('#f1-circ-tit').textContent = 'Il circuito di ' + luogo(prossima.luogo);
    tutte.filter((s) => s.gp === prossima.gp && s.luogo === prossima.luogo).forEach((s, i) => {
      const li = el('li', s.fine < adesso ? 'past' : s === prossima ? 'now' : '');
      li.style.setProperty('--i', i);
      li.dataset.key = String(s.chiave);
      li.append(el('span', '', nome(s.sessione)), el('span', 't', quando(s.inizio)));
      lista.append(li);
    });
    anima(lista);
    tick();
  }
  let ultimiNumeri = [];
  function tick() {
    const lbl = $('#f1-next-lbl');
    const out = $('#f1-count');
    if (!lbl || !out) return;
    if (!prossima) { out.replaceChildren(); return; }
    // Sessione finita: si passa alla prossima (e si ridisegna il weekend, che può essere un altro GP)
    if (new Date(prossima.fine) < Date.now()) { const prima = prossima.gp; DISEGNO.weekend(); if (prossima && prossima.gp !== prima) visti.delete('f1-pista'); return; }
    const ms = new Date(prossima.inizio) - Date.now();
    if (ms <= 0) {
      lbl.textContent = nome(prossima.sessione) + ' è iniziata';
      if (!out.querySelector('.f1-live')) out.replaceChildren(el('div', 'f1-live', 'In corso'));
      return;
    }
    lbl.textContent = nome(prossima.sessione) + ' tra';
    const n = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
    const nomi = ['giorni', 'ore', 'min', 'sec'];
    let clock = out.querySelector('.f1-clock');
    if (!clock) {
      clock = el('div', 'f1-clock');
      nomi.forEach((k) => { const d = el('div'); d.append(el('b', '', '—'), el('span', '', k)); clock.append(d); });
      out.replaceChildren(clock);
      ultimiNumeri = [];
    }
    clock.classList.toggle('soon', ms < 36e5);
    clock.querySelectorAll('b').forEach((b, i) => {
      const t = String(n[i]).padStart(i ? 2 : 1, '0');
      if (ultimiNumeri[i] === t) return;
      b.textContent = t;
      if (MOTO && ultimiNumeri.length) { b.classList.remove('f1-tick'); void b.offsetWidth; b.classList.add('f1-tick'); }
    });
    ultimiNumeri = n.map((x, i) => String(x).padStart(i ? 2 : 1, '0'));
  }

  // Pista, albo e quote arrivano dall'ultimo aggiornamento dei dati: dopo una gara possono essere ancora del GP appena corso
  function inArrivo(box) {
    const info = rows('f1_info')[0];
    if (!prossima || !info || !info.prossima_gp || info.prossima_gp === prossima.gp) return false;
    box.replaceChildren(el('p', 'f1-note' + (primaVolta({ id: box.id + '-arr' }) ? ' f1-arr' : ''), 'In arrivo con il prossimo aggiornamento dei dati'));
    return true;
  }
  function drawPista() {
    const box = $('#f1-pista');
    if (attesa(box, ['f1_pista', 'f1_info'])) return;
    if (inArrivo(box)) return;
    box.replaceChildren();
    const pts = rows('f1_pista');
    const linea = pts.filter((p) => p.tipo === 'p').sort((a, b) => a.n - b.n);
    if (!linea.length) { box.append(el('p', 'f1-note', 'Tracciato non disponibile')); return; }
    const rot = ((rows('f1_info')[0] || {}).rotazione || 0) * Math.PI / 180;
    const ruota = (p) => ({ ...p, x: p.x * Math.cos(rot) - p.y * Math.sin(rot), y: -(p.x * Math.sin(rot) + p.y * Math.cos(rot)) });
    const L = linea.map(ruota);
    const C = pts.filter((p) => p.tipo === 'c').map(ruota);
    const W = box.clientWidth || 320;
    const pad = 18;
    const xs = d3.extent(L, (p) => p.x), ys = d3.extent(L, (p) => p.y);
    const H = Math.max(160, Math.min(320, (W - 2 * pad) * (ys[1] - ys[0]) / (xs[1] - xs[0]) + 2 * pad));
    const k = Math.min((W - 2 * pad) / (xs[1] - xs[0]), (H - 2 * pad) / (ys[1] - ys[0]));
    const ox = (W - k * (xs[1] - xs[0])) / 2, oy = (H - k * (ys[1] - ys[0])) / 2;
    const X = (p) => ox + (p.x - xs[0]) * k, Y = (p) => oy + (p.y - ys[0]) * k;
    const d = d3.line().x(X).y(Y)(L) + 'Z';
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Tracciato del prossimo Gran Premio');
    svg.append('path').attr('d', d).attr('fill', 'none').attr('stroke', 'var(--cds-chart-grid)').attr('stroke-width', 10).attr('stroke-linejoin', 'round');
    const traccia = svg.append('path').attr('id', 'f1-track-path').attr('d', d).attr('fill', 'none').attr('stroke', 'var(--color-fg)').attr('stroke-width', 3).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
    // Traguardo
    svg.append('rect').attr('x', X(L[0]) - 7).attr('y', Y(L[0]) - 2).attr('width', 14).attr('height', 4).attr('rx', 1).style('fill', 'var(--f1-red)');
    const cx = d3.mean(L, X), cy = d3.mean(L, Y);
    const fuori = (p, ax) => { const dx = X(p) - cx, dy = Y(p) - cy, d = Math.hypot(dx, dy) || 1; return ax === 'x' ? X(p) + dx / d * 11 : Y(p) + dy / d * 11; };
    svg.selectAll('text.c').data(C).join('text').attr('x', (p) => fuori(p, 'x')).attr('y', (p) => fuori(p, 'y')).attr('dy', '0.35em').attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-fg-muted)').style('font-size', '10px').text((p) => p.n);
    const animare = primaVolta(box);
    if (animare) {
      const len = traccia.node().getTotalLength();
      traccia.attr('stroke-dasharray', len).attr('stroke-dashoffset', len).transition().duration(1800).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)
        .on('end', () => traccia.attr('stroke-dasharray', null));
    }
    if (MOTO) {
      // Una "macchina" che gira sul tracciato
      [[0.32, 3, 0.25], [0.16, 4, 0.5]].forEach(([dietro, r, op]) => {
        const s = svg.append('circle').attr('r', r).style('fill', 'var(--f1-red)').attr('opacity', op);
        s.append('animateMotion').attr('dur', '9s').attr('repeatCount', 'indefinite').attr('begin', ((animare ? 1.8 : 0) + dietro) + 's').append('mpath').attr('href', '#f1-track-path');
      });
      const auto = svg.append('circle').attr('r', 5).style('fill', 'var(--f1-red)').attr('stroke', 'var(--color-panel)').attr('stroke-width', 2);
      const am = auto.append('animateMotion').attr('dur', '9s').attr('repeatCount', 'indefinite').attr('rotate', 'auto').attr('begin', animare ? '1.8s' : '0s');
      am.append('mpath').attr('href', '#f1-track-path');
    }
  }

  // ---- Pronostico dalle quote ----
  function drawQuote() {
    const box = $('#f1-quote');
    const q = rows('f1_quote');
    $('#f1-quote-gara').textContent = q[0] ? (prossima ? gpLungo(prossima.gp) : q[0].gara.replace(/ \d{4}$/, '')) : '';
    if (attesa(box, ['f1_quote_media', 'f1_risultato'])) return;
    if (inArrivo(box)) { $('#f1-quote-gara').textContent = ''; $('#f1-quote-fonti').textContent = ''; return; }
    box.replaceChildren();
    const media = rows('f1_quote_media').slice(0, 3);
    const fonti = [...new Set(q.map((r) => r.fonte))];
    $('#f1-quote-fonti').textContent = fonti.length ? 'Fonti: ' + fonti.join(' e ') + '. I siti della rete Kambi (Unibet, Paf, LeoVegas, ATG, Svenska Spel, in vari paesi) hanno le stesse quote, quindi contano come una sola fonte.' : '';
    if (!media.length) { box.append(el('p', 'f1-note', 'Quote non ancora disponibili per questa gara')); return; }
    const col = colori();
    const cognome = (n) => String(n).split(' ').pop().toLowerCase();
    const team = {};
    rows('f1_risultato').forEach((r) => { team[cognome(r.pilota || '')] = r; });
    const animare = !visti.has(box.id);
    const perc = (x) => (x == null ? '—' : Math.round(x * 100) + '%');
    media.forEach((m, i) => {
      const t = team[cognome(m.pilota)] || {};
      const sotto = el('div');
      sotto.style.display = 'grid'; sotto.style.gap = '4px';
      sotto.append(el('small', '', fonti.map((f) => (f.startsWith('Book') ? 'bookmaker ' : 'Polymarket ') + perc(m['p_' + f])).join(' · ')), barra(m.prob, t.colore || col[t.sigla], animare && MOTO));
      const r = rigaLista(String(i + 1), m.pilota, sotto, perc(m.prob), 'media', t.colore, i);
      r.dataset.key = m.pilota;
      box.append(r);
      if (animare) conta(r, m.prob, perc, i * 35);
    });
    anima(box);
  }

  // ---- Mondiale ----
  function drawMondiale() {
    const info = rows('f1_info')[0];
    $('#f1-agg').textContent = info ? 'aggiornato ' + quando(info.aggiornato) : '';
    const col = colori();
    const bp = $('#f1-piloti');
    if (!attesa(bp, ['f1_piloti', 'f1_risultato'])) {
      bp.replaceChildren();
      const ps = rows('f1_piloti');
      const max = d3.max(ps, (p) => p.punti) || 1;
      const animare = !visti.has(bp.id);
      ps.forEach((p, i) => {
        const c = coloreTeam(col, p.team) || col[p.sigla];
        const sotto = el('div');
        sotto.style.display = 'grid'; sotto.style.gap = '4px';
        sotto.append(el('small', '', p.team), barra(p.punti / max, c, animare && MOTO));
        const gap = i ? '−' + punti(ps[0].punti - p.punti) : (p.vittorie ? p.vittorie + ' vittorie' : '');
        const r = rigaLista(p.pos == null ? '—' : String(p.pos), p.pilota, sotto, punti(p.punti) + ' pt', gap, c, i);
        r.dataset.key = p.sigla;
        bp.append(r);
        if (animare && i < 12) conta(r, p.punti, (x) => punti(Math.round(x)) + ' pt', i * 35);
      });
      anima(bp);
    }
    const bc = $('#f1-costruttori');
    if (!attesa(bc, ['f1_costruttori', 'f1_risultato'])) {
      bc.replaceChildren();
      const cs = rows('f1_costruttori');
      const max = d3.max(cs, (c) => c.punti) || 1;
      const animare = !visti.has(bc.id);
      cs.forEach((c, i) => {
        const colr = coloreTeam(col, c.team);
        const sotto = el('div');
        sotto.style.display = 'grid'; sotto.style.gap = '4px';
        sotto.append(el('small', '', c.vittorie ? c.vittorie + (c.vittorie === 1 ? ' vittoria' : ' vittorie') : 'nessuna vittoria'), barra(c.punti / max, colr, animare && MOTO));
        const r = rigaLista(c.pos == null ? '—' : String(c.pos), c.team, sotto, punti(c.punti) + ' pt', i ? '−' + punti(cs[0].punti - c.punti) : '', colr, i);
        r.dataset.key = c.team;
        bc.append(r);
        if (animare) conta(r, c.punti, (x) => punti(Math.round(x)) + ' pt', i * 35);
      });
      anima(bc);
    }
  }

  // ---- Albo d'oro del prossimo circuito ----
  function drawAlbo() {
    const box = $('#f1-albo');
    if (attesa(box, ['f1_albo', 'f1_risultato'])) return;
    if (inArrivo(box)) { $('#f1-albo-circ').textContent = ''; return; }
    box.replaceChildren();
    const a = rows('f1_albo');
    $('#f1-albo-circ').textContent = a[0] ? a[0].circuito : '';
    if (!a.length) { box.append(el('p', 'f1-note', 'Nessun dato sulle edizioni passate')); return; }
    const col = colori();
    a.forEach((r, i) => {
      const c = coloreTeam(col, r.team) || col[r.sigla];
      const via = r.griglia === 1 ? 'dalla pole' : r.griglia ? 'partito ' + r.griglia + '°' : '';
      box.append(rigaLista(String(r.anno).slice(2), r.pilota, r.team, via, '', c, i));
      box.lastChild.querySelector('.p').textContent = "'" + String(r.anno).slice(2);
      box.lastChild.dataset.key = String(r.anno);
    });
    anima(box);
  }

  // ---- Corsa al titolo ----
  function drawTitolo() {
    const n = $('#f1-titolo-n'), frase = $('#f1-titolo-frase'), box = $('#f1-titolo-lista');
    if (attesa(box, ['f1_sessioni', 'f1_piloti', 'f1_risultato'])) { n.replaceChildren(); frase.textContent = ''; return; }
    box.replaceChildren(); n.replaceChildren();
    const adesso = new Date().toISOString();
    // In palio: ogni gara o sprint non ancora contata nella classifica (anche se in corso o appena finita)
    const fino = (rows('f1_info')[0] || {}).classifica_data;
    const future = rows('f1_sessioni').filter((s) => !s.annullata && (fino ? s.inizio.slice(0, 10) > fino : s.inizio >= adesso));
    const gare = future.filter((s) => s.sessione === 'Race').length;
    const sprint = future.filter((s) => s.sessione === 'Sprint').length;
    const palio = gare * 25 + sprint * 8;
    const primaGara = future.find((s) => s.sessione === 'Race');
    const prossimoMax = primaGara ? 25 + (future.some((s) => s.sessione === 'Sprint' && s.gp === primaGara.gp) ? 8 : 0) : 0;
    const ps = rows('f1_piloti').filter((p) => p.punti != null);
    if (!ps.length) return;
    const capo = ps[0];
    [[gare, gare === 1 ? 'gara' : 'gare'], [sprint, sprint === 1 ? 'sprint' : 'sprint'], [palio, 'punti in palio']].forEach(([v, k], i) => {
      const d = el('div'); d.style.setProperty('--i', i); d.append(el('span', 'f1-big-n', String(v)), el('span', 'k', k)); n.append(d);
    });
    const vivi = ps.filter((p) => p.punti + palio >= capo.punti);
    const vant = ps[1] ? capo.punti - ps[1].punti : 0;
    const cogn = (p) => p.pilota.split(' ').pop();
    if (!palio) frase.textContent = 'Il campionato è finito: ' + capo.pilota + ' è campione del mondo.';
    else if (vivi.length === 1) frase.textContent = capo.pilota + ' è già campione del mondo: nessuno può più raggiungerlo.';
    else frase.textContent = cogn(capo) + ' ha ' + punti(vant) + ' punti su ' + cogn(ps[1]) + '. Diventa campione quando il vantaggio supera i punti rimasti in palio' + (vant + prossimoMax > palio - prossimoMax ? ': può succedere già al prossimo weekend.' : '.') + ' ' + (vivi.length === 2 ? 'Solo in due' : 'In ' + vivi.length) + ' possono ancora vincere il titolo.';
    const col = colori();
    const max = d3.max(vivi, (p) => p.punti + palio) || 1;
    const animare = !visti.has(box.id);
    vivi.slice(0, 6).forEach((p, i) => {
      const c = coloreTeam(col, p.team) || col[p.sigla] || 'var(--cds-chart-muted)';
      const sotto = el('div', 'f1-race');
      const b = barra(p.punti / max, c, animare && MOTO);
      const extra = el('b'); extra.style.background = c; extra.style.left = (p.punti / max * 100) + '%'; extra.style.width = (palio / max * 100) + '%';
      const linea = el('u'); linea.style.left = (capo.punti / max * 100) + '%';
      b.append(extra, linea);
      sotto.append(el('small', '', 'al massimo ' + punti(p.punti + palio) + ' pt'), b);
      const r = rigaLista(String(p.pos), p.pilota, sotto, punti(p.punti) + ' pt', i ? '−' + punti(capo.punti - p.punti) : 'leader', c, i);
      r.dataset.key = p.sigla;
      box.append(r);
    });
    anima(box);
    anima(n);
  }

  // ---- Sfida tra compagni ----
  function drawCompagni() {
    const box = $('#f1-duelli');
    if (attesa(box, ['f1_piloti', 'f1_risultato'])) return;
    box.replaceChildren();
    const col = colori();
    const animare = !visti.has(box.id) && MOTO;
    const squadre = d3.groups(rows('f1_piloti'), (p) => p.team).filter(([, ps]) => ps.length >= 2);
    squadre.sort((a, b) => d3.sum(b[1], (p) => p.punti) - d3.sum(a[1], (p) => p.punti));
    squadre.forEach(([team, ps], i) => {
      const [a, b] = ps.slice().sort((x, y) => y.punti - x.punti);
      const c = coloreTeam(col, team) || col[a.sigla] || 'var(--cds-chart-muted)';
      const d = el('div', 'f1-duel');
      d.style.setProperty('--i', i);
      d.dataset.key = team;
      const nomi = el('div', 'nomi');
      const lato = (p) => { const s = el('span'); s.append(el('b', '', p.pilota.split(' ').pop()), document.createTextNode(' ' + punti(p.punti))); return s; };
      nomi.append(lato(a), lato(b));
      const split = el('div', 'split');
      const ia = el('i'), ib = el('i');
      ia.style.background = c; ib.style.background = c; ib.style.opacity = '.35';
      const tot = a.punti + b.punti;
      const fa = tot ? a.punti / tot : 0.5, fb = 1 - fa;
      if (animare) { ia.style.flexGrow = .5; ib.style.flexGrow = .5; requestAnimationFrame(() => requestAnimationFrame(() => { ia.style.flexGrow = fa || 0.001; ib.style.flexGrow = fb || 0.001; })); }
      else { ia.style.flexGrow = fa || 0.001; ib.style.flexGrow = fb || 0.001; }
      split.append(ia, ib);
      d.append(nomi, split, el('div', 'team', team + ' · ' + (tot ? Math.round(fa * 100) + '% contro ' + Math.round(fb * 100) + '%' : 'ancora a zero punti')));
      box.append(d);
    });
    anima(box);
  }

  // ---- Ultima gara ----
  const BANDIERE = { GREEN: ['verde', 'var(--color-ok)'], YELLOW: ['gialla', 'var(--color-warn)'], 'DOUBLE YELLOW': ['doppia gialla', 'var(--color-warn)'], RED: ['rossa', 'var(--color-bad)'], CHEQUERED: ['scacchi', 'var(--color-fg)'], BLUE: ['blu', 'var(--color-fg-muted)'], CLEAR: ['libera', 'var(--color-ok)'], 'BLACK AND WHITE': ['bianconera', 'var(--color-fg)'] };
  let tuttiMessaggi = false;
  // Messaggi della direzione gara tradotti: [etichetta, colore, testo, sotto, importante, gruppo]
  const MOTIVI = [
    [/LEAVING THE TRACK AND GAINING AN ADVANTAGE/, 'fuori pista con vantaggio'], [/CAUSING A COLLISION/, 'ha causato una collisione'], [/MULTIPLE TRACK LIMITS|TRACK LIMITS/, 'limiti della pista'],
    [/SPEEDING IN THE PIT LANE|PIT LANE SPEEDING/, 'velocità in corsia box'], [/UNSAFE RELEASE/, 'uscita pericolosa dal box'], [/FORCING ANOTHER DRIVER OFF THE TRACK/, 'ha spinto un altro fuori pista'],
    [/IMPEDING/, 'ha ostacolato un pilota'], [/FALSE START|JUMP START/, 'partenza anticipata'], [/OVERTAKING UNDER (SC|SAFETY CAR|VSC)/, 'sorpasso in regime di safety car'],
    [/OVERTAKING UNDER YELLOW|YELLOW FLAG/, 'non ha rispettato la bandiera gialla'], [/ERRATIC DRIVING|DANGEROUS DRIVING/, 'guida pericolosa'], [/STARTING PROCEDURE INFRINGEMENT/, 'errore nella procedura di partenza'],
    [/MOVING UNDER BRAKING/, 'spostamento in frenata'], [/PIT ENTRY|PIT EXIT LINE/, "linea d'ingresso o uscita box"],
  ];
  const motivo = (t) => { const m = MOTIVI.find(([re]) => re.test(t)); return m ? m[1] : ''; };
  const ITA = [
    [/^GREEN LIGHT - PIT EXIT OPEN/, () => ['verde', 'var(--color-ok)', 'Semaforo verde: uscita box aperta', '', true, '']],
    [/^PIT EXIT CLOSED/, () => ['', '', 'Uscita box chiusa', '', false, '']],
    [/^PIT EXIT OPEN/, () => ['', '', 'Uscita box aperta', '', false, '']],
    [/^(DOUBLE )?YELLOW IN TRACK SECTOR (\d+)/, (m) => [m[1] ? 'doppia gialla' : 'gialla', 'var(--color-warn)', 'Settore ' + m[2], '', false, 'gialle']],
    [/^CLEAR IN TRACK SECTOR (\d+)/, (m) => ['libera', 'var(--color-ok)', 'Settore ' + m[1] + ' di nuovo libero', '', false, 'gialle']],
    [/^TRACK CLEAR/, () => ['libera', 'var(--color-ok)', 'Pista libera', '', true, '']],
    [/^RISK OF RAIN FOR (?:THE )?F1 (\w+) IS (\d+%)/, (m) => ['', '', 'Rischio pioggia ' + m[2], '', false, '']],
    [/^OVERTAKE (ENABLED|DISABLED)/, (m) => ['', '', m[1] === 'ENABLED' ? 'Modalità sorpasso attiva' : 'Modalità sorpasso spenta', '', false, '']],
    [/^DRS (ENABLED|DISABLED)/, (m) => ['', '', m[1] === 'ENABLED' ? 'DRS attivo' : 'DRS spento', '', false, '']],
    [/^SESSION STARTED/, () => ['', '', 'Inizia la sessione', '', true, '']],
    [/^SESSION FINISHED/, () => ['', '', 'Fine della sessione', '', true, '']],
    [/^RACE START/, () => ['', '', 'Partenza della gara', '', true, '']],
    [/^MARSHALS ON TRACK AT TURN (\d+)/, (m) => ['', '', 'Commissari in pista alla curva ' + m[1], '', false, '']],
    [/^TRACK SURFACE SLIPPERY (?:IN TRACK SECTOR|AT TURN) (\d+)/, (m) => ['', '', 'Pista scivolosa ' + (/SECTOR/.test(m[0]) ? 'nel settore ' : 'alla curva ') + m[1], '', false, '']],
    [/^VSC DEPLOYED|^VIRTUAL SAFETY CAR DEPLOYED/, () => ['VSC', 'var(--color-warn)', 'Virtual safety car', 'tutti rallentano', true, '']],
    [/^VSC ENDING|^VIRTUAL SAFETY CAR ENDING/, () => ['VSC', 'var(--color-ok)', 'Finisce la virtual safety car', '', true, '']],
    [/^SAFETY CAR DEPLOYED/, () => ['safety car', 'var(--color-warn)', 'Entra la safety car', '', true, '']],
    [/^SAFETY CAR IN THIS LAP/, () => ['safety car', 'var(--color-ok)', 'La safety car rientra in questo giro', '', true, '']],
    [/^RED FLAG/, () => ['rossa', 'var(--color-bad)', 'Bandiera rossa: sessione sospesa', '', true, '']],
    [/^CHEQUERED FLAG/, () => ['scacchi', 'var(--color-fg)', 'Bandiera a scacchi', '', true, '']],
    [/^WAVED BLUE FLAG FOR CAR \d+ \((\w+)\)/, (m, n) => ['blu', 'var(--color-fg-muted)', 'Bandiera blu per ' + n(m[1]), 'deve lasciar passare chi lo doppia', false, 'blu']],
    [/^BLACK AND WHITE FLAG FOR CAR \d+ \((\w+)\)/, (m, n) => ['bianconera', 'var(--color-fg)', 'Ultimo avviso a ' + n(m[1]), motivo(m.input), true, '']],
    [/^CAR \d+ \((\w+)\) (TIME [\d:.]+|LAP) DELETED.*?AT TURN (\d+)(?: LAP (\d+))?/, (m, n) => ['', '', (m[2] === 'LAP' ? 'Giro cancellato a ' : 'Tempo cancellato a ') + n(m[1]), 'limiti della pista alla curva ' + m[3] + (m[4] ? ', giro ' + m[4] : ''), false, 'limiti']],
    [/PENALTY SERVED - (\d+) SECOND TIME PENALTY FOR CAR \d+ \((\w+)\)/, (m, n) => ['', '', n(m[2]) + ' ha scontato la penalità di ' + m[1] + ' secondi', '', true, '']],
    [/PENALTY SERVED.*?CAR \d+ \((\w+)\)/, (m, n) => ['', '', n(m[1]) + ' ha scontato la penalità', '', true, '']],
    [/(\d+) SECOND TIME PENALTY FOR CAR \d+ \((\w+)\)/, (m, n) => ['penalità', 'var(--color-bad)', m[1] + ' secondi di penalità a ' + n(m[2]), motivo(m.input), true, '']],
    [/DRIVE THROUGH PENALTY FOR CAR \d+ \((\w+)\)/, (m, n) => ['penalità', 'var(--color-bad)', 'Drive through per ' + n(m[1]), motivo(m.input), true, '']],
    [/STOP AND GO PENALTY FOR CAR \d+ \((\w+)\)/, (m, n) => ['penalità', 'var(--color-bad)', 'Stop and go per ' + n(m[1]), motivo(m.input), true, '']],
    [/(?:(\d+) PLACE )?GRID PENALTY FOR CAR \d+ \((\w+)\)/, (m, n) => ['penalità', 'var(--color-bad)', (m[1] ? m[1] + ' posizioni di penalità in griglia a ' : 'Penalità in griglia a ') + n(m[2]), motivo(m.input), true, '']],
    [/(?:REPRIMAND|WARNING) FOR CAR \d+ \((\w+)\)/, (m, n) => ['richiamo', 'var(--color-warn)', 'Richiamo a ' + n(m[1]), motivo(m.input), true, '']],
    [/CAR \d+ \((\w+)\) DISQUALIFIED/, (m, n) => ['squalifica', 'var(--color-bad)', n(m[1]) + ' squalificato', motivo(m.input), true, '']],
    [/^(?:FIA STEWARDS: )?(?:TURN (\d+) )?INCIDENT INVOLVING CARS? (.*?) (NOTED|UNDER INVESTIGATION|NO FURTHER ACTION|REVIEWED NO FURTHER INVESTIGATION|WILL BE INVESTIGATED AFTER THE (?:RACE|SESSION))/, (m, n) => {
      const chi = [...m[2].matchAll(/\((\w+)\)/g)].map((x) => n(x[1])).join(' e ');
      const dove = m[1] ? ' alla curva ' + m[1] : '';
      const mot = motivo(m.input);
      if (m[3] === 'NOTED') return ['', '', 'Episodio' + dove + ': ' + chi, 'segnalato ai commissari' + (mot ? ' · ' + mot : ''), false, 'episodi'];
      if (/NO FURTHER/.test(m[3])) return ['ok', 'var(--color-ok)', 'Nessuna penalità per ' + chi, mot, true, ''];
      return ['indagine', 'var(--color-warn)', 'Indagine su ' + chi + dove, mot + (/AFTER/.test(m[3]) ? (mot ? ' · ' : '') + 'dopo la gara' : ''), true, ''];
    }],
    [/^ALL PASS HOLDERS MAY ACCESS THE PIT LANE/, () => ['', '', 'Corsia box aperta al pubblico', '', false, '']],
  ];
  function traduci(r, nomi) {
    const t = String(r.messaggio || '').toUpperCase().replace(/\s*\(?\d{1,2}:\d{2}:\d{2}\)?/g, '').trim();
    // "a Alonso" → "ad Alonso"
    for (const [re, f] of ITA) { const m = t.match(re); if (m) { const x = f(m, nomi); x[2] = x[2].replace(/ a ([AEIOU])/g, ' ad $1'); return x; } }
    const band = BANDIERE[r.bandiera] || (r.categoria === 'SafetyCar' ? ['safety car', 'var(--color-warn)'] : null);
    return [band ? band[0] : '', band ? band[1] : '', t.toLowerCase(), '', r.categoria === 'SafetyCar' || r.bandiera === 'RED', ''];
  }
  function drawGara() {
    const info = rows('f1_info')[0];
    $('#f1-ult-tit').textContent = info && info.ultima_gp ? GP(info.ultima_gp) + ' · ' + nome(info.ultima_sessione) : '—';
    $('#f1-ult-data').textContent = info && info.ultima_inizio ? 'Ultima sessione · ' + giornoMese(info.ultima_inizio) : 'Ultima sessione';
    const gara = !!(info && /race/i.test(info.ultima_tipo));
    const podio = $('#f1-podio');
    const lista = $('#f1-ris');
    const ris = rows('f1_risultato');
    if (!attesa(podio, ['f1_risultato'])) {
      podio.replaceChildren();
      const altezze = { 1: 96, 2: 72, 3: 56 };
      [ris[1], ris[0], ris[2]].forEach((r, i) => {
        if (!r) { podio.append(el('div')); return; }
        const d = el('div');
        if (r.pos === 1 && gara) d.append(el('div', 'cup', '🏆'));
        d.append(el('div', 'n', r.sigla), el('div', 's', r.team));
        const blk = el('div', 'blk', String(r.pos));
        blk.style.height = (altezze[r.pos] || 48) + 'px';
        blk.style.background = r.colore || 'var(--cds-chart-muted)';
        blk.style.setProperty('--i', [1, 0, 2][i]);
        d.append(blk);
        podio.append(d);
      });
      const primo = !visti.has(podio.id);
      anima(podio);
      if (primo && MOTO && gara) coriandoli(podio, ris.slice(0, 3).map((r) => r.colore));
    }
    if (!attesa(lista, ['f1_risultato'])) {
      lista.replaceChildren();
      const veloce = d3.min(ris, (r) => r.giro_migliore || Infinity);
      $('#f1-ris-nota').textContent = 'In viola il giro più veloce.' + (gara ? ' Le frecce: posizioni guadagnate o perse rispetto al primo giro.' : '');
      const primoGiro = {};
      rows('f1_giri').forEach((g) => { if (g.giro === 1 && g.pos) primoGiro[g.sigla] = g.pos; });
      ris.forEach((r, i) => {
        let dist = '—';
        if (r.stato) dist = r.stato === 'DNF' ? 'Ritirato' : r.stato;
        else if (i === 0 || r.distacco === 0) dist = gara ? r.giri + ' giri' : tempo(r.giro_migliore);
        else if (typeof r.distacco === 'string') dist = r.distacco.replace(/\+1 LAP$/i, '+1 giro').replace(/ LAPS?$/i, ' giri');
        else if (r.distacco != null) dist = '+' + tempo(r.distacco);
        const sotto = el('small', '', r.team + (r.punti ? ' · ' + punti(r.punti) + ' pt' : ''));
        if (r.giro_migliore && r.giro_migliore === veloce) sotto.append(el('span', 'f1-tag fl', 'giro veloce'));
        const p1 = primoGiro[r.sigla];
        if (gara && p1 && r.pos && !r.stato && p1 !== r.pos) sotto.append(el('span', 'f1-tag ' + (p1 > r.pos ? 'su' : 'giu'), (p1 > r.pos ? '▲' : '▼') + Math.abs(p1 - r.pos)));
        const row = rigaLista(r.pos == null ? '—' : String(r.pos), r.pilota || r.sigla, sotto, dist, r.giro_migliore ? 'giro ' + tempo(r.giro_migliore) : '', r.colore, i);
        row.dataset.key = r.sigla;
        lista.append(row);
      });
      anima(lista);
    }
    const meteo = $('#f1-meteo');
    if (!attesa(meteo, ['f1_meteo'])) {
      meteo.replaceChildren();
      const m = rows('f1_meteo')[0];
      const g = (x) => (x == null ? '—' : x.toLocaleString('it-IT', { maximumFractionDigits: 0 }) + '°');
      [['Aria', g(m && m.aria)], ['Asfalto', g(m && m.pista)], ['Umidità', m && m.umidita != null ? Math.round(m.umidita) + '%' : '—'], ['Pioggia', m ? (m.pioggia ? 'Sì' : 'No') : '—']].forEach(([k, v]) => {
        const d = el('div'); d.style.setProperty('--i', meteo.children.length); d.append(el('span', 'v', v), el('span', 'k', k)); meteo.append(d);
      });
      anima(meteo);
    }
    const dir = $('#f1-dir');
    const piu = $('#f1-dir-more');
    const sum = $('#f1-dir-sum');
    if (attesa(dir, ['f1_direzione', 'f1_risultato'])) { piu.hidden = true; sum.replaceChildren(); return; }
    dir.replaceChildren();
    // Nomi dei piloti al posto delle sigle (cognome, dal risultato dell'ultima sessione)
    const cognomi = {};
    ris.forEach((r) => { if (r.sigla && r.pilota) cognomi[r.sigla] = r.pilota.split(' ').pop(); });
    const nomi = (s) => cognomi[s] || s;
    const tutti = rows('f1_direzione').map((r) => ({ r, t: traduci(r, nomi) })).reverse();
    // Riepilogo dei messaggi di routine, che di solito si nascondono
    const quanti = (g) => tutti.filter((x) => x.t[5] === g).length;
    sum.replaceChildren(...[['blu', 'bandiere blu'], ['limiti', 'tempi cancellati'], ['gialle', 'gialle e via libera'], ['episodi', 'episodi segnalati']]
      .filter(([g]) => quanti(g)).map(([g, k]) => el('span', '', quanti(g) + ' ' + k)));
    const importanti = tutti.filter((x) => x.t[4]);
    const msg = tuttiMessaggi || importanti.length < 3 ? tutti : importanti;
    $('#f1-dir-tipo').textContent = msg === tutti ? 'tutti i messaggi' : 'solo i più importanti';
    const mostra = tuttiMessaggi ? msg : msg.slice(0, 12);
    piu.hidden = tuttiMessaggi || tutti.length <= mostra.length;
    mostra.forEach(({ r, t }, i) => {
      const riga = el('div', 'f1-msg');
      riga.style.setProperty('--i', Math.min(i, 10));
      riga.dataset.key = String(r.n);
      riga.append(el('div', 'g', r.giro == null ? quando(r.ora, false) : 'giro ' + r.giro));
      const m = el('div', 'm');
      if (t[0]) { const f = el('span', 'f1-flag', t[0]); f.style.color = t[1]; m.append(f); }
      m.append(document.createTextNode(t[2]));
      if (t[3]) m.append(el('small', '', t[3]));
      riga.append(m);
      dir.append(riga);
    });
    anima(dir);
  }

  // ---- Strategia ----
  // La scheda Strategia mostra l'ultimo evento tra gara, sprint e qualifiche (mai le prove libere).
  function garaStrategia() {
    const i = rows('f1_info')[0] || {};
    const q = /qualif|shootout/i.test(i.strategia_sessione || '');
    $('#f1-box').style.display = q ? 'none' : ''; // in qualifica i "pit" sono solo uscite dal box: lista lunga e senza senso
    $('#f1-str-gara').textContent = i.strategia_gp ? GP(i.strategia_gp) + ' · ' + nome(i.strategia_sessione) + ' del ' + giornoMese(i.strategia_inizio) : '';
  }
  function drawPosizioni() {
    const box = $('#f1-lapchart');
    const sel = $('#f1-pick');
    if (attesa(box, ['f1_giri', 'f1_risultato'])) return;
    box.replaceChildren();
    const ris = rows('f1_risultato');
    const giri = rows('f1_giri').filter((g) => g.pos != null);
    if (!giri.length) { box.append(el('p', 'f1-note', 'Nessun giro registrato in questa sessione')); return; }
    const scelto = sel.value || (ris[3] && ris[3].sigla) || '';
    sel.replaceChildren(...ris.map((r) => new Option(r.sigla + ' · ' + (r.pilota || ''), r.sigla)));
    sel.value = scelto;
    const evid = new Set([...ris.slice(0, 3).map((r) => r.sigla), scelto]);
    const col = colori();
    const per = d3.group(giri, (g) => g.sigla);
    const maxG = d3.max(giri, (g) => g.giro);
    const nP = Math.max(ris.length, d3.max(giri, (g) => g.pos));
    const W = box.clientWidth || 320;
    const m = { t: 8, r: 40, b: 26, l: 24 };
    const H = Math.max(260, nP * 14) + m.t + m.b;
    const x = d3.scaleLinear([1, maxG], [m.l, W - m.r]);
    const y = d3.scaleLinear([1, nP], [m.t, H - m.b]);
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Posizione di ogni pilota a fine giro');
    svg.append('g').selectAll('line').data([1, 5, 10, 15, 20].filter((p) => p <= nP)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y).attr('stroke', 'var(--cds-chart-grid)');
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(W / 70))).tickSizeOuter(0)).call(asse);
    svg.append('g').selectAll('text').data([1, 5, 10, 15, 20].filter((p) => p <= nP)).join('text').attr('x', m.l - 6).attr('y', (p) => y(p)).attr('dy', '0.35em').attr('text-anchor', 'end')
      .attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)').text((p) => p + '°');
    const line = d3.line().x((g) => x(g.giro)).y((g) => y(g.pos));
    const animare = primaVolta(box);
    const ordine = [...per.keys()].sort((a, b) => evid.has(a) - evid.has(b));
    let k = 0;
    ordine.forEach((s) => {
      const gs = per.get(s).slice().sort((a, b) => a.giro - b.giro);
      const on = evid.has(s);
      const p = svg.append('path').attr('d', line(gs)).attr('fill', 'none').attr('stroke', on ? (col[s] || dash.colors[0]) : 'var(--cds-chart-muted)')
        .attr('stroke-width', on ? 2.5 : 1).attr('stroke-opacity', on ? 1 : 0.45).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
      const u = gs[gs.length - 1];
      let lab = null;
      if (on) lab = svg.append('text').attr('x', x(u.giro) + 5).attr('y', y(u.pos)).attr('dy', '0.35em').attr('fill', 'var(--color-fg)').style('font-size', 'var(--cds-font-size-caption)').style('font-weight', 600).text(s);
      if (animare) {
        const len = p.node().getTotalLength();
        const dl = on ? 600 + 150 * k++ : 0;
        p.attr('stroke-dasharray', len).attr('stroke-dashoffset', len).transition().delay(dl).duration(on ? 1400 : 900).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0).on('end', () => p.attr('stroke-dasharray', null));
        if (lab) lab.attr('opacity', 0).transition().delay(dl + 1300).duration(300).attr('opacity', 1);
      }
    });
    const rule = svg.append('line').attr('class', 'f1-rule').attr('y1', m.t).attr('y2', H - m.b).attr('stroke', 'var(--cds-chart-reference)').attr('opacity', 0);
    const show = (ev) => {
      const [px] = d3.pointer(ev, svg.node());
      const g = Math.max(1, Math.min(maxG, Math.round(x.invert(px))));
      rule.attr('x1', x(g)).attr('x2', x(g)).attr('opacity', 1);
      const sul = [...evid].map((s) => (per.get(s) || []).find((r) => r.giro === g)).filter(Boolean).sort((a, b) => a.pos - b.pos);
      const sc = box.clientWidth / W;
      const righe = [el('div', 'h', 'Giro ' + g)];
      sul.forEach((r) => {
        const d = el('div');
        const sw = el('span', 'f1-sw'); sw.style.background = col[r.sigla] || dash.colors[0];
        d.append(sw, document.createTextNode(r.sigla + ' ' + r.pos + '° · ' + tempo(r.tempo)));
        righe.push(d);
      });
      tip(box, righe, x(g) * sc, m.t + 40);
    };
    svg.on('pointermove', show).on('pointerdown', show).on('pointerleave', (ev) => { if (ev.pointerType === 'mouse') { rule.attr('opacity', 0); togliTip(box); } });
    fuori(box, () => box.querySelectorAll('.f1-rule').forEach((l) => l.setAttribute('opacity', 0)));
  }

  function drawStint() {
    const box = $('#f1-stints');
    const leg = $('#f1-leg');
    leg.replaceChildren();
    if (attesa(box, ['f1_gomme', 'f1_risultato'])) return;
    box.replaceChildren();
    const st = rows('f1_gomme').filter((s) => s.da != null);
    if (!st.length) { box.append(el('p', 'f1-note', 'Nessuno stint registrato in questa sessione')); return; }
    const ord = rows('f1_risultato').map((r) => r.sigla);
    const piloti = [...new Set([...ord, ...st.map((s) => s.sigla)])].filter((p) => st.some((s) => s.sigla === p));
    [...new Set(st.map((s) => s.mescola))].forEach((c) => {
      const [n, colr] = mescola(c);
      const sp = el('span');
      sp.append(gomma(c), document.createTextNode(n));
      leg.append(sp);
    });
    anima(leg);
    const maxG = d3.max(st, (s) => s.a || s.da);
    const W = box.clientWidth || 320;
    const m = { t: 4, r: 8, b: 26, l: 38 };
    const bh = 16;
    const H = piloti.length * bh + m.t + m.b;
    const x = d3.scaleLinear([0, maxG], [m.l, W - m.r]);
    const y = d3.scaleBand(piloti, [m.t, H - m.b]).padding(0.22);
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Stint di gomme per pilota');
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(W / 70))).tickSizeOuter(0)).call(asse);
    svg.append('g').selectAll('text').data(piloti).join('text').attr('x', m.l - 6).attr('y', (p) => y(p) + y.bandwidth() / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
      .attr('fill', 'var(--color-fg)').style('font-size', 'var(--cds-font-size-caption)').text((p) => p);
    const larg = (s) => Math.max(2, x(s.a || s.da) - x(s.da - 1) - 2);
    const bars = svg.append('g').selectAll('rect').data(st).join('rect')
      .attr('x', (s) => x(s.da - 1) + 1).attr('y', (s) => y(s.sigla)).attr('height', y.bandwidth()).attr('rx', 4)
      .attr('fill', (s) => mescola(s.mescola)[1]).attr('stroke', 'var(--color-border-line)');
    // Tocco ovunque sulla riga del pilota: si legge lo stint sotto il dito (le barre corte sono difficili da centrare)
    const leggi = (ev) => {
      const [px, py] = d3.pointer(ev, svg.node());
      const p = piloti.find((q) => py >= y(q) - y.step() * y.padding() / 2 && py < y(q) + y.bandwidth() + y.step() * y.padding() / 2);
      if (!p) return togliTip(box);
      const g = Math.max(1, Math.ceil(x.invert(px)));
      const mie = st.filter((q) => q.sigla === p);
      const s = mie.find((q) => g >= q.da && g <= (q.a || q.da)) || mie.reduce((a, b) => (Math.abs(b.da - g) < Math.abs(a.da - g) ? b : a));
      const sc = box.clientWidth / W;
      tip(box, [el('div', 'h', s.sigla + ' · stint ' + s.stint), el('div', '', mescola(s.mescola)[0] + (s.eta ? ', usate (' + s.eta + ' giri)' : ', nuove')), el('div', '', 'Giri ' + s.da + '–' + (s.a || s.da))], (x(s.da - 1) + x(s.a || s.da)) / 2 * sc, y(s.sigla) * sc);
    };
    svg.on('pointerdown', leggi).on('pointermove', leggi).on('pointerleave', (ev) => { if (ev.pointerType === 'mouse') togliTip(box); });
    fuori(box);
    if (primaVolta(box)) {
      const idx = new Map(piloti.map((p, i) => [p, i]));
      bars.attr('width', 0).transition().delay((s) => idx.get(s.sigla) * 30 + (s.da / maxG) * 500).duration(500).ease(d3.easeCubicOut).attr('width', larg);
    } else bars.attr('width', larg);
  }

  function drawPit() {
    const box = $('#f1-pit');
    if (attesa(box, ['f1_pit', 'f1_risultato'])) return;
    box.replaceChildren();
    const col = colori();
    const pit = rows('f1_pit').slice().sort((a, b) => a.giro - b.giro);
    if (!pit.length) { box.append(el('p', 'f1-note', 'Nessun pit stop in questa sessione')); return; }
    const max = d3.max(pit, (p) => p.corsia || 0) || 1;
    const migliore = d3.min(pit, (p) => p.fermo || Infinity);
    const animare = !visti.has(box.id);
    pit.forEach((p, i) => {
      const sotto = el('div');
      sotto.style.display = 'grid'; sotto.style.gap = '4px';
      sotto.append(el('small', '', p.fermo ? 'fermo ' + p.fermo.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' s' + (p.fermo === migliore ? ' · il più veloce' : '') : 'in corsia box'), barra((p.corsia || 0) / max, col[p.sigla], animare && MOTO));
      const r = rigaLista(String(p.giro), p.sigla, sotto, p.corsia == null ? '—' : p.corsia.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' s', 'giro ' + p.giro, col[p.sigla], i);
      r.querySelector('.p').textContent = String(i + 1);
      r.dataset.key = encodeURIComponent(p.sigla) + ',' + encodeURIComponent(p.giro);
      box.append(r);
    });
    anima(box);
  }

  // ---- Calendario ----
  function drawCalendario() {
    const box = $('#f1-cal');
    if (attesa(box, ['f1_sessioni', 'f1_vincitori', 'f1_risultato'])) return;
    box.replaceChildren();
    const adesso = new Date().toISOString();
    const gare = rows('f1_sessioni').filter((s) => s.tipo === 'Race' && s.sessione === 'Race');
    const prox = gare.find((s) => s.fine >= adesso && !s.annullata);
    // Vincitore: la gara Jolpica con la partenza più vicina (al massimo un giorno di differenza)
    const vinc = rows('f1_vincitori');
    const col = colori();
    const vincitore = (s) => vinc.find((v) => Math.abs(new Date(v.data) - new Date(s.inizio)) < 864e5);
    gare.forEach((s, i) => {
      const v = s.fine < adesso && !s.annullata ? vincitore(s) : null;
      const sotto = el('small', '', luogo(s.luogo) + ', ' + paese(s.paese) + (s.annullata ? ' · annullata' : ''));
      if (v) sotto.append(el('span', 'vince', '🏆 ' + v.pilota.split(' ').pop() + ' · ' + v.team));
      const c = v ? coloreTeam(col, v.team) || col[v.sigla] : '';
      const r = rigaLista(s.round ? String(s.round) : '·', GP(s.gp), sotto, giornoMese(s.inizio), quando(s.inizio, false), s === prox ? 'var(--f1-red)' : c, i);
      if (s.fine < adesso) r.classList.add('past');
      if (s === prox) r.classList.add('next');
      r.dataset.key = String(s.chiave);
      box.append(r);
    });
    anima(box);
    if (prox && primaVolta({ id: 'f1-cal-scroll' })) {
      const r = box.querySelector('.next');
      if (r) setTimeout(() => r.scrollIntoView({ block: 'center', behavior: MOTO ? 'smooth' : 'auto' }), 400);
    }
  }

  // ---- Apertura della pagina e dei pannelli ----
  let costruita = false;
  let pannello = 'weekend';
  const aperta = () => sv.classList.contains('f1-on');
  const DISEGNO = {
    weekend: () => { drawWeekend(); drawQuote(); drawPista(); drawAlbo(); },
    mondiale: () => { drawTitolo(); drawMondiale(); drawCompagni(); },
    gara: drawGara,
    strategia: () => { garaStrategia(); drawPosizioni(); drawStint(); drawPit(); },
    calendario: drawCalendario,
  };
  function avviso() {
    const box = $('#f1-avviso');
    const info = rows('f1_info')[0];
    let testo = null, live = false;
    if (info && info.aggiornato && ok('f1_sessioni')) {
      const agg = new Date(info.aggiornato), ora = Date.now();
      const sess = rows('f1_sessioni').filter((s) => !s.annullata);
      // da venerdì a domenica i dati arrivano più volte al giorno (al massimo 8 ore di pausa la notte), da lunedì a giovedì una volta al giorno
      const fineSett = (d) => ['Fri', 'Sat', 'Sun'].includes(d.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short' }));
      const weekend = fineSett(agg) && fineSett(new Date(ora));
      const ore = (ora - agg) / 36e5;
      const ultimaFatta = sess.filter((s) => (s.tipo === 'Race' || s.tipo === 'Qualifying') && new Date(s.fine) < ora).pop();
      const inCorso = sess.find((s) => new Date(s.inizio) <= ora && new Date(s.fine) >= ora);
      if (ore > (weekend ? 9 : 30)) testo = ['I dati sono fermi a ' + quando(info.aggiornato), ': l\'aggiornamento automatico è in ritardo, appena riparte si sistemano da soli.'];
      else if (info.diretta && inCorso) { testo = [nome(inCorso.sessione) + ' in diretta', ': classifiche e quote sono aggiornate, tempi e posizioni arrivano a fine sessione.']; live = true; }
      else if (ultimaFatta && agg < new Date(ultimaFatta.fine) && (!info.ultima_inizio || info.ultima_inizio < ultimaFatta.inizio)) testo = [nome(ultimaFatta.sessione) + ' · ' + gpLungo(ultimaFatta.gp), ': risultati in arrivo con il prossimo aggiornamento dei dati.'];
      else if (info.diretta) testo = ['Dati della diretta', ': tempi e posizioni dell\'ultima sessione arrivano con il prossimo aggiornamento.'];
    }
    box.hidden = !testo;
    box.classList.toggle('live', live);
    if (!testo) { box.replaceChildren(); return; }
    const chiave = testo[0];
    if (box.dataset.k === chiave) return;
    box.dataset.k = chiave;
    box.replaceChildren(el('span'));
    box.firstChild.append(el('b', '', testo[0]), document.createTextNode(testo[1]));
    box.classList.remove('enter');
    if (MOTO) { void box.offsetWidth; box.classList.add('enter'); }
  }
  function draw() {
    if (!costruita || !aperta()) return;
    avviso();
    DISEGNO[pannello]();
  }
  function pillola() {
    const b = page.querySelector('.f1-sub button[aria-selected=true]');
    const p = page.querySelector('.f1-pill');
    if (!b || !p) return;
    p.style.width = b.offsetWidth + 'px';
    p.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }
  // ---- Partenza: semaforo rapido, senza suono, solo dal tasto "Rivedi la partenza" (le cinque luci in fila, poi buio dopo un attimo a caso) ----
  let inPartenza = false;
  function semaforo() {
    if (!MOTO || inPartenza) return;
    inPartenza = true;
    const box = el('div', 'f1-start');
    box.setAttribute('aria-label', 'Partenza');
    const pods = [];
    const gantry = el('div', 'f1-gantry');
    for (let i = 0; i < 5; i++) { const p = el('div', 'pod'); p.append(el('i'), el('i', 'r')); pods.push(p); gantry.append(p); }
    const testo = el('div', 'f1-start-t', 'Pronti alla partenza');
    const x = el('button', 'f1-start-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Chiudi');
    box.append(x, gantry, testo);
    page.prepend(box);
    if (costruita) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const timer = [];
    const fine = () => { timer.forEach(clearTimeout); box.classList.add('out'); setTimeout(() => { box.remove(); inPartenza = false; }, 600); };
    x.addEventListener('click', fine);
    const T0 = 0.4, PASSO = 0.3;
    const buio = T0 + 4 * PASSO + 0.3 + Math.random() * 0.6;
    pods.forEach((p, i) => timer.push(setTimeout(() => { p.classList.add('on'); testo.textContent = ''; }, (T0 + i * PASSO) * 1000)));
    timer.push(setTimeout(() => { pods.forEach((p) => p.classList.remove('on')); testo.textContent = 'Lights out and away we go!'; box.classList.add('via'); }, buio * 1000));
    timer.push(setTimeout(fine, buio * 1000 + 1600));
  }
  function scie() {
    const h = $('#f1-prossimo');
    if (!h || !MOTO || h.querySelector('.f1-streaks')) return;
    const s = el('div', 'f1-streaks');
    s.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 7; i++) {
      const l = el('i');
      l.style.top = (8 + i * 13 + Math.random() * 6) + '%';
      l.style.setProperty('--t', (1.8 + Math.random() * 1.6).toFixed(2) + 's');
      l.style.setProperty('--d', (-Math.random() * 3).toFixed(2) + 's');
      s.append(l);
    }
    h.prepend(s);
  }
  function mostra(k, animare) {
    if (!DISEGNO[k]) k = 'weekend';
    pannello = k;
    page.querySelectorAll('.f1-sub button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pane === k)));
    pillola();
    page.querySelectorAll('.f1-pane').forEach((p) => {
      const on = p.dataset.pane === k;
      p.hidden = !on;
      p.classList.remove('enter');
      if (on && animare) { void p.offsetWidth; p.classList.add('enter'); }
    });
    dash.setLink('f1-' + k);
    draw();
  }
  function apri(k) {
    if (!costruita) {
      page.append(tpl.content.cloneNode(true));
      costruita = true;
      const sub = page.querySelector('.f1-sub');
      sub.prepend(el('span', 'f1-pill'));
      sub.classList.add('pill');
      window.addEventListener('resize', pillola);
      $('#f1-replay').addEventListener('click', semaforo);
      if (!MOTO) $('#f1-replay').hidden = true;
      $('#f1-pick').addEventListener('change', drawPosizioni);
      $('#f1-dir-more').addEventListener('click', () => { tuttiMessaggi = true; drawGara(); });
      page.querySelector('.f1-sub').addEventListener('click', (e) => {
        const b = e.target.closest('button[data-pane]');
        if (b && b.dataset.pane !== pannello) { mostra(b.dataset.pane, true); b.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
      });
    }
    sv.classList.add('f1-on');
    tab.setAttribute('aria-current', 'page');
    mostra(k || pannello, MOTO);
  }
  function chiudi() { sv.classList.remove('f1-on'); tab.removeAttribute('aria-current'); }
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (a === tab) { e.preventDefault(); e.stopPropagation(); apri(); window.scrollTo({ top: 0 }); }
    else chiudi();
  }, true);
  setInterval(() => { if (aperta() && pannello === 'weekend') tick(); }, 1000);
  dash.onData(draw);
  const h = location.hash.slice(1);
  if (h === 'f1' || h.startsWith('f1-')) setTimeout(() => apri(h.slice(3)), 0);
})();
