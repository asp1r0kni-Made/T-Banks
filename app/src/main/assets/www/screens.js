'use strict';
/* ================= вкладки и экраны ================= */
const miniCard = c => `<div class="mc ${c.design} ${c.frozen ? 'frz' : ''}" onclick="event.stopPropagation();A.card(${c.id})"><span class="mn">${esc(c.number.slice(-4))}</span><span class="ps ${c.ps}">${c.ps === 'mir' ? 'МИР' : c.ps === 'visa' ? 'VISA' : '<u></u><u></u>'}</span>${c.kind === 'virtual' ? '<i class="cloud">' + ic('wifi', 9, 2.4) + '</i>' : ''}</div>`;
const opRow = t => {
  const c = catOf(t.cat);
  return `<div class="op"><div class="oi" style="background:${c.c}">${ic(c.i, 20, 2)}</div><div class="om"><b>${esc(t.title)}</b><small>${esc(t.sub)}</small></div><div class="oa"><b class="${t.amount > 0 ? 'pos' : ''}">${rub(t.amount, { sign: true })}</b>${t.cashback ? '<span class="cb">+' + rub(t.cashback) + '</span>' : ''}${t.channel ? '<small>' + esc(t.channel) + '</small>' : ''}</div></div>`;
};
const rowItem = (i, bg, fg, t, s, fn, right) => `<div class="li" onclick="${fn}"><div class="lic" style="background:${bg};color:${fg}">${ic(i, 22, 1.9)}</div><div class="lim"><b>${t}</b>${s ? '<small>' + s + '</small>' : ''}</div>${right || ic('chev', 16, 2.2)}</div>`;
const initial = n => esc((n || '?').trim()[0] || '?').toUpperCase();

/* ---------- ГЛАВНАЯ ---------- */
const STORIES = [
  ['Ваши траты месяца', 'linear-gradient(160deg,#8A4DFF,#4A1FD8)', 'pie', "A.ops()"],
  ['Кредитный рейтинг', 'linear-gradient(160deg,#2F7BFF,#12B5A0)', 'chart', "pushLayer('credit')"],
  ['Накопительный счёт до 14%', 'linear-gradient(160deg,#1C2F9A,#3B7BFF)', 'piggy', "A.openSavings()"],
  ['Ещё больше о вашей карте', 'linear-gradient(160deg,#5A5F72,#1B1E2B)', 'card', "A.firstCard()"],
  ['Пригласите друга', 'linear-gradient(160deg,#FFC21A,#FF7A00)', 'gift', "A.invite()"]
];
TABV.home = () => {
  const u = ST().user, b = black(), mt = monthTx(), others = ST().accounts.filter(a => a.kind !== 'black');
  const unread = ST().notes.filter(n => !n.read).length;
  const accTile = a => {
    const cs = cardsOf(a.id);
    if (a.kind === 'black') return `<div class="tile glass acc" onclick="pushLayer('account',{id:${a.id}})"><div class="at"><div class="rubc">₽</div><div class="am"><b class="big">${hid(rub(a.balance))}</b><span>${esc(a.name)}</span></div><div class="crown">${ic('crown', 13, 2)}${hid(rub(u.bonus))}</div></div><div class="mcs">${cs.map(miniCard).join('')}</div></div>`;
    const pr = a.kind === 'goal' && a.goal ? `<div class="gp"><i style="width:${Math.min(100, a.balance / a.goal * 100)}%"></i></div><small class="sec">${rub(a.balance)} из ${rub(a.goal)}</small>` : '';
    return `<div class="tile glass acc" onclick="pushLayer('account',{id:${a.id}})"><div class="at"><div class="rubc alt">${ic(a.kind === 'goal' ? 'target' : 'up', 22, 2)}</div><div class="am"><b class="big">${hid(rub(a.balance))}</b><span>${esc(a.name)}${a.kind === 'savings' ? ' · ' + a.percent + '%' : ''}</span></div></div>${pr}</div>`;
  };
  return `<div class="pad">
  <div class="search glass" onclick="A.ops(null,true)">${ic('search', 20, 2)}<span>Поиск</span></div>
  <div class="greet"><div class="avatar" onclick="pushLayer('profile')">${initial(u.name)}</div><h1 onclick="pushLayer('profile')">${esc((u.name || '').split(' ')[0])}<i>${ic('chev', 22, 2.6)}</i></h1>
   <button class="gb glass" onclick="A.notes()">${ic('bell', 21, 2)}${unread ? '<b>' + unread + '</b>' : ''}</button><button class="gb gift" onclick="A.invite()">${ic('gift', 21, 2)}</button></div>
  <div class="stories">${STORIES.map((s, i) => `<div class="story" onclick="${s[3]}"><div class="sin" style="background:${s[1]}"><div class="sart">${ic(s[2], 54, 1.3)}</div><span>${s[0]}</span></div></div>`).join('')}</div>
  <div class="two">
   <div class="tile glass sm" onclick="A.ops()"><b class="h">Все операции</b><span class="sec">Трат в ${MONTHS_P[new Date().getMonth()]}<br><b class="tx">${hid(rub(spendSum(mt)))}</b></span>${spendBar(mt)}</div>
   <div class="tile glass sm" onclick="A.bonus()"><b class="h">Кэшбэк<br>и бонусы</b><div class="partners"><i style="background:#FFD21E;color:#4a3a00">${ic('fuel', 20, 2)}</i><i style="background:#FF8FB1;color:#7a1038">${ic('cup', 20, 2)}</i><i style="background:#35C27B;color:#063d22">${ic('bag', 20, 2)}</i></div></div>
  </div>
  ${ST().accounts.filter(a => a.kind === 'black').map(accTile).join('')}${others.map(accTile).join('')}
  <div class="banner" onclick="A.openSavings()"><div><b>Накопительный счёт</b><span>14% годовых на остаток.<br>Проценты — каждый день</span></div><div class="bart">${ic('piggy', 64, 1.2)}</div></div>
  <button class="btn" onclick="A.openProduct()">Открыть новый счёт или продукт</button></div>`;
};

