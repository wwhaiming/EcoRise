/* EcoRise — AI Client (Anthropic Claude API)
 * Falls back to mock responses when ANTHROPIC_API_KEY is not set.
 */

let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (_) {
  Anthropic = null;
}

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY || !Anthropic) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ── Mock responses for when API key is not set ──

const MOCK_ECO_ACTIONS = [
  { actionType: 'transportation', specificAction: 'Cycling commute', requiresFollowUp: true, followUpQuestion: 'How many miles did you bike?', estimatedCO2Saved: 2.4, environmentalImpactSummary: 'By choosing to bike instead of drive, you avoided approximately 2.4 kg of CO2 emissions. This is equivalent to keeping a 100-watt light bulb off for about 10 hours.', pointsCategory: { category: 'transportation', action: 'biking' } },
  { actionType: 'waste', specificAction: 'Reusable bottle', requiresFollowUp: false, followUpQuestion: '', estimatedCO2Saved: 0.5, environmentalImpactSummary: 'Using a reusable bottle prevents single-use plastic waste. Each reusable bottle saves approximately 156 plastic bottles per year.', pointsCategory: { category: 'waste', action: 'reusable_bottle' } },
  { actionType: 'food', specificAction: 'Plant-based meal', requiresFollowUp: false, followUpQuestion: '', estimatedCO2Saved: 1.8, environmentalImpactSummary: 'Choosing a plant-based meal saves about 1.8 kg of CO2 compared to a meat-based alternative. Plant-based diets use 75% less land and 54% less water.', pointsCategory: { category: 'food', action: 'plant_based_meal' } },
  { actionType: 'transportation', specificAction: 'Public transit ride', requiresFollowUp: true, followUpQuestion: 'How many miles did you ride?', estimatedCO2Saved: 1.6, environmentalImpactSummary: 'Taking public transit instead of driving alone reduces per-person emissions by about 45%. Great choice for reducing your carbon footprint!', pointsCategory: { category: 'transportation', action: 'public_transit' } },
];

const MOCK_QUESTS = [
  { title: 'Two-Wheel Tuesday', description: 'Log a bike or walk commute', actionType: 'transportation', targetDetails: 'bike or walk', pointsBase: 60 },
  { title: 'Zero-Waste Lunch', description: 'Post a meal with no single-use plastic', actionType: 'waste', targetDetails: 'no plastic meal', pointsBase: 40 },
  { title: 'Bottle Streak', description: 'Refill a reusable bottle 3 times', actionType: 'waste', targetDetails: 'reusable bottle', pointsBase: 45 },
  { title: 'Spot the Trash', description: 'Report one litter hotspot near you', actionType: 'nature', targetDetails: 'trash report', pointsBase: 50 },
  { title: 'Bring a Friend', description: 'Invite someone to your leaderboard', actionType: 'community', targetDetails: 'invite friend', pointsBase: 75 },
];

// ── 1. Analyze eco action image ──

async function analyzeEcoAction(imageBase64) {
  const client = getClient();

  if (!client) {
    // Return a random mock action
    const mock = MOCK_ECO_ACTIONS[Math.floor(Math.random() * MOCK_ECO_ACTIONS.length)];
    return { ...mock, isMock: true };
  }

  try {
    // Strip data URI prefix if present
    let base64Data = imageBase64;
    let mediaType = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mediaType = match[1];
        base64Data = match[2];
      }
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: `You are EcoRise's environmental impact analyzer. The user has uploaded an image of an eco-friendly action they took. Analyze the image and extract:
- actionType (from: transportation, waste, energy, food, nature, other)
- specificAction (e.g., 'biked to school', 'recycled plastic bottles')
- requiresFollowUp (boolean — true if you need distance/quantity info)
- followUpQuestion (e.g., 'How many miles did you bike?')
- estimatedCO2Saved (in kg, estimate conservatively)
- environmentalImpactSummary (2-3 sentences explaining the positive impact)
- pointsCategory breakdown ready to pass to rubric: { category, action }
Respond ONLY in JSON.`,
          },
        ],
      }],
    });

    const text = response.content[0].text;
    const json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return { ...json, isMock: false };
  } catch (err) {
    console.error('AI analyzeEcoAction error:', err.message);
    const mock = MOCK_ECO_ACTIONS[0];
    return { ...mock, isMock: true, error: err.message };
  }
}

