// GTA VI trophy guide and tracker: 55 trophies, search, filters, roadmap,
// detail view, spoiler control, progress saved in localStorage, export/import/reset.
const KEY = 'gta6-trophy-checklist';
const SPOIL_KEY = 'gta6-trophy-spoiler';
const list = document.getElementById('list');
const search = document.getElementById('search');
const gradeSel = document.getElementById('grade');
const earnedSel = document.getElementById('earned');
const missSel = document.getElementById('miss');
const catSel = document.getElementById('cat');
const sortSel = document.getElementById('sort');
const spoilerBox = document.getElementById('spoiler');
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
spoilerBox.checked = localStorage.getItem(SPOIL_KEY) === '1';
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

function save() { localStorage.setItem(KEY, JSON.stringify([...earned])); }

function isStorySpoiler(t) { return spoilerBox.checked && t.category === 'story' && !earned.has(t.name); }

function show(t) {
  const q = search.value.toLowerCase();
  if (q && !(t.name + ' ' + t.description + ' ' + t.chapter).toLowerCase().includes(q)) return false;
  if (gradeSel.value !== 'all' && t.grade !== gradeSel.value) return false;
  if (earnedSel.value === 'earned' && !earned.has(t.name)) return false;
  if (earnedSel.value === 'unearned' && earned.has(t.name)) return false;
  if (missSel.value === 'missable' && !t.missable) return false;
  if (missSel.value === 'safe' && t.missable) return false;
  if (catSel.value !== 'all' && t.category !== catSel.value) return false;
  return true;
}

function render() {
  let items = trophies.filter(show);
  if (sortSel.value === 'az') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
  if (sortSel.value === 'diff') items = [...items].sort((a, b) => b.difficulty - a.difficulty);
  list.replaceChildren();
  for (const t of items) {
    const card = document.createElement('div');
    card.className = 'card' + (earned.has(t.name) ? ' earned' : '');
    const box = document.createElement('input');
    box.type = 'checkbox'; box.checked = earned.has(t.name);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      save(); render();
    });
    const title = document.createElement('strong');
    title.textContent = isStorySpoiler(t) ? 'Story trophy — hidden by spoiler control' : t.name;
    const grade = document.createElement('span');
    grade.className = 'grade ' + t.grade; grade.textContent = t.grade;
    const desc = document.createElement('p');
    desc.textContent = isStorySpoiler(t) ? 'Earn it to reveal its name and description.' : t.description;
    const meta = document.createElement('p');
    meta.textContent = `${t.chapter} • Difficulty ${t.difficulty}/5 • ${t.time}` + (t.missable ? ' • MISSABLE' : '');
    card.append(box, ' ', title, ' ', grade, desc, meta);
    card.addEventListener('click', () => openDetail(t));
    list.append(card);
  }
  const pct = Math.round((earned.size / trophies.length) * 100);
  document.getElementById('bar').style.width = pct + '%';
  document.getElementById('progress').textContent = `${earned.size} of ${trophies.length} earned — ${pct}%`;
  document.getElementById('bygrade').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${g}: ${trophies.filter((t) => t.grade === g && earned.has(t.name)).length}/${trophies.filter((t) => t.grade === g).length}`)
    .join(' • ');
  document.getElementById('count').textContent = `All trophies (${items.length} shown)`;
}

function openDetail(t) {
  const d = document.getElementById('detail');
  d.hidden = false;
  document.getElementById('dname').textContent = t.name;
  document.getElementById('ddesc').textContent = 'Official: ' + t.description;
  document.getElementById('dmeta').innerHTML = '';
  const meta = document.getElementById('dmeta');
  for (const [k, v] of [['Grade', t.grade], ['Chapter / mission', t.chapter], ['Missable', t.missable ? 'Yes — do it before the story moves on' : 'No'], ['Difficulty', t.difficulty + ' / 5'], ['Estimated time', t.time], ['Kind', t.category]]) {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    meta.append(dt, dd);
  }
  document.getElementById('dguide').textContent = 'Guide: ' + t.guide;
  document.getElementById('dsource').textContent = 'Source: ' + t.source;
  d.scrollIntoView();
}

document.getElementById('dclose').addEventListener('click', () => { document.getElementById('detail').hidden = true; });
document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned])], { type: 'application/json' }));
  a.download = 'trophy-progress.json'; a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  earned = new Set(JSON.parse(await file.text())); save(); render();
});
document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Reset all earned trophies?')) { earned = new Set(); save(); render(); }
});
spoilerBox.addEventListener('change', () => {
  localStorage.setItem(SPOIL_KEY, spoilerBox.checked ? '1' : '0'); render();
});
for (const el of [search, gradeSel, earnedSel, missSel, catSel, sortSel]) el.addEventListener('input', render);
render();
