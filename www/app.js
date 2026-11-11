'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const U=n=>`calc(var(--u)*${n})`;
let BASE=(localStorage.getItem('api')||window.API_BASE||'').replace(/\/$/,'');
let TOKEN=localStorage.getItem('tok')||'',ME=null,ICONS={},HIST={items:[],pending:[]},PR={gram:82.86,usdt:81.87},SEEN=0;
const NAME={gram:'GRAM',usdt:'USD₮'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const nf=(n,d=6)=>(+n).toLocaleString('ru-RU',{maximumFractionDigits:d});
const rub=n=>nf(n,2);
const ini=()=>ME?ME.username.slice(0,2).toUpperCase():'GW';
async function api(p,b,form){
 const h={};if(TOKEN)h.Authorization='Bearer '+TOKEN;const o={headers:h};
 if(form){o.method='POST';o.body=form}else if(b){o.method='POST';h['Content-Type']='application/json';o.body=JSON.stringify(b)}
 try{const r=await fetch(BASE+p,o),j=await r.json();if(r.status===401&&p!=='/api/login')logout();return j}catch(e){return{error:'Нет связи с сервером'}}}
/* ---------- иконки ---------- */
const GRAM='<img src="img/gram.webp" alt="" draggable="false">';
const USDT='<svg viewBox="0 0 66 66"><circle cx="33" cy="33" r="33" fill="#119f8a"/><path d="M17 22l4-5h24l4 5-16 22z" fill="#fff"/><path d="M24 25h18M33 25v12M27 30c0 2 12 2 12 0" stroke="#119f8a" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="11" fill="#1e88e5" stroke="#15171c" stroke-width="3"/><path d="M45 46h10l-5 9z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>';
const GEM='<svg viewBox="0 0 60 50"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5cc2ff"/><stop offset="1" stop-color="#1f3fe0"/></linearGradient></defs><path d="M12 2h36l11 15-29 31L1 17z" fill="url(#gg)"/><path d="M1 17h58M20 17l10 31 10-31M12 2l8 15 10-15 10 15 8-15" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.2"/></svg>';
const TI={gram:GRAM,usdt:USDT};
const IC={in:'<path d="M12 4v16M5 13l7 7 7-7"/>',out:'<path d="M12 20V4M5 11l7-7 7 7"/>',swap:'<path d="M4 8h16M16 4l4 4-4 4M20 16H4M8 12l-4 4 4 4"/>',stake:'<ellipse cx="12" cy="7" rx="7" ry="3.4"/><path d="M5 7v5c0 2 3 3.4 7 3.4s7-1.400 7-3.400V7"/>',pe:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>'};
const tic=(k,c)=>`<div class="tic ${c||''}"><svg viewBox="0 0 24 24">${IC[k]}</svg></div>`;
const MNT={};
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2200)}
function copyT(t){try{navigator.clipboard.writeText(t)}catch(e){}toast('Скопировано')}
function count(el,to,fmt){const from=+el.dataset.v||0;el.dataset.v=to;if(from===to){el.textContent=fmt(to);return}const t0=performance.now();
 (function f(t){const k=Math.min(1,(t-t0)/700),e=1-Math.pow(1-k,3);el.textContent=fmt(from+(to-from)*e);if(k<1)requestAnimationFrame(f)})(t0)}
/* ---------- вкладки ---------- */
let TAB=0;
function setTab(i){TAB=i;$('#track').style.transform=`translateX(${-i*33.3334}%)`;$('#pill').style.transform=`translateX(${U(i*28.6)})`;
 $$('.tab').forEach((t,k)=>t.classList.toggle('on',k===i));$$('.pg').forEach((p,k)=>p.classList.toggle('on',k===i));
 $('#tabs').scrollTo({left:i===2?999:0,behavior:'smooth'})}
$$('.tab').forEach((t,i)=>t.onclick=()=>setTab(i));
(()=>{let x=0,y=0,ok=false;const p=$('#pages');
 p.addEventListener('touchstart',e=>{x=e.touches[0].clientX;y=e.touches[0].clientY;ok=!e.target.closest('.cards,.mov')},{passive:true});
 p.addEventListener('touchend',e=>{if(!ok)return;const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;
  if(Math.abs(dx)>60&&Math.abs(dy)<45)setTab(Math.max(0,Math.min(2,TAB+(dx<0?1:-1))))},{passive:true})})();
