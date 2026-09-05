const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { getSubmissionSettings } = require('../lib/submissionSettings');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const evaluateSchema = z.object({
  submissionId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  remarks: z.string().max(2000).default(''),
});

const publishSchema = z.object({
  teamIds: z.array(z.string()).min(1),
});

const announcementSchema = z.object({
  title: z.string().min(1, 'Title required.').max(200),
  detail: z.string().min(1, 'Detail required.'),
});

const trackSchema = z.object({
  title: z.string().min(1),
  category: z.string().default('General'),
  domain: z.string().optional(),
  short_description: z.string().default(''),
  description: z.string().default(''),
  difficulty: z.string().default('Intermediate'),
  reward: z.string().default(''),
  tags: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (Array.isArray(val)) return val;
    return [];
  }, z.array(z.string())).default([]),
  published: z.boolean().default(false),
});

// ─── Registration window ──────────────────────────────────────────────────────

router.get('/registration-status', async (_req, res) => {
  try {
    const window = await prisma.registrationWindow.findFirst();
    return res.json({ success: true, data: { open: window?.open ?? true } });
  } catch (err) {
    console.error('[Admin/RegistrationStatus]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch registration status.' });
  }
});

router.post('/registration-toggle', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const existing = await prisma.registrationWindow.findFirst();
    if (existing) {
      const updated = await prisma.registrationWindow.update({
        where: { id: existing.id },
        data: { open: !existing.open },
      });
      return res.json({ success: true, data: { open: updated.open } });
    } else {
      const created = await prisma.registrationWindow.create({ data: { open: false } });
      return res.json({ success: true, data: { open: created.open } });
    }
  } catch (err) {
    console.error('[Admin/ToggleReg]', err);
    return res.status(500).json({ success: false, error: 'Failed to toggle registration.' });
  }
});

// ─── Teams (admin view) ───────────────────────────────────────────────────────

router.get('/teams', requireAuth, requireRole('admin', 'judge'), async (_req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: true,
        submission: { select: { id: true, original_name: true, submitted_at: true, locked: true, version: true } },
        result: true,
        payment: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const shaped = teams.map((t) => ({
      id: t.id,
      name: t.name,
      joinCode: t.join_code,
      trackName: t.theme_track,
      problemStatementId: t.problem_statement_id,
      college: t.college,
      year: t.year,
      dept: t.dept,
      status: 'registered',
      submissionStatus: t.submission ? 'submitted' : 'pending',
      shortlisted: t.result?.shortlist_status === 'Shortlisted' || (t.result?.shortlisted ?? false),
      shortlistStatus: t.result?.shortlist_status || (t.result?.shortlisted ? 'Shortlisted' : 'Under-Review'),
      members: t.members,
      submission: t.submission,
      result: t.result,
      payment: t.payment, // <── ADD THIS LINE
    }));

    return res.json({ success: true, data: shaped });
  } catch (err) {
    console.error('[Admin/Teams]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch teams.' });
  }
});

// ─── Submissions (admin/judge list) ──────────────────────────────────────────

router.get('/submissions', requireAuth, requireRole('admin', 'judge'), async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        team: { select: { id: true, name: true, theme_track: true, college: true } },
        evaluations: {
          include: { judge: { select: { id: true, name: true, role: true } } },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });

    // For judges: only show their own evaluations attached
    const judgeId = req.user.role === 'judge' ? req.user.id : null;

    const shaped = submissions.map((s) => ({
      id: s.id,
      teamId: s.team_id,
      teamName: s.team.name,
      trackName: s.team.theme_track,
      college: s.team.college,
      filename: s.original_name,
      version: s.version,
      submittedAt: s.submitted_at,
      locked: s.locked,
      evaluations: judgeId
        ? s.evaluations.filter((e) => e.judge_id === judgeId)
        : s.evaluations,
      averageScore: s.evaluations.length
        ? Math.round(s.evaluations.reduce((sum, e) => sum + e.score, 0) / s.evaluations.length)
        : null,
    }));

    return res.json({ success: true, data: shaped });
  } catch (err) {
    console.error('[Admin/Submissions]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch submissions.' });
  }
});

// ─── Evaluate (judge scores) ──────────────────────────────────────────────────

router.post('/evaluate', requireAuth, requireRole('admin', 'judge'), async (req, res) => {
  const parsed = evaluateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { submissionId, score, remarks } = parsed.data;

  try {
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    const evaluation = await prisma.evaluation.upsert({
      where: {
        submission_id_judge_id: { submission_id: submissionId, judge_id: req.user.id },
      },
      create: {
        submission_id: submissionId,
        judge_id: req.user.id,
        score,
        remarks,
      },
      update: { score, remarks },
    });

    return res.json({ success: true, data: evaluation });
  } catch (err) {
    console.error('[Admin/Evaluate]', err);
    return res.status(500).json({ success: false, error: 'Failed to save evaluation.' });
  }
});

// ─── Leaderboard / aggregate scores ──────────────────────────────────────────

