const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'dist/data/dashboard.json'), 'utf8'));
const listeners = new Map();
class Element {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.dataset = {};
    this.classes = new Set();
    this.classList = { toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name) };
  }
  addEventListener(type, callback) {
    listeners.set(`${this.id}:${type}`, callback);
  }
  dispatch(type) {
    const callback = listeners.get(`${this.id}:${type}`);
    assert.ok(callback, `Expected ${type} handler for ${this.id}`);
    callback({ target: this });
  }
  insertAdjacentHTML(_position, html) { this.innerHTML += html; }
}
const ids = ['county-select','crop-select','year-select','summary-year','summary-yield','summary-rain','summary-status','year-badge','county-title','county-meta','temperature','monthly-rain','field-title','radar-county','satellite-state','alerts-state','weather-live','yield-history','field-grid','field-average','alerts-list','weather-chart','county-chart','crop-chart','crop-legend','trend-chart','soil-chart','main'];
const elements = Object.fromEntries(ids.map((id) => [id, new Element(id)]));
elements['county-select'].value = 'nakuru';
elements['crop-select'].value = 'maize';
elements['year-select'].value = '2026';
const yearInline = [new Element(), new Element(), new Element()];
const countyInline = [new Element()];
const cropButtons = data.crops.slice(0,8).map((crop) => {
  const button = new Element();
  button.dataset.crop = crop.id;
  return button;
});
const document = {
  getElementById: (id) => elements[id],
  querySelector: (selector) => selector.startsWith('#') ? elements[selector.slice(1)] : selector === 'main' ? elements.main : null,
  querySelectorAll: (selector) => selector === '.year-inline' ? yearInline : selector === '.county-inline' ? countyInline : selector === '[data-crop]' ? cropButtons : [],
};
const context = {
  document,
  fetch: async (url) => ({ ok: url === 'data/dashboard.json', status: 200, json: async () => data }),
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'dist/js/app.js'), 'utf8'), context);

(async () => {
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(elements['county-title'].textContent, 'Nakuru County');
  assert.equal(elements.temperature.textContent, '24°C');
  assert.equal(elements['monthly-rain'].textContent, '89mm');
  assert.equal(elements['summary-status'].textContent, 'Current snapshot');
  assert.equal(elements['weather-live'].textContent, '(Static sample data)');
  assert.match(elements['weather-chart'].innerHTML, /<svg/);
  assert.match(elements['county-chart'].innerHTML, /Nakuru/);
  assert.equal(elements['alerts-list'].innerHTML.split('<li').length - 1, 4);
  assert.equal(elements['field-grid'].innerHTML.split('field-cell').length - 1, 100);

  elements['year-select'].value = '2022';
  elements['year-select'].dispatch('change');
  assert.equal(elements['summary-status'].textContent, 'Archived');
  assert.equal(elements['summary-yield'].textContent, '-15%');
  assert.equal(elements['satellite-state'].className, 'pill archived');
  assert.match(elements['satellite-state'].innerHTML, /Historical/);
  assert.equal(yearInline[0].textContent, '2022');

  elements['county-select'].value = 'meru';
  elements['county-select'].dispatch('change');
  assert.equal(elements['county-title'].textContent, 'Meru County');
  assert.equal(countyInline[0].textContent, 'Meru');

  elements['crop-select'].value = 'tea';
  elements['crop-select'].dispatch('change');
  assert.match(elements['county-meta'].textContent, /Tea \(Chai\)/);
  assert.ok(cropButtons.find((button) => button.dataset.crop === 'tea').classes.has('selected'));
  console.log('Dashboard interaction smoke tests passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
