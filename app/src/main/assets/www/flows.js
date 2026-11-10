'use strict';
/* ================= сценарии: вход, PIN, переводы, карты, профиль ================= */
const parseAmt = s => { const v = parseFloat(String(s || '').replace(/\s/g, '').replace(',', '.')); return isFinite(v) && v > 0 ? Math.round(v * 100) : 0; };
const logoSvg = '<svg viewBox="0 0 92 104"><defs><linearGradient id="lgx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEA70"/><stop offset="1" stop-color="#FFB800"/></linearGradient></defs><path d="M12 4H80Q88 4 88 12V58Q88 80 46 100Q4 80 4 58V12Q4 4 12 4Z" fill="url(#lgx)"/><path d="M26 28H66V40H52V74H40V40H26Z" fill="#17140A"/></svg>';

/* ---------- простые диалоги ---------- */
function askConfirm(title, text, okLabel, fn, danger) {
  openSheet(sh => `<div class="dlg"><h2>${esc(title)}</h2><p class="sec">${esc(text)}</p><button class="btn ${danger ? 'danger' : ''}" id="dok">${esc(okLabel)}</button><button class="btn ghost" onclick="closeSheet()">Отмена</button></div>`, { live: false });
  $('#dok').onclick = () => { closeSheet(); fn(); };
}
function askInput(title, value, cb, ph, type) {
  const sh = openSheet(() => `${shHead(title)}<div class="pd"><input class="field" id="ai" value="${esc(value || '')}" placeholder="${esc(ph || '')}" ${type ? 'inputmode="' + type + '"' : ''} autocomplete="off"><button class="btn" id="aok">Сохранить</button></div>`, { live: false });
  const go = () => { const v = $('#ai').value.trim(); if (!v) return; closeSheet(sh); cb(v); };
  $('#aok').onclick = go; $('#ai').onkeydown = e => { if (e.key === 'Enter') go(); }; setTimeout(() => $('#ai') && $('#ai').focus(), 350);
}

/* ---------- ВХОД / РЕГИСТРАЦИЯ ---------- */
const AU = { mode: 'login', phone: '', name: '', pw: '', show: false };
function showAuth() { S.locked = false; $('#auth').className = 'on'; $('#auth').innerHTML = authHtml(); updateTabbar(); }
function hideAuth() { $('#auth').className = ''; $('#auth').innerHTML = ''; updateTabbar(); }
function authHtml() {
  const reg = AU.mode === 'reg';
  return `<div class="auth"><div class="alogo">${logoSvg}</div><h1>Т-Банк</h1><p class="sec">${reg ? 'Откройте счёт за минуту' : 'Войдите, чтобы продолжить'}</p>
  <div class="glass acard"><div class="seg"><button class="${!reg ? 'on' : ''}" onclick="A.authMode('login')">Вход</button><button class="${reg ? 'on' : ''}" onclick="A.authMode('reg')">Регистрация</button></div>
   <label class="lbl">Номер телефона</label><input class="field" inputmode="tel" placeholder="+7 900 000-00-00" value="${esc(AU.phone)}" oninput="AU.phone=fmtPhone(this.value);this.value=AU.phone">
   ${reg ? `<label class="lbl">Имя и фамилия</label><input class="field" placeholder="Иван Петров" value="${esc(AU.name)}" oninput="AU.name=this.value" autocomplete="off">` : ''}
   <label class="lbl">Пароль${reg ? ' (минимум 6 символов)' : ''}</label><div class="pw"><input class="field" id="pw" type="${AU.show ? 'text' : 'password'}" placeholder="••••••" value="${esc(AU.pw)}" oninput="AU.pw=this.value" onkeydown="if(event.key==='Enter')A.authGo()"><button onclick="AU.show=!AU.show;A.authKeep()">${ic(AU.show ? 'eyeoff' : 'eye', 20, 2)}</button></div>
   <button class="btn" id="agb" onclick="A.authGo()">${reg ? 'Создать аккаунт' : 'Войти'}</button></div>
  <a class="lnk srv" onclick="A.serverSheet()">${ic('settings', 15, 2)} Сервер: ${esc(S.server.replace(/^https?:\/\//, '') || 'не задан')}</a>
  <p class="ver">Учебный симулятор. Деньги виртуальные — не вводите настоящие данные карт и паролей.</p></div>`;
}
A.authMode = m => { AU.mode = m; showAuth(); };
A.authKeep = () => { showAuth(); };
A.authGo = async () => {
  const b = $('#agb'); if (b) b.disabled = true;
  try {
    const j = await api(AU.mode === 'reg' ? '/register' : '/login', 'POST', { phone: AU.phone, name: AU.name, password: AU.pw });
    S.token = j.token; lsSet('tb_token', j.token); AU.pw = ''; S.locked = false; S.tab = 'home'; clearLayers();
    setState(j.state); hideAuth();
    if (AU.mode === 'reg') { setTimeout(() => showPin('setup'), 400); }
  } catch (e) { toast(e.message, 'err'); if (b) b.disabled = false; }
};
A.forceLogout = () => { S.token = ''; lsSet('tb_token', ''); S.st = null; lsSet('tb_cache', 'null'); closeAllSheets(); clearLayers(); $('#views').innerHTML = ''; showAuth(); };
A.logout = () => askConfirm('Выйти из аккаунта?', 'Данные останутся на сервере — войдите по номеру и паролю.', 'Выйти', async () => { try { await api('/logout', 'POST', null, true); } catch (e) {} A.forceLogout(); }, true);

