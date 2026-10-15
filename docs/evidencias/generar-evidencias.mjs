// Genera las capturas y el video del funcionamiento de la app contra la API REST (XAMPP).
// Requisitos: XAMPP encendido, Microsoft Edge, y `npm i playwright-core ffmpeg-static`.
// Uso: node generar-evidencias.mjs docs/evidencias
// El panel oscuro inferior y el retraso de 1.2 s por petición los agrega ESTE script (no son parte de la app).
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const OUT = process.argv[2] ?? 'evidencias';
const SHOTS = path.join(OUT, 'capturas');
const VIDEO_DIR = path.join(OUT, 'video');
const TMP_VIDEO = path.join(OUT, '.tmp-video');
const APP = 'http://localhost/proyecto/app';
const API = 'http://localhost/proyecto/api';
const DELAY_MS = 1200; // retraso artificial: en localhost la API responde tan rápido que el loading no se alcanza a ver
const VIEW = { width: 420, height: 900 };
const PANEL_H = 190;

for (const dir of [SHOTS, TMP_VIDEO]) fs.rmSync(dir, { recursive: true, force: true });
for (const dir of [SHOTS, VIDEO_DIR, TMP_VIDEO]) fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({
  viewport: VIEW,
  deviceScaleFactor: 2,
  serviceWorkers: 'block', // para que el retraso y el modo sin conexión apliquen a todas las peticiones
  recordVideo: { dir: TMP_VIDEO, size: VIEW },
});

// ---------- Panel de evidencia (lo dibuja este script, NO es parte de la app) ----------
await ctx.addInitScript(({ PANEL_H }) => {
  const install = () => {
    if (document.getElementById('ev-panel') || !document.body) return;
    const style = document.createElement('style');
    style.textContent = `
      ion-app { bottom: ${PANEL_H}px !important; height: auto !important; }
      #ev-panel { position: fixed; left: 0; right: 0; bottom: 0; height: ${PANEL_H}px; box-sizing: border-box;
        background: #0f172a; color: #e2e8f0; font: 11.5px/1.4 Consolas, monospace; padding: 7px 10px;
        border-top: 3px solid #f59e0b; z-index: 2147483647; overflow: hidden; }
      #ev-title { font: 600 10px system-ui; color: #94a3b8; letter-spacing: .04em; text-transform: uppercase; }
      #ev-step { font: 700 13.5px system-ui; color: #fbbf24; margin: 2px 0 6px; }
      .ev-row { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ev-body { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #94a3b8; margin: 0 0 3px 14px; }
      .GET { color: #60a5fa; } .POST { color: #34d399; } .PUT { color: #fbbf24; } .DELETE { color: #f87171; }
      .ok { color: #4ade80; } .warn { color: #fb923c; } .err { color: #f87171; } .wait { color: #e2e8f0; }`;
    document.head.appendChild(style);
    const panel = document.createElement('div');
    panel.id = 'ev-panel';
    panel.innerHTML = '<div id="ev-title">Peticiones a la API REST · panel agregado por el script de captura</div>' +
      '<div id="ev-step"></div><div id="ev-log"></div>';
    document.body.appendChild(panel);
  };
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  window.__ev = {
    render(step, rows) {
      install();
      const stepEl = document.getElementById('ev-step');
      if (!stepEl) return;
      stepEl.textContent = step;
      document.getElementById('ev-log').innerHTML = rows.map((r) => {
        const cls = r.status === null ? 'wait' : r.status >= 200 && r.status < 300 ? 'ok' : r.status >= 400 && r.status < 500 ? 'warn' : 'err';
        const status = r.status === null ? '⏳ esperando…' : r.status === 0 ? '✖ sin conexión' : `${r.status >= 400 ? '✖' : '✔'} ${r.status}`;
        const time = r.ms !== null ? ` · ${(r.ms / 1000).toFixed(1)} s` : '';
        return `<div class="ev-row"><span class="${cls}">${status}</span> <b class="${r.method}">${r.method}</b> ${esc(r.path)}<span style="color:#64748b">${time}</span></div>` +
          (r.body ? `<div class="ev-body">${esc(r.body)}</div>` : '');
      }).join('');
    },
  };
  document.addEventListener('DOMContentLoaded', install);
}, { PANEL_H });

