const VERSION = 2;
const $ = (id) => document.getElementById(id);
$('ver').textContent = VERSION;

// Online / offline status
function setNet() {
  const el = $('net');
  el.textContent = navigator.onLine ? 'online' : 'offline';
  el.className = 'pill ' + (navigator.onLine ? 'on' : 'off');
}
addEventListener('online', setNet);
addEventListener('offline', setNet);
setNet();

// Installed vs browser tab
if (matchMedia('(display-mode: standalone)').matches) $('mode').textContent = 'installed app';

// Install button
let deferredPrompt = null;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('install').hidden = false;
});
$('install').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('install').hidden = true;
});
addEventListener('appinstalled', () => { $('installNote').textContent = 'Installed.'; });

// Saved counter and note (localStorage)
let count = Number(localStorage.getItem('count') || 0);
$('count').textContent = count;
$('plus').addEventListener('click', () => { count++; localStorage.setItem('count', count); $('count').textContent = count; });
$('reset').addEventListener('click', () => { count = 0; localStorage.setItem('count', 0); $('count').textContent = 0; });
$('note').value = localStorage.getItem('note') || '';
$('note').addEventListener('input', (e) => localStorage.setItem('note', e.target.value));

// Describe a CSV's text
function describe(name, text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return `${name}\n${lines.length - 1} data rows\n\n` + lines.slice(0, 5).join('\n');
}

// File picker
$('file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  $('fileOut').textContent = describe(f.name, await f.text());
});

// Shared file (handed over by the service worker)
async function showShared() {
  if (!new URLSearchParams(location.search).has('shared')) return;
  const cache = await caches.open('shared-files');
  const res = await cache.match('shared-file');
  if (!res) { $('sharedOut').textContent = 'Shared, but no file arrived.'; return; }
  const name = res.headers.get('x-file-name') || 'shared file';
  $('sharedOut').textContent = describe(name, await res.text());
  $('sharedOut').scrollIntoView();
}
showShared();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