A.serverSheet = () => {
  openSheet(() => `${shHead('Сервер')}<div class="pd"><p class="sec">Адрес вашего сервера на PythonAnywhere, например<br>https://ИМЯ.pythonanywhere.com</p><input class="field" id="sv" value="${esc(S.server)}" placeholder="https://ИМЯ.pythonanywhere.com" autocapitalize="off" autocomplete="off"><button class="btn" id="svb">Проверить и сохранить</button></div>`, { live: false });
  $('#svb').onclick = async () => {
    const v = $('#sv').value.trim().replace(/\/+$/, ''); if (!/^https:\/\//.test(v)) { toast('Адрес должен начинаться с https://', 'err'); return; }
    const old = S.server; S.server = v;
    try { await api('/ping'); lsSet('tb_server', v); toast('Сервер доступен', 'ok'); closeSheet(); if (!S.token) showAuth(); else render(); }
    catch (e) { S.server = old; toast(e.message, 'err'); }
  };
};

/* ---------- PIN ---------- */
const P = { mode: 'verify', val: '', first: '', err: false };
function showPin(mode) { P.mode = mode; P.val = ''; P.first = ''; P.err = false; S.locked = mode === 'verify'; $('#auth').className = 'on'; drawPin(); updateTabbar(); }
function drawPin() {
  const t = { verify: 'Введите код', setup: 'Придумайте код для входа', confirm: 'Повторите код' }[P.mode];
  $('#auth').innerHTML = `<div class="auth pin"><div class="alogo sm">${logoSvg}</div><h2>${t}</h2><div class="dots ${P.err ? 'shake' : ''}">${[0, 1, 2, 3].map(i => `<i class="${i < P.val.length ? 'f' : ''}"></i>`).join('')}</div>
  <div class="pad4">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button onclick="A.pk('${n}')">${n}</button>`).join('')}<span>${P.mode === 'setup' ? '<a class="lnk" onclick="A.pinSkip()">Позже</a>' : ''}</span><button onclick="A.pk('0')">0</button><button class="bs" onclick="A.pk('<')">${ic('backspace', 26, 1.8)}</button></div>
  ${P.mode === 'verify' ? '<a class="lnk" onclick="A.logout()">Выйти из аккаунта</a>' : ''}</div>`;
}
A.pinSkip = () => { S.locked = false; hideAuth(); };
A.pk = async d => {
  tick(); P.err = false;
  if (d === '<') P.val = P.val.slice(0, -1); else if (P.val.length < 4) P.val += d;
  drawPin(); if (P.val.length < 4) return;
  const v = P.val;
  const fail = m => { P.err = true; P.val = ''; if (m) toast(m, 'err'); setTimeout(drawPin, 30); };
  if (P.mode === 'verify') { try { const j = await api('/pin/verify', 'POST', { pin: v }); S.locked = false; hideAuth(); setState(j.state); } catch (e) { fail(e.status === 403 ? 'Неверный код' : e.message); } }
  else if (P.mode === 'setup') { P.first = v; P.mode = 'confirm'; P.val = ''; setTimeout(drawPin, 150); }
  else { if (v !== P.first) { P.mode = 'setup'; P.first = ''; fail('Коды не совпали'); return; } const j = await act('/pin/set', { pin: v }, 'Код для входа включён'); if (j) { S.locked = false; hideAuth(); } else fail(); }
};
A.togglePin = () => { if (ST().user.has_pin) askConfirm('Отключить код?', 'Вход в приложение будет без кода.', 'Отключить', () => act('/pin/off', {}, 'Код отключён'), true); else showPin('setup'); };
document.addEventListener('visibilitychange', () => {
  if (document.hidden) S.lastHide = Date.now();
  else if (S.token && S.st && S.st.user.has_pin && !S.locked && Date.now() - S.lastHide > 45000) { closeAllSheets(); showPin('verify'); }
  else if (S.token && S.st && !document.hidden) refresh(true);
});

/* ---------- общие действия ---------- */
A.toggleHide = () => { S.hidden = !S.hidden; lsSet('tb_hide', S.hidden ? '1' : '0'); render(); };
A.toggleTheme = () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; lsSet('tb_theme', S.theme); applyTheme(); render(); };
A.editName = () => askInput('Имя и фамилия', ST().user.name, v => act('/profile', { name: v }, 'Имя обновлено'), 'Иван Петров');
A.firstCard = () => { const c = ST().cards[0]; if (c) A.card(c.id); };
A.invite = () => {
  const t = 'Привет! Переведи мне деньги в Т-Банке по номеру ' + fmtPhone(ST().user.phone);
  try { navigator.clipboard.writeText(t); } catch (e) {}
  openSheet(() => `${shHead('Пригласить друга')}<div class="pd c"><div class="bigic">${ic('gift', 56, 1.4)}</div><p class="sec">Друг зарегистрируется в приложении по своему номеру, а вы сможете переводить ему деньги.</p><div class="glass tile">${esc(t)}</div><button class="btn" onclick="try{navigator.clipboard.writeText(${JSON.stringify(t).replace(/"/g, '&quot;')})}catch(e){};toast('Скопировано','ok')">Скопировать сообщение</button></div>`, { live: false });
};
A.notes = () => {
  openSheet(() => `${shHead('Уведомления')}<div class="pd">${ST().notes.length ? '<div class="glass list">' + ST().notes.map(n => `<div class="li note"><div class="lic" style="background:rgba(255,221,45,.16);color:#FFDD2D">${ic('bell', 20, 2)}</div><div class="lim"><b>${esc(n.title)}</b><small>${esc(n.text)}</small><small class="t">${dayLabel(n.ts)}, ${timeLabel(n.ts)}</small></div></div>`).join('') + '</div>' : '<div class="empty">Уведомлений нет</div>'}</div>`);
  if (ST().notes.some(n => !n.read)) api('/notes/read', 'POST', null, true).then(j => setTimeout(() => setState(j.state), 1200)).catch(() => {});
};
A.bonus = () => {
  openSheet(() => `${shHead('Кэшбэк и бонусы')}<div class="pd c"><div class="bigic gold">${ic('crown', 56, 1.4)}</div><span class="sec">Ваши баллы</span><b class="huge">${rub(ST().user.bonus, { frac: true })}</b><p class="sec">Баллы начисляются за платежи (до 5%). 1 балл = 1 ₽ — потратьте на счёт Black.</p><button class="btn" ${ST().user.bonus < 100 ? 'disabled' : ''} id="bsp">Потратить на счёт</button></div>`);
  $('#bsp').onclick = async () => { const j = await act('/bonus/spend', { amount: ST().user.bonus }, 'Баллы зачислены на счёт'); if (j) closeSheet(); };
};
A.achv = () => {
  const s = ST(), L = [['Первые шаги', 'Откройте счёт', true], ['Перевод другу', 'Сделайте перевод', s.tx.some(t => t.cat === 'transfer')], ['Платёж', 'Оплатите любую услугу', s.tx.some(t => /^pay_/.test(t.cat))], ['Накопитель', 'Откройте накопительный счёт или копилку', s.accounts.some(a => a.kind !== 'black')], ['Коллекционер', 'Выпустите вторую карту', s.cards.length > 1], ['Безопасность', 'Включите код для входа', s.user.has_pin]];
  openSheet(() => `${shHead('Достижения')}<div class="pd"><div class="glass list">${L.map(l => rowItem(l[2] ? 'check' : 'lock', l[2] ? 'rgba(53,194,123,.18)' : 'rgba(142,142,153,.18)', l[2] ? '#35C27B' : '#9a9aa8', l[0], l[1], '', l[2] ? ic('check', 18, 2.6) : '')).join('')}</div></div>`, { live: false });
};