const page = await ctx.newPage();
const rows = [];
let step = '';
const render = () => page.evaluate(([s, r]) => window.__ev?.render(s, r), [step, rows.slice(-4)]).catch(() => {});
const ids = new Map();
const apiPath = (url) => decodeURI(new URL(url).pathname.replace('/proyecto', '')) + new URL(url).search;

page.on('request', (req) => {
  if (!req.url().startsWith(API) || req.method() === 'OPTIONS') return;
  const row = { method: req.method(), path: apiPath(req.url()), status: null, ms: null, body: '', start: Date.now() };
  ids.set(req, row);
  rows.push(row);
  render();
});
page.on('response', async (res) => {
  const row = ids.get(res.request());
  if (!row) return;
  row.status = res.status();
  row.ms = Date.now() - row.start;
  row.body = (await res.text().catch(() => '')).slice(0, 140);
  render();
});
page.on('requestfailed', (req) => {
  const row = ids.get(req);
  if (!row) return;
  row.status = 0;
  row.ms = Date.now() - row.start;
  render();
});
page.on('load', () => render());

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

// Retraso artificial en cada petición a la API. En modo "sin conexión" la petición falla como sin red.
let offline = false;
async function setOffline(value) {
  offline = value;
  await ctx.setOffline(value);
}
await ctx.route(`${API}/**`, async (route) => {
  await new Promise((r) => setTimeout(r, DELAY_MS));
  if (offline) {
    await route.abort('internetdisconnected');
  } else {
    await route.continue();
  }
});

