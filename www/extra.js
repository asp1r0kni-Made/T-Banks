'use strict';
/* ---------- анимированные иконки (TGS): свои + загруженные админом ---------- */
const DEF={gram_send:'tgs/send.tgs',gram_tap:'tgs/tap.tgs',empty:'tgs/empty.tgs',pin:'tgs/pin.tgs',success:'tgs/success.tgs'},TG={};
const tgsData=u=>TG[u]||(TG[u]=fetch(u).then(r=>r.arrayBuffer()).then(b=>JSON.parse(pako.ungzip(new Uint8Array(b),{to:'string'}))));
const fix=d=>{d.assets=d.assets||[];d.chars=d.chars||[];d.markers=d.markers||[];const ids=new Set(d.assets.map(a=>a.id)),f=ls=>(ls||[]).filter(l=>{if(l.ty===4&&!l.shapes)l.shapes=[];l.ks=l.ks||{};return l.ty!==0||ids.has(l.refId)});d.layers=f(d.layers);d.assets.forEach(a=>{if(a.layers)a.layers=f(a.layers)});return d};
async function mount(el,slot,o){o=o||{};if(!el)return null;const u=ICONS[slot]?BASE+ICONS[slot]:DEF[slot];if(!u)return null;
 try{const d=await tgsData(u);el.innerHTML='';return lottie.loadAnimation({container:el,renderer:'svg',loop:o.loop!==false,autoplay:o.autoplay!==false,animationData:fix(JSON.parse(JSON.stringify(d)))})}catch(e){return null}}
const IMG=n=>`<img src="img/${n}.webp" alt="" draggable="false">`;
function icons(){const g=ICONS.gram_list||'',u=ICONS.usdt_list||'';
 if(MNT.g!==g){MNT.g=g;if(g)mount($('#ico-gram'),'gram_list');else $('#ico-gram').innerHTML=GRAM}
 if(MNT.u!==u){MNT.u=u;if(u)mount($('#ico-usdt'),'usdt_list');else $('#ico-usdt').innerHTML=USDT}}
/* ---------- валюты ---------- */
const CUR={rub:['Российский рубль','₽',2,0],usd:['Доллар США','$',2,1],eur:['Евро','€',2,1],cny:['Китайский юань','¥',2,1],btc:['Биткоин','BTC',8,0],gram:['Gram','GRAM',4,0]};
const rate=k=>({rub:1,usd:1/PR.usdt,eur:1/94.3,cny:1/11.35,btc:1/7.9e6,gram:1/PR.gram})[k];
let CURK=localStorage.getItem('cur')||'rub',PRIV=localStorage.getItem('priv')==='1',TOT=0,POP=null;
const cv=(r,k=CURK)=>{const c=CUR[k],n=nf(r*rate(k),c[2]);return c[3]?c[1]+n:n+' '+c[1]};
const fmtBal=x=>{const c=CUR[CURK],n=nf(x*rate(CURK),c[2]);return c[3]?`<small>${c[1]}</small>${n}`:`${n}<small>${c[1]}</small>`};
function countH(el,to){const from=+el.dataset.v||0;el.dataset.v=to;if(from===to){el.innerHTML=fmtBal(to);return}const t0=performance.now();
 (function f(t){const k=Math.min(1,(t-t0)/700),e=1-Math.pow(1-k,3);el.innerHTML=fmtBal(from+(to-from)*e);if(k<1)requestAnimationFrame(f)})(t0)}