$('#ava').onclick=()=>profile();
$('#q').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim()){toast('Поиск: '+e.target.value.trim());e.target.value='';e.target.blur()}});
/* звёздочки */
(()=>{const c=$('#c1 .cbg');for(let i=0;i<18;i++){const s=document.createElement('span');s.className='st';s.textContent='✦';
 s.style.left=(4+Math.random()*90)+'%';s.style.top=(5+Math.random()*80)+'%';s.style.fontSize=U(1+Math.random()*1.8);
 s.style.animationDuration=(2+Math.random()*3)+'s,'+(6+Math.random()*6)+'s';s.style.animationDelay=(-Math.random()*5)+'s,'+(-Math.random()*8)+'s';c.appendChild(s)}})();
/* ---------- экраны ---------- */
const STACK=[];
function scr(html,cls){const d=document.createElement('div');d.className='scr '+(cls||'');d.innerHTML=html;$('#app').appendChild(d);STACK.push(d);history.pushState({s:STACK.length},'');
 requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('in')));return d}
function popScr(){const d=STACK.pop();if(!d)return;d.classList.remove('in');setTimeout(()=>d.remove(),520)}
window.addEventListener('popstate',popScr);
const back=()=>history.back();
const ARR='<svg viewBox="0 0 24 24"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>',XI='<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>';
const UD='<svg viewBox="0 0 12 16"><path d="M6 0l5 6H1zM6 16L1 10h10z"/></svg>';
const hd=(t,b)=>`<div class="hd">${b?`<button class="ib" onclick="back()">${ARR}</button>`:`<button class="chip glass" onclick="profile()"><span class="mini">${ini()}</span>${UD}</button>`}<h1>${t}</h1>${b?'<i class="sp0"></i>':`<button class="ib" onclick="back()">${XI}</button>`}</div>`;
const chip=t=>`<div class="tk"><div class="ci">${TI[t]}</div>${NAME[t]}</div>`;
function shake(el){el.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:260})}
function done(title,sub,slot){const o=document.createElement('div');o.className='ovl';
 o.innerHTML=`<div class="big" id="ob"><div class="check"><svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg></div></div><h2>${title}</h2><p>${sub}</p>`;
 STACK[STACK.length-1].appendChild(o);mount(o.querySelector('#ob'),slot||'success',{loop:false});setTimeout(()=>{o.remove();back()},1900)}
/* — пополнить — */
function qrSvg(t){const q=qrcode(0,'H');q.addData(t);q.make();const n=q.getModuleCount(),m=1.5;
 let s=`<svg viewBox="${-m} ${-m} ${n+2*m} ${n+2*m}"><defs><linearGradient id="qg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${n}" y2="${n}"><stop offset="0" stop-color="#1b8fb0"/><stop offset="1" stop-color="#1c3fcb"/></linearGradient></defs><g fill="url(#qg)">`;
 const F=(r,c)=>(r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7),c0=((n-9)/2)|0,C=(r,c)=>r>=c0&&r<c0+9&&c>=c0&&c<c0+9;
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c)&&!F(r,c)&&!C(r,c))s+=`<circle cx="${c+.5}" cy="${r+.5}" r=".47"/>`;
 [[0,0],[0,n-7],[n-7,0]].forEach(([r,c])=>s+=`<circle cx="${c+3.5}" cy="${r+3.5}" r="2.9" fill="none" stroke="url(#qg)" stroke-width="1.1"/><circle cx="${c+3.5}" cy="${r+3.5}" r="1.6"/>`);
 return s+'</g></svg>'}
function buyCard(){let T='gram';
 const d=scr(`${hd('Покупка с карты',1)}<div class="sbody" style="padding:calc(var(--u)*2) calc(var(--u)*4)"><div class="box glass"><div class="bt"><span>Вы хотите получить</span></div>
 <div class="big-in"><input id="ba" type="number" inputmode="decimal" placeholder="0"><button id="bt" class="tk"></button></div><div class="bt" style="margin-top:calc(var(--u)*3)"><span id="br">≈ 0 ₽</span></div></div>
 <p style="color:var(--muted);font-size:calc(var(--u)*3.7);line-height:1.45;padding:0 calc(var(--u)*2)">Заявка уйдёт администратору. Когда он подтвердит оплату, баланс пополнится автоматически, а запись появится в ленте.</p>
 <div id="bm" class="msg"></div></div><button class="cta" id="bs">Отправить заявку</button>`,'r');
 const upd=()=>{$('#bt').innerHTML=chip(T);$('#br').textContent='≈ '+rub((+$('#ba').value||0)*PR[T])+' ₽'};
 d.querySelector('#bt').onclick=()=>{T=T==='gram'?'usdt':'gram';upd()};d.querySelector('#ba').oninput=upd;upd();
 d.querySelector('#bs').onclick=async()=>{const r=await api('/api/topup',{token:T,amount:$('#ba').value});if(r.error){$('#bm').textContent=r.error;shake($('#bs'));return}
  await refresh();done('Заявка отправлена','Ожидайте подтверждения')}}
