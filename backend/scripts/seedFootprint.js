/* EcoRise — Seed School Footprint Data
 * Reads the 5 synthetic CSVs from /synthetic_data/ and inserts into SQLite.
 * Idempotent: uses INSERT OR IGNORE, safe to run multiple times.
 *
 * Usage: node scripts/seedFootprint.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db');

const DATA_DIR = path.join(__dirname, '..', '..', 'synthetic_data');

function parseCSV(filename) {
  const lines = fs.readFileSync(path.join(DATA_DIR, filename), 'utf8').trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = vals[i]?.trim(); });
    return obj;
  });
}

function seed() {
  const db = getDb();

  // energy_usage.csv → fp_energy
  const energy = parseCSV('energy_usage.csv');
  const insEnergy = db.prepare('INSERT OR IGNORE INTO fp_energy (date, building, kwh) VALUES (?, ?, ?)');
  const txEnergy = db.transaction(() => {
    for (const r of energy) insEnergy.run(r.date, r.building, parseFloat(r.kwh));
  });
  txEnergy();
  console.log(`✅ Seeded ${energy.length} energy rows`);

  // water_usage.csv → fp_water
  const water = parseCSV('water_usage.csv');
  const insWater = db.prepare('INSERT OR IGNORE INTO fp_water (date, building, gallons) VALUES (?, ?, ?)');
  const txWater = db.transaction(() => {
    for (const r of water) insWater.run(r.date, r.building, parseFloat(r.gallons));
  });
  txWater();
  console.log(`✅ Seeded ${water.length} water rows`);

  // trash_recycling.csv → fp_trash
  const trash = parseCSV('trash_recycling.csv');
  const insTrash = db.prepare(
    'INSERT OR IGNORE INTO fp_trash (date, total_lbs, recycled_lbs, landfill_lbs, compost_lbs) VALUES (?, ?, ?, ?, ?)'
  );
  const txTrash = db.transaction(() => {
    for (const r of trash) {
      insTrash.run(r.date, parseFloat(r.total_lbs), parseFloat(r.recycled_lbs), parseFloat(r.landfill_lbs), parseFloat(r.compost_lbs));
    }
  });
  txTrash();
  console.log(`✅ Seeded ${trash.length} trash rows`);

  // transportation.csv → fp_transportation
  const trans = parseCSV('transportation.csv');
  const insTrans = db.prepare(
    'INSERT OR IGNORE INTO fp_transportation (date, bus_riders, car_riders, bike_walkers, total_students) VALUES (?, ?, ?, ?, ?)'
  );
  const txTrans = db.transaction(() => {
    for (const r of trans) {
      insTrans.run(r.date, parseInt(r.bus_riders), parseInt(r.car_riders), parseInt(r.bike_walkers), parseInt(r.total_students));
    }
  });
  txTrans();
  console.log(`✅ Seeded ${trans.length} transportation rows`);

  // cafeteria_food_waste.csv → fp_cafeteria
  const caf = parseCSV('cafeteria_food_waste.csv');
  const insCaf = db.prepare(
    'INSERT OR IGNORE INTO fp_cafeteria (date, day_of_week, meals_served, food_waste_lbs, post_holiday) VALUES (?, ?, ?, ?, ?)'
  );
  const txCaf = db.transaction(() => {
    for (const r of caf) {
      insCaf.run(r.date, parseInt(r.day_of_week), parseInt(r.meals_served), parseFloat(r.food_waste_lbs), parseInt(r.post_holiday));
    }
  });
  txCaf();
  console.log(`✅ Seeded ${caf.length} cafeteria rows`);

  console.log('\n🌱 Footprint seed complete.');
}

seed();
