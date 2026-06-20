/* Regenerate synthetic school data CSVs */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname);

const rnd = (mn, mx) => mn + Math.random() * (mx - mn);
const rndi = (mn, mx) => Math.round(rnd(mn, mx));
const fmt = (n) => parseFloat(n.toFixed(1));

const SPRING_BREAK = new Set(['2026-04-06','2026-04-07','2026-04-08','2026-04-09','2026-04-10']);
const POST_HOLIDAY = new Set(['2026-04-13','2026-05-26']);
const ENERGY_SPIKES = {};
ENERGY_SPIKES['2026-04-14'] = {'Main Building': 1900};
ENERGY_SPIKES['2026-05-15'] = {'Science Wing': 1250};
ENERGY_SPIKES['2026-06-10'] = {'Main Building': 1700};
const WATER_SPIKES = {};
WATER_SPIKES['2026-05-02'] = {'Gym': 4800};

const dates = [];
const start = new Date('2026-03-23');
const end = new Date('2026-06-18');
for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const iso = d.toISOString().slice(0,10);
  const dow = d.getDay();
  if (dow === 0 || dow === 6) continue;
  if (SPRING_BREAK.has(iso)) continue;
  if (iso === '2026-05-25') continue;
  dates.push({iso, dow});
}

// energy_usage.csv
const buildings = {'Main Building': 900, 'Gym': 280, 'Science Wing': 480};
let rows = ['date,building,kwh'];
for (const {iso} of dates) {
  for (const [b, base] of Object.entries(buildings)) {
    let v = base * rnd(0.88, 1.12);
    if (ENERGY_SPIKES[iso] && ENERGY_SPIKES[iso][b]) v = ENERGY_SPIKES[iso][b];
    rows.push(iso + ',' + b + ',' + fmt(v));
  }
}
fs.writeFileSync(path.join(OUT, 'energy_usage.csv'), rows.join('\n'), 'utf8');

// water_usage.csv
const wblds = {'Main Building': 5200, 'Gym': 1900, 'Cafeteria': 2800};
rows = ['date,building,gallons'];
for (const {iso} of dates) {
  for (const [b, base] of Object.entries(wblds)) {
    let v = base * rnd(0.9, 1.1);
    if (WATER_SPIKES[iso] && WATER_SPIKES[iso][b]) v = WATER_SPIKES[iso][b];
    rows.push(iso + ',' + b + ',' + fmt(v));
  }
}
fs.writeFileSync(path.join(OUT, 'water_usage.csv'), rows.join('\n'), 'utf8');

// trash_recycling.csv
rows = ['date,total_lbs,recycled_lbs,landfill_lbs,compost_lbs'];
for (const {iso} of dates) {
  const total = rnd(340, 460);
  const rec = total * rnd(0.22, 0.30);
  const comp = total * rnd(0.10, 0.16);
  const land = total - rec - comp;
  rows.push(iso + ',' + fmt(total) + ',' + fmt(rec) + ',' + fmt(land) + ',' + fmt(comp));
}
fs.writeFileSync(path.join(OUT, 'trash_recycling.csv'), rows.join('\n'), 'utf8');

// transportation.csv
rows = ['date,bus_riders,car_riders,bike_walkers,total_students'];
for (const {iso} of dates) {
  const bus = rndi(360, 400), bike = rndi(130, 175), car = 850 - bus - bike;
  rows.push(iso + ',' + bus + ',' + car + ',' + bike + ',850');
}
fs.writeFileSync(path.join(OUT, 'transportation.csv'), rows.join('\n'), 'utf8');

// cafeteria_food_waste.csv
const DOW_BASE = {1:44, 2:37, 3:34, 4:39, 5:54};
rows = ['date,day_of_week,meals_served,food_waste_lbs,post_holiday'];
for (const {iso, dow} of dates) {
  const ph = POST_HOLIDAY.has(iso) ? 1 : 0;
  const base = DOW_BASE[dow] || 40;
  const waste = ph ? base * rnd(1.75, 2.05) : base * rnd(0.88, 1.14);
  rows.push(iso + ',' + dow + ',' + rndi(620, 720) + ',' + fmt(waste) + ',' + ph);
}
fs.writeFileSync(path.join(OUT, 'cafeteria_food_waste.csv'), rows.join('\n'), 'utf8');

console.log('Written ' + dates.length + ' school days to ' + OUT);