/* ---------- ПЛАТЕЖИ ---------- */
const PAYCATS = [['mobile', 'Мобильная связь', 'phone', '#4C8DFF'], ['utility', 'ЖКХ', 'flame', '#F59A0B'], ['internet', 'Интернет и ТВ', 'wifi', '#A56BFF'], ['fines', 'Штрафы и налоги', 'shield', '#E5493D'], ['gov', 'Госуслуги', 'gov', '#35B4E8'], ['shop', 'Магазины', 'cart', '#35C27B']];
TABV.pay = () => `<div class="pad"><h1 class="ptitle">Платежи</h1>
 <div class="seclabel">Переводы</div>
 <div class="qgrid">
  ${[['phone', 'По телефону', "A.transfer('phone')", '#4C8DFF'], ['card', 'По номеру карты', "A.transfer('card')", '#A56BFF'], ['swap', 'Между своими', "A.transfer('own')", '#35C27B'], ['down', 'Из другого банка', 'A.topup()', '#F59A0B']].map(q => `<div class="q" onclick="${q[2]}"><div class="qc" style="background:${q[3]}22;color:${q[3]}">${ic(q[0], 24, 1.9)}</div><span>${q[1]}</span></div>`).join('')}
 </div>
 <div class="seclabel">Платежи</div>
 <div class="glass list">${PAYCATS.map(c => rowItem(c[2], c[3] + '22', c[3], c[1], c[0] === 'fines' || c[0] === 'gov' ? 'Без кэшбэка' : 'Кэшбэк до ' + ({ mobile: 3, utility: 1, internet: 2, shop: 5 })[c[0]] + '%', `A.pay('${c[0]}')`)).join('')}</div>
 <div class="seclabel">Сервисы</div>
 <div class="glass list">
  ${rowItem('card', 'rgba(76,141,255,.16)', '#4C8DFF', 'Заказать допкарту', 'Виртуальная — сразу, пластик — доставим', 'A.issueCard()')}
  ${rowItem('target', 'rgba(53,194,123,.16)', '#35C27B', 'Копилка на цель', 'Откладывайте на мечту', 'A.newGoal()')}
  ${rowItem('piggy', 'rgba(165,107,255,.16)', '#A56BFF', 'Накопительный счёт', '14% годовых', 'A.openSavings()')}
  ${rowItem('star', 'rgba(245,184,0,.18)', '#F5B800', 'Потратить бонусы', 'Баллы → рубли', 'A.bonus()')}
 </div></div>`;

