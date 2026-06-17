/* EcoRise — AI Client (OpenAI API)
 * Falls back to mock responses when OPENAI_API_KEY is not set.
 */

let OpenAI;
try {
  OpenAI = require('openai');
} catch (_) {
  OpenAI = null;
}

// Locally-trained offline trash detector (datasets/train_trash_detector.py -> ONNX).
const localTrashModel = require('./localTrashModel');

function getClient() {
  if (!process.env.OPENAI_API_KEY || !OpenAI) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

const ECO_MODEL = 'gpt-4o-mini';
const ECO_PROMPT_VERSION = '2026-06-15.gate-v1';
const ECO_CONFIDENCE_FLOOR = Number(process.env.ECO_CONFIDENCE_FLOOR || 0.5);

async function analyzeEcoAction(imageBase64) {
  const client = getClient();

  if (!client) {
    // No vision model offline -> do NOT mint points from a fabricated action.
    // Set MOCK_ECO_ALWAYS_PASS=true to restore demo behavior (clearly flagged fake).
    if (process.env.MOCK_ECO_ALWAYS_PASS === 'true') {
      const mock = MOCK_ECO_ACTIONS[Math.floor(Math.random() * MOCK_ECO_ACTIONS.length)];
      return { ...mock, isEcoAction: true, confidence: 0, isMock: true,
        provenance: { source: 'mock', model: 'mock', promptVersion: ECO_PROMPT_VERSION } };
    }
    return {
      isEcoAction: false, confidence: 0, actionType: 'other', specificAction: 'AI disabled',
      requiresFollowUp: false, estimatedCO2Saved: 0,
      environmentalImpactSummary: 'AI vision is disabled (no OPENAI_API_KEY). Cannot verify this action.',
      isMock: true, provenance: { source: 'mock', model: 'mock', promptVersion: ECO_PROMPT_VERSION },
    };
  }

  try {
    let base64Data = imageBase64;
    let mediaType = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const m = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (m) { mediaType = m[1]; base64Data = m[2]; }
    }

    const response = await client.chat.completions.create({
      model: ECO_MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are EcoRise's eco-action analyzer. FIRST decide whether this photo genuinely shows a real eco-friendly action (biking/walking/transit, recycling/compost/reusable items, saving energy, a plant-based meal, litter cleanup, planting, etc.).
Set isEcoAction=false for anything else (selfie, pet, random object, screenshot, meme, ordinary indoor scene, food that is not notably eco). Be strict; when unsure, isEcoAction=false.
Only if isEcoAction=true, fill the rest. Respond ONLY in JSON:
{"isEcoAction": boolean, "confidence": number between 0 and 1, "actionType": "transportation|waste|energy|food|nature|other", "specificAction": string, "requiresFollowUp": boolean, "followUpQuestion": string, "estimatedCO2Saved": number_in_kg, "environmentalImpactSummary": string}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:${mediaType};base64,${base64Data}`,
            },
          },
        ],
      }],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0].message.content;
    const json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    const confidence = Math.max(0, Math.min(1, Number(json.confidence ?? 0)));
    return {
      isEcoAction: json.isEcoAction === true && confidence >= ECO_CONFIDENCE_FLOOR,
      confidence,
      actionType: String(json.actionType || 'other'),
      specificAction: String(json.specificAction || 'Eco action'),
      requiresFollowUp: !!json.requiresFollowUp,
      followUpQuestion: json.followUpQuestion || '',
      estimatedCO2Saved: Math.max(0, Number(json.estimatedCO2Saved) || 0),
      environmentalImpactSummary: json.environmentalImpactSummary || '',
      isMock: false,
      provenance: { source: 'openai', model: ECO_MODEL, promptVersion: ECO_PROMPT_VERSION, confidence },
    };
  } catch (err) {
    console.error('AI analyzeEcoAction error:', err.message);
    // On failure, reject rather than fabricate an eco action (no false points).
    return {
      isEcoAction: false, confidence: 0, actionType: 'other', specificAction: 'Could not analyze',
      requiresFollowUp: false, estimatedCO2Saved: 0,
      environmentalImpactSummary: 'Could not analyze image — please try again.',
      isMock: true, error: err.message,
      provenance: { source: 'error', model: ECO_MODEL, promptVersion: ECO_PROMPT_VERSION },
    };
  }
}

// ── 2. Generate daily quests ──

async function generateDailyQuests(userId) {
  const client = getClient();

  if (!client) {
    return MOCK_QUESTS.map((q, i) => ({ ...q, id: `quest_${userId}_${i}` }));
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generate 5 unique daily environmental quests for a user. Each quest should be specific and completable in a day. Format: [{title, description, actionType, targetDetails, pointsBase}]. Make them varied across transportation, waste, energy, food, and nature categories. Respond ONLY in JSON.`,
      }],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0].message.content;
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
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Does this action "${action.specificAction}" (type: ${action.actionType}) complete or progress any of these quests: ${JSON.stringify(quests.map(q => ({ id: q.id, title: q.title, targetDetails: q.targetDetails })))}? Respond with: {matchedQuestId, progressPercent, completed}. Respond ONLY in JSON.`,
      }],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0].message.content;
    return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch (err) {
    console.error('AI checkQuestMatch error:', err.message);
    return { matchedQuestId: null, progressPercent: 0, completed: false };
  }
}

// ── 4. Rate trash severity (with trash / not-trash gate) ──

// Minimum model confidence required to accept a photo as real litter.
const TRASH_CONFIDENCE_FLOOR = Number(process.env.TRASH_CONFIDENCE_FLOOR || 0.55);

async function rateTrashSeverity(imageBase64) {
  const client = getClient();

  if (!client) {
    // Offline path: prefer the locally-trained CNN (datasets/train_trash_detector.py).
    if (localTrashModel.isAvailable()) {
      const r = await localTrashModel.classify(imageBase64);
      if (r) {
        const isTrash = r.pTrash >= localTrashModel.TRASH_PROB_THRESHOLD;
        // No severity labels in training data -> map model confidence to a coarse score.
        const score = isTrash ? Math.max(1, Math.min(10, Math.round(r.pTrash * 10))) : 0;
        return {
          isTrash,
          confidence: Number(r.pTrash.toFixed(3)),
          score,
          description: isTrash
            ? `Local CNN detected litter (p=${(r.pTrash * 100).toFixed(0)}%). Severity is approximate (confidence-based).`
            : `Local CNN: this image does not look like litter (p=${(r.pTrash * 100).toFixed(0)}%).`,
          estimatedItems: isTrash ? 'approx' : '0',
          isMock: false,
          source: 'local-cnn',
        };
      }
    }

    // No API key and no local model => do NOT fabricate a score (that is what
    // produced false positives on non-trash photos).
    // Set MOCK_TRASH_ALWAYS_PASS=true to restore the old "everything passes"
    // demo behavior, clearly labelled as fake.
    if (process.env.MOCK_TRASH_ALWAYS_PASS === 'true') {
      const severity = Math.floor(Math.random() * 5) + 4; // 4-8
      return {
        isTrash: true,
        confidence: 0,
        score: severity,
        description: 'DEMO MODE: AI vision disabled (no API key) — this is NOT a real detection.',
        estimatedItems: `${severity * 3}-${severity * 5} items`,
        isMock: true,
      };
    }
    return {
      isTrash: false,
      confidence: 0,
      score: 0,
      description: 'AI vision is disabled (no OPENAI_API_KEY). Cannot verify trash — set the key for real detection.',
      estimatedItems: '0',
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

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are EcoRise's litter detector. FIRST decide whether this photo genuinely shows litter, trash, or dumped waste in a real outdoor or public setting.

Set isTrash=false (score 0) if the image is anything else — a person, selfie, pet, food, plant, indoor scene, building, screenshot, meme, document, product shot, artwork, or a clean area with no discarded waste. Ordinary objects in normal use are NOT trash. Be strict: when uncertain, isTrash=false.

Only if isTrash=true, rate severity 0-10:
1-2: A few pieces of litter
3-4: Noticeable accumulation in a small area
5-6: Large pile or widespread litter
7-8: Significant dumping, multiple large items
9-10: Extreme illegal dumping / hazardous waste

Respond ONLY in JSON:
{"isTrash": boolean, "confidence": number between 0 and 1, "score": number 0-10, "description": string, "estimatedItems": string}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:${mediaType};base64,${base64Data}`
            }
          }
        ],
      }],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0].message.content;
    const json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    // Normalize + enforce the gate server-side (never trust the raw score alone).
    const score = Math.max(0, Math.min(10, Number(json.score) || 0));
    const confidence = Math.max(0, Math.min(1, Number(json.confidence ?? 0)));
    const isTrash = json.isTrash === true && score > 0 && confidence >= TRASH_CONFIDENCE_FLOOR;

    return {
      isTrash,
      confidence,
      score: isTrash ? score : 0,
      description: json.description || (isTrash ? 'Litter detected.' : 'No litter detected in this image.'),
      estimatedItems: json.estimatedItems || '0',
      isMock: false,
    };
  } catch (err) {
    console.error('AI rateTrashSeverity error:', err.message);
    // On failure, reject conservatively rather than award points.
    return { isTrash: false, confidence: 0, score: 0, description: 'Could not analyze image — please try again.', estimatedItems: '0', isMock: true, error: err.message };
  }
}