/* ---------- ОПЕРАЦИИ ---------- */
const O = { q: '', acc: null };
A.ops = (accId, focus) => {
  O.q = ''; O.acc = accId || null;
  openSheet(() => {
    const list = opsList(); const mt = monthTx(O.acc);
    return `${shHead('Операции')}<div class="pd"><div class="search glass sm">${ic('search', 18, 2)}<input id="oq" placeholder="Поиск" value="${esc(O.q)}" oninput="A.opsQ(this.value)" autocomplete="off"></div>
    ${O.acc ? `<div class="chip">${esc(accById(O.acc).name)}<a onclick="A.opsAcc(null)">${ic('close', 12, 3)}</a></div>` : ''}
    <div class="rowh"><h3>Траты за <span class="blue">${MONTHS_N[new Date().getMonth()]}</span></h3><b>${hid(rub(spendSum(mt)))}</b></div>${spendBar(mt)}
    <div id="ol">${list}</div></div>`;
  }, { full: true, live: false });
  if (focus) setTimeout(() => $('#oq') && $('#oq').focus(), 380);
};
function opsList() {
  let l = ST().tx; if (O.acc) l = l.filter(t => t.account_id === O.acc);
  const q = O.q.trim().toLowerCase(); if (q) l = l.filter(t => (t.title + ' ' + t.sub).toLowerCase().includes(q));
  if (!l.length) return '<div class="empty">Ничего не найдено</div>';
  let out = '', last = '';
  l.forEach(t => { const d = dayLabel(t.ts); if (d !== last) { out += `<div class="dh">${d}</div>`; last = d; } out += opRow(t); });
  return out;
}
A.opsQ = v => { O.q = v; $('#ol').innerHTML = opsList(); };
A.opsAcc = id => { O.acc = id; const sh = S.sheets[S.sheets.length - 1]; renderSheet(sh); };

