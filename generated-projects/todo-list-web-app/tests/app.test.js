// Automated unit tests generated for todo-list-web-app
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SOURCE_FILES = ['app.js', 'index.html', 'styles.css'];
const projectRoot = path.join(__dirname, '..');

test('every generated source file exists and has content', () => {
  for (const file of SOURCE_FILES) {
    const fullPath = path.join(projectRoot, file);
    assert.ok(fs.existsSync(fullPath), `missing file: ${file}`);
    assert.ok(fs.readFileSync(fullPath, 'utf8').trim().length > 0, `empty file: ${file}`);
  }
});

test('the entry point references its scripts and styles', () => {
  const entry = SOURCE_FILES.find((file) => file.endsWith('.html'));
  if (!entry) return;

  const html = fs.readFileSync(path.join(projectRoot, entry), 'utf8');
  for (const file of SOURCE_FILES.filter((f) => f.endsWith('.js') || f.endsWith('.css'))) {
    assert.ok(html.includes(path.basename(file)), `entry point does not reference ${file}`);
  }
});
