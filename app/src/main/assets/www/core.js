'use strict';
/* ================= ядро: состояние, API, иконки, навигация ================= */
const CFG = window.TB_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const A = {};                                   // все действия, вызываемые из разметки
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

const S = {
  server: (lsGet('tb_server', '') || CFG.server || '').replace(/\/+$/, ''),
  token: lsGet('tb_token', ''),
  st: null, tab: 'home', layers: [], sheets: [], locked: false, hidden: lsGet('tb_hide', '0') === '1',
  theme: lsGet('tb_theme', 'dark'), chat: [], lastHide: 0
};
try { S.st = JSON.parse(lsGet('tb_cache', 'null')); } catch (e) {}
try { S.chat = JSON.parse(lsGet('tb_chat', '[]')); } catch (e) {}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_P = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'];
const MONTHS_N = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

/* ---------- форматирование ---------- */
const group = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
function rub(k, o = {}) {
  k = k || 0; const neg = k < 0; const a = Math.abs(k);
  const whole = Math.floor(a / 100), cents = a % 100;
  let s = group(whole) + ((cents || o.frac) ? ',' + String(cents).padStart(2, '0') : '');
  if (o.sign) s = (neg ? '−' : '+') + s; else if (neg) s = '−' + s;
  return s + '\u00A0₽';
}
const hid = s => S.hidden ? '••••' : s;
function fmtPhone(d) {
  d = String(d || '').replace(/\D/g, ''); if (d[0] === '8') d = '7' + d.slice(1); if (!d) return '';
  if (d[0] !== '7') d = '7' + d; d = d.slice(0, 11);
  let o = '+7'; if (d.length > 1) o += ' ' + d.slice(1, 4); if (d.length > 4) o += ' ' + d.slice(4, 7);
  if (d.length > 7) o += '-' + d.slice(7, 9); if (d.length > 9) o += '-' + d.slice(9, 11); return o;
}
const fmtCard = n => String(n).replace(/(\d{4})(?=\d)/g, '$1 ');
function dayLabel(ts) {
  const d = new Date(ts * 1000), n = new Date(), y = new Date(Date.now() - 864e5);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, n)) return 'Сегодня'; if (same(d, y)) return 'Вчера';
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + (d.getFullYear() !== n.getFullYear() ? ' ' + d.getFullYear() : '');
}
const timeLabel = ts => { const d = new Date(ts * 1000); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

/* ---------- иконки (контурные, 24×24) ---------- */
const IC = {
  back: 'M15 5l-7 7 7 7', chev: 'M9 5l7 7-7 7', close: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10 3.5 6.5 4 7 6.2 7.4 7.4 10 7 12 7zM12 7c2-3.5 5.5-3 5-.8C16.6 7.4 14 7 12 7z',
  bell: 'M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21.5h4',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.7C3.9 8.5 2 12 2 12s3.6 7 10 7c1.5 0 2.9-.4 4-.9',
  send: 'M21 3L10 14M21 3l-6.5 18-4-8-8-4z', down: 'M12 4v14M6 13l6 6 6-6', up: 'M12 20V6M6 11l6-6 6 6',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2M7 7h.01M17 7h.01M7 17h.01',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM10.5 18h3',
  wifi: 'M2.5 9a15 15 0 0 1 19 0M5.5 12.5a10.5 10.5 0 0 1 13 0M8.6 16a6 6 0 0 1 6.8 0M12 19.5h.01',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6z', flame: 'M12 3c.8 3.8 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 0 2 1 3 2 3 0-3-.5-6 1-9z',
  shield: 'M12 3l7 3v5.5c0 4.6-3 7.7-7 9.5-4-1.8-7-4.9-7-9.5V6zM9 12l2.2 2.2L15.5 10',
  piggy: 'M5 11.5A6.5 6.5 0 0 1 11.5 6H15a4 4 0 0 1 3 1.3l2-.8v4l-1.2 1V16h-3l-.8 2h-3l-.7-2H8l-1-1.4A6.5 6.5 0 0 1 5 11.5zM15 10.5h.01',
  chart: 'M5 20V11M12 20V4M19 20v-6', lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3', edit: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  check: 'M5 12.5l4.5 4.5L19 7', settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4v6M9 14v6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  refresh: 'M20 11a8 8 0 1 0-2 6.3M20 4.5V11h-6.5', download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z', card: 'M3 6h18v12H3zM3 10.5h18M6.5 15h3',
  chat: 'M4 5h16v11H9.5L5 20v-4H4z', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  city: 'M12 3l9 9-9 9-9-9zM9 12l3-3 3 3-3 3z', ring: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  cart: 'M3 4h2.2l2 11h11l2-8H6.5M9.5 20h.01M17 20h.01', plane: 'M21 3L3 10.5l6.5 2.5L12 20l2-5.5zM9.5 13L21 3',
  doc: 'M7 3h7.5L19 7.5V21H7zM14 3v5h5M10 13h6M10 17h6', tv: 'M4 6h16v11H4zM9 21h6M8 3l4 3 4-3',
  gov: 'M3 10l9-6 9 6zM5.5 10v8M9.8 10v8M14.2 10v8M18.5 10v8M3 20.5h18', percent: 'M6 18L18 6M8 8h.01M16 16h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01', copy: 'M9 9h11v11H9zM5 15V4h11',
  swap: 'M7 4L3 8l4 4M3 8h15M17 20l4-4-4-4M21 16H6', fuel: 'M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3 20h13M14 9h3l2 2v6a1.5 1.5 0 0 0 3 0V9l-2-2',
  cup: 'M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 9h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2', pill: 'M10.5 20.5a4.2 4.2 0 0 1-6-6l9-9a4.2 4.2 0 0 1 6 6zM8.5 8.5l7 7',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12h.01',
  bag: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2', heart: 'M12 20S4 15 4 9.5A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.5C20 15 12 20 12 20z',
  pie: 'M12 3v9h9a9 9 0 1 1-9-9zM15 3.5A9 9 0 0 1 20.5 9H15z', calc: 'M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01',
  backspace: 'M21 5H9l-6 7 6 7h12zM15 9.5l-4 5M11 9.5l4 5', key: 'M15 8a4 4 0 1 1-1.2 2.8L4 20.5V18l2-2v-2l2-2h2.2A4 4 0 0 1 15 8z',
  car: 'M4 14l1.5-5A2 2 0 0 1 7.4 7.500h9.200a2 2 0 0 1 1.900 1.500L20 14v4h-3v-2H7v2H4zM7.500 11.500h.01M16.500 11.500h.01', sms: 'M4 5h16v12H8l-4 3z'
};
const ic = (n, s = 22, w = 1.9) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[n] || ''}"/></svg>`;

