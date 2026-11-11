
var $=function(s){return document.querySelector(s)};
var SLOTS={gram_list:'Gram — иконка в списке',gram_send:'Gram — иконка при отправке',gram_tap:'Gram — иконка при нажатии',usdt_list:'Tether USD — иконка в списке'};
var GRAM='<svg viewBox="0 0 66 66"><circle cx="33" cy="33" r="33" fill="#2f95f5"/><path d="M18 26l5-6h20l5 6-15 21z" fill="#fff"/><path d="M33 24l2.4 5.6L41 32l-5.6 2.4L33 40l-2.4-5.6L25 32l5.6-2.4z" fill="#2f95f5"/></svg>',ME=null,mode='login',sheet=$('#sheet'),dim=$('#dim');
function ls(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function ss(k,v){localStorage.setItem(k,JSON.stringify(v))}
function rnd(n){var a=new Uint8Array(n);crypto.getRandomValues(a);return a}
function hex(a){return Array.from(a).map(function(x){return x.toString(16).padStart(2,'0')}).join('')}
async function hsh(p,salt){var d=new TextEncoder().encode(salt+p);if(window.crypto&&crypto.subtle)return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',d)));var h=5381;for(var i=0;i<d.length;i++)h=((h<<5)+h+d[i])>>>0;return String(h)}
function newAddr(){var s='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',a=rnd(46),r='UQ';for(var i=0;i<46;i++)r+=s[a[i]%64];return r}
async function seed(){var u=ls('users',{});if(!u.admin){var salt=hex(rnd(8));u.admin={username:'admin',salt:salt,pw:await hsh('admin12345',salt),admin:true,address:newAddr()};ss('users',u)}}
function b2u(b){var s=atob(b),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a}
function u2b(a){var s='';for(var i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s)}
function mount(el,slot,o){o=o||{};var b=ls('icons',{})[slot];if(!b)return Promise.resolve(null);
 try{var d=JSON.parse(pako.ungzip(b2u(b),{to:'string'}));el.innerHTML='';return Promise.resolve(lottie.loadAnimation({container:el,renderer:'svg',loop:o.loop!==false,autoplay:o.autoplay!==false,animationData:d}))}catch(e){return Promise.resolve(null)}}
function openSheet(h){$('#sbody').innerHTML=h;sheet.classList.add('on');dim.classList.add('on')}
function closeSheet(){sheet.classList.remove('on');dim.classList.remove('on')}dim.onclick=closeSheet;
function toast(t){var e=$('#toast');e.textContent=t;e.classList.add('on');setTimeout(function(){e.classList.remove('on')},1800)}
function copyA(){try{navigator.clipboard.writeText(ME.address)}catch(e){}toast('Адрес скопирован')}
(function(){var c=$('#c1');for(var i=0;i<18;i++){var s=document.createElement('span');s.className='st';s.textContent='✦';
 s.style.left=(4+Math.random()*90)+'%';s.style.top=(5+Math.random()*80)+'%';s.style.fontSize=(9+Math.random()*16)+'px';
 s.style.animationDuration=(2+Math.random()*3)+'s,'+(6+Math.random()*6)+'s';s.style.animationDelay=(-Math.random()*5)+'s,'+(-Math.random()*8)+'s';c.appendChild(s)}})();
async function boot(){await seed();var n=ls('session',null),u=n&&ls('users',{})[n.toLowerCase()];
 if(u){ME=u;$('#auth').classList.remove('on');$('#ini').textContent=u.username.slice(0,2).toUpperCase();mount($('#ico-gram'),'gram_list');mount($('#ico-usdt'),'usdt_list')}else{ME=null;$('#auth').classList.add('on')}}
document.querySelectorAll('.seg button').forEach(function(b){b.onclick=function(){mode=b.dataset.m;document.querySelectorAll('.seg button').forEach(function(x){x.classList.toggle('on',x===b)});$('#go').textContent=mode==='login'?'Войти':'Создать кошелёк';$('#am').textContent=''}});
$('#go').onclick=async function(){var name=$('#u').value.trim(),pw=$('#p').value,us=ls('users',{}),k=name.toLowerCase(),m=$('#am');
 if(mode==='register'){if(!/^[A-Za-z0-9_]{3,20}$/.test(name)){m.textContent='Логин: 3–20 символов, латиница, цифры, _';return}
  if(pw.length<6){m.textContent='Пароль минимум 6 символов';return}if(us[k]){m.textContent='Такой логин уже занят';return}
  var salt=hex(rnd(8));us[k]={username:name,salt:salt,pw:await hsh(pw,salt),admin:false,address:newAddr()};ss('users',us)}
 else{var u=us[k];if(!u||u.pw!==await hsh(pw,u.salt)){m.textContent='Неверный логин или пароль';return}}
 ss('session',name);$('#p').value='';m.textContent='';boot()};
$('#p').addEventListener('keydown',function(e){if(e.key==='Enter')$('#go').click()});
var S={
 deposit:function(){return '<h2>Пополнить</h2><p>Отправьте GRAM или USD₮ (TON) на адрес вашего кошелька.</p><div class="addr">'+ME.address+'</div><button class="pri" onclick="copyA()">Скопировать адрес</button>'},
 send:function(){return '<div class="big" id="big"></div><h2>Отправить</h2><input class="fld" id="to" placeholder="Адрес получателя"><input class="fld" type="number" inputmode="decimal" placeholder="Сумма, GRAM"><button class="pri" id="do">Отправить</button><div class="msg" id="m"></div>'},
 trade:function(){return '<h2>Торговля</h2><p>Обмен GRAM ⇄ USD₮ по курсу 1 GRAM = 1,01 USD₮.</p><input class="fld" type="number" inputmode="decimal" placeholder="Сумма"><button class="pri" id="do">Обменять</button><div class="msg" id="m"></div>'},
 stake:function(){return '<h2>Стейкинг</h2><p>Ставьте GRAM и получайте до 13,91 % годовых.</p><input class="fld" type="number" inputmode="decimal" placeholder="Сумма, GRAM"><button class="pri" id="do">Поставить в стейкинг</button><div class="msg" id="m"></div>'},
 gram:function(){return '<div class="big" id="big"></div><h2>Gram</h2><p>Цена: 82,86 ₽ (−4,25 %)<br>Баланс: 0 GRAM<br>Стейкинг: 13,91 % годовых</p><button class="pri" onclick="openAct(\'deposit\')">Пополнить</button>'},
 usdt:function(){return '<div class="big"><svg viewBox="0 0 66 66"><circle cx="33" cy="33" r="33" fill="#119f8a"/><path d="M17 22l4-5h24l4 5-16 22z" fill="#fff"/><path d="M24 25h18M33 25v12M27 30c0 2 12 2 12 0" stroke="#119f8a" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="11" fill="#1e88e5" stroke="#181818" stroke-width="3"/><path d="M45 46h10l-5 9z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg></div><h2>Tether USD</h2><p>Сеть: TON<br>Цена: 81,87 ₽<br>Баланс: 0 USD₮</p><button class="pri" onclick="openAct(\'deposit\')">Пополнить</button>'},
 add:function(){return '<h2>Добавить</h2><p>Импорт токена скоро будет доступен.</p><button class="pri" onclick="closeSheet()">Понятно</button>'},
 me:function(){return '<h2>'+ME.username+'</h2><p>Адрес кошелька:</p><div class="addr">'+ME.address+'</div>'+(ME.admin?'<button class="pri" onclick="openAdmin()">Админ-панель (иконки TGS)</button>':'')+'<button class="pri gr" id="lo">Выйти</button>'}
};
function openAct(k){openSheet(S[k]());var anim=null;
 if(k==='send'){$('#big').innerHTML=GRAM;mount($('#big'),'gram_send').then(function(a){anim=a;if(!a)mount($('#big'),'gram_list').then(function(b){anim=b})})}
 if(k==='gram'){$('#big').innerHTML=GRAM;mount($('#big'),'gram_tap',{loop:false}).then(function(a){anim=a;$('#big').onclick=function(){if(anim)anim.goToAndPlay(0)}})}
 if(k==='me')$('#lo').onclick=function(){ss('session',null);closeSheet();boot()};
 var g=$('#do');if(g)g.onclick=function(){var m=$('#m');if(k==='send'&&!$('#to').value.trim()){m.textContent='Введите адрес получателя';return}
  if(k==='send'&&anim)anim.goToAndPlay(0);m.textContent='Недостаточно средств'}}
function openAdmin(){closeSheet();var a=$('#adm'),icons=ls('icons',{}),h='<button class="back" id="ab">← Назад</button><h1>Иконки TGS</h1><p class="lead">Загрузите анимированные стикеры .tgs. Они сохраняются на этом телефоне.</p>';
 Object.keys(SLOTS).forEach(function(k){h+='<div class="slot"><h3>'+SLOTS[k]+'</h3><div class="pv" id="pv-'+k+'">'+(icons[k]?'':'не загружено')+'</div><input type="file" id="f-'+k+'"><button class="pri" data-up="'+k+'">Загрузить</button>'+(icons[k]?'<button class="pri gr" data-del="'+k+'">Удалить</button>':'')+'<div class="msg" id="m-'+k+'"></div></div>'});
 a.innerHTML=h;a.classList.add('on');$('#ab').onclick=function(){a.classList.remove('on');boot()};
 Object.keys(icons).forEach(function(k){mount($('#pv-'+k),k)});
 a.querySelectorAll('[data-up]').forEach(function(b){b.onclick=async function(){var k=b.dataset.up,f=$('#f-'+k).files[0],m=$('#m-'+k);if(!f){m.textContent='Выберите файл .tgs';return}
  try{var u=new Uint8Array(await f.arrayBuffer()),j=JSON.parse(pako.ungzip(u,{to:'string'}));if(!j.layers)throw 0;if(u.length>1500000){m.textContent='Файл слишком большой';return}
   var ic=ls('icons',{});ic[k]=u2b(u);ss('icons',ic);openAdmin()}catch(e){m.textContent='Это не корректный TGS'}}});
 a.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){var ic=ls('icons',{});delete ic[b.dataset.del];ss('icons',ic);openAdmin()}})}
document.querySelectorAll('[data-a]').forEach(function(b){b.onclick=function(){openAct(b.dataset.a)}});
document.querySelectorAll('[data-tok]').forEach(function(b){b.onclick=function(){openAct(b.dataset.tok)}});
$('#plus').onclick=function(){openAct('add')};$('#ava').onclick=function(){if(ME)openAct('me')};
$('#q').addEventListener('keydown',function(e){if(e.key==='Enter'&&this.value.trim()){toast('Поиск: '+this.value.trim());this.value='';this.blur()}});
$('#tabs').onclick=function(e){var t=e.target.closest('.tab');if(!t)return;document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x===t)});
 ['wallet','market','browse'].forEach(function(id){$('#'+id).hidden=id!==t.dataset.t});$('#scroll').scrollTop=0};
boot();