/* ---------- ГОРОД ---------- */
const OFFERS = [['fuel', 'АЗС', 'Кэшбэк до 7%', '#FFD21E'], ['cup', 'Кофейни', 'Кэшбэк до 10%', '#FF8FB1'], ['bag', 'Магазины одежды', 'Кэшбэк до 15%', '#A56BFF'], ['pill', 'Аптеки', 'Кэшбэк до 5%', '#35C27B'], ['car', 'Такси и каршеринг', 'Кэшбэк до 8%', '#4C8DFF'], ['plane', 'Путешествия', 'Кэшбэк до 12%', '#35B4E8'], ['heart', 'Красота и здоровье', 'Кэшбэк до 20%', '#E5493D']];
TABV.city = () => `<div class="pad"><h1 class="ptitle">Город</h1>
 <div class="mapcard glass"><div class="mapart">${ic('city', 90, 0.9)}</div><b>Предложения рядом</b><span class="sec">Партнёры с повышенным кэшбэком</span></div>
 <div class="seclabel">Категории партнёров</div>
 <div class="glass list">${OFFERS.map(o => rowItem(o[0], o[3] + '33', o[3], o[1], o[2], "toast('Предложение будет доступно в следующем обновлении')")).join('')}</div></div>`;

/* ---------- ЧАТ ---------- */
TABV.chat = () => {
  const msgs = S.chat.length ? S.chat : [{ me: 0, t: 'Здравствуйте! Я помощник Т-Банка. Спросите про баланс, карты, переводы или кэшбэк.' }];
  return `<div class="pad chatp"><h1 class="ptitle">Чат</h1><div class="msgs">${msgs.map(m => `<div class="msg ${m.me ? 'me' : ''}">${esc(m.t)}</div>`).join('')}${S.typing ? '<div class="msg typing"><i></i><i></i><i></i></div>' : ''}</div>
  <div class="chips">${['Баланс', 'Как заморозить карту?', 'Как перевести деньги?', 'Кэшбэк'].map(q => `<button onclick="A.chatSend('${q}')">${q}</button>`).join('')}</div>
  <form class="chatin glass" onsubmit="event.preventDefault();A.chatSend(this.q.value);this.q.value=''"><input name="q" placeholder="Сообщение" autocomplete="off"><button type="submit">${ic('up', 20, 2.4)}</button></form></div>`;
};

/* ---------- ВИТРИНА ---------- */
function score() {
  const s = ST(); return Math.min(950, 600 + Math.min(150, s.tx.length * 3) + Math.min(150, Math.floor(totalBal() / 100 / 1000) * 10) + Math.min(60, s.accounts.length * 20));
}
function gauge(sc, big) {
  const R = 70, cx = 90, cy = 90, a0 = 150, sw = 240, f = Math.max(0, Math.min(1, (sc - 1) / 998));
  const pt = a => [cx + R * Math.cos(a * Math.PI / 180), cy + R * Math.sin(a * Math.PI / 180)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a0 + sw), [kx, ky] = pt(a0 + sw * f);
  const id = 'g' + Math.floor(Math.random() * 1e6);
  return `<svg viewBox="0 0 180 150" class="gauge ${big ? 'big' : ''}"><defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FF6A5F"/><stop offset=".5" stop-color="#FFD84A"/><stop offset="1" stop-color="#35D07F"/></linearGradient></defs>
  <path d="M${x0} ${y0} A${R} ${R} 0 1 1 ${x1} ${y1}" fill="none" stroke="url(#${id})" stroke-width="11" stroke-linecap="round" opacity=".95"/>
  <circle cx="${kx}" cy="${ky}" r="8" fill="#35D07F" stroke="#fff" stroke-width="3"/><text x="90" y="98" text-anchor="middle" font-size="40" font-weight="800" fill="#fff">${sc}</text></svg>`;
}
TABV.show = () => `<div class="pad"><h1 class="ptitle">Витрина</h1>
 <div class="tile credit" onclick="pushLayer('credit')"><div><b class="h">Кредитный рейтинг</b><span>Узнайте, как вас оценивают банки</span></div>${gauge(score())}</div>
 <div class="pgrid">
  ${[['Накопительный счёт', '14% годовых', 'piggy', 'linear-gradient(150deg,#2F5BFF,#17C3B2)', 'A.openSavings()'], ['Копилка', 'На вашу цель', 'target', 'linear-gradient(150deg,#14B86F,#0E8E86)', 'A.newGoal()'], ['Виртуальная карта', 'Выпуск за секунду', 'card', 'linear-gradient(150deg,#7A4DFF,#3A1FB8)', "A.issueCard('virtual')"], ['Бонусы', hid(rub(ST().user.bonus)), 'star', 'linear-gradient(150deg,#FFC21A,#FF7A00)', 'A.bonus()']].map(p => `<div class="prod" style="background:${p[3]}" onclick="${p[4]}"><div class="pa">${ic(p[2], 70, 1.1)}</div><b>${p[0]}</b><span>${p[1]}</span></div>`).join('')}
 </div>
 <div class="seclabel">Ещё</div>
 <div class="glass list">${rowItem('shield', 'rgba(53,194,123,.16)', '#35C27B', 'Безопасность', 'Код-пароль и заморозка карт', "pushLayer('profile')")}${rowItem('chart', 'rgba(76,141,255,.16)', '#4C8DFF', 'Аналитика трат', 'Куда уходят деньги', 'A.ops()')}</div></div>`;