/* ---------- лента ---------- */
const EMO={send:['up-green','Отправлено'],credit:['gift-teal','Пополнение'],swap:['pm-bolt-circle','Обмен'],stake:['star-circle','Стейкинг'],unstake:['star-circle','Вывод из стейкинга'],p2p:['up-green','P2P']};
function renderFeed(){const{items,pending}=HIST;
 if(!items.length&&!pending.length){$('#feed').innerHTML='<div class="empty"><div class="eanim" id="eanim"></div><b>Нет активности</b><p>История операций в этом кошельке пока отсутствует.</p></div>';mount($('#eanim'),'empty');return}
 const row=(ic,rot,t,s,memo,r,cls)=>`<div class="tx"><div class="tic">${IMG(ic).replace('<img','<img'+(rot?' style="transform:rotate(180deg)"':''))}</div><div class="mid"><b>${t}</b><span>${s}</span>${memo?`<em>${esc(memo)}</em>`:''}</div><div class="rt amt ${cls||''}">${r}</div></div>`;
 $('#feed').innerHTML=pending.map(p=>row('clock',0,'Заявка на пополнение','Ожидает подтверждения · '+fmtT(p.ts),'',nf(p.amount)+' '+NAME[p.token])).join('')+
 items.map(r=>{const inn=r.dir==='in',[ic,t0]=EMO[r.kind];let t=t0,s=fmtT(r.ts);
  if(r.kind==='send'||r.kind==='p2p'){t=r.kind==='p2p'?(inn?'P2P · куплено':'P2P · продано'):(inn?'Получено':'Отправлено');s=(inn?'от @':'для @')+esc(r.peer||'?')+' · '+s}
  else if(r.kind==='swap')s=NAME[r.token]+' → '+NAME[r.token2]+' · '+s;
  const sw=r.kind==='swap',plus=inn||r.kind==='unstake';
  return row(ic,(r.kind==='send'||r.kind==='p2p')&&inn,t,s,r.memo,sw?'+'+nf(r.amount2)+' '+NAME[r.token2]:(plus?'+':'−')+nf(r.amount)+' '+NAME[r.token],plus||sw?'in':'')}).join('')}
/* ---------- обновление данных (один запрос /api/state) ---------- */
let LASTIN=0;
function paint(){if(!ME)return;$('#ini').textContent=ini();TOT=(ME.gram+ME.staked)*PR.gram+ME.usdt*PR.usdt;
 const b=$('#bal');if(PRIV){b.innerHTML='••••';b.dataset.v=0}else countH(b,TOT);
 count($('#stk'),ME.staked,x=>nf(x,4)+' GRAM');
 $('#gv').textContent=nf(ME.gram,4)+' GRAM';$('#gr').textContent=cv(ME.gram*PR.gram);$('#uv').textContent=nf(ME.usdt,4)+' USD₮';$('#ur').textContent=cv(ME.usdt*PR.usdt);
 $('#gp').textContent=cv(PR.gram);$('#up').textContent=cv(PR.usdt);renderFeed()}
async function refresh(quiet){if(!TOKEN)return;const m=await api('/api/state');if(!m.auth)return;ME=m.user;ICONS=m.icons||{};if(m.price)PR=m.price;
 const h=m.history,top=h.items.find(x=>x.dir==='in'&&x.kind==='send');
 if(quiet&&LASTIN&&top&&top.id>LASTIN)toast(`Получено ${nf(top.amount)} ${NAME[top.token]} от @${top.peer}`);
 LASTIN=Math.max(LASTIN,0,...h.items.filter(x=>x.dir==='in').map(x=>x.id));HIST=h;paint();icons()}
/* ---------- скрытие баланса (пыль) ---------- */
function dust(){const c1=$('#c1'),cn=$('#dust'),r=c1.getBoundingClientRect(),w=cn.width=Math.round(r.width/2),h=cn.height=Math.round(r.height/2),ctx=cn.getContext('2d');
 const P=[];for(let i=0;i<620;i++){const x=Math.random()*w;P.push({x,y:Math.random()*h,vx:.5+Math.random()*1.6,vy:(Math.random()-.5)*.9,d:x/w*520+Math.random()*180,s:.8+Math.random()*1.6,l:700+Math.random()*700,c:Math.random()<.5?'255,255,255':'170,220,255'})}
 const t0=performance.now();(function f(t){const e=t-t0;ctx.clearRect(0,0,w,h);let n=0;
  for(const p of P){const a=e-p.d;if(a<0){ctx.fillStyle='rgba('+p.c+',.5)';ctx.fillRect(p.x,p.y,p.s,p.s);n++;continue}
   const k=a/p.l;if(k>=1)continue;n++;ctx.fillStyle='rgba('+p.c+','+(.75*(1-k)).toFixed(2)+')';ctx.fillRect(p.x+p.vx*a*.06*(1+k*2),p.y+p.vy*a*.06-k*k*14,p.s,p.s)}
  if(n&&e<2800)requestAnimationFrame(f);else ctx.clearRect(0,0,w,h)})(t0)}
