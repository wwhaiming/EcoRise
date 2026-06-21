/* GeoRise — request validation (zod). */
const { z } = require('zod');

const email = z.string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address')
  .max(254, 'Email must be under 254 characters');
const password = z.string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');
const uuidArr = z.array(z.string().uuid()).max(3);

const schemas = {
  signup: z.object({
    email,
    password,
    name: z.string().trim().min(1, 'Name cannot be empty').max(60, 'Name must be under 60 characters').optional(),
    rememberMe: z.boolean().optional(),
  }),
  login: z.object({ email, password, rememberMe: z.boolean().optional() }),
  createLeaderboard: z.object({
    name: z.string().trim().min(1).max(80),
    resetInterval: z.enum(['daily', 'weekly', 'monthly']).optional(),
    prize: z.string().trim().max(120).optional(),
    includeSelf: z.boolean().optional(),
  }),
  updateLeaderboard: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    resetInterval: z.enum(['daily', 'weekly', 'monthly']).optional(),
    prize: z.string().trim().max(120).optional(),
    includeSelf: z.boolean().optional(),
  }),
  join: z.object({ inviteCode: z.string().trim().max(16).optional() }),
  createPost: z.object({
    image: z.string().regex(/^data:image\/(jpeg|png|gif|webp);base64,/, 'image must be a jpeg/png/gif/webp data URI').max(9_000_000).optional(),
    caption: z.string().trim().max(500).optional(),
    leaderboardId: z.string().uuid().optional(),
    miles: z.coerce.number().min(0).max(500).optional(),
    servings: z.coerce.number().min(1).max(10).optional(),
    tags: z.union([uuidArr, z.string()]).optional(), // string tolerated, parsed in route
    actionType: z.enum(['transportation', 'transport', 'waste', 'energy', 'food', 'nature', 'cleanup', 'community']).optional(),
    actionDesc: z.string().trim().max(120).optional(),
  }),
  comment: z.object({ text: z.string().trim().min(1).max(500) }),
  trash: z.object({
    image: z.string().regex(/^data:image\/(jpeg|png|gif|webp);base64,/, 'image must be a jpeg/png/gif/webp data URI').max(9_000_000).optional(),
    location: z.string().trim().max(120).optional(),
    leaderboardId: z.string().uuid().optional(),
  }),
  questProgress: z.object({ leaderboardId: z.string().uuid().optional() }),
  updateUser: z.object({
    name: z.string().trim().min(1).max(60).optional(),
    handle: z.string().trim().regex(/^@?[a-zA-Z0-9_]{1,20}$/).optional(),
    // Only an image data-URI or an https URL — never an arbitrary 2MB blob
    // (e.g. data:text/html) that would be fanned out to every other member.
    avatar: z.string().max(2_000_000).regex(/^(data:image\/|https:\/\/)/, 'avatar must be an image data URI or https URL').optional(),
  }),
  coachAnswer: z.object({
    answer: z.string().trim().min(1).max(300),
    msToAnswer: z.coerce.number().int().min(0).max(3_600_000).optional(),
    leaderboardId: z.string().uuid().optional(),
  }),
  coachPrefs: z.object({
    topics: z.array(z.string().trim().max(40)).max(12).optional(),
    gradeLevel: z.string().trim().max(40).optional(),
    cadence: z.coerce.number().int().min(0).max(3).optional(),
    quietStart: z.coerce.number().int().min(0).max(23).optional(),
    quietEnd: z.coerce.number().int().min(0).max(23).optional(),
    optedIn: z.boolean().optional(),
  }),
  // Privacy / FERPA-COPPA (Phase 2)
  setBoardPrivacy: z.object({
    consentMode: z.enum(['demo', 'classroom', 'parent']).optional(),
    retentionMode: z.enum(['minimize', 'standard', '24h', 'do_not_store']).optional(),
    reviewRequired: z.boolean().optional(),
    displayMode: z.enum(['names', 'initials']).optional(),
  }),
  recordConsent: z.object({
    leaderboardId: z.string().uuid(),
    userId: z.string().uuid().optional(),               // a teacher attesting/granting for a student
    status: z.enum(['attested', 'granted', 'revoked']),
    method: z.string().trim().max(200).optional(),
    note: z.string().trim().max(500).optional(),
  }),
  reviewPost: z.object({
    decision: z.enum(['approve', 'reject']),
    reason: z.string().trim().max(300).optional(),
  }),
  deleteAccount: z.object({ confirm: z.literal(true) }),
};

// Express middleware factory for body validation.
function body(name) {
  const schema = schemas[name];
  return (req, res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: r.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    req.valid = r.data;
    next();
  };
}

// Clamp pagination query params.
function pageParams(req) {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = Math.min(100000, Math.max(0, parseInt(req.query.offset, 10) || 0));
  return { limit, offset };
}

module.exports = { schemas, body, pageParams, z };