router.get('/results', requireAuth, requireRole('admin', 'judge'), async (_req, res) => {
  try {
    const results = await prisma.result.findMany({
      include: {
        team: {
          include: {
            submission: {
              include: {
                evaluations: { select: { score: true, judge_id: true } },
              },
            },
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    const shaped = results.map((r) => {
      const evals = r.team.submission?.evaluations ?? [];
      const avg = evals.length
        ? Math.round(evals.reduce((s, e) => s + e.score, 0) / evals.length)
        : null;

      return {
        teamId: r.team_id,
        teamName: r.team.name,
        rank: r.rank,
        shortlisted: r.shortlisted,
        shortlistStatus: r.shortlist_status || (r.shortlisted ? 'Shortlisted' : 'Under-Review'),
        published: r.published,
        averageScore: avg,
        judgeCount: evals.length,
      };
    });

    // Sort by avg score desc for leaderboard view
    shaped.sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1));

    return res.json({ success: true, data: shaped });
  } catch (err) {
    console.error('[Admin/Results]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch results.' });
  }
});

// ─── Shortlist teams ──────────────────────────────────────────────────────────

router.post('/teams/shortlist', requireAuth, requireRole('admin'), async (req, res) => {
  const { teamStatuses, teamIds } = req.body;
  const updates = Array.isArray(teamStatuses)
    ? teamStatuses
    : Array.isArray(teamIds) ? teamIds.map((teamId) => ({ teamId, status: 'Shortlisted' })) : null;
  const validStatuses = new Set(['Shortlisted', 'Waitlisted', 'Under-Review', 'Eliminated']);
  if (!updates || updates.some(({ teamId, status }) => !teamId || !validStatuses.has(status))) {
    return res.status(400).json({ success: false, error: 'Provide team statuses using a valid shortlist status.' });
  }

  try {
    const savedResults = [];
    for (const { teamId, status } of updates) {
      const result = await prisma.result.upsert({
        where: { team_id: teamId },
        create: { team_id: teamId, shortlisted: status === 'Shortlisted', shortlist_status: status },
        update: { shortlisted: status === 'Shortlisted', shortlist_status: status },
      });
      savedResults.push(result);
    }

    return res.json({ success: true, data: { teamStatuses: updates, results: savedResults } });
  } catch (err) {
    console.error('[Admin/Shortlist]', err);
    return res.status(500).json({ success: false, error: 'Failed to update shortlist.' });
  }
});

// ─── Publish results ──────────────────────────────────────────────────────────

router.post('/results/publish', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { teamIds } = req.body || {};

    let updated;
    if (Array.isArray(teamIds) && teamIds.length > 0) {
      updated = await prisma.result.updateMany({
        where: { team_id: { in: teamIds } },
        data: { published: true },
      });
    } else {
      updated = await prisma.result.updateMany({
        data: { published: true },
      });
    }

    await prisma.hackathonSetting.upsert({
      where: { id: 1 },
      create: { id: 1, acceptingSubmissions: false },
      update: { acceptingSubmissions: false },
    });

    return res.json({
      success: true,
      message: `Successfully published ${updated.count} results.`,
      data: { count: updated.count },
    });
  } catch (err) {
    console.error('[Admin/PublishResults]', err);
    return res.status(500).json({ success: false, error: 'Failed to publish results.' });
  }
});

router.post('/results/unpublish', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const updated = await prisma.result.updateMany({ data: { published: false } });
    return res.json({
      success: true,
      message: `Successfully unpublished ${updated.count} results.`,
      data: { count: updated.count },
    });
  } catch (err) {
    console.error('[Admin/UnpublishResults]', err);
    return res.status(500).json({ success: false, error: 'Failed to unpublish results.' });
  }
});


// ─── Announcements ────────────────────────────────────────────────────────────

router.get('/announcements', async (_req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { created_at: 'desc' },
    });
    return res.json({ success: true, data: announcements });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch announcements.' });
  }
});

router.post('/announcements', requireAuth, requireRole('admin'), async (req, res) => {
  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const announcement = await prisma.announcement.create({ data: parsed.data });
    return res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    console.error('[Admin/Announcements]', err);
    return res.status(500).json({ success: false, error: 'Failed to post announcement.' });
  }
});

// ─── Tracks (Problem statements) ─────────────────────────────────────────────

router.get('/tracks', async (_req, res) => {
  try {
    const tracks = await prisma.track.findMany({ orderBy: { title: 'asc' } });
    return res.json({ success: true, data: tracks });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch tracks.' });
  }
});

router.post('/tracks', requireAuth, requireRole('admin'), async (req, res) => {
  const parsed = trackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed.' });
  }

  try {
    const { domain, ...trackData } = parsed.data;
    const track = await prisma.track.create({
      data: {
        ...trackData,
        ...(domain && { category: domain }),
      },
    });
    return res.status(201).json({ success: true, data: track });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to create track.' });
  }
});