/* ---------- ПЕРЕВОД ---------- */
const T = { mode: 'phone', phone: '', card: '', amount: '', comment: '', from: null, to: null, found: '', done: null };
A.transfer = mode => {
  Object.assign(T, { mode: mode || 'phone', phone: '', card: '', amount: '', comment: '', found: '', done: null, from: black().id, to: (ST().accounts.find(a => a.kind !== 'black') || {}).id || null });
  T.sh = openSheet(transferHtml, { live: false });
};
function transferHtml() {
  if (T.done) return `${shHead('Перевод')}<div class="done"><div class="okc">${ic('check', 54, 2.6)}</div><h2>${esc(T.done.title)}</h2><b class="huge">${rub(T.done.amount, { frac: true })}</b><p class="sec">${esc(T.done.sub)}</p><button class="btn" onclick="closeSheet()">Готово</button></div>`;
  const a = accById(T.from) || black();
  const seg = `<div class="seg">${[['phone', 'Телефон'], ['card', 'Карта'], ['own', 'Свои счета']].map(m => `<button class="${T.mode === m[0] ? 'on' : ''}" onclick="T.mode='${m[0]}';T.found='';renderSheet(T.sh)">${m[1]}</button>`).join('')}</div>`;
  let who = '';
  if (T.mode === 'phone') who = `<label class="lbl">Номер телефона получателя</label><input class="field" inputmode="tel" placeholder="+7 900 000-00-00" value="${esc(T.phone)}" oninput="T.phone=fmtPhone(this.value);this.value=T.phone;A.lookup()"><div class="lk" id="lk">${esc(T.found)}</div>`;
  else if (T.mode === 'card') who = `<label class="lbl">Номер карты получателя</label><input class="field" inputmode="numeric" placeholder="0000 0000 0000 0000" value="${esc(T.card)}" oninput="T.card=fmtCard(this.value.replace(/\\D/g,'').slice(0,16));this.value=T.card;A.lookup()"><div class="lk" id="lk">${esc(T.found)}</div>`;
  else { const opts = (sel, ex) => ST().accounts.filter(x => x.id !== ex).map(x => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.name)} — ${rub(x.balance)}</option>`).join(''); who = `<label class="lbl">Откуда</label><select class="field" onchange="T.from=+this.value">${opts(T.from)}</select><label class="lbl">Куда</label><select class="field" onchange="T.to=+this.value">${ST().accounts.map(x => `<option value="${x.id}" ${x.id === T.to ? 'selected' : ''}>${esc(x.name)} — ${rub(x.balance)}</option>`).join('')}</select>`; }
  return `${shHead('Перевод')}<div class="pd">${seg}${who}<label class="lbl">Сумма</label><input class="field amt" inputmode="decimal" placeholder="0 ₽" value="${esc(T.amount)}" oninput="T.amount=this.value"><div class="hint">Доступно: ${rub(a.balance, { frac: true })} · без комиссии</div>
  ${T.mode !== 'own' ? `<label class="lbl">Комментарий</label><input class="field" placeholder="Необязательно" value="${esc(T.comment)}" oninput="T.comment=this.value">` : ''}<button class="btn" id="tgo" onclick="A.tGo()">Перевести</button></div>`;
}
let lkTimer;
A.lookup = () => {
  clearTimeout(lkTimer); const lk = $('#lk'); if (lk) lk.textContent = '';
  const q = T.mode === 'phone' ? (T.phone.replace(/\D/g, '').length >= 11 ? '?phone=' + T.phone.replace(/\D/g, '') : '') : (T.card.replace(/\D/g, '').length === 16 ? '?card=' + T.card.replace(/\D/g, '') : '');
  if (!q) return;
  lkTimer = setTimeout(async () => { try { const j = await api('/lookup' + q, 'GET', null, true); T.found = j.found ? '✓ ' + j.name : 'Получатель не найден в Т-Банке'; const l = $('#lk'); if (l) { l.textContent = T.found; l.className = 'lk ' + (j.found ? 'ok' : 'bad'); } } catch (e) {} }, 350);
};
A.tGo = async () => {
  const amt = parseAmt(T.amount); if (!amt) { toast('Введите сумму', 'err'); return; }
  let j, sub, title;
  if (T.mode === 'own') {
    if (!T.to || T.to === T.from) { toast('Выберите разные счета', 'err'); return; }
    j = await act('/move', { from_account: T.from, to_account: T.to, amount: amt }); title = 'Переведено между счетами'; sub = accById(T.from).name + ' → ' + accById(T.to).name;
  } else {
    const to = T.mode === 'phone' ? { phone: T.phone } : { card: T.card.replace(/\s/g, '') };
    if (T.mode === 'phone' ? T.phone.replace(/\D/g, '').length < 11 : T.card.replace(/\D/g, '').length < 16) { toast('Укажите получателя', 'err'); return; }
    j = await act('/transfer', { from_account: T.from, to, amount: amt, comment: T.comment }); title = 'Перевод выполнен'; sub = T.found.replace('✓ ', '') || 'Клиенту Т-Банка';
  }
  if (j) { T.done = { title, amount: amt, sub }; renderSheet(T.sh); }
};
A.moveTo = id => { Object.assign(T, { mode: 'own', amount: '', done: null, from: black().id, to: id }); T.sh = openSheet(transferHtml, { live: false }); };
A.moveFrom = id => { Object.assign(T, { mode: 'own', amount: '', done: null, from: id, to: black().id }); T.sh = openSheet(transferHtml, { live: false }); };
A.closeAcc = id => { const a = accById(id); askConfirm('Закрыть «' + a.name + '»?', a.balance ? 'Остаток ' + rub(a.balance) + ' вернётся на счёт Black.' : 'Счёт будет закрыт.', 'Закрыть счёт', async () => { const j = await act('/accounts/' + id + '/close', {}, 'Счёт закрыт'); if (j) popLayer(); }, true); };

/* ---------- ПОПОЛНЕНИЕ ---------- */
const TU = { amount: '' };
A.topup = () => {
  TU.amount = ''; const b = black();
  openSheet(() => `${shHead('Из другого банка')}<div class="pd"><div class="srcc"><span>с карты другого банка</span><b>Виртуальный источник</b><i>${ic('check', 40, 2.4)}</i></div><div class="dstc"><span>на ${esc(b.name)}</span><b>${rub(b.balance)}</b></div>
   <input class="field amt" inputmode="decimal" placeholder="0 ₽" oninput="TU.amount=this.value"><div class="chips">${[1000, 5000, 10000, 50000].map(v => `<button onclick="TU.amount='${v}';document.querySelector('.amt').value='${v}'">${group(v)} ₽</button>`).join('')}</div><div class="hint">Без комиссии · учебные деньги</div><button class="btn" id="tuo">Пополнить</button></div>`, { live: false });
  $('#tuo').onclick = async () => { const amt = parseAmt(TU.amount); if (!amt) { toast('Введите сумму', 'err'); return; } const j = await act('/topup', { account_id: b.id, amount: amt }, 'Счёт пополнен'); if (j) closeSheet(); };
};

/* ---------- ПЛАТЁЖ ---------- */
A.pay = cat => {
  const c = PAYCATS.find(x => x[0] === cat), b = black(), P2 = { ref: '', amount: '', provider: '' };
  const lab = { mobile: 'Номер телефона', utility: 'Лицевой счёт', internet: 'Номер договора', fines: 'Номер постановления', gov: 'Номер услуги', shop: 'Название магазина' }[cat];
  const cb = { mobile: 3, utility: 1, internet: 2, shop: 5 }[cat] || 0;
  openSheet(() => `${shHead(c[1])}<div class="pd"><div class="payh"><div class="lic big" style="background:${c[3]}22;color:${c[3]}">${ic(c[2], 30, 1.9)}</div><div><b>${c[1]}</b><small class="sec">${cb ? 'Кэшбэк ' + cb + '% баллами' : 'Без кэшбэка'}</small></div></div>
   <label class="lbl">${lab}</label><input class="field" id="pr" ${cat === 'mobile' ? 'inputmode="tel" placeholder="+7 900 000-00-00"' : 'placeholder="Введите значение"'} autocomplete="off"><label class="lbl">Сумма</label><input class="field amt" id="pa" inputmode="decimal" placeholder="0 ₽"><div class="hint">Списание со счёта ${esc(b.name)}: ${rub(b.balance, { frac: true })}</div><button class="btn" id="pgo">Оплатить</button></div>`, { live: false });
  const pr = $('#pr'); if (cat === 'mobile') pr.oninput = () => { pr.value = fmtPhone(pr.value); };
  $('#pgo').onclick = async () => { const amt = parseAmt($('#pa').value); if (!amt) { toast('Введите сумму', 'err'); return; } const ref = pr.value.trim(); const j = await act('/pay', { account_id: b.id, category: cat, amount: amt, ref, provider: cat === 'shop' && ref ? ref : c[1] }, 'Платёж выполнен'); if (j) closeSheet(); };
};

/* ---------- КАРТЫ И ПРОДУКТЫ ---------- */
const CF = { show: false };
const bigCard = (c, u, show) => `<div class="cardscene ${c.frozen ? 'frozen' : ''}" onclick="this.firstElementChild.classList.toggle('flipped')"><div class="flip"><div class="face front ${c.design}"><div class="ct"><b>Т-БАНК</b><span>${ic('wifi', 22, 2)}</span></div><div class="chip"></div><div class="cn">${show ? fmtCard(c.number) : '•••• •••• •••• ' + esc(c.number.slice(-4))}</div><div class="cm"><span>${esc((u.name || '').toUpperCase())}</span><span>${esc(c.expiry)}</span></div><div class="cps ${c.ps}">${c.ps === 'mir' ? 'МИР' : c.ps === 'visa' ? 'VISA' : '<u></u><u></u>'}</div>${c.frozen ? '<div class="fz">Заморожена</div>' : ''}</div>
 <div class="face back ${c.design}"><div class="mag"></div><div class="sig">CVV <b>${show ? esc(c.cvv) : '•••'}</b></div><span class="bt">${esc(c.name)}</span></div></div></div>`;
A.card = id => {
  CF.show = false;
  openSheet(() => {
    const c = ST().cards.find(x => x.id === id); if (!c) return `${shHead('Карта')}<div class="empty">Карта удалена</div>`;
    return `${shHead(c.name)}<div class="pd">${bigCard(c, ST().user, CF.show)}<div class="hint c">Нажмите на карту, чтобы перевернуть</div>
    <div class="glass list">
     <div class="li" onclick="A.freeze(${c.id},${c.frozen ? 0 : 1})"><div class="lic" style="background:rgba(76,141,255,.16);color:#4C8DFF">${ic('lock', 22)}</div><div class="lim"><b>Заморозить карту</b><small>Платежи будут недоступны</small></div><span class="sw ${c.frozen ? 'on' : ''}"></span></div>
     ${rowItem('eye', 'rgba(165,107,255,.16)', '#A56BFF', CF.show ? 'Скрыть реквизиты' : 'Показать реквизиты', '', 'CF.show=!CF.show;renderSheet(S.sheets[S.sheets.length-1])')}
     ${rowItem('copy', 'rgba(53,194,123,.16)', '#35C27B', 'Скопировать номер', fmtCard(c.number).replace(/\d(?=.{5})/g, '•').slice(0, 0) + 'Номер карты', `A.copyNum(${c.id})`)}
     ${rowItem('key', 'rgba(245,154,11,.16)', '#F59A0B', 'Показать PIN-код', '', `A.showPin(${c.id})`)}
     ${rowItem('edit', 'rgba(142,142,153,.18)', '#9a9aa8', 'Переименовать', '', `A.renameCard(${c.id})`)}
     ${rowItem('close', 'rgba(229,73,61,.16)', '#E5493D', 'Удалить карту', '', `A.delCard(${c.id})`)}
    </div></div>`;
  });
};
A.freeze = (id, f) => act('/cards/' + id + '/freeze', { frozen: !!f }, f ? 'Карта заморожена' : 'Карта разморожена');
A.copyNum = id => { const c = ST().cards.find(x => x.id === id); try { navigator.clipboard.writeText(c.number); } catch (e) {} toast('Номер карты скопирован', 'ok'); };
A.showPin = async id => { try { const j = await api('/cards/' + id + '/pin', 'POST'); toast('PIN-код карты: ' + j.pin); } catch (e) { toast(e.message, 'err'); } };
A.renameCard = id => askInput('Название карты', ST().cards.find(x => x.id === id).name, v => act('/cards/' + id + '/rename', { name: v }, 'Название изменено'));
A.delCard = id => askConfirm('Удалить карту?', 'Карта будет закрыта без возможности восстановления.', 'Удалить', async () => { const j = await act('/cards/' + id, null, 'Карта удалена', 'DELETE'); if (j) closeSheet(); }, true);

A.issueCard = kind => {
  const I = { kind: kind || 'virtual', design: 'black' };
  const sh = openSheet(() => `${shHead('Новая карта')}<div class="pd"><div class="seg">${[['virtual', 'Виртуальная'], ['plastic', 'Пластиковая']].map(k => `<button class="${I.kind === k[0] ? 'on' : ''}" onclick="I_.kind='${k[0]}';renderSheet(I_.sh)">${k[1]}</button>`).join('')}</div>
  <label class="lbl">Дизайн</label><div class="designs">${['black', 'yellow', 'metal'].map(d => `<div class="dz ${d} ${I.design === d ? 'on' : ''}" onclick="I_.design='${d}';renderSheet(I_.sh)"></div>`).join('')}</div><p class="sec">${I.kind === 'virtual' ? 'Карта появится сразу — платите в интернете и через смартфон.' : 'Пластиковую карту доставим за 5 дней. Бесплатно.'}</p><button class="btn" onclick="A.issueGo(I_)">Выпустить карту</button></div>`, { live: false });
  I.sh = sh; window.I_ = I;
};
A.issueGo = async I => { const j = await act('/cards/issue', { kind: I.kind, design: I.design }, 'Карта выпущена'); if (j) closeSheet(); };
A.openSavings = () => askConfirm('Открыть накопительный счёт?', '14% годовых на остаток, проценты начисляются каждый день. Бесплатно.', 'Открыть', () => act('/accounts/open', { kind: 'savings' }, 'Накопительный счёт открыт'));
A.newGoal = () => {
  openSheet(() => `${shHead('Копилка')}<div class="pd"><label class="lbl">На что копим</label><input class="field" id="gn" placeholder="Например, отпуск" autocomplete="off"><label class="lbl">Цель</label><input class="field amt" id="gs" inputmode="decimal" placeholder="0 ₽"><button class="btn" id="gb">Создать копилку</button></div>`, { live: false });
  $('#gb').onclick = async () => { const g = parseAmt($('#gs').value), n = $('#gn').value.trim(); if (!n || !g) { toast('Заполните название и цель', 'err'); return; } const j = await act('/accounts/open', { kind: 'goal', name: n, goal: g }, 'Копилка создана'); if (j) closeSheet(); };
};
A.openProduct = () => openSheet(() => `${shHead('Новый продукт')}<div class="pd"><div class="glass list">
  ${rowItem('piggy', 'rgba(165,107,255,.16)', '#A56BFF', 'Накопительный счёт', '14% годовых', 'closeSheet();A.openSavings()')}
  ${rowItem('target', 'rgba(53,194,123,.16)', '#35C27B', 'Копилка на цель', 'Откладывайте на мечту', 'closeSheet();A.newGoal()')}
  ${rowItem('card', 'rgba(76,141,255,.16)', '#4C8DFF', 'Виртуальная карта', 'Сразу, бесплатно', "closeSheet();A.issueCard('virtual')")}
  ${rowItem('card', 'rgba(245,154,11,.16)', '#F59A0B', 'Пластиковая карта', 'Доставка за 5 дней', "closeSheet();A.issueCard('plastic')")}</div></div>`, { live: false });

/* ---------- ЧАТ ---------- */
A.chatSend = q => {
  q = (q || '').trim(); if (!q) return;
  S.chat.push({ me: 1, t: q }); S.typing = true; renderTab(); chatDown();
  const l = q.toLowerCase(); let r;
  if (/баланс|сколько/.test(l)) r = 'На счёте Black: ' + rub(black().balance, { frac: true }) + '. Всего на всех счетах: ' + rub(totalBal(), { frac: true }) + '.';
  else if (/заморо|блок/.test(l)) r = 'Откройте карту на главном экране и включите переключатель «Заморозить карту». Разморозить можно там же.';
  else if (/перевод|перевести|отправ/.test(l)) r = 'Раздел «Платежи» → «По телефону» или «По номеру карты». Получатель должен быть клиентом Т-Банка. Переводы без комиссии.';
  else if (/кэшбэк|кешбэк|бонус|балл/.test(l)) r = 'У вас ' + rub(ST().user.bonus, { frac: true }) + ' бонусов. Их можно потратить на счёт: Главная → «Кэшбэк и бонусы».';
  else if (/лимит/.test(l)) r = 'Лимит одной операции — 5 000 000 ₽. Других ограничений в учебной версии нет.';
  else if (/привет|здравств/.test(l)) r = 'Здравствуйте! Чем могу помочь?';
  else r = 'Передал ваш вопрос специалисту. А пока спросите про баланс, переводы, заморозку карты или кэшбэк.';
  setTimeout(() => { S.typing = false; S.chat.push({ me: 0, t: r }); S.chat = S.chat.slice(-40); lsSet('tb_chat', JSON.stringify(S.chat)); if (S.tab === 'chat') { renderTab(); chatDown(); } }, 900);
};
const chatDown = () => setTimeout(() => { const v = $('#views'); v.scrollTop = v.scrollHeight; }, 30);

/* ---------- ОБНОВЛЕНИЕ ПРИЛОЖЕНИЯ ---------- */
const U = { state: 'idle', info: null, pct: 0, msg: '', silent: false };
const native = () => typeof window.AndroidApp !== 'undefined';
A.ver = () => { try { return native() ? AndroidApp.versionName() : 'web'; } catch (e) { return 'web'; } };
A.updates = () => { openSheet(updHtml); if (['idle', 'latest', 'error'].includes(U.state)) A.updCheck(false); };
function updHtml() {
  const i = U.info || {}, S_ = U.state;
  const m = { idle: ['refresh', '', 'Обновление', 'Проверить наличие новой версии', 'Проверить'], checking: ['refresh', 'spin', 'Проверяем…', 'Ищем новую версию', ''], latest: ['check', 'ok', 'У вас последняя версия', 'Версия ' + A.ver(), 'Проверить снова'], available: ['download', '', 'Доступно обновление', 'Версия ' + (i.versionName || '') + (i.size ? ' · ' + (i.size / 1048576).toFixed(1) + ' МБ' : '') + '. Ваши данные сохранятся.', 'Обновить сейчас'], downloading: ['refresh', 'spin', 'Загрузка обновления', 'Загрузка… ' + U.pct + '%', ''], installing: ['download', '', 'Установка', 'Подтвердите установку в системном окне — приложение перезапустится само.', ''], perm: ['info', 'err', 'Нужно разрешение', 'Разрешите установку из этого приложения в настройках, вернитесь и нажмите «Продолжить».', 'Продолжить'], web: ['info', '', 'Только в приложении', 'Проверка обновлений работает в установленном APK.', ''], error: ['info', 'err', 'Не получилось', U.msg || 'Попробуйте позже', 'Повторить'] }[S_];
  return `${shHead('Обновление')}<div class="pd c"><div class="updi ${m[1]}">${ic(m[0], 38, 1.8)}</div><h2>${m[2]}</h2><p class="sec">${esc(m[3])}</p>${S_ === 'available' && i.notes ? '<div class="notes">' + esc(i.notes) + '</div>' : ''}${S_ === 'downloading' ? `<div class="gp lg"><i style="width:${U.pct}%"></i></div>` : ''}${m[4] ? `<button class="btn" onclick="A.updMain()">${m[4]}</button>` : ''}</div>`;
}
const updDraw = () => { const s = S.sheets.find(x => x.fn === updHtml); if (s) renderSheet(s); };
A.updCheck = silent => { if (!native()) { U.state = 'web'; updDraw(); return; } U.silent = !!silent; if (!silent) { U.state = 'checking'; updDraw(); } try { AndroidApp.checkUpdate(); } catch (e) { U.state = silent ? 'idle' : 'error'; U.msg = String(e); updDraw(); } };
A.updMain = () => { if (U.state === 'available' || U.state === 'perm' || U.state === 'error' && U.info && U.info.status === 'available') { U.state = 'downloading'; U.pct = 0; updDraw(); try { AndroidApp.startUpdate(); } catch (e) { U.state = 'error'; U.msg = String(e); updDraw(); } } else A.updCheck(false); };
window.onUpdateCheck = r => { U.info = r; if (r.status === 'available') { U.state = 'available'; if (U.silent) push('Доступно обновление', 'Версия ' + r.versionName + ' — нажмите, чтобы установить', A.updates); } else if (r.status === 'latest') U.state = 'latest'; else { U.state = U.silent ? 'idle' : 'error'; U.msg = r.message; } updDraw(); };
window.onUpdateProgress = p => { U.pct = p; updDraw(); };
window.onUpdateState = (s, m) => { U.state = s; U.msg = m; updDraw(); };

/* ---------- ЗАПУСК ---------- */
async function boot() {
  applyTheme();
  if (S.token && S.st) {
    render(); if (S.st.user.has_pin) showPin('verify');
    refresh(true); setTimeout(() => A.updCheck(true), 2500);
  } else if (S.token) {
    if (await refresh(false)) { hideAuth(); } else showAuth();
  } else showAuth();
}