/* ---------- категории операций ---------- */
const CAT = {
  transfer: { c: '#E5493D', i: 'send' }, income: { c: '#35C27B', i: 'down' }, topup: { c: '#35C27B', i: 'plus' }, move: { c: '#4C8DFF', i: 'swap' },
  interest: { c: '#35C27B', i: 'percent' }, cashback: { c: '#F5B800', i: 'star' }, pay_mobile: { c: '#4C8DFF', i: 'phone' },
  pay_utility: { c: '#F59A0B', i: 'flame' }, pay_internet: { c: '#A56BFF', i: 'wifi' }, pay_fines: { c: '#E5493D', i: 'shield' },
  pay_gov: { c: '#35B4E8', i: 'gov' }, pay_shop: { c: '#35C27B', i: 'cart' }
};
const catOf = c => CAT[c] || { c: '#8E8E99', i: 'doc' };

/* ---------- доступ к данным ---------- */
const ST = () => S.st || { user: { name: '', phone: '', bonus: 0 }, accounts: [], cards: [], tx: [], notes: [] };
const black = () => ST().accounts.find(a => a.kind === 'black');
const accById = id => ST().accounts.find(a => a.id === id);
const cardsOf = id => ST().cards.filter(c => c.account_id === id);
const totalBal = () => ST().accounts.reduce((s, a) => s + a.balance, 0);
function monthTx(accId) {
  const n = new Date(); const t0 = new Date(n.getFullYear(), n.getMonth(), 1).getTime() / 1000;
  return ST().tx.filter(t => t.ts >= t0 && t.amount < 0 && t.cat !== 'move' && (!accId || t.account_id === accId));
}
function spendBar(list) {
  const m = {}; let tot = 0;
  list.forEach(t => { const c = catOf(t.cat).c; m[c] = (m[c] || 0) - t.amount; tot -= t.amount; });
  if (!tot) return '<div class="bar"><i style="flex:1;background:rgba(150,150,170,.35)"></i></div>';
  return '<div class="bar">' + Object.keys(m).map(c => `<i style="flex:${m[c]};background:${c}"></i>`).join('') + '</div>';
}
const spendSum = list => list.reduce((s, t) => s - t.amount, 0);

