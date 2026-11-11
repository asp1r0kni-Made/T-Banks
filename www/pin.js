'use strict';
/* ---------- PIN-код (4 цифры) и вход по отпечатку ---------- */
const hex=a=>[...a].map(x=>x.toString(16).padStart(2,'0')).join('');
const UN=()=>ME?ME.username:localStorage.getItem('uname')||'';
const pinData=()=>{try{return JSON.parse(localStorage.getItem('pin:'+UN()))}catch(e){return null}};
const pinSave=d=>localStorage.setItem('pin:'+UN(),JSON.stringify(d));
async function pinHash(p,s){const d=new TextEncoder().encode(s+':'+p);if(window.crypto&&crypto.subtle)return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',d)));let h=5381;for(const b of d)h=((h<<5)+h+b)>>>0;return''+h}
/* биометрия: мост к Android (NativeBio) */
const bioAvail=()=>{try{return !!(window.NativeBio&&NativeBio.available())}catch(e){return false}};
const bioOn=()=>{const d=pinData();return !!(d&&d.bio)};
function bioSet(v){const d=pinData();if(d){d.bio=v;pinSave(d)}}
function bioAuth(){return new Promise(r=>{if(!bioAvail())return r(false);window.__bio=ok=>{window.__bio=null;r(!!ok)};try{NativeBio.prompt('Вход в Gram Wallet')}catch(e){r(false)}})}
const DEL='<svg viewBox="0 0 24 24"><path d="M21 5H9l-6 7 6 7h12a1 1 0 001-1V6a1 1 0 00-1-1zM17 9.500l-5 5M12 9.500l5 5"/></svg>';
const FP='<svg viewBox="0 0 24 24"><path d="M12 11v4c0 2-.5 3.500-1.500 5M8 14c0-1 0-2 .5-3a4 4 0 017 1.500c0 3 0 5-1 7.500M5 11a7 7 0 0111-5.500M19 9c.5 1.500.5 3 .3 5M5.500 15c.3-1.500.5-3 .5-4"/></svg>';
const KEYS=['1','2','3','4','5','6','7','8','9','bio','0','del'];
const PS={buf:'',mode:'',tmp:'',cb:null,tries:0,until:0,locked:false};
function pinEl(){let e=$('#pin');if(e)return e;e=document.createElement('div');e.id='pin';e.className='pin';
 e.innerHTML=`<div class="pico" id="pico"></div><h2 id="ptt"></h2><p id="psb"></p><div class="dots" id="pdt"><i></i><i></i><i></i><i></i></div><div class="pad">${KEYS.map(k=>`<button class="pk${k==='bio'||k==='del'?' gh':''}" data-k="${k}">${k==='del'?DEL:k==='bio'?FP:k}</button>`).join('')}</div><button class="fg" id="pfg"></button>`;
 $('#app').appendChild(e);e.querySelectorAll('.pk').forEach(b=>b.addEventListener('pointerdown',ev=>{ev.preventDefault();pinKey(b.dataset.k)}));return e}
const dots=()=>$('#pdt').querySelectorAll('i').forEach((d,i)=>d.classList.toggle('on',i<PS.buf.length));
function pinOpen(mode,title,sub,o){o=o||{};const e=pinEl();PS.mode=mode;PS.buf='';PS.cb=o.ok||null;$('#ptt').textContent=title;$('#psb').textContent=sub||'';$('#psb').className='';dots();
 e.querySelector('[data-k=bio]').style.visibility=(o.bio&&bioOn()&&bioAvail())?'visible':'hidden';
 const f=$('#pfg');f.textContent=o.forgot?'Забыли PIN-код?':o.cancel?'Отмена':'';f.style.visibility=(o.forgot||o.cancel)?'visible':'hidden';
 f.onclick=o.forgot?()=>{PS.locked=false;pinHide();logout(1)}:()=>{pinHide();o.cancel&&o.cancel()};
 mount($('#pico'),'pin',{loop:false});requestAnimationFrame(()=>e.classList.add('on'))}
function pinHide(){const e=$('#pin');if(e)e.classList.remove('on')}
function wrong(msg){const s=$('#psb');s.textContent=msg;s.className='bad';$('#pdt').animate([{transform:'translateX(0)'},{transform:'translateX(-9px)'},{transform:'translateX(9px)'},{transform:'translateX(-6px)'},{transform:'translateX(0)'}],{duration:320});
 try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}setTimeout(()=>{PS.buf='';dots()},320)}