/* карта: сворачивание при прокрутке и скрытие (как на видео) */
const CPS={v:0,anim:0};
function setCP(v){CPS.v=Math.max(0,Math.min(1,v));$('#cards').style.setProperty('--cp',CPS.v);$('#c1').classList.toggle('cmp',CPS.v>.6)}
function animCP(to,ms){cancelAnimationFrame(CPS.anim);const from=CPS.v,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);setCP(from+(to-from)*e);if(k<1)CPS.anim=requestAnimationFrame(f)})(t0)}
const DHP=()=>30.5*Math.min(innerWidth/100,4.6);
(()=>{const p=$('#p0');let ly=0,vy=0,drag=false,wt=0;
 p.addEventListener('touchstart',e=>{ly=e.touches[0].clientY;vy=0;drag=false;cancelAnimationFrame(CPS.anim)},{passive:true});
 p.addEventListener('touchmove',e=>{if(PRIV)return;const y=e.touches[0].clientY,dy=y-ly;ly=y;vy=dy;
  if((dy<0&&CPS.v<1)||(dy>0&&CPS.v>0&&p.scrollTop<=0)){setCP(CPS.v-dy/DHP());drag=true;if(e.cancelable)e.preventDefault()}},{passive:false});
 p.addEventListener('touchend',()=>{if(!drag||PRIV)return;animCP(vy<-4?1:vy>4?0:(CPS.v>.5?1:0),340)},{passive:true});
 p.addEventListener('wheel',e=>{if(PRIV)return;if((e.deltaY>0&&CPS.v<1)||(e.deltaY<0&&CPS.v>0&&p.scrollTop<=0)){e.preventDefault();setCP(CPS.v+e.deltaY/DHP());clearTimeout(wt);wt=setTimeout(()=>animCP(CPS.v>.5?1:0,260),120)}},{passive:false})})();
function applyPriv(anim){document.body.classList.toggle('priv',PRIV);if(anim){if(PRIV){$('#cards').classList.add('dusting');dust();setTimeout(()=>animCP(1,800),420);setTimeout(()=>$('#cards').classList.remove('dusting'),1600)}else animCP(0,620)}else setCP(PRIV?1:0);if(ME)paint()}
function setPriv(v,anim){PRIV=v;localStorage.setItem('priv',v?'1':'0');applyPriv(anim)}
$$('.rt.amt').forEach(el=>el.addEventListener('click',ev=>{ev.stopPropagation();setPriv(!PRIV,true)},true));
$('#c1').addEventListener('click',()=>{if(PRIV)setPriv(false,true);else if(CPS.v>.6)animCP(0,520)});
/* ---------- всплывающие окна: валюта и меню кошелька ---------- */
function closePop(){if(POP){const d=POP;POP=null;d.classList.remove('on');setTimeout(()=>d.remove(),260)}}
function popup(html,top){closePop();top-=$('#app').getBoundingClientRect().top;const d=document.createElement('div');d.className='popw';d.innerHTML=`<div class="popb"></div><div class="pop glass" style="top:${top}px">${html}</div>`;
 $('#app').appendChild(d);d.querySelector('.popb').onclick=closePop;requestAnimationFrame(()=>d.classList.add('on'));POP=d;return d}
function curPop(){if(PRIV||CPS.v>.6)return;const r=$('#c1').getBoundingClientRect(),d=popup(Object.keys(CUR).map(k=>`<button class="cr ${k===CURK?'on':''}" data-k="${k}"><i class="rd"></i><div><b>${CUR[k][0]}</b><span>${cv(TOT,k)}</span></div></button>`).join(''),r.top+r.height*.42);
 d.querySelectorAll('.cr').forEach(b=>b.onclick=()=>{CURK=b.dataset.k;localStorage.setItem('cur',CURK);$('#bal').dataset.v=0;paint();closePop()})}
function walletPop(){const r=$('#c1').getBoundingClientRect(),a=ME.address,short=a.slice(0,6)+'···'+a.slice(-6),
 d=popup(`<button class="mr" id="m1">${IMG('share')}<span>Ссылка на кошелёк</span></button><div class="mr sep">${IMG('ton')}<div style="flex:1;min-width:0"><b>TON</b><small>${short}</small></div><button class="mb" id="m2"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg></button><button class="mb" id="m3" style="color:#3d9bff"><svg viewBox="0 0 30 30"><rect x="3" y="3" width="9" height="9" rx="2"/><rect x="18" y="3" width="9" height="9" rx="2"/><rect x="3" y="18" width="9" height="9" rx="2"/><path d="M19 19h1M25 19h1M19 25h1M25 25h1M22 22h1"/></svg></button></div><button class="mr" id="m4"><span class="stk">${IMG('ton')}${IMG('telegram')}${IMG('gear')}</span><span>Все блокчейны</span><svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>`,r.bottom-r.height*.2);
 d.querySelector('#m1').onclick=()=>{copyT('ton://transfer/'+a);closePop()};d.querySelector('#m2').onclick=()=>{copyT(a);closePop()};
 d.querySelector('#m3').onclick=()=>{closePop();deposit()};d.querySelector('#m4').onclick=()=>{closePop();deposit()}}