/* ---------- слои ---------- */
const hdBack = (title, extra = '') => `<div class="hdbar"><button class="rb" onclick="A.back()">${ic('back', 22, 2.4)}</button><span>${title || ''}</span><div style="min-width:38px;text-align:right">${extra}</div></div>`;
LAYERS.account = p => {
  const a = accById(p.id); if (!a) { setTimeout(popLayer, 0); return ''; }
  const cs = cardsOf(a.id), txs = ST().tx.filter(t => t.account_id === a.id), mt = monthTx(a.id), u = ST().user;
  if (a.kind === 'black') return `<div class="hd"><div class="glow"></div>${hdBack('')}
   <div class="hdt">${esc(a.name)}<i>${ic('edit', 14, 2)}</i></div><div class="hdb">${hid(rub(a.balance, { frac: true }))}</div>
   <div class="hmcs">${cs.map(miniCard).join('')}<div class="mc add" onclick="A.issueCard()">${ic('plus', 18, 2.4)}</div></div></div>
  <div class="over"><div class="actions glass">${[['ring', 'Оплатить', "A.tab('pay')"], ['plus', 'Пополнить', 'A.topup()'], ['send', 'Перевести', "A.transfer('phone')"]].map(x => `<button onclick="${x[2]}"><i>${ic(x[0], 24, 2)}</i>${x[1]}</button>`).join('')}</div>
  <div class="two"><div class="tile glass sm" onclick="A.ops(${a.id})"><b class="h">Операции<br>по счёту</b><span class="sec">Трат в этом месяце<br><b class="tx">${hid(rub(spendSum(mt)))}</b></span>${spendBar(mt)}</div>
  <div class="tile glass sm" onclick="A.bonus()"><div class="crown dk">${ic('crown', 13, 2)}${hid(rub(u.bonus))}</div><b class="h" style="margin-top:8px">Накоплено кэшбэка</b><span class="sec">Можно потратить<br>в любой момент</span></div></div>
  <div class="glass tile"><div class="rowh"><b class="h">Бонусы по ${esc(a.name)}</b><a class="lnk" onclick="A.bonus()">Все</a></div><div class="hs">${[['Кэшбэк до 30%', ['#2F7A5B', '#F5C32A', '#111']], ['Кэшбэк до 5% на всё', ['#A56BFF', '#FF8FB1', '#35B4E8']], ['Процент на остаток', ['#4C8DFF', '#35C27B', '#F59A0B']]].map(b => `<div class="bonus"><b>${b[0]}</b><div>${b[1].map(c => `<i style="background:${c}"></i>`).join('')}</div></div>`).join('')}</div></div>
  <div class="rowh pd"><h3>Последние операции</h3><a class="lnk" onclick="A.ops(${a.id})">Все</a></div><div class="glass list ops">${txs.slice(0, 5).map(opRow).join('') || '<div class="empty">Операций пока нет</div>'}</div></div>`;
  const pr = a.kind === 'goal' && a.goal ? `<div class="gp lg"><i style="width:${Math.min(100, a.balance / a.goal * 100)}%"></i></div><div class="hdsub">${rub(a.balance)} из ${rub(a.goal)} · ${Math.min(100, Math.round(a.balance / a.goal * 100))}%</div>` : `<div class="hdsub">${a.percent}% годовых · проценты начисляются ежедневно</div>`;
  return `<div class="hd ${a.kind}"><div class="glow"></div>${hdBack('')}<div class="hdt">${esc(a.name)}</div><div class="hdb">${hid(rub(a.balance, { frac: true }))}</div>${pr}</div>
  <div class="over"><div class="actions glass">${[['plus', 'Пополнить', `A.moveTo(${a.id})`], ['up', 'Снять', `A.moveFrom(${a.id})`], ['close', 'Закрыть', `A.closeAcc(${a.id})`]].map(x => `<button onclick="${x[2]}"><i>${ic(x[0], 24, 2)}</i>${x[1]}</button>`).join('')}</div>
  <div class="rowh pd"><h3>Операции</h3></div><div class="glass list ops">${txs.slice(0, 20).map(opRow).join('') || '<div class="empty">Операций пока нет</div>'}</div></div>`;
};
LAYERS.credit = () => { const sc = score(), s = ST(); return `<div class="blue"><div class="hdbar"><button class="lnk" onclick="A.back()">Закрыть</button></div>
 <h1 class="ct">Кредитный рейтинг</h1><p class="cs">Показывает, как вас оценивают банки. Чем выше рейтинг, тем больше шанс получить кредит на нужную сумму и по низкой ставке</p>${gauge(sc, true)}<div class="gl"><span>1</span><span>999</span></div>
 <div class="wcard"><b>${sc > 750 ? 'У вас высокие шансы получить кредит' : sc > 650 ? 'У вас хорошие шансы получить кредит' : 'Рейтинг можно улучшить'}</b><span class="chipg">${sc > 750 ? 'Отлично' : sc > 650 ? 'Хорошо' : 'Средне'}</span></div>
 <h3 class="cs2">Как повысить рейтинг</h3><div class="wcard soft"><b>Пользуйтесь счетами и картой регулярно</b><span>Рейтинг растёт вместе с числом операций (${s.tx.length}) и остатком на счетах. Откройте накопительный счёт — это тоже плюс.</span><span class="chipg">Рекомендуем</span></div></div>`; };