router.patch('/tracks/:id', requireAuth, requireRole('admin'), async (req, res) => {
  // 1. Validate and transform incoming data using Zod (handles tags array and mapping)
  const parsed = trackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed.', details: parsed.error.format() });
  }

  try {
    // 2. Map frontend 'domain' to database 'category' if your schema uses category
    const { domain, ...restData } = parsed.data;

    const track = await prisma.track.update({
      where: { id: req.params.id },
      data: {
        ...restData,
        ...(domain && { category: domain }), // maps domain to category safely
      },
    });
    return res.json({ success: true, data: track });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Track not found.' });
    console.error('Update track error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update track.' });
  }
});

router.delete('/tracks/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await prisma.track.delete({ where: { id: req.params.id } });
    return res.json({ success: true, data: { deletedId: req.params.id } });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Track not found.' });
    return res.status(500).json({ success: false, error: 'Failed to delete track.' });
  }
});

// ─── Lock all submissions (admin, run before judging) ─────────────────────────

router.post('/submissions/lock-all', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const { count } = await prisma.submission.updateMany({ data: { locked: true } });
    return res.json({ success: true, data: { lockedCount: count } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to lock submissions.' });
  }
});


// Add to admin.js (or your settings route file)
const settingsSchema = z.object({
  name: z.string().min(1),
  year: z.number().int(),
  deadline: z.string(),
  payment_deadline: z.string(),
  hackathonStatus: z.enum(['Live', 'Paused', 'Closed']),
  registrationStatus: z.enum(['Open', 'Closed']),
  acceptingSubmissions: z.boolean(),
});

router.get('/settings', async (_req, res) => {
  try {
    const settings = await getSubmissionSettings(prisma);
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch settings.' });
  }
});

router.put('/settings', requireAuth, requireRole('admin'), async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed.', details: parsed.error.format() });
  }

  try {
    await prisma.hackathonSetting.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: parsed.data,
    });
    const settings = await getSubmissionSettings(prisma);
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update settings.' });
  }
});

const rankSchema = z.object({
  position: z.enum(['first', 'second', 'third', 'fourth']),
  teamId: z.string().min(1),
});

router.post('/results/winners', requireAuth, requireRole('admin'), async (req, res) => {
  const parsed = rankSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed.' });
  }

  const { position, teamId } = parsed.data;
  const rankMap = { first: 1, second: 2, third: 3, fourth: 4 };
  const targetRank = rankMap[position];

  try {
    // Clear any existing team holding this rank to maintain unique positioning
    await prisma.result.updateMany({
      where: { rank: targetRank },
      data: { rank: null },
    });

    // Assign the rank to the newly selected team
    const result = await prisma.result.upsert({
      where: { team_id: teamId },
      create: { team_id: teamId, rank: targetRank, shortlisted: true, shortlist_status: 'Shortlisted' },
      update: { rank: targetRank, shortlisted: true, shortlist_status: 'Shortlisted' },
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Admin/AssignWinner]', err);
    return res.status(500).json({ success: false, error: 'Failed to assign winner rank.' });
  }
});


// ─── POST /api/admin/teams/:teamId/verify-payment ─────────────────────────────
router.post('/teams/:teamId/verify-payment', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { teamId } = req.params;

    const payment = await prisma.payment.findUnique({ where: { team_id: teamId } });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment has not been uploaded for this team.' });
    }

    if (payment.status !== 'Verified' && !payment.is_paid) {
      const successfulPaymentCount = await prisma.payment.count({
        where: { OR: [{ is_paid: true }, { status: 'success' }, { status: 'Verified' }] },
      });
      if (successfulPaymentCount >= 30) {
        return res.status(409).json({ success: false, error: 'Payment capacity has been reached.' });
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'Verified', is_paid: true },
    });

    return res.json({ success: true, data: updatedPayment });
  } catch (err) {
    console.error('[Admin/VerifyPayment]', err);
    return res.status(500).json({ success: false, error: 'Failed to verify payment.' });
  }
});

router.patch('/teams/:teamId/payment-status', requireAuth, requireRole('admin', 'judge'), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { status } = req.body;
    const validStatuses = new Set(['Pending', 'Verified', 'success', 'Rejected']);

    if (!validStatuses.has(status)) {
      return res.status(400).json({ success: false, error: 'Invalid payment status.' });
    }

    const payment = await prisma.payment.findUnique({ where: { team_id: teamId } });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment has not been uploaded for this team.' });
    }

    if ((status === 'Verified' || status === 'success') && !payment.is_paid && payment.status !== 'Verified' && payment.status !== 'success') {
      const successfulPaymentCount = await prisma.payment.count({
        where: { OR: [{ is_paid: true }, { status: 'success' }, { status: 'Verified' }] },
      });
      if (successfulPaymentCount >= 30) {
        return res.status(409).json({ success: false, error: 'Payment capacity has been reached.' });
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status, is_paid: status === 'Verified' || status === 'success' },
    });

    return res.json({ success: true, data: updatedPayment });
  } catch (err) {
    console.error('[Admin/PaymentStatus]', err);
    return res.status(500).json({ success: false, error: 'Failed to update payment status.' });
  }
});
module.exports = router;