$('#balb').onclick=e=>{e.stopPropagation();if(PRIV){setPriv(false,true);return}if(CPS.v>.6){animCP(0,520);return}curPop()};$('#cnm').onclick=e=>{e.stopPropagation();if(ME)walletPop()};
/* ---------- пополнить ---------- */
let QRL=null;const loadQR=()=>QRL||(QRL=new Promise(r=>{const s=document.createElement('script');s.src='qrcode.js';s.onload=r;document.head.appendChild(s)}));
async function deposit(){await loadQR();const a=ME.address,NET=['TON','Bitcoin','Ethereum','Solana'];
 const d=scr(`<div class="sbody" style="padding:0"><div class="depbg"><div class="hd"><button class="chip glass" onclick="profile()"><span class="mini">${ini()}</span>${UD}</button><div class="qtabs glass" id="qt">${NET.map((n,i)=>`<span class="${i?'':'on'}">${n}</span>`).join('')}</div><button class="ib" onclick="back()">${XI}</button></div>
 <div class="dpw"><div class="dtr" id="dtr"><div class="dp"><div class="qrc">${qrSvg(a)}<img class="qgem" src="img/gem.webp" alt=""></div></div>${NET.slice(1).map(n=>`<div class="dp"><div class="qrc soon"><b>${n}</b><span>Эта сеть пока не поддерживается</span></div></div>`).join('')}</div></div></div>
 <div class="panel glass dadr" style="margin:0;border-radius:0 0 calc(var(--u)*7) calc(var(--u)*7)"><div style="color:var(--blue);font-size:calc(var(--u)*4.4)" id="dh">Мой адрес GRAM (TON)</div>
 <div class="adr" id="da" onclick="copyT(ME.address)"><b>${a.slice(0,6)}</b>${a.slice(6,-6)}<b>${a.slice(-6)}</b><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg></div>
 <p id="dn" style="color:var(--muted);font-size:calc(var(--u)*3.8);line-height:1.45;margin:0">Отправляйте только GRAM или активы на базе TON на этот адрес. Получить перевод можно и по имени: <b style="color:#fff">@${esc(ME.username)}</b>.</p></div>
 <div class="panel glass menu"><button onclick="buyCard()">Покупка с карты</button><button onclick="trade('usdt','gram')">Покупка за криптовалюту</button></div></div>`);
 d.querySelectorAll('#qt span').forEach((t,i)=>t.onclick=()=>{d.querySelectorAll('#qt span').forEach((x,k)=>x.classList.toggle('on',k===i));$('#dtr').style.transform=`translateX(${-i*100}%)`;
  $('#da').style.display=$('#dn').style.display=i?'none':'';$('#dh').textContent=i?'Сеть '+NET[i]+' пока недоступна':'Мой адрес GRAM (TON)'})}
