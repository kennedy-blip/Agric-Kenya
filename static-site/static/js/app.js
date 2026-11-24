const $ = (selector) => document.querySelector(selector);
const round = (value) => Math.round(value);
const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

function svgChart(id, content, label) {
  const el = document.getElementById(id);
  el.innerHTML = `<svg viewBox="0 0 640 280" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}
function text(x, y, value, anchor = 'middle', cls = 'axis-text') {
  return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(value)}</text>`;
}
function gridLines(left, top, width, height, max, ticks = 4) {
  let html = '';
  for (let i = 0; i <= ticks; i += 1) {
    const y = top + height - (height * i / ticks);
    html += `<line class="grid-line" x1="${left}" y1="${y}" x2="${left + width}" y2="${y}"/>`;
    html += text(left - 8, y + 3, round(max * i / ticks), 'end');
  }
  return html;
}
function renderWeather(data, year) {
  const rows = data.weather.map((row) => ({ ...row, rainfall: round(row.rainfall * data.multipliers[year].rainfall), temperature: round(row.temperature * data.multipliers[year].temp), yieldIndex: round(row.yieldIndex * data.multipliers[year].yield) }));
  const left = 40, top = 18, width = 580, height = 205, max = 180, step = width / rows.length, barW = 15;
  let html = gridLines(left, top, width, height, max);
  const tempPts = [], yieldPts = [];
  rows.forEach((row, i) => {
    const x = left + step * i + step / 2;
    const barH = row.rainfall / max * height;
    html += `<rect class="bar" x="${x - barW / 2}" y="${top + height - barH}" width="${barW}" height="${barH}" fill="#60a5fa"><title>${row.month}: ${row.rainfall} mm rain</title></rect>`;
    html += text(x, top + height + 18, row.month);
    tempPts.push(`${x},${top + height - row.temperature / max * height}`);
    yieldPts.push(`${x},${top + height - row.yieldIndex / max * height}`);
  });
  html += `<polyline fill="none" stroke="#f59e0b" stroke-width="2.5" points="${tempPts.join(' ')}"/><polyline fill="none" stroke="#22c55e" stroke-width="2.5" points="${yieldPts.join(' ')}"/>`;
  svgChart('weather-chart', html, `Monthly rainfall, temperature and yield index for ${year}`);
}
function renderCounty(data, year) {
  const m = data.multipliers[year];
  const rows = data.countyYield.map((row) => ({ ...row, maize: round(row.maize * m.yield), potatoes: round(row.potatoes * m.yield), wheat: round(row.wheat * m.yield) }));
  const left = 42, top = 16, width = 580, height = 214, max = 50, step = width / rows.length, bw = 11;
  let html = gridLines(left, top, width, height, max, 5);
  rows.forEach((row, i) => {
    const center = left + step * (i + .5);
    [['maize','#fbbf24'],['potatoes','#a855f7'],['wheat','#3b82f6']].forEach(([key,color], j) => {
      const h = row[key] / max * height;
      html += `<rect class="bar" x="${center - 17 + j * 12}" y="${top + height - h}" width="10" height="${h}" fill="${color}"><title>${row.county} ${key}: ${row[key]} bags/ha</title></rect>`;
    });
    html += text(center, top + height + 26, row.county.split(' ').map((part) => part.slice(0, 5)).join(' '));
  });
  svgChart('county-chart', html, `Maize, potato and wheat yields by county in ${year}`);
}
function renderDonut(data) {
  const total = data.cropDistribution.reduce((sum, row) => sum + row.value, 0);
  let angle = 0;
  const cx = 320, cy = 116, r = 76, circumference = 2 * Math.PI * r;
  let html = '';
  data.cropDistribution.forEach((row) => {
    const length = row.value / total * circumference;
    html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${row.color}" stroke-width="34" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-angle}" transform="rotate(-90 ${cx} ${cy})"><title>${row.name}: ${row.value}%</title></circle>`;
    angle += length;
  });
  html += text(cx, cy - 2, 'Kenya', 'middle', 'donut-label');
  html += text(cx, cy + 16, 'Crops', 'middle', 'donut-label-small');
  svgChart('crop-chart', html, 'Crop distribution by share of agricultural land');
  $('#crop-legend').innerHTML = data.cropDistribution.map((row) => `<span><i style="background:${row.color}"></i>${esc(row.name)} ${row.value}%</span>`).join('');
}
function renderTrends(data) {
  const rows = data.yieldTrends, keys = [['maize','#fbbf24'],['wheat','#f59e0b'],['tea','#22c55e'],['coffee','#8b5cf6']];
  const left = 38, top = 20, width = 584, height = 210, max = 5, step = width / (rows.length - 1);
  let html = gridLines(left, top, width, height, max, 5);
  rows.forEach((row, i) => { html += text(left + i * step, top + height + 20, row.year); });
  keys.forEach(([key,color]) => {
    const points = rows.map((row,i) => `${left + i * step},${top + height - row[key] / max * height}`);
    html += `<polyline fill="none" stroke="${color}" stroke-width="2.5" points="${points.join(' ')}"/>`;
    points.forEach((point) => { const [x,y] = point.split(','); html += `<circle cx="${x}" cy="${y}" r="3.5" fill="${color}"/>`; });
  });
  svgChart('trend-chart', html, 'Crop yield trends from 2022 through 2026');
}
function renderSoil(data, year) {
  const multiplier = data.multipliers[year].yield;
  const rows = data.soil.map((row) => Object.fromEntries(Object.entries(row).map(([key,value]) => [key, key === 'depth' ? value : round(value * multiplier)])));
  const keys = [['moisture','#3b82f6'],['nitrogen','#22c55e'],['phosphorus','#f59e0b'],['potassium','#8b5cf6']];
  const left = 45, top = 18, width = 570, height = 200, max = 80, step = width / rows.length, bw = 14;
  let html = gridLines(left, top, width, height, max, 4);
  rows.forEach((row,i) => {
    const center = left + step * (i + .5);
    keys.forEach(([key,color],j) => {
      const h = row[key] / max * height;
      html += `<rect class="bar" x="${center - 31 + j * 16}" y="${top + height - h}" width="13" height="${h}" fill="${color}"><title>${row.depth} ${key}: ${row[key]}</title></rect>`;
    });
    html += text(center, top + height + 22, row.depth);
  });
  svgChart('soil-chart', html, `Soil moisture and nutrients by depth in ${year}`);
}
function renderField(countyId) {
  const base = countyId === 'nakuru' ? 85 : countyId === 'trans-nzoia' ? 88 : countyId === 'kericho' ? 92 : 80;
  let seed = Array.from(countyId).reduce((sum, char) => sum + char.charCodeAt(0), 0) || 41;
  const cells = Array.from({length:100}, () => {
    seed = (seed * 9301 + 49297) % 233280;
    return (seed / 233280) * 25 + base - 15;
  });
  const avg = cells.reduce((sum,value) => sum + value,0) / cells.length;
  $('#field-grid').innerHTML = cells.map((health,i) => `<span class="field-cell" style="background:${health < 70 ? '#ef4444b3' : health < 80 ? '#fbbf24b3' : '#22c55ecc'}" title="Field ${i + 1}: ${health.toFixed(1)}% health"></span>`).join('');
  $('#field-average').textContent = `${avg.toFixed(1)}%`;
}
function renderAlerts(data, year) {
  const alerts = data.alerts[year] || data.alerts['2026'];
  $('#alerts-list').innerHTML = alerts.map((item) => `<li class="${esc(item.type)}">${esc(item.message)}<time>${esc(item.time)}</time></li>`).join('');
}
function start(data) {
  const countySelect = $('#county-select'), cropSelect = $('#crop-select'), yearSelect = $('#year-select');
  function update() {
    const county = data.counties.find((item) => item.id === countySelect.value) || data.counties[0];
    const crop = data.crops.find((item) => item.id === cropSelect.value) || data.crops[0];
    const year = yearSelect.value in data.multipliers ? yearSelect.value : '2026';
    const m = data.multipliers[year], summary = data.yearSummary[year];
    $('#summary-year').textContent = year;
    $('#summary-yield').textContent = summary.yield;
    $('#summary-rain').textContent = summary.rainfall;
    $('#summary-status').textContent = year === '2026' ? 'Current snapshot' : 'Archived';
    $('#summary-status').className = year === '2026' ? '' : 'archived-text';
    $('#year-badge').textContent = year === '2026' ? 'Current' : 'Archive';
    $('#year-badge').className = `badge ${year === '2026' ? 'live' : 'archived'}`;
    $('#county-title').textContent = `${county.name} County`;
    $('#county-meta').textContent = `${county.region} Region · ${crop.icon} ${crop.name} · ${year}`;
    $('#temperature').textContent = `${round(24 * m.temp)}°C`;
    $('#monthly-rain').textContent = `${round(85 * m.rainfall)}mm`;
    $('#field-title').textContent = `Satellite Field Health - ${county.name}`;
    $('#radar-county').textContent = `${county.name} County`;
    document.querySelectorAll('.county-inline').forEach((el) => { el.textContent = county.name; });
    document.querySelectorAll('.year-inline').forEach((el) => { el.textContent = year; });
    const live = year === '2026';
    $('#satellite-state').className = `pill ${live ? 'live' : 'archived'}`;
    $('#satellite-state').innerHTML = `<i></i>${live ? 'Snapshot' : 'Historical'}`;
    $('#alerts-state').textContent = live ? 'Snapshot' : `Archive ${year}`;
    $('#alerts-state').className = `pill ${live ? 'live' : 'archived'}`;
    $('#weather-live').textContent = live ? '(Static sample data)' : '(Historical sample data)';
    $('#yield-history').textContent = live ? '' : '(Historical)';
    renderField(county.id);
    renderAlerts(data, year);
    renderWeather(data, year);
    renderCounty(data, year);
    renderDonut(data);
    renderTrends(data);
    renderSoil(data, year);
    document.querySelectorAll('[data-crop]').forEach((button) => button.classList.toggle('selected', button.dataset.crop === crop.id));
  }
  [countySelect,cropSelect,yearSelect].forEach((select) => select.addEventListener('change', update));
  document.querySelectorAll('[data-crop]').forEach((button) => button.addEventListener('click', () => { cropSelect.value = button.dataset.crop; update(); }));
  update();
}
fetch('data/dashboard.json').then((response) => {
  if (!response.ok) throw new Error(`Dashboard data failed to load (${response.status})`);
  return response.json();
}).then(start).catch((error) => {
  document.querySelector('main').insertAdjacentHTML('afterbegin', `<p class="data-error" role="alert">Dashboard data could not be loaded. Please reload this page. (${esc(error.message)})</p>`);
});