/* — отправить — */
function trade(f,t){const S={f:f||'gram',t:t||'usdt'};
 const d=scr(`${hd('Торговля')}<div class="sbody" style="padding:calc(var(--u)*2) calc(var(--u)*4)"><div class="seg glass"><i class="pill"></i><button class="on">Обмен</button><button id="tp2">P2P</button></div><div class="box glass" style="padding-bottom:calc(var(--u)*6)"><div class="bt"><span>Вы продаёте</span><span id="tm"></span></div><div class="big-in"><input id="ta" type="number" inputmode="decimal" placeholder="0"><div class="tk" id="tf"></div></div>
 <button class="sw glass" id="tsw"><svg viewBox="0 0 24 24"><path d="M8 4v16M4 16l4 4 4-4M16 20V4M12 8l4-4 4 4"/></svg></button><div class="bt" style="margin-top:calc(var(--u)*3)"><span>Вы покупаете</span></div><div class="big-in"><div class="o" id="to">0</div><div class="tk" id="tt2"></div></div></div>
 <div class="box glass det" style="padding:calc(var(--u)*3.4) calc(var(--u)*4.6)"><div class="line" style="padding:0" id="tdh"><b>Детали обмена</b><svg viewBox="0 0 24 24" style="width:calc(var(--u)*5);stroke:#999;fill:none;stroke-width:2.2"><path d="M6 9l6 6 6-6"/></svg></div><div class="dtl" id="tdl"><div class="kv"><span>Цена за 1</span><b id="tr"></b></div><div class="kv"><span>Проскальзывание</span><b>5%</b></div><div class="kv"><span>Влияние на цену</span><b>0%</b></div><div class="kv"><span>Минимально получите</span><b id="tmn">0</b></div></div></div><div id="tw"></div><div class="msg" id="te"></div></div><button class="cta off" id="tb">Введите сумму</button>`);
 const upd=()=>{const v=+$('#ta').value||0,o=v*PR[S.f]/PR[S.t];$('#tf').innerHTML=chip(S.f);$('#tt2').innerHTML=chip(S.t);
  $('#tm').innerHTML=`Максимум: <b style="color:var(--blue)">${nf(ME[S.f])} ${NAME[S.f]}</b>`;$('#to').textContent=nf(o);$('#tmn').textContent=nf(o*.95,6)+' '+NAME[S.t];$('#to').style.color=o?'#fff':'#777';
  $('#tr').textContent=`1 ${NAME[S.f]} ≈ ${nf(PR[S.f]/PR[S.t],4)} ${NAME[S.t]}`;const b=$('#tb');
  b.textContent=v<=0?'Введите сумму':v>ME[S.f]?'Недостаточно средств':'Обменять';b.classList.toggle('off',v<=0||v>ME[S.f]);
  $('#tw').innerHTML=ME[S.f]<=0?`<div class="warn"><div><b>Пополните баланс для обмена</b><p>Купите криптовалюту с карты или получите перевод, чтобы пополнить баланс для обмена.</p></div><button onclick="deposit()">Пополнить</button></div>`:''};
 d.querySelector('#tsw').onclick=e=>{[S.f,S.t]=[S.t,S.f];e.currentTarget.querySelector('svg').style.transform+=' rotate(180deg)';$('#ta').value='';upd()};
 d.querySelector('#ta').oninput=upd;upd();d.querySelector('#tdh').onclick=()=>d.querySelector('#tdl').classList.toggle('on');d.querySelector('#tp2').onclick=()=>{back();setTimeout(p2pScr,540)};
 d.querySelector('#tb').onclick=async()=>{if($('#tb').classList.contains('off'))return shake($('#tb'));const r=await api('/api/swap',{from:S.f,to:S.t,amount:$('#ta').value});
  if(r.error){$('#te').textContent=r.error;return shake($('#tb'))}await refresh();done('Обмен выполнен',`+${nf(r.out)} ${NAME[S.t]}`)}}