/* ---------- отправить ---------- */
function sendScr(){let T='gram';
 const d=scr(`${hd('Отправить')}<div class="sbody" style="padding:calc(var(--u)*2) calc(var(--u)*4)"><div class="box glass"><div class="bt"><span>Отправить на</span></div><div class="big-in" style="margin-top:calc(var(--u)*2.4)"><input id="st" style="font-size:calc(var(--u)*4.4)" placeholder="Адрес или @имя" autocapitalize="none"><button class="lnk" id="sp0">Вставить</button><button class="ib" id="sqr"><svg viewBox="0 0 30 30" style="stroke:var(--blue);fill:none;stroke-width:2.4"><path d="M3 10V5a2 2 0 012-2h5M20 3h5a2 2 0 012 2v5M27 20v5a2 2 0 01-2 2h-5M10 27H5a2 2 0 01-2-2v-5M3 15h24"/></svg></button></div></div>
 <div class="box glass"><div class="bt"><span>Сумма</span><span id="sm"></span></div><div class="big-in"><input id="sa" type="number" inputmode="decimal" placeholder="0"><button class="tk" id="sc"></button></div><div class="bt" style="margin-top:calc(var(--u)*3)"><span id="sr"></span><span>Комиссия: 0</span></div></div>
 <div class="box glass"><div class="bt"><span>Комментарий или Memo</span></div><textarea class="fld" id="smo" rows="2" maxlength="120" style="margin:calc(var(--u)*2.6) 0 0;resize:none" placeholder="Добавьте сообщение, если нужно"></textarea></div><div class="msg" id="se"></div></div><button class="cta off" id="ss">Введите адрес</button>`);
 const upd=()=>{const v=+$('#sa').value||0,ad=$('#st').value.trim();$('#sc').innerHTML=chip(T);$('#sm').innerHTML=`Максимум: <b style="color:var(--blue);cursor:pointer" id="mx">${nf(ME[T])} ${NAME[T]}</b>`;
  $('#mx').onclick=()=>{$('#sa').value=ME[T];upd()};$('#sr').textContent='≈ '+cv(v*PR[T]);const b=$('#ss');
  b.textContent=!ad?'Введите адрес':v<=0?'Введите сумму':v>ME[T]?'Недостаточно средств':'Отправить';b.classList.toggle('off',!ad||v<=0||v>ME[T])};
 d.querySelector('#sc').onclick=()=>{T=T==='gram'?'usdt':'gram';upd()};d.querySelector('#sa').oninput=d.querySelector('#st').oninput=upd;upd();
 d.querySelector('#sp0').onclick=async()=>{try{$('#st').value=(await navigator.clipboard.readText()).trim();upd()}catch(e){toast('Нет доступа к буферу обмена')}};
 d.querySelector('#sqr').onclick=()=>toast('Сканер QR скоро появится');
 d.querySelector('#ss').onclick=async()=>{if($('#ss').classList.contains('off'))return shake($('#ss'));
  const r=await api('/api/send',{to:$('#st').value,token:T,amount:$('#sa').value,memo:$('#smo').value});if(r.error){$('#se').textContent=r.error;return shake($('#ss'))}
  const a=$('#sa').value;await refresh();done('Отправлено',`${nf(a)} ${NAME[T]} → @${esc(r.to)}`,'gram_send')}}
/* ---------- токен: график, периоды ---------- */
const RNG=[['Все',200,'all',1095],['1 г',150,'y',365],['3 мес',120,'3m',90],['1 мес',120,'m',30],['1 нед',120,'w',7],['1 д',96,'d',1]];
function series(t,k,n){let s=(t==='gram'?7:3)*977+k.length*131+n;const r=()=>(s=s*16807%2147483647)/2147483647,vol={d:.004,w:.008,m:.015,'3m':.025,y:.05,all:.07}[k];let v=1;const o=[];
 for(let i=0;i<n;i++){v*=1+(r()-.5)*vol*2;o.push(v)}const sc=PR[t]/o[n-1];return o.map(x=>x*sc)}