// ── 2. Generate daily quests ──

async function generateDailyQuests(userId) {
  const client = getClient();

  if (!client) {
    return MOCK_QUESTS.map((q, i) => ({ ...q, id: `quest_${userId}_${i}` }));
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generate 5 unique daily environmental quests for a user. Each quest should be specific and completable in a day. Format: [{title, description, actionType, targetDetails, pointsBase}]. Make them varied across transportation, waste, energy, food, and nature categories. Respond ONLY in JSON.`,
      }],
    });

    const text = response.content[0].text;
    const json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return Array.isArray(json) ? json : json.quests || MOCK_QUESTS;
  } catch (err) {
    console.error('AI generateDailyQuests error:', err.message);
    return MOCK_QUESTS;
  }
}

// ── 3. Check quest match ──

async function checkQuestMatch(action, quests) {
  const client = getClient();

  if (!client) {
    // Simple keyword matching for mock mode
    const actionLower = (action.specificAction || action.actionType || '').toLowerCase();
    for (const quest of quests) {
      const targetLower = (quest.targetDetails || quest.title || '').toLowerCase();
      if (actionLower.includes(targetLower) || targetLower.includes(actionLower) ||
          quest.actionType === action.actionType) {
        return { matchedQuestId: quest.id, progressPercent: 100, completed: true };
      }
    }
    return { matchedQuestId: null, progressPercent: 0, completed: false };
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Does this action "${action.specificAction}" (type: ${action.actionType}) complete or progress any of these quests: ${JSON.stringify(quests.map(q => ({ id: q.id, title: q.title, targetDetails: q.targetDetails })))}? Respond with: {matchedQuestId, progressPercent, completed}. Respond ONLY in JSON.`,
      }],
    });

    const text = response.content[0].text;
    return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch (err) {
    console.error('AI checkQuestMatch error:', err.message);
    return { matchedQuestId: null, progressPercent: 0, completed: false };
  }
}

// ── 4. Rate trash severity ──

async function rateTrashSeverity(imageBase64) {
  const client = getClient();

  if (!client) {
    const severity = Math.floor(Math.random() * 5) + 4; // 4-8 range
    return {
      score: severity,
      description: severity >= 7
        ? 'Significant dumping area with multiple large items and widespread litter.'
        : 'Noticeable accumulation of trash in the area requiring attention.',
      estimatedItems: `${severity * 3}-${severity * 5} items`,
      isMock: true,
    };
  }

  try {
    let base64Data = imageBase64;
    let mediaType = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mediaType = match[1];
        base64Data = match[2];
      }
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: `Rate the severity and amount of trash in this image on a scale of 0–10. 0 = no visible trash, 10 = severe large-scale illegal dumping. Use this strict scale:
1-2: A few pieces of litter
3-4: Noticeable accumulation in a small area
5-6: Large pile or widespread area with litter
7-8: Significant dumping, multiple large items
9-10: Extreme illegal dumping, hazardous waste
Respond ONLY in JSON: {score, description, estimatedItems}`,
          },
        ],
      }],
    });

    const text = response.content[0].text;
    const json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return { ...json, isMock: false };
  } catch (err) {
    console.error('AI rateTrashSeverity error:', err.message);
    return { score: 5, description: 'Unable to analyze image.', estimatedItems: 'Unknown', isMock: true, error: err.message };
  }
}

module.exports = { analyzeEcoAction, generateDailyQuests, checkQuestMatch, rateTrashSeverity };