/* ---------- API ---------- */
let busyCount = 0;
function progress(on) { busyCount += on ? 1 : -1; $('#prog').classList.toggle('on', busyCount > 0); }
async function api(path, method = 'GET', data, quiet) {
  if (!S.server || /ВАШЛОГИН/.test(S.server)) throw new Error('Укажите адрес сервера (экран входа → «Сервер»)');
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 20000);
  if (!quiet) progress(true);
  try {
    const r = await fetch(S.server + '/api' + path, {
      method, signal: ctl.signal, body: data ? JSON.stringify(data) : undefined,
      headers: Object.assign({ 'Content-Type': 'application/json' }, S.token ? { Authorization: 'Bearer ' + S.token } : {})
    });
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok || j.ok === false) {
      if (r.status === 401 && S.token && !/^\/(login|register)/.test(path)) setTimeout(() => A.forceLogout(), 0);
      const er = new Error(j.error || ('Ошибка ' + r.status)); er.status = r.status; throw er;
    }
    return j;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Сервер не отвечает');
    if (e instanceof TypeError) throw new Error('Нет связи с сервером');
    throw e;
  } finally { clearTimeout(to); if (!quiet) progress(false); }
}
function setState(st) { S.st = st; lsSet('tb_cache', JSON.stringify(st)); render(); }
async function act(path, data, okMsg, method = 'POST') {
  try {
    const j = await api(path, method, data);
    if (j.state) setState(j.state);
    if (okMsg) toast(okMsg, 'ok');
    return j;
  } catch (e) { toast(e.message, 'err'); return null; }
}
async function refresh(quiet) {
  try { const j = await api('/state', 'GET', null, quiet); setState(j.state); return true; } catch (e) { if (!quiet) toast(e.message, 'err'); return false; }
}

/* ---------- тосты ---------- */
function toast(msg, kind = '') {
  const t = document.createElement('div'); t.className = 'toast ' + kind;
  t.innerHTML = (kind === 'ok' ? ic('check', 18, 2.4) : kind === 'err' ? ic('info', 18, 2.2) : '') + '<span>' + esc(msg) + '</span>';
  $('#toasts').appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 3200);
  tick();
}
function push(title, text, cb) {
  const t = document.createElement('div'); t.className = 'pushb';
  t.innerHTML = `<div class="pi">Т</div><div class="pb"><div class="pa">Т-Банк<span>сейчас</span></div><b>${esc(title)}</b><div>${esc(text)}</div></div>`;
  t.onclick = () => { t.remove(); cb && cb(); };
  $('#toasts').appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 5500);
}
function tick() { try { window.AndroidApp && AndroidApp.haptic && AndroidApp.haptic(); } catch (e) {} }

/* ---------- тема ---------- */
function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  try { window.AndroidApp && AndroidApp.setBars && AndroidApp.setBars(S.theme === 'dark'); } catch (e) {}
  const m = $('meta[name=color-scheme]'); if (m) m.content = S.theme;
}