function tokScr(t){const isG=t==='gram';let R=5,data=[],dim=0;
 const d=scr(`<div class="hd"><button class="ib" onclick="back()">${ARR}</button><div class="ht"><h1 id="h1">${isG?'Gram':'Tether USD'}</h1><div class="hb" id="hb"><b>${nf(ME[t],4)} ${NAME[t]}</b><span>${cv(ME[t]*PR[t])}</span></div></div><button class="ib" id="tm"><svg viewBox="0 0 24 24" style="fill:#bbb;stroke:none"><circle cx="12" cy="5" r="1.800"/><circle cx="12" cy="12" r="1.800"/><circle cx="12" cy="19" r="1.800"/></svg></button></div>
 <div class="sbody" style="padding:0 0 calc(var(--u)*22)" id="tb"><div class="hero"><div class="big" id="tb0">${isG?IMG('gram'):USDT}</div><h2><span id="tbv" data-v="0">0</span> <small>${NAME[t]}</small></h2><p>${cv(ME[t]*PR[t])}</p></div>
 <div class="acts sticky" style="padding-top:calc(var(--u)*4)"><button class="act" onclick="deposit()"><i class="glass"><svg viewBox="0 0 34 34"><path d="M17 5v24M5 17h24"/></svg></i>Пополнить</button><button class="act" onclick="sendScr()"><i class="glass"><svg viewBox="0 0 34 34"><path d="M17 29V6M7 15l10-10 10 10"/></svg></i>Отправить</button><button class="act" onclick="trade('${t}','${isG?'usdt':'gram'}')"><i class="glass"><svg viewBox="0 0 34 34"><path d="M5 12h24M23 6l6 6M29 22H5M11 28l-6-6"/></svg></i>Торговля</button><button class="act" onclick="stakeScr()"><i class="glass"><svg viewBox="0 0 34 34"><ellipse cx="17" cy="10" rx="9" ry="5"/><path d="M8 10v4c0 3 4 5 9 5s9-2 9-5v-4M8 19v4c0 3 4 5 9 5s9-2 9-5v-4"/></svg></i>Стейкинг</button></div>
 <div class="panel glass" style="padding:calc(var(--u)*3.6) 0 calc(var(--u)*3)"><div style="padding:0 calc(var(--u)*4);color:var(--muted);font-size:calc(var(--u)*4.2)">Цена</div><div style="padding:0 calc(var(--u)*4);font-size:calc(var(--u)*5);font-weight:600" id="cp"></div><div class="cht" id="cht"></div><div class="tl" id="tl"></div><div class="rng glass" id="rng">${RNG.map((r,i)=>`<button class="${i===5?'on':''}">${r[0]}</button>`).join('')}</div></div>
 <div class="panel glass" style="padding:calc(var(--u)*3.6) calc(var(--u)*4)"><div class="ihd" id="ih"><span>Информация</span><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></div><p id="ip" style="margin:calc(var(--u)*1.4) 0 0;font-size:calc(var(--u)*4.4);line-height:1.55">${isG?'Gram — нативная монета блокчейна TON. Её можно отправлять, обменивать и ставить в стейкинг с доходностью 13.91% годовых.':'Tether USD (USD₮) — стейблкоин в сети TON, привязанный к доллару США.'}</p></div></div>
 <button class="cta green" onclick="trade('${isG?'usdt':'gram'}','${t}')">Купить</button>`,'r');
 count(d.querySelector('#tbv'),ME[t],x=>nf(x,4));
 const sb=d.querySelector('#tb');sb.onscroll=()=>d.style.setProperty('--p',Math.min(1,sb.scrollTop/(26*UPX())));
 const big=d.querySelector('#tb0');if(isG){const ov=document.createElement('div');ov.className='ov';big.appendChild(ov);const tap=async()=>{const a=await mount(ov,'gram_tap',{loop:false});if(a)a.addEventListener('complete',()=>{ov.innerHTML=''})};big.onclick=tap;setTimeout(tap,450)}
 const draw=()=>{const[n,k,days]=[RNG[R][1],RNG[R][2],RNG[R][3]];data=series(t,k,n);const mn=Math.min(...data),mx=Math.max(...data),W=300,H=100,sp=mx-mn||1,
  pts=data.map((v,i)=>[i*W/(n-1),H-(v-mn)/sp*(H-14)-6]),ln=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(''),dn=data[n-1]<data[0],c=dn?'#3d9bff':'#3ddc84';
  d.querySelector('#cht').innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".28"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${ln}L${W} ${H}L0 ${H}Z" fill="url(#ag)"/><path d="${ln}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg><i class="cl"></i><i class="cd"></i>`;
  const lab=i=>{const dt=new Date(Date.now()-(1-i/(n-1))*days*864e5);return days<=1?dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):dt.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:days>200?'2-digit':undefined})};
  d.querySelector('#tl').innerHTML=[.1,.37,.63,.9].map(f=>`<span>${lab(Math.round(f*(n-1)))}</span>`).join('');
  const show=i=>{const v=data[i],ch=(v/data[0]-1)*100;d.querySelector('#cp').innerHTML=`${rub(v*1)} ₽ <span class="${ch<0?'dn':'up'}" style="font-weight:400;font-size:.85em">${ch<0?'−':'+'}${Math.abs(ch).toFixed(2)}%</span>${i<n-1?`<em class="tt">${lab(i)}</em>`:''}`;
   const x=i/(n-1)*100,y=pts[i][1]/H*100,l=d.querySelector('.cl'),o=d.querySelector('.cd');l.style.left=o.style.left=x+'%';o.style.top=y+'%';l.style.opacity=o.style.opacity=i<n-1?1:0};
  show(n-1);const bx=d.querySelector('#cht'),mv=e=>{const r=bx.getBoundingClientRect();show(Math.max(0,Math.min(n-1,Math.round((e.clientX-r.left)/r.width*(n-1)))))};
  bx.onpointerdown=e=>{bx.setPointerCapture(e.pointerId);mv(e)};bx.onpointermove=e=>{if(e.buttons||e.pointerType==='touch')mv(e)};bx.onpointerup=()=>show(n-1)};
 d.querySelectorAll('#rng button').forEach((b,i)=>b.onclick=()=>{R=i;d.querySelectorAll('#rng button').forEach((x,k)=>x.classList.toggle('on',k===i));draw()});
 draw();
 d.querySelector('#ih').onclick=()=>{d.querySelector('#ih').classList.toggle('cl0');d.querySelector('#ip').style.display=d.querySelector('#ip').style.display==='none'?'':'none'};
 d.querySelector('#tm').onclick=()=>{const L=[['CoinMarketCap','https://coinmarketcap.com/currencies/toncoin/'],['Документация','https://docs.ton.org'],['Исходный код','https://github.com/ton-blockchain/ton'],['Открыть в эксплорере','https://tonscan.org/address/'+ME.address]];
  const p=popup(L.map((x,i)=>`<button class="mr" data-i="${i}"><span>${x[0]}</span></button>`).join(''),60);p.querySelector('.pop').style.left='30%';p.querySelectorAll('.mr').forEach(b=>b.onclick=()=>{closePop();window.open(L[+b.dataset.i][1],'_blank')})}}
