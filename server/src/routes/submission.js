const { Router } = require('express');
const prisma = require('../lib/prisma');
const { uploadFile, getSignedUrl } = require('../lib/storage');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/ratelimit');
const { upload, validateMimeType, handleMulterError } = require('../middleware/upload');
const { getSubmissionSettings } = require('../lib/submissionSettings');

const router = Router();

// Submission deadline: Sept 27, 2026 23:59:59 IST
const SUBMISSION_DEADLINE = new Date('2026-09-27T18:29:59.000Z'); // 23:59 IST = 18:29 UTC

// ─── POST /api/submission/upload ──────────────────────────────────────────────

router.post(
  '/upload',
  requireAuth,
  requireRole('team'),
  uploadLimiter,
  upload.single('file'),
  handleMulterError,
  validateMimeType,
  async (req, res) => {
    const settings = await getSubmissionSettings(prisma);
    if (!settings.acceptingSubmissions) {
      return res.status(403).json({
        success: false,
        error: settings.submissionCount >= settings.submissionLimit
          ? 'Presentation submissions are closed because the 800-submission limit has been reached.'
          : 'Presentation submissions are currently closed by the hackathon organizers.',
      });
    }

    // Check deadline lock
    if (new Date() > SUBMISSION_DEADLINE) {
      return res.status(403).json({
        success: false,
        error: 'The submission window has closed (deadline: Sept 25, 2026).',
      });
    }

    const teamId = req.user.teamId;
    const file = req.file;

    try {
      // Check if there's an existing submission to determine version
      const existing = await prisma.submission.findUnique({ where: { team_id: teamId } });

      if (existing?.locked) {
        return res.status(403).json({
          success: false,
          error: 'Your submission has been locked and can no longer be updated.',
        });
      }

      const version = existing ? existing.version + 1 : 1;
      const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
      const storagePath = `${teamId}/abstract-v${version}${ext}`;

      // Upload buffer to Cloudflare R2
      await uploadFile(storagePath, file.buffer, file.detectedMime || file.mimetype);

      // Upsert submission row in DB
      const submission = await prisma.submission.upsert({
        where: { team_id: teamId },
        create: {
          team_id: teamId,
          file_path: storagePath,
          original_name: file.originalname,
          mime_type: file.detectedMime || file.mimetype,
          size_bytes: file.size,
          version,
        },
        update: {
          file_path: storagePath,
          original_name: file.originalname,
          mime_type: file.detectedMime || file.mimetype,
          size_bytes: file.size,
          version,
          submitted_at: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          filename: file.originalname,
          size: file.size,
          version: submission.version,
          uploadedAt: submission.submitted_at,
        },
      });
    } catch (err) {
      console.error('[Submission/Upload]', err);
      return res.status(500).json({ success: false, error: 'Upload failed. Please try again.' });
    }
  }
);

// ─── GET /api/submission/me ────────────────────────────────────────────────────

router.get('/me', requireAuth, requireRole('team'), async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { team_id: req.user.teamId },
    });

    if (!submission) {
      return res.json({ success: true, data: null });
    }

    return res.json({
      success: true,
      data: {
        filename: submission.original_name,
        size: submission.size_bytes,
        version: submission.version,
        uploadedAt: submission.submitted_at,
        locked: submission.locked,
      },
    });
  } catch (err) {
    console.error('[Submission/Me]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch submission.' });
  }
});

// ─── GET /api/submission/signed-url/:submissionId ─────────────────────────────

router.get('/signed-url/:submissionId', requireAuth, requireRole('admin', 'judge'), async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.submissionId },
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    const signedUrl = await getSignedUrl(submission.file_path, 900); // 15-min URL

    return res.json({
      success: true,
      data: { url: signedUrl, expiresIn: 900, filename: submission.original_name },
    });
  } catch (err) {
    console.error('[Submission/SignedUrl]', err);
    return res.status(500).json({ success: false, error: 'Failed to generate download link.' });
  }
});

module.exports = router;
