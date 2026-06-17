/* GeoRise — Comprehensive Points Rubric Engine
 * Accepts: { actionType, specificAction, details, milesIfApplicable, co2Saved, aiExtractedData, userContext }
 * Returns: { points, breakdown, explanation }
 */

// ── Category scoring tables ──

const TRANSPORTATION = {
  max: 40,
  actions: {
    walking:       { base: 15, perMile: 1.0, cap: 35 },
    running:       { base: 15, perMile: 1.0, cap: 35 },
    biking:        { base: 15, perMile: 0.8, cap: 35 },
    cycling:       { base: 15, perMile: 0.8, cap: 35 },
    public_transit:{ base: 10, perMile: 0.5, cap: 25 },
    bus:           { base: 10, perMile: 0.5, cap: 25 },
    train:         { base: 10, perMile: 0.5, cap: 25 },
    subway:        { base: 10, perMile: 0.5, cap: 25 },
    carpooling:    { base: 8,  perMile: 0,   cap: 20 },
  },
  co2MultiplierPerKg: 2,
  co2MultiplierCap: 20,
};

const WASTE = {
  max: 30,
  actions: {
    recycling:          { flat: 15 },   // was {min:10,max:20}; quantity is never supplied, so the range only ever paid the floor
    composting:         { flat: 15 },
    refusing_plastic:   { flat: 10 },
    reusing_items:      { flat: 8  },
    reusable_bottle:    { flat: 8  },
    reusable_bag:       { flat: 8  },
    reusable_container: { flat: 8  },
    zero_waste_shopping:{ flat: 20 },
  },
};

const ENERGY = {
  max: 25,
  actions: {
    turning_off_lights:    { flat: 8 },   // was {min:5,max:10}; range never received a quantity, always floored
    turning_off_electronics:{ flat: 8 },
    natural_light:         { flat: 8  },
    natural_ventilation:   { flat: 8  },
    line_drying:           { flat: 12 },
    cold_water_washing:    { flat: 8  },
    unplugging_devices:    { flat: 5  },
  },
};

const FOOD = {
  max: 30,
  actions: {
    vegetarian_meal:  { flat: 15 },
    vegan_meal:       { flat: 15 },
    plant_based_meal: { flat: 15 },
    local_produce:    { flat: 12 },
    seasonal_produce: { flat: 12 },
    reducing_food_waste:{ flat: 10 },
    growing_food:     { flat: 20 },
    buying_secondhand:{ flat: 15 },
  },
};

const NATURE = {
  max: 20,
  actions: {
    picking_up_litter: { flat: 15 },   // was {min:10,max:20}; range never received a quantity, always floored
    litter_pickup:     { flat: 15 },
    planting_trees:    { flat: 20 },
    planting_garden:   { flat: 20 },
    cleanup_event:     { flat: 20 },
    educating_others:  { flat: 15 },
  },
};

const CATEGORIES = {
  transportation: TRANSPORTATION,
  transport:      TRANSPORTATION,
  waste:          WASTE,
  energy:         ENERGY,
  food:           FOOD,
  nature:         NATURE,
  cleanup:        NATURE,
  community:      NATURE,
};

// ── Normalize action string to a key ──
function normalizeAction(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// ── Find matching action in a category ──
function findAction(category, specificAction) {
  const key = normalizeAction(specificAction);
  const actions = category.actions;

  // Direct match
  if (actions[key]) return { key, config: actions[key] };

  // Partial match
  for (const [k, v] of Object.entries(actions)) {
    if (key.includes(k) || k.includes(key)) return { key: k, config: v };
  }

  return null;
}

// ── Calculate points for a single action ──
function calculatePoints({ actionType, specificAction, details, milesIfApplicable, co2Saved, aiExtractedData, userContext }) {
  const breakdown = [];
  let basePoints = 0;

  const catKey = normalizeAction(actionType);
  const category = CATEGORIES[catKey];

  if (!category) {
    // Unknown category — award a default 10 points
    basePoints = 10;
    breakdown.push({ label: 'Eco action (uncategorized)', points: 10 });
  } else {
    const match = findAction(category, specificAction || actionType);

    if (!match) {
      // Known category but unknown specific action — base 10
      basePoints = 10;
      breakdown.push({ label: `${actionType} action`, points: 10 });
    } else {
      const cfg = match.config;

      if (cfg.flat) {
        basePoints = cfg.flat;
        breakdown.push({ label: match.key.replace(/_/g, ' '), points: cfg.flat });
      } else if (cfg.base !== undefined) {
        // Transportation-style: base + per-mile
        let pts = cfg.base;
        breakdown.push({ label: `Base (${match.key.replace(/_/g, ' ')})`, points: cfg.base });

        if (milesIfApplicable && cfg.perMile > 0) {
          const mileBonus = Math.round(milesIfApplicable * cfg.perMile);
          pts += mileBonus;
          breakdown.push({ label: `${milesIfApplicable} miles × ${cfg.perMile}/mi`, points: mileBonus });
        }

        pts = Math.min(pts, cfg.cap || category.max);
        basePoints = pts;
      } else if (cfg.min !== undefined) {
        // Range-based (quantity matters)
        const quantity = details?.quantity || aiExtractedData?.quantity || 1;
        const range = cfg.max - cfg.min;
        const pts = Math.min(cfg.max, cfg.min + Math.floor(range * Math.min(quantity, 10) / 10));
        basePoints = pts;
        breakdown.push({ label: match.key.replace(/_/g, ' '), points: pts });
      }

      // CO2 savings multiplier (transportation only)
      if (category === TRANSPORTATION && co2Saved > 0) {
        const co2Bonus = Math.min(TRANSPORTATION.co2MultiplierCap, Math.round(co2Saved * TRANSPORTATION.co2MultiplierPerKg));
        if (co2Bonus > 0) {
          basePoints += co2Bonus;
          breakdown.push({ label: `CO₂ saved (${co2Saved}kg × 2)`, points: co2Bonus });
        }
      }

      // Cap at category max
      basePoints = Math.min(basePoints, category.max);
    }
  }

  // ── Bonus multipliers ──
  let multiplier = 1;
  const bonuses = [];

  if (userContext) {
    // First action of the day
    if (userContext.isFirstActionToday) {
      multiplier *= 1.1;
      bonuses.push({ label: 'First action today', multiplier: 1.1 });
    }

    // 7-day streak
    if (userContext.streak >= 7) {
      multiplier *= 1.25;
      bonuses.push({ label: `${userContext.streak}-day streak`, multiplier: 1.25 });
    }

    // Quest completion
    if (userContext.isQuestCompletion) {
      multiplier *= 2;
      bonuses.push({ label: 'Quest completion (2×)', multiplier: 2 });
    }

    // Tagged friends
    if (userContext.taggedFriends && userContext.taggedFriends.length > 0) {
      const tagCount = Math.min(userContext.taggedFriends.length, 3);
      const tagBonus = tagCount * 5;
      basePoints += tagBonus;
      breakdown.push({ label: `Tagged ${tagCount} friend(s)`, points: tagBonus });
    }
  }

  const finalPoints = Math.round(basePoints * multiplier);

  // Build explanation
  const parts = breakdown.map(b => `${b.label}: +${b.points}`);
  if (bonuses.length) parts.push(...bonuses.map(b => `${b.label}: ×${b.multiplier}`));
  parts.push(`Total: ${finalPoints} pts`);

  return {
    points: finalPoints,
    breakdown,
    bonuses,
    multiplier,
    explanation: parts.join(' | '),
  };
}

module.exports = { calculatePoints, CATEGORIES, normalizeAction };