/* ---------- профиль ---------- */
const sw=(id,on)=>`<i class="swt ${on?'on':''}" id="${id}"><b></b></i>`;
function profile(){const bio=bioAvail();
 const d=scr(`${hd('Профиль',1)}<div class="sbody" style="padding:calc(var(--u)*2) calc(var(--u)*4)"><div style="text-align:center;padding:calc(var(--u)*2) 0 calc(var(--u)*5)"><div class="pav"><span>${ini()}</span></div><h2 style="margin:calc(var(--u)*3) 0 .6u;font-size:calc(var(--u)*6)">@${esc(ME.username)}</h2><div style="color:var(--muted);font-size:calc(var(--u)*3.6)" class="amt">Всего ≈ ${cv(TOT)}</div></div>
 <div class="panel glass" style="margin:0 0 calc(var(--u)*3.8);overflow:hidden">
  <div class="pr" id="r1">${IMG('eye')}<span>Скрывать баланс</span>${sw('s1',PRIV)}</div>
  <button class="pr" id="r2">${IMG('dollar')}<span>Валюта</span><em>${CUR[CURK][0]}</em></button>
  <button class="pr" id="r3">${IMG('key')}<span>Сменить PIN-код</span></button>
  ${bio?`<div class="pr" id="r4">${IMG('shield-star')}<span>Вход по отпечатку</span>${sw('s4',bioOn())}</div>`:''}
  <button class="pr" id="r5">${IMG('pencil')}<span>Сменить пароль</span></button>
  <button class="pr" id="r6">${IMG('ton')}<span>Адрес кошелька</span><em>${ME.address.slice(0,6)}···${ME.address.slice(-4)}</em></button>
  ${ME.admin?`<button class="pr" id="r7">${IMG('crown')}<span>Админ-панель</span></button>`:''}
 </div>
 <div id="pw" style="display:none"><input class="fld" id="po" type="password" placeholder="Старый пароль"><input class="fld" id="pn" type="password" placeholder="Новый пароль (от 6 символов)"><button class="pri" id="pk">Сохранить пароль</button><div class="msg" id="pm"></div></div>
 <button class="pr out glass" id="r8">${IMG('power-gray')}<span>Выйти</span></button></div>`);
 const q=s=>d.querySelector(s);
 q('#r1').onclick=()=>{setPriv(!PRIV,true);q('#s1').classList.toggle('on',PRIV)};
 q('#r2').onclick=()=>{const k=Object.keys(CUR);CURK=k[(k.indexOf(CURK)+1)%k.length];localStorage.setItem('cur',CURK);$('#bal').dataset.v=0;paint();q('#r2 em').textContent=CUR[CURK][0]};
 q('#r3').onclick=()=>pinChange();
 if(bio)q('#r4').onclick=async()=>{const on=!bioOn();if(on&&!(await bioAuth()))return toast('Не удалось подтвердить отпечаток');bioSet(on);q('#s4').classList.toggle('on',on)};
 q('#r5').onclick=()=>{const p=q('#pw');p.style.display=p.style.display==='none'?'block':'none'};
 q('#pk').onclick=async()=>{const r=await api('/api/password',{old:$('#po').value,new:$('#pn').value});$('#pm').textContent=r.error||'';if(!r.error){toast('Пароль изменён');back()}};
 q('#r6').onclick=()=>copyT(ME.address);if(ME.admin)q('#r7').onclick=()=>adminScr();q('#r8').onclick=()=>logout(1)}
/* ---------- маркет и обзор ---------- */