const CHAT_SYSTEM_PROMPT = `You are EcoRise's friendly, conversational AI Assistant.
A user has uploaded a photo to log an eco-friendly action (biking/walking/transit, recycling/compost/reusable items, saving energy, a plant-based meal, litter cleanup, planting, etc.).
Your job is to chat with them to:
1. Verify if the action in the photo is actually eco-friendly.
2. Gather any missing details if needed (for transportation actions, ask for distance/miles; for others, ask for specific actions if unclear).
3. Be friendly, encouraging, and conversational.
4. Keep the conversation short: usually 1-3 turns.

IMPORTANT: You MUST respond ONLY in JSON format on every turn:
{
  "message": "Your conversational response to the user. Ask questions or wrap up and congratulate them.",
  "isComplete": boolean,
  "actionType": "transportation|waste|energy|food|nature|none",
  "specificAction": "Short description of the verified action",
  "estimatedCO2Saved": number,
  "points": number,
  "miles": number (for transportation actions, the estimated or user-reported distance in miles; set to 0 or omit otherwise)
}`;

function simulateMockChat(messages) {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length <= 1) {
    return {
      message: "Hey! I see your photo. It looks like you're doing something green! What eco-friendly action are you taking here? (e.g., did you bike/walk/transit somewhere, or reuse a bottle?)",
      isComplete: false,
      actionType: 'none',
      specificAction: '',
      estimatedCO2Saved: 0,
      points: 0,
      miles: 0
    };
  }

  const lastUserText = userMessages[userMessages.length - 1].content.toLowerCase();
  const isTransport = lastUserText.includes('bike') || lastUserText.includes('cycle') || lastUserText.includes('walk') || lastUserText.includes('run') || lastUserText.includes('transit') || lastUserText.includes('bus') || lastUserText.includes('train');
  
  if (isTransport) {
    const milesMatch = lastUserText.match(/(\d+(\.\d+)?)/);
    const miles = milesMatch ? parseFloat(milesMatch[1]) : 5;
    const co2 = +(miles * 0.4).toFixed(1);
    const points = Math.min(40, Math.max(15, Math.round(15 + miles * 0.8 + co2 * 2)));
    
    let activity = 'Green transit';
    if (lastUserText.includes('bike') || lastUserText.includes('cycle')) activity = 'Biking commute';
    else if (lastUserText.includes('walk') || lastUserText.includes('run')) activity = 'Walking commute';
    else if (lastUserText.includes('bus') || lastUserText.includes('train') || lastUserText.includes('transit')) activity = 'Public transit ride';

    return {
      message: `That's amazing! Choosing ${activity} for ${miles} miles is a fantastic way to cut down carbon emissions. This saves about ${co2} kg of CO2 and earns you ${points} points. Ready to log this action?`,
      isComplete: true,
      actionType: 'transportation',
      specificAction: activity,
      estimatedCO2Saved: co2,
      points: points,
      miles: miles
    };
  }

  const isWaste = lastUserText.includes('bottle') || lastUserText.includes('bag') || lastUserText.includes('refill') || lastUserText.includes('recycle') || lastUserText.includes('compost') || lastUserText.includes('litter') || lastUserText.includes('cleanup');
  if (isWaste) {
    return {
      message: "Great job! Reducing waste by recycling, composting, or using reusable items helps save resource consumption. This saves about 0.5 kg of CO2 and earns you 20 points! Ready to log?",
      isComplete: true,
      actionType: 'waste',
      specificAction: lastUserText.includes('compost') ? 'Composting waste' : lastUserText.includes('cleanup') || lastUserText.includes('litter') ? 'Litter cleanup' : 'Waste reduction',
      estimatedCO2Saved: 0.5,
      points: 20,
      miles: 0
    };
  }

  const isFood = lastUserText.includes('meal') || lastUserText.includes('vegan') || lastUserText.includes('vegetarian') || lastUserText.includes('plant') || lastUserText.includes('eat');
  if (isFood) {
    return {
      message: "Delicious! Eating plant-based meals significantly lowers water usage and agricultural greenhouse gases. This saves about 1.8 kg of CO2 and earns you 25 points! Ready to log?",
      isComplete: true,
      actionType: 'food',
      specificAction: 'Plant-based meal',
      estimatedCO2Saved: 1.8,
      points: 25,
      miles: 0
    };
  }

  return {
    message: "Thank you for explaining! That definitely counts as a positive step for our planet. I've logged this action under waste/energy/nature and awarded you 15 points. Ready to submit?",
    isComplete: true,
    actionType: 'nature',
    specificAction: 'Eco action',
    estimatedCO2Saved: 0.3,
    points: 15,
    miles: 0
  };
}

