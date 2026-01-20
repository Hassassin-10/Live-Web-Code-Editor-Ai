// ================== Utilities ==================
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const out = $('#output');
const preview = $('#preview');
const STORAGE_KEY = 'academy-codelab-web';


const escapeHtml = s =>
  String(s).replace(/[&<>"]/g, c => ({

    '&': '&amp;',

    '<': '&lt;',

    '>': '&gt;',

    '"': '&quot;'
  }[c]
  ));


function log(msg, type = 'info') {
  const color = type === 'error' ? 'var(--err)' : type === 'warn' ? 'var(--warn)' : 'var(--brand)';

  const time = new Date().toLocaleTimeString();

  const line = document.createElement('div');

  line.innerHTML = `<span style="color:${color}">[${time}]</span> ${escapeHtml(msg)}`;

  out.appendChild(line); out.scrollTop = out.scrollHeight;
}


function clearOut() { out.innerHTML = ''; }

$('#clearOut')?.addEventListener('click', clearOut);


// ================== ACE Editors (HTML/CSS/JS) ==================
function makeEditor(id, mode) {

  const ed = ace.edit(id, {
    theme: 'ace/theme/dracula',
    mode, tabSize: 2, useSoftTabs: true, showPrintMargin: false, wrap: true
  });


  ed.session.setUseWrapMode(true);
  ed.commands.addCommand({
    name: 'run', bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
    exec() { runWeb(false); }
  });


  ed.commands.addCommand({
    name: 'save', bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
    exec() { saveProject(); }
  });


  return ed;
}

const ed_html = makeEditor('ed_html', 'ace/mode/html');
const ed_css = makeEditor('ed_css', 'ace/mode/css');
const ed_js = makeEditor('ed_js', 'ace/mode/javascript');

// ================== Tabs (robust + a11y) ==================
const TAB_ORDER = ['html', 'css', 'js'];

const wraps = Object.fromEntries($$('#webEditors .editor-wrap').map(w => [w.dataset.pane, w]));

const editors = { html: ed_html, css: ed_css, js: ed_js };

function activePane() {
  const t = $('#webTabs .tab.active');
  return t ? t.dataset.pane : 'html';
}


function showPane(name) {

  TAB_ORDER.forEach(k => { if (wraps[k]) wraps[k].hidden = (k !== name); });
  $$('#webTabs .tab').forEach(t => {
    const on = t.dataset.pane === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
  });


  requestAnimationFrame(() => {
    const ed = editors[name];
    if (ed && ed.resize) { ed.resize(true); ed.focus(); }
  });

}


$('#webTabs')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab'); if (!btn) return;
  showPane(btn.dataset.pane);
});


$('#webTabs')?.addEventListener('keydown', (e) => {
  const idx = TAB_ORDER.indexOf(activePane());
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const delta = e.key === 'ArrowLeft' ? -1 : 1;
    showPane(TAB_ORDER[(idx + delta + TAB_ORDER.length) % TAB_ORDER.length]);
    e.preventDefault();
  }
});

showPane('html');

// ================== Preview ==================
function buildWebSrcdoc(withTests = false) {
  const html = ed_html.getValue();
  const css = ed_css.getValue();
  const js = ed_js.getValue();
  const tests = ($('#testArea')?.value || '').trim();

  return `<!doctype html>
  
  <html lang="en" dir="ltr">
  


<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width,initial-scale=1">


<style>${css}\n</style></head>

<body>${html}

<script>
  // Capture console output
  (function(){
    const _log = console.log;
    const _warn = console.warn;
    const _error = console.error;
    
    console.log = function(...args){
      _log.apply(console, args);
      try { parent.log(args.join(' '), 'info'); } catch(e){}
    };
    console.warn = function(...args){
      _warn.apply(console, args);
      try { parent.log(args.join(' '), 'warn'); } catch(e){}
    };
    console.error = function(...args){
      _error.apply(console, args);
      try { parent.log(args.join(' '), 'error'); } catch(e){}
    };
    
    window.onerror = function(msg, url, line, col, error) {
      try { parent.log('Error: ' + msg + ' (Line ' + line + ')', 'error'); } catch(e){}
    };
  })();
</script>

<script>

try{

${js}

${withTests && tests ? `\n/* tests */\n${tests}` : ''}

}catch(e){console.error(e)}<\/script>

</body>

</html>`;
}