LAYERS.profile = () => { const u = ST().user; return `<div class="hdbar plain"><button class="rb" onclick="A.back()">${ic('back', 22, 2.4)}</button><span>Профиль</span><div style="width:38px"></div></div>
 <div class="pad prof"><div class="pav">${initial(u.name)}</div><h2>${esc(u.name)}</h2><div class="sec">${esc(fmtPhone(u.phone))}</div>
 <div class="glass tile pts"><div><span class="sec">Бонусные баллы</span><b class="big acc">${rub(u.bonus)}</b></div><button class="btn sm" onclick="A.bonus()">Потратить</button></div>
 <div class="glass list">
  ${rowItem('user', 'rgba(76,141,255,.16)', '#4C8DFF', 'Изменить имя', '', 'A.editName()')}
  ${rowItem('lock', 'rgba(53,194,123,.16)', '#35C27B', 'Код для входа', u.has_pin ? 'Включён' : 'Выключен', 'A.togglePin()', `<span class="sw ${u.has_pin ? 'on' : ''}"></span>`)}
  ${rowItem(S.hidden ? 'eyeoff' : 'eye', 'rgba(165,107,255,.16)', '#A56BFF', 'Скрывать суммы', '', 'A.toggleHide()', `<span class="sw ${S.hidden ? 'on' : ''}"></span>`)}
  ${rowItem('settings', 'rgba(245,154,11,.16)', '#F59A0B', 'Светлая тема', '', 'A.toggleTheme()', `<span class="sw ${S.theme === 'light' ? 'on' : ''}"></span>`)}
  ${rowItem('star', 'rgba(245,184,0,.18)', '#F5B800', 'Достижения', '', 'A.achv()')}
 </div><div class="glass list">
  ${rowItem('download', 'rgba(255,221,45,.16)', '#FFDD2D', 'Обновление приложения', 'Версия ' + A.ver(), 'A.updates()')}
  ${rowItem('settings', 'rgba(142,142,153,.18)', '#9a9aa8', 'Сервер', esc(S.server.replace(/^https?:\/\//, '')), 'A.serverSheet()')}
 </div><div class="glass list">${rowItem('logout', 'rgba(229,73,61,.16)', '#E5493D', 'Выйти из аккаунта', '', 'A.logout()')}</div>
 <p class="ver">Т-Банк · учебный симулятор · деньги виртуальные</p></div>`; };