/* — стейкинг — */
async function stakeScr(){let M='add';const si=await api('/api/stakeinfo');
 const d=scr(`${hd('Добавить')}<div class="sbody" style="padding:calc(var(--u)*2) calc(var(--u)*4)"><div class="seg glass"><i class="pill" id="sp"></i><button class="on">Добавить</button><button>Вывести</button></div>
 <div class="box glass"><div class="bt"><span>Сумма</span><span id="km"></span></div><div class="big-in"><input id="ka" type="number" inputmode="decimal" placeholder="0"><div class="tk">${chip('gram').replace('class="tk"','')}</div></div><div class="bt" style="margin-top:calc(var(--u)*3)"><span id="kr"></span><span>Комиссия: 0 GRAM</span></div></div>
 <div class="box glass"><b style="font-size:calc(var(--u)*4.2)">Инфо</b><div class="line"><span>Текущий APY</span><span class="apy">13.91%</span></div><div class="line"><span>Приблизительный доход в год</span><b class="up" id="ky">0 GRAM</b></div>
 <div class="line"><span>Всего в стейкинге</span><b>${nf(si.total||0,2)} GRAM</b></div><div class="line"><span>Всего стейкеров</span><b>${si.stakers||0}</b></div></div><div class="msg" id="ke"></div></div><button class="cta off" id="kb">Введите сумму</button>`);
 const upd=()=>{const v=+$('#ka').value||0,mx=M==='add'?ME.gram:ME.staked;$('#km').innerHTML=`${M==='add'?'Максимум':'В стейкинге'}: <b style="color:var(--blue)" id="kx">${nf(mx)} GRAM</b>`;
  $('#kx').onclick=()=>{$('#ka').value=mx;upd()};$('#kr').textContent='≈ '+rub(v*PR.gram)+' ₽';$('#ky').textContent=nf(v*.1391,4)+' GRAM';const b=$('#kb');
  b.textContent=v<=0?'Введите сумму':v>mx?'Недостаточно средств':M==='add'?'Застейкать GRAM':'Вывести GRAM';b.classList.toggle('off',v<=0||v>mx)};
 d.querySelectorAll('.seg button').forEach((b,i)=>b.onclick=()=>{M=i?'rm':'add';d.querySelectorAll('.seg button').forEach((x,k)=>x.classList.toggle('on',k===i));
  $('#sp').style.transform=`translateX(${i*100}%)`;d.querySelector('h1').textContent=i?'Вывести':'Добавить';$('#ka').value='';upd()});
 d.querySelector('#ka').oninput=upd;upd();
 d.querySelector('#kb').onclick=async()=>{if($('#kb').classList.contains('off'))return shake($('#kb'));const r=await api('/api/stake',{amount:$('#ka').value,unstake:M==='rm'});
  if(r.error){$('#ke').textContent=r.error;return shake($('#kb'))}await refresh();done(M==='add'?'Застейкано':'Выведено','Готово')}}
/* — токен — */
const SPARK=(seed,down,w=300,h=60)=>{let s=seed;const r=()=>(s=s*16807%2147483647)/2147483647;let y=down?.2:.8,p=[];for(let i=0;i<40;i++){y+= (down?.018:-.018)+(r()-.5)*.14;y=Math.max(.06,Math.min(.94,y));p.push([i*w/39,y*h])}
 const c=down?'#3d9bff':'#3ddc84',d=p.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join('');
 return `<svg class="sp" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}L${w} ${h}L0 ${h}Z" fill="${c}" opacity=".14"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`};