function runWeb(withTests = false) {
  preview.srcdoc = buildWebSrcdoc(withTests);
  log(withTests ? 'Run with tests.' : 'Web preview updated.');
}

$('#runWeb')?.addEventListener('click', () => runWeb(false));


$('#runTests')?.addEventListener('click', () => runWeb(true));


$('#openPreview')?.addEventListener('click', () => {

  const src = buildWebSrcdoc(false);

  const w = window.open('about:blank');

  w.document.open(); w.document.write(src); w.document.close();
});

// ================== Save / Load (Web-only) ==================
function projectJSON() {
  return {
    version: 1,
    kind: 'web-only',
    assignment: $('#assignment')?.value || '',
    test: $('#testArea')?.value || '',
    html: ed_html.getValue(),
    css: ed_css.getValue(),
    js: ed_js.getValue()
  };
}


function loadProject(obj) {

  try {

    if ($('#assignment')) $('#assignment').value = obj.assignment || '';

    if ($('#testArea')) $('#testArea').value = obj.test || '';

    ed_html.setValue(obj.html || '', -1);

    ed_css.setValue(obj.css || '', -1);

    ed_js.setValue(obj.js || '', -1);

    log('Web project loaded.');

  } catch (e) { log('Unable to load project: ' + e, 'error'); }

}


function setDefaultContent() {
  ed_html.setValue(`<!-- Welcome card -->
<section class="card" style="max-width:520px;margin:24px auto;padding:18px;text-align:center">
  <h1>Welcome to the Live Web Code Editor</h1>
  <p>This example runs locally in the browser.</p>
  <button id="btn">Try me</button>
</section>`, -1);

  ed_css.setValue(`body{font-family:system-ui;background:#f7fafc;margin:0}
h1{color:#0f172a}
#btn{padding:.75rem 1rem;border:0;border-radius:10px;background:#60a5fa;color:#08111f;font-weight:700}`, -1);

  ed_js.setValue(`document.getElementById('btn').addEventListener('click',()=>alert('Well done!'));
console.log('Hello from JavaScript!');`, -1);
}


function saveProject() {
  try {
    const data = JSON.stringify(projectJSON(), null, 2);
    localStorage.setItem(STORAGE_KEY, data);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Code-web.json';
    a.click();
    log('Saved locally and downloaded JSON file.');
  } catch (e) { log('Unable to save: ' + e, 'error'); }
}


$('#saveBtn')?.addEventListener('click', saveProject);
$('#loadBtn')?.addEventListener('click', () => $('#openFile').click());
$('#openFile')?.addEventListener('change', async (e) => {
  const f = e.target.files?.[0]; if (!f) return;
  try { const obj = JSON.parse(await f.text()); loadProject(obj); }
  catch (err) { log('Invalid project file', 'error'); }
});

// ================== Initial load ==================
try {
  const cache = localStorage.getItem(STORAGE_KEY);
  if (cache) { loadProject(JSON.parse(cache)); }
  else { setDefaultContent(); }
} catch { setDefaultContent(); }

log('Ready — Web-only Editor (HTML/CSS/JS) ✨');



function normalizeProject(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Not an object');

  // accept old/new shapes; fall back to empty strings
  const html = typeof raw.html === 'string' ? raw.html : (raw.web && raw.web.html) || '';
  const css = typeof raw.css === 'string' ? raw.css : (raw.web && raw.web.css) || '';
  const js = typeof raw.js === 'string' ? raw.js : (raw.web && raw.web.js) || '';

  return {
    version: 1,
    kind: 'web-only',
    assignment: typeof raw.assignment === 'string' ? raw.assignment : (raw.task || ''),
    test: typeof raw.test === 'string' ? raw.test : (raw.tests || ''),
    html, css, js
  };
}