function buildMarket(){const mv=[['Anonymous Cat',1.54,60.88,'#8a6a4a','A'],['The Black Rock',3.99,-19.6,'#2a3342','TB'],['STONK',3.93,-33.39,'#0e6f82','s']];
 const pop=[['Bitcoin','#f7931a','₿',-1.18],['Tron','#ef5b5b','T',-1.07],['Ethereum','#5a6fe0','Ξ',-4.56],['Gram','','',-0.81],['Solana','#0d0d12','S',-3.16],['Polygon','#7a1ff0','P',-0.32],['Zcash','#d9a014','Z',-5.92],['My Wallet Coin','#12a3f0','W',-1.44],['Dogecoin','#c8a22a','D',-1.44]];
 const st=[['Gold xStock','#e0a800','G',1.52],['Apple','#f2f2f2','',2.7,'#111'],['MicroStrategy','#f59a1b','M',-0.45],['Micron','#111','m',-7.06],['Nasdaq xStock','#1a4fd0','N',3.3],['Amazon','#ff9900','a',3.48]];
 const tile=(p,fn)=>`<button class="gi" onclick="${fn}">${p[1]===''?`<div class="ci">${GRAM}</div>`:`<div class="ci" style="background:${p[1]};color:${p[4]||'#fff'}">${p[2]}</div>`}${p[0]}<small class="${p[3]<0?'dn':'up'}">${p[3]>0?'+':''}${p[3]}%</small></button>`;
 $('#p1').innerHTML=`<div class="sec glass"><div class="h4">Главные движения за день</div><div class="mov">${mv.map((m,i)=>`<div class="mc"><div class="ci" style="background:${m[3]}">${m[4]}</div><b>${m[0]}</b><span>${m[1]} ₽ <b class="${m[2]<0?'dn':'up'}" style="display:inline;font-weight:500">${m[2]>0?'+':''}${m[2]}%</b></span>${SPARK(11+i,m[2]<0)}</div>`).join('')}</div></div>
 <div class="sec glass"><div class="h4">Популярные токены <button onclick="toast('Скоро')">Показать все</button></div><div class="grid3">${pop.map(p=>tile(p,p[0]==='Gram'?"tokScr('gram')":"toast('Скоро')")).join('')}</div></div>
 <div class="sec glass"><div class="h4">Токенизированные акции <button onclick="toast('Скоро')">Показать все</button></div><div class="grid3">${st.map(p=>tile(p,"toast('Скоро')")).join('')}</div></div>
 <div class="sec glass"><div class="h4">Токенизированное золото</div>${[['XAUt0','Tether Gold','337 211.22 ₽','+1.61%'],['XAUT','Tether Gold','337 463.1 ₽','+1.6%']].map(g=>`<div class="gold"><div class="ci" style="background:#d9a014">${g[0][3]}</div><div class="mid"><div class="nm">${g[0]} <span class="badge">${g[1]}</span></div><div class="sub">${g[2]}</div></div><b class="up">${g[3]}</b></div>`).join('')}</div>`}
function buildExplore(){const A=(n,c,l)=>`<div class="ap"><i style="background:${c}">${l}</i>${n}</div>`;
 $('#p2').innerHTML=`<div class="sec glass"><div class="h4">Подключённые приложения</div><div class="apps">${A('Getgems','linear-gradient(135deg,#5cc2ff,#2a84f5)','✿')}${A('Split','linear-gradient(135deg,#8ea0b8,#c0b6d0)','/')}${A('Split','linear-gradient(135deg,#8ea0b8,#c0b6d0)','/')}${A('Настройки','transparent','⚙')}</div></div>
 <div class="sec glass"><div class="h4">Сейчас в тренде</div><div class="ban"><div class="gem"><img src="img/gem-s.webp" alt=""></div><h5>Send &amp; Receive Crypto or Collectibles via Telegram</h5><div class="bl"><i>@push</i><div><b>@push</b><p>Переводите средства и NFT в любых чатах прямо в Telegram</p></div></div></div></div>
 <div class="sec glass"><div class="h4">Популярные приложения</div><div class="pops"><div>${A('Spot','linear-gradient(135deg,#1f86f5,#1a52c4)','◆')}${A('Cubes','#111','▣')}</div><div>${A('Storm','#111','ST')}${A('Evaa','#3a1fe0','E')}</div></div></div>`}
/* ---------- запуск ---------- */
$('#ico-gram').innerHTML=GRAM;$('#ico-usdt').innerHTML=USDT;MNT.g=MNT.u='';
buildMarket();buildExplore();applyPriv(false);
document.addEventListener('visibilitychange',()=>document.body.classList.toggle('bgp',document.hidden));