// ---------- Utilidades ----------
const results = [];
let n = 0;
const pause = (ms = 900) => page.waitForTimeout(ms);
async function setStep(text) {
  step = text;
  await render();
}
async function shot(name, note) {
  n++;
  const file = `${String(n).padStart(2, '0')}-${name}.png`;
  await render();
  await page.screenshot({ path: path.join(SHOTS, file) });
  results.push({ file, step, note });
  console.log(`📸 ${file}  ${note ?? ''}`);
  await pause();
}
/** Espera a que aparezca el loading y toma la captura mientras la petición sigue en curso. */
async function shotWhileLoading(name, note) {
  await page.waitForTimeout(350);
  await shot(name, note);
}
/** Espera a que el toast esté presentado (no solo creado) y devuelve su mensaje. */
async function toast() {
  await page.waitForFunction(
    () => [...document.querySelectorAll('ion-toast')].some((t) => !t.classList.contains('overlay-hidden')),
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(450); // animación de entrada
  return page.locator('ion-toast:not(.overlay-hidden)').last().evaluate((e) => e.message);
}
async function noToast() {
  await page.waitForFunction(() => !document.querySelector('ion-toast'), null, { timeout: 8000 }).catch(() => {});
}
const input = (name) => page.locator(`ion-input[formControlName="${name}"] input`);
async function typeInto(locator, text) {
  await locator.fill('');
  await locator.pressSequentially(text, { delay: 45 });
}
async function apiToken() {
  return page.evaluate(() => JSON.parse(localStorage.getItem('token') ?? 'null'));
}
async function cleanupCopito() {
  const token = await apiToken();
  if (!token) return;
  await page.evaluate(async ([api, token]) => {
    const h = { Authorization: 'Bearer ' + token };
    const { cuyos = [] } = await fetch(api + '/cuyos', { headers: h }).then((r) => r.json());
    for (const c of cuyos.filter((c) => c.name === 'Copito')) {
      await fetch(`${api}/cuyos/${c.id}`, { method: 'DELETE', headers: h });
    }
  }, [API, token]);
}

let cuyoId = null;
try {
  // ===== 1. Login: error 401 y loading =====
  await page.goto(`${APP}/login`);
  await setStep('Manejo de errores · POST /auth/login con contraseña incorrecta');
  await pause(1200);
  await typeInto(page.locator('ion-input input[type="email"]'), 'demo@correo.com');
  await typeInto(page.locator('ion-input input[type="password"]'), 'incorrecta');
  await page.locator('ion-button[type="submit"]').click();
  await shotWhileLoading('loading-login', 'Spinner en el botón + barra de carga global mientras responde la API');
  await shot('error-401-credenciales', `Toast: "${await toast()}"`);
  await noToast();

  await setStep('POST /auth/login · inicio de sesión correcto');
  await typeInto(page.locator('ion-input input[type="password"]'), '123456');
  await page.locator('ion-button[type="submit"]').click();
  await page.waitForURL('**/tabs/cuyos');
  await cleanupCopito();

  // ===== 2. GET lista =====
  await setStep('GET /cuyos · cargar la lista de cuyos');
  await shotWhileLoading('get-cuyos-cargando', 'Spinner mientras llega la lista');
  await page.locator('ion-item[detail]').first().waitFor();
  await shot('get-cuyos-lista', 'Lista recibida de la API (200)');

  // ===== 3. POST crear =====
  await page.locator('ion-fab-button').click();
  await page.waitForURL('**/tabs/cuyos/nuevo');
  await setStep('Validación en el cliente · formulario incompleto');
  await input('name').fill('');
  await page.locator('ion-button[type="submit"]').click();
  await shot('validacion-formulario', 'El formulario no se envía si hay campos inválidos');

  await setStep('POST /cuyos · registrar un cuyo nuevo');
  await typeInto(input('name'), 'Copito');
  await page.locator('ion-segment-button[value="macho"]').click();
  await typeInto(input('age_months'), '4');
  await typeInto(input('weight_g'), '520');
  await shot('post-formulario', 'Datos que se enviarán en el cuerpo JSON');
  await page.locator('ion-button[type="submit"]').click();
  await shotWhileLoading('post-guardando', 'Botón "Guardando..." + barra de carga');
  await shot('post-201-creado', `Toast: "${await toast()}"`);
  await page.waitForURL(/tabs\/cuyos\/\d+$/);
  cuyoId = Number(page.url().split('/').pop());
  await noToast();

  // ===== 4. GET detalle =====
  await setStep(`GET /cuyos/${cuyoId} y /cuyos/${cuyoId}/evaluations · detalle`);
  await page.locator('ion-content h1', { hasText: 'Copito' }).filter({ visible: true }).waitFor();
  await shot('get-detalle-cuyo', 'Detalle del cuyo recién creado');

  // ===== 5. PUT editar =====
  await page.locator('ion-button:has(ion-icon[name="create-outline"])').click();
  await setStep(`GET /cuyos/${cuyoId} · cargar los datos para editar`);
  await shotWhileLoading('put-cargando-datos', 'Spinner mientras se traen los datos actuales');
  await page.waitForFunction(() => document.querySelector('ion-input[formControlName="name"] input')?.value === 'Copito');
  await setStep(`PUT /cuyos/${cuyoId} · actualizar edad y peso`);
  await typeInto(input('age_months'), '5');
  await typeInto(input('weight_g'), '610');
  await shot('put-formulario', 'Formulario precargado y modificado');
  await page.locator('ion-button[type="submit"]').click();
  await shotWhileLoading('put-guardando', 'Botón "Guardando..." durante el PUT');
  const putMessage = await toast();
  await page.locator('ion-content p', { hasText: '610 g' }).filter({ visible: true }).waitFor(); // el detalle ya recargó los datos nuevos
  await shot('put-200-actualizado', `Toast: "${putMessage}" · el detalle muestra 5 meses y 610 g`);
  await noToast();

  // ===== 6. POST evaluación =====
  await page.locator('ion-button', { hasText: 'Evaluar su dieta' }).click();
  await setStep('GET /foods · catálogo de alimentos');
  await page.locator('.food-card').first().waitFor();
  await setStep('POST /evaluations · evaluar la dieta del día');
  const add = async (food, times) => {
    const button = page.locator('.food-card', { hasText: food }).locator('ion-button:has(ion-icon[name="add-circle"])');
    for (let i = 0; i < times; i++) await button.click();
  };
  await add('Heno', 3);
  await add('Agua fresca', 1);
  await add('Pimiento', 2);
  await add('Perejil', 2);
  await add('Brócoli', 1);
  await shot('post-evaluacion-carrito', 'Carrito: { cuyo_id, items: [{ food_id, quantity }] }');
  await page.locator('ion-footer ion-button', { hasText: 'Evaluar' }).click();
  await shotWhileLoading('post-evaluando', 'Botón "Evaluando..." durante el POST');
  await page.locator('ion-modal app-diet-result').waitFor();
  await pause(600);
  await shot('post-201-resultado', 'Respuesta del servidor: puntaje y recomendaciones');
  await page.locator('ion-modal ion-button', { hasText: 'Cerrar' }).click();
  await pause(600);

  // ===== 7. DELETE evaluación =====
  await page.goto(`${APP}/tabs/cuyos/${cuyoId}`);
  await setStep(`GET /cuyos/${cuyoId}/evaluations · historial del cuyo`);
  await page.locator('ion-list ion-item[detail]').first().waitFor();
  await page.locator('ion-list ion-item[detail]').first().click();
  await setStep('GET /evaluations/{id} · detalle de la evaluación');
  await page.locator('ion-button', { hasText: 'Eliminar evaluación' }).waitFor();
  await shot('get-detalle-evaluacion', 'Detalle con alimentos y recomendaciones');
  await setStep('DELETE /evaluations/{id} · eliminar evaluación');
  await page.locator('ion-button', { hasText: 'Eliminar evaluación' }).click();
  await page.locator('ion-alert').waitFor();
  await pause(500);
  await shot('delete-confirmar', 'Confirmación antes de eliminar');
  await page.locator('ion-alert .alert-button-role-destructive').click();
  await shotWhileLoading('delete-eliminando', 'Aviso "Eliminando evaluación..." durante el DELETE');
  await shot('delete-200-evaluacion', `Toast: "${await toast()}"`);
  await noToast();

  // ===== 8. Errores: 404 y sin conexión =====
  await page.goto(`${APP}/tabs/cuyos/99999`);
  await setStep('Manejo de errores · GET /cuyos/99999 (no existe)');
  await shot('error-404-no-existe', `Toast: "${await toast()}"`);
  await noToast();

  // Se navega DENTRO de la app (sin recargar), como lo haría un usuario
  await page.waitForURL(/tabs\/cuyos$/);
  await page.locator('ion-item[detail]', { hasText: 'Copito' }).click();
  await page.locator('ion-content h1', { hasText: 'Copito' }).filter({ visible: true }).waitFor();
  await page.locator('ion-button:has(ion-icon[name="create-outline"])').click();
  await setStep('Manejo de errores · PUT sin conexión con el servidor');
  await page.waitForFunction(() => document.querySelector('ion-input[formControlName="name"] input')?.value === 'Copito');
  await setOffline(true);
  await page.locator('ion-button[type="submit"]').click();
  await shot('error-sin-conexion', `Toast: "${await toast()}"`);
  await setOffline(false);
  await noToast();

  // ===== 9. DELETE cuyo =====
  await page.goto(`${APP}/tabs/cuyos/${cuyoId}`);
  await setStep(`DELETE /cuyos/${cuyoId} · eliminar el cuyo`);
  await page.locator('ion-button', { hasText: 'Eliminar cuyo' }).click();
  await page.locator('ion-alert').waitFor();
  await pause(500);
  await page.locator('ion-alert .alert-button-role-destructive').click();
  await shotWhileLoading('delete-eliminando-cuyo', 'Aviso "Eliminando cuyo..." durante el DELETE');
  await shot('delete-200-cuyo', `Toast: "${await toast()}"`);
  cuyoId = null;
  await noToast();

  // ===== 10. GET /health =====
  await page.goto(`${APP}/tabs/perfil`);
  await setStep('GET /health · probar la conexión con el servidor');
  const testButton = page.locator('ion-button', { hasText: 'Probar conexión' });
  await testButton.scrollIntoViewIfNeeded();
  await testButton.click();
  await shotWhileLoading('get-health-probando', 'Botón "Probando..." durante la petición');
  await shot('get-health-200', `Toast: "${await toast()}"`);
  await noToast();

  // ===== 11. Logout =====
  await setStep('POST /auth/logout · cerrar sesión');
  await page.locator('ion-button', { hasText: 'Cerrar sesión' }).click();
  await page.locator('ion-alert .alert-button-role-destructive').click();
  await page.waitForURL('**/login');
  await pause(1500);
  await shot('logout', 'Sesión cerrada: de vuelta al login');
} finally {
  if (cuyoId) await cleanupCopito().catch(() => {});
  const video = page.video();
  await ctx.close();
  await browser.close();

  const webm = path.join(TMP_VIDEO, 'recorrido-api-rest.webm');
  const mp4 = path.join(VIDEO_DIR, 'recorrido-api-rest.mp4');
  fs.copyFileSync(await video.path(), webm);
  const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-movflags', '+faststart', mp4]);
  fs.rmSync(TMP_VIDEO, { recursive: true, force: true });
  console.log('\n🎬 ' + mp4);
  console.log('errores de JavaScript en la página:', JSON.stringify(errors));
}