function safeSetValue(id, val) {
  const el = document.getElementById(id);
  if (el) { el.value = val; }
  else { log(`Warning: #${id} not found; skipped setting value`, 'warn'); }
}

function loadProject(raw) {
  const proj = normalizeProject(raw);
  safeSetValue('assignment', proj.assignment);
  safeSetValue('testArea', proj.test);
  if (typeof ed_html?.setValue === 'function') ed_html.setValue(proj.html, -1);
  if (typeof ed_css?.setValue === 'function') ed_css.setValue(proj.css, -1);
  if (typeof ed_js?.setValue === 'function') ed_js.setValue(proj.js, -1);
  log('Project loaded.');
}


// ================== Gemini "Magic Build" ==================
const MAGIC_BTN = $('#magicBtn');

async function callGemini(assignment) {
  let apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    apiKey = prompt('Please enter your Gemini API Key to use this feature:\n(It will be saved locally)');
    if (apiKey) localStorage.setItem('gemini_api_key', apiKey.trim());
    else return;
  }

  MAGIC_BTN.disabled = true;
  const originalText = MAGIC_BTN.innerHTML;
  MAGIC_BTN.innerHTML = `<span>✨ Building...</span>`;

  try {
    const promptText = `
      You are an expert web developer.
      Task: ${assignment}
      
      Output ONLY a VALID JSON object with this exact structure:
      {
        "html": "...",
        "css": "...",
        "js": "..."
      }
      Do not include markdown formatting (like \`\`\`json). Just the raw JSON string.
      Ensure the code is complete and functional.
    `;

    // Try multiple models in case of 404/availability
    const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    let lastError;
    let response;

    for (const model of models) {
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        });

        if (response.ok) break;

        // Continue if 404 (Not Found) or 429 (Rate Limit)
        if (response.status !== 404 && response.status !== 429) {
          const errText = await response.text();
          throw new Error(`${response.status} ${response.statusText} - ${errText}`);
        }
      } catch (e) {
        lastError = e;
        // Only break loop if it's NOT a 404/429 error
        if (!e.message.includes('404') && !e.message.includes('429')) break;
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error('All models failed (404 Not Found)');
    }

    /* if (!response.ok) { ... } removed as handled above */

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('No response generated');

    // Clean up potential markdown code blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const result = JSON.parse(text);

    if (result.html) ed_html.setValue(result.html, -1);
    if (result.css) ed_css.setValue(result.css, -1);
    if (result.js) ed_js.setValue(result.js, -1);

    log('✨ Solution built by Gemini!', 'star');
    runWeb(false); // Auto-run

  } catch (err) {
    console.error(err);
    log('Gemini Error: ' + err.message, 'error');
    if (err.message.includes('API')) localStorage.removeItem('gemini_api_key'); // Reset if bad key
  } finally {
    MAGIC_BTN.disabled = false;
    MAGIC_BTN.innerHTML = originalText;
  }
}

MAGIC_BTN?.addEventListener('click', () => {
  const task = $('#assignment').value.trim();
  if (!task) {
    alert('Please describe the task first!');
    return;
  }
  callGemini(task);
});


// Buttons


// ===== Initial restore (after DOM is parsed) =====
window.addEventListener('DOMContentLoaded', () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const obj = JSON.parse(cached);
      loadProject(obj);
    } else {
      // seed defaults if nothing cached
      if (!document.getElementById('assignment')) return;
      // your default seeding function if you have one:
      // setDefaultContent();
    }
  } catch (e) {
    log('Skipping auto-restore: ' + e, 'warn');
  }
});