async function pinKey(k){if(Date.now()<PS.until)return;if(k==='bio'){tryBio();return}
 if(k==='del')PS.buf=PS.buf.slice(0,-1);else if(PS.buf.length<4)PS.buf+=k;dots();if(PS.buf.length===4)setTimeout(pinSubmit,150)}
function unlock(){const cb=PS.cb;PS.locked=false;PS.tries=0;pinHide();cb&&cb()}
async function tryBio(){if(!bioOn()||!bioAvail())return;if(await bioAuth())unlock()}
async function pinSubmit(){const v=PS.buf;
 if(PS.mode==='set1'){PS.tmp=v;PS.buf='';PS.mode='set2';$('#ptt').textContent='Повторите PIN-код';$('#psb').textContent='';dots();return}
 if(PS.mode==='set2'){if(v!==PS.tmp){wrong('PIN-коды не совпали');PS.mode='set1';PS.tmp='';$('#ptt').textContent='Придумайте PIN-код';return}
  const salt=hex(crypto.getRandomValues(new Uint8Array(8))),old=pinData()||{};pinSave({salt,hash:await pinHash(v,salt),bio:!!old.bio});const cb=PS.cb;pinHide();await offerBio();toast('PIN-код сохранён');cb&&cb();return}
 const d=pinData();if(d&&await pinHash(v,d.salt)===d.hash){unlock();return}
 PS.tries++;if(PS.tries>=5){PS.until=Date.now()+30000;PS.tries=0;const t=setInterval(()=>{const s=Math.ceil((PS.until-Date.now())/1000);if(s<=0){clearInterval(t);$('#psb').textContent='';return}$('#psb').textContent='Слишком много попыток. Подождите '+s+' с'},500);wrong('Слишком много попыток');return}
 wrong('Неверный PIN-код · осталось попыток: '+(5-PS.tries))}
function offerBio(){return new Promise(res=>{if(!bioAvail()||bioOn())return res();const d=document.createElement('div');d.className='ovl';
 d.innerHTML=`<div class="big">${IMG('shield-star')}</div><h2>Вход по отпечатку</h2><p>Открывайте приложение без ввода PIN-кода</p><button class="pri" id="bo1" style="width:70%;margin-top:calc(var(--u)*6)">Включить</button><button class="pri gr" id="bo0" style="width:70%">Не сейчас</button>`.replace(/(\d)u/g,'$calc(var(--u)*1)');
 $('#app').appendChild(d);d.querySelector('#bo0').onclick=()=>{d.remove();res()};d.querySelector('#bo1').onclick=async()=>{if(await bioAuth()){bioSet(true);toast('Вход по отпечатку включён')}d.remove();res()}})}
function lockApp(){if(PS.locked||!ME&&!TOKEN||!pinData())return;PS.locked=true;pinOpen('verify','Введите PIN-код','',{bio:true,forgot:true});if(bioOn()&&bioAvail())setTimeout(tryBio,400)}
function pinChange(){pinOpen('verify','Введите текущий PIN-код','',{cancel:()=>{},ok:()=>setTimeout(()=>pinOpen('set1','Придумайте новый PIN-код','',{cancel:()=>{}}),350)})}
function afterLogin(){if(ME)localStorage.setItem('uname',ME.username);if(!pinData())pinOpen('set1','Придумайте PIN-код','Он защищает вход в приложение на этом устройстве',{})}
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(TOKEN&&hiddenAt&&Date.now()-hiddenAt>10000)lockApp()});
/* старт */
if(TOKEN&&pinData())lockApp();
if(TOKEN)refresh().then(()=>{if(!ME){PS.locked=false;pinHide();showAuth()}else if(!pinData())afterLogin()});else showAuth();
setInterval(()=>{if(TOKEN&&ME&&!document.hidden)refresh(true)},12000);