async function chatEcoAction(messages, imageBase64) {
  const client = getClient();
  
  if (!client) {
    return simulateMockChat(messages);
  }

  try {
    let base64Data = imageBase64;
    let mediaType = 'image/jpeg';
    if (imageBase64 && imageBase64.startsWith('data:')) {
      const m = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (m) { mediaType = m[1]; base64Data = m[2]; }
    }

    const apiMessages = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT }
    ];

    let imageIncluded = false;
    for (const msg of messages) {
      if (msg.role === 'user' && !imageIncluded && imageBase64) {
        apiMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: msg.content || 'Here is the photo of my eco action.' },
            { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:${mediaType};base64,${base64Data}` } }
          ]
        });
        imageIncluded = true;
      } else {
        apiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    if (apiMessages.length === 1 && imageBase64) {
      apiMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this photo of my eco-friendly action.' },
          { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:${mediaType};base64,${base64Data}` } }
        ]
      });
    }

    const response = await client.chat.completions.create({
      model: ECO_MODEL,
      max_tokens: 1024,
      messages: apiMessages,
      response_format: { type: "json_object" }
    });

    const text = response.choices[0].message.content;
    const json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return {
      message: String(json.message || 'I see.'),
      isComplete: !!json.isComplete,
      actionType: String(json.actionType || 'none'),
      specificAction: String(json.specificAction || ''),
      estimatedCO2Saved: Math.max(0, Number(json.estimatedCO2Saved) || 0),
      points: Math.max(0, Number(json.points) || 0),
      miles: Math.max(0, Number(json.miles) || 0)
    };
  } catch (err) {
    console.error('AI chatEcoAction error:', err.message);
    return {
      message: 'Oh no, I encountered an issue analyzing your request. Could you explain what you are doing in this photo?',
      isComplete: false,
      actionType: 'none',
      specificAction: '',
      estimatedCO2Saved: 0,
      points: 0,
      miles: 0,
      error: err.message
    };
  }
}

module.exports = { analyzeEcoAction, generateDailyQuests, checkQuestMatch, rateTrashSeverity, chatEcoAction };