async function adminScr(){const o=await api('/api/admin/overview');if(o.error)return toast(o.error);
 const d=scr(`${hd('Админ-панель',1)}<div class="sbody" style="padding:calc(var(--u)*2) calc(var(--u)*4)" id="ab">
 <div class="box glass"><b>Заявки на пополнение</b>${o.requests.length?o.requests.map(r=>`<div class="rq"><span>@${esc(r.username)} · ${nf(r.amount)} ${NAME[r.token]}</span><span><button class="y" data-r="${r.id}" data-ok="1">✓</button> <button class="n" data-r="${r.id}">✕</button></span></div>`).join(''):'<div style="color:var(--muted);padding-top:calc(var(--u)*2);font-size:calc(var(--u)*3.6)">Заявок нет</div>'}</div>
 <div class="box glass"><b>Споры P2P</b>${(o.disputes||[]).length?o.disputes.map(x=>`<div class="rq"><span>#${x.id} · ${nf(x.amount)} ${NAME[x.token]} · ${rub(x.rub)} ₽<br><small style="color:var(--muted)">продавец @${esc(x.seller)} → покупатель @${esc(x.buyer)}</small></span><span><button class="y" data-d="${x.id}" data-rel="1">Покупателю</button> <button class="n" data-d="${x.id}">Продавцу</button></span></div>`).join(''):'<div style="color:var(--muted);padding-top:calc(var(--u)*2);font-size:calc(var(--u)*3.6)">Споров нет</div>'}</div><div class="box glass"><b>Выдать баланс</b><input class="fld" id="cu" style="margin-top:calc(var(--u)*3)" placeholder="Логин пользователя"><input class="fld" id="cm" type="number" placeholder="Сумма"><button class="pri gr" id="ct">Токен: GRAM</button><button class="pri" id="cg">Выдать</button><div class="msg" id="cmsg"></div></div>
 <div class="box glass"><b>Иконки TGS</b><div id="sl" style="margin-top:calc(var(--u)*3)"></div></div>
 <div class="box glass"><b>Пользователи (${o.users.length})</b>${o.users.map(u=>`<div class="ur"><b>@${esc(u.username)}</b><span>${nf(u.gram,2)} G · ${nf(u.usdt,2)} U${u.staked?` · ${nf(u.staked,2)} st`:''}</span></div>`).join('')}</div></div>`,'r');
 let T='gram';d.querySelector('#ct').onclick=e=>{T=T==='gram'?'usdt':'gram';e.target.textContent='Токен: '+NAME[T]};
 d.querySelector('#cg').onclick=async()=>{const r=await api('/api/admin/credit',{username:$('#cu').value,token:T,amount:$('#cm').value});$('#cmsg').style.color=r.error?'':'var(--green)';$('#cmsg').textContent=r.error||'Выдано';if(!r.error){$('#cm').value='';refresh()}};
 d.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{await api('/api/admin/p2p_resolve',{id:+b.dataset.d,release:!!b.dataset.rel});back();setTimeout(adminScr,560)});
 d.querySelectorAll('[data-r]').forEach(b=>b.onclick=async()=>{await api('/api/admin/topup',{id:+b.dataset.r,ok:!!b.dataset.ok});back();setTimeout(adminScr,560)});
 const sl=d.querySelector('#sl');Object.keys(o.slots).forEach(k=>{const w=document.createElement('div');w.className='slot';
  w.innerHTML=`<h3>${o.slots[k]}</h3><div class="pv" id="pv-${k}">${ICONS[k]?'':'не загружено'}</div><input type="file" accept=".tgs"><button class="pri">Загрузить</button>${ICONS[k]?'<button class="pri gr">Удалить</button>':''}<div class="msg"></div>`;
  sl.appendChild(w);mount(w.querySelector('.pv'),k);const[up,del]=w.querySelectorAll('button'),m=w.querySelector('.msg');
  up.onclick=async()=>{const f=w.querySelector('input').files[0];if(!f){m.textContent='Выберите файл .tgs';return}const fd=new FormData();fd.append('slot',k);fd.append('file',f);
   const r=await api('/api/admin/upload',null,fd);if(r.error){m.textContent=r.error;return}await refresh();back();setTimeout(adminScr,560)};
  if(del)del.onclick=async()=>{await api('/api/admin/delete',{slot:k});await refresh();back();setTimeout(adminScr,560)}})}
/* ---------- маркет и обзор ---------- */
const CI=(c,l)=>`<div class="ci" style="background:${c}">${l}</div>`;
/* ---------- данные ---------- */
function fmtT(ts){return new Date(ts*1000).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
/* ---------- вход ---------- */
let MODE='login';
function showAuth(){$('#auth').classList.add('on');$('#alogo').innerHTML=GRAM;$('#srv').innerHTML=`Сервер: ${esc(BASE||'не указан')} · <u id="chs">изменить</u>`;
 $('#chs').onclick=()=>{const v=prompt('Адрес сервера, например https://имя.pythonanywhere.com',BASE);if(v!==null){BASE=v.trim().replace(/\/$/,'');localStorage.setItem('api',BASE);showAuth()}}}
$$('#auth .seg button').forEach((b,i)=>b.onclick=()=>{MODE=b.dataset.m;$$('#auth .seg button').forEach(x=>x.classList.toggle('on',x===b));$('#apill').style.transform=`translateX(${i*100}%)`;$('#go').textContent=i?'Создать кошелёк':'Войти';$('#am').textContent=''});
$('#go').onclick=async()=>{const r=await api('/api/'+MODE,{username:$('#u').value.trim(),password:$('#p').value});if(r.error){$('#am').textContent=r.error;return shake($('#go'))}
 TOKEN=r.token;localStorage.setItem('tok',TOKEN);$('#p').value='';$('#auth').classList.remove('on');LASTIN=0;await refresh();setTab(0);afterLogin()};
$('#p').addEventListener('keydown',e=>{if(e.key==='Enter')$('#go').click()});
function logout(go){TOKEN='';localStorage.removeItem('tok');ME=null;HIST={items:[],pending:[]};while(STACK.length)popScr();pinHide();showAuth()}