/* ---------- слои (экраны поверх вкладок) и шторки ---------- */
const LAYERS = {}, SHEETS = {};
function pushLayer(name, p) {
  const el = document.createElement('div'); el.className = 'layer'; el.innerHTML = '<div class="scroll"></div>';
  $('#layers').appendChild(el); const L = { name, p, el }; S.layers.push(L); renderLayer(L);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in'))); tick(); updateTabbar();
}
function popLayer() {
  const L = S.layers.pop(); if (!L) return false;
  L.el.classList.remove('in'); setTimeout(() => L.el.remove(), 380); updateTabbar(); return true;
}
function clearLayers() { while (S.layers.length) { const L = S.layers.pop(); L.el.remove(); } updateTabbar(); }
function renderLayer(L) { const sc = $('.scroll', L.el), y = sc.scrollTop; sc.innerHTML = LAYERS[L.name](L.p || {}); sc.scrollTop = y; }

function openSheet(fn, o = {}) {
  const el = document.createElement('div'); el.className = 'sheet-wrap';
  el.innerHTML = '<div class="backdrop"></div><div class="sheet ' + (o.full ? 'full' : '') + '"><div class="grab"></div><div class="sheet-in scroll"></div></div>';
  const sh = { el, fn, live: o.live !== false, full: !!o.full, onClose: o.onClose };
  $('.backdrop', el).onclick = () => closeSheet(sh);
  $('#sheets').appendChild(el); S.sheets.push(sh); renderSheet(sh);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in'))); tick(); return sh;
}
function renderSheet(sh) { const sc = $('.sheet-in', sh.el), y = sc.scrollTop; sc.innerHTML = sh.fn(sh); sc.scrollTop = y; }
function closeSheet(sh) {
  sh = sh || S.sheets[S.sheets.length - 1]; if (!sh) return false;
  S.sheets = S.sheets.filter(x => x !== sh); sh.el.classList.remove('in'); setTimeout(() => sh.el.remove(), 380);
  if (sh.onClose) sh.onClose(); return true;
}
const closeAllSheets = () => { while (S.sheets.length) closeSheet(); };
const shHead = (title, right = '') => `<div class="shh"><button class="lnk" onclick="closeSheet()">Закрыть</button><div class="shh-t">${esc(title)}</div><div class="shh-r">${right}</div></div>`;

/* ---------- общий рендер ---------- */
function render() {
  if (!S.st) return;
  const ae = document.activeElement; if (!(ae && ae.matches && ae.matches('input') && $('#views').contains(ae))) renderTab();
  S.layers.forEach(renderLayer); S.sheets.forEach(s => s.live && renderSheet(s)); updateTabbar();
}
const TABS = [['home', 'Главная', 'card'], ['pay', 'Платежи', 'ring'], ['city', 'Город', 'city'], ['chat', 'Чат', 'chat'], ['show', 'Витрина', 'grid']];
function updateTabbar() {
  const tb = $('#tabbar'); tb.classList.toggle('hide', !S.st || S.locked);
  const unread = ST().notes.filter(n => !n.read).length;
  tb.innerHTML = TABS.map(t => `<button class="tab ${S.tab === t[0] && !S.layers.length ? 'on' : ''}" onclick="A.tab('${t[0]}')">${ic(t[2], 25, 1.8)}<span>${t[1]}</span>${t[0] === 'home' && unread ? '<b class="dot">' + unread + '</b>' : ''}</button>`).join('');
}
const tabScroll = {};
function renderTab() {
  const v = $('#views'); const y = v.scrollTop; v.innerHTML = TABV[S.tab]();
  v.scrollTop = (v._tab === S.tab) ? y : (tabScroll[S.tab] || 0); v._tab = S.tab;
}
const TABV = {};
A.tab = t => { tick(); closeAllSheets(); const had = S.layers.length; clearLayers(); if (t === S.tab && !had) { $('#views').scrollTo({ top: 0, behavior: 'smooth' }); return; } tabScroll[S.tab] = $('#views').scrollTop; S.tab = t; $('#views').classList.remove('swap'); void $('#views').offsetWidth; $('#views').classList.add('swap'); renderTab(); updateTabbar(); };
A.back = () => popLayer();

/* кнопка «Назад» Android */
window.__back = function () {
  if (S.locked) return false;
  if (closeSheet()) return true;
  if (popLayer()) return true;
  if (S.st && S.tab !== 'home') { A.tab('home'); return true; }
  return false;
};
