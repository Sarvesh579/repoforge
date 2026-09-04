const { Router } = require('express');
const prisma = require('../lib/prisma');
const { uploadPaymentScreenshot: storePaymentScreenshot } = require('../lib/paymentStorage');
const { uploadParticipantId } = require('../lib/paymentStorage');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadPayment, uploadPaymentScreenshot, validatePaymentMimeType } = require('../middleware/upload');
const { checkPaymentEligibility } = require('../lib/paymentEligibility');

const router = Router();

async function requirePaymentEligibility(req, res, next) {
    try {
        const eligibility = await checkPaymentEligibility(prisma, req.user.teamId);
        if (!eligibility.eligible) {
            return res.status(403).json({ success: false, error: eligibility.reason, data: { eligibility } });
        }
        next();
    } catch (err) {
        console.error('[Payment Eligibility]', err);
        return res.status(500).json({ success: false, error: 'Unable to verify payment upload eligibility.' });
    }
}

router.post(
    '/upload-screenshot',
    requireAuth,
    requireRole('team'),
    requirePaymentEligibility,
    (req, res, next) => {
        console.log('[Payment Route] Hit /upload-screenshot endpoint');
        next();
    },
    (req, res, next) => {
        uploadPaymentScreenshot.single('file')(req, res, function (err) {
            if (err) {
                console.error('[Multer Error Caught]:', err);
                const error = err.code === 'LIMIT_FILE_SIZE'
                    ? 'Payment screenshot must be 1 MB or smaller.'
                    : (err.message || 'File upload error');
                return res.status(400).json({ success: false, error });
            }
            next();
        });
    },
    validatePaymentMimeType,
    async (req, res) => {
        try {
            console.log('[Payment Route] Multer processing & MIME validation complete.');
            console.log('[Payment Route] req.file:', req.file ? { originalname: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype, detectedMime: req.file.detectedMime } : 'undefined');
            console.log('[Payment Route] req.user:', req.user);

            const teamId = req.user?.teamId || req.user?.id;
            const file = req.file;

            if (!file) {
                console.warn('[Payment Route] Validation failed: No file provided.');
                return res.status(400).json({ success: false, error: 'No screenshot uploaded.' });
            }

            if (!teamId) {
                console.warn('[Payment Route] Validation failed: Missing teamId on req.user.');
                return res.status(400).json({ success: false, error: 'User team ID not found.' });
            }

            const existingPayment = await prisma.payment.findUnique({ where: { team_id: teamId } });
            if (existingPayment?.status === 'Verified') {
                return res.status(409).json({
                    success: false,
                    error: 'Payment is already verified. Re-uploading the screenshot is disabled.',
                });
            }

            const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
            const storagePath = `${teamId}/payment-receipt${ext}`;
            console.log(`[Payment Route] Attempting Supabase upload to path: ${storagePath}`);

            // 1. Upload to Supabase
            const uploadResult = await storePaymentScreenshot(storagePath, file.buffer, file.mimetype);
            console.log('[Payment Route] Supabase upload successful:', uploadResult);

            // 2. Update Database via Prisma
            console.log('[Payment Route] Attempting database upsert for teamId:', teamId);
            const paymentRecord = await prisma.payment.upsert({
                where: { team_id: teamId },
                create: {
                    team_id: teamId,
                    file_path: storagePath,
                    original_name: file.originalname,
                    status: 'Pending',
                },
                update: {
                    file_path: storagePath,
                    original_name: file.originalname,
                    status: 'Pending',
                    uploaded_at: new Date(),
                },
            });
            console.log('[Payment Route] Database upsert successful:', paymentRecord);

            return res.status(200).json({
                success: true,
                data: {
                    fileName: paymentRecord.original_name,
                    status: paymentRecord.status,
                    uploadedAt: paymentRecord.uploaded_at,
                },
            });
        } catch (err) {
            console.error('[Payment Route CATCH ERROR CRASH PREVENTED]:', err);
            if (!res.headersSent) {
                return res.status(500).json({
                    success: false,
                    error: err.message || 'Internal server error during payment processing.'
                });
            }
        }
    }
);

router.post(
    '/upload-ids',
    requireAuth,
    requireRole('team'),
    uploadPayment.single('file'), // Handle single combined PDF file upload
    validatePaymentMimeType,
    async (req, res) => {
        try {
            const teamId = req.user?.teamId || req.user?.id;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ success: false, error: 'No ID proofs PDF provided.' });
            }

            const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
            const storagePath = `${teamId}/participant-ids${ext}`;

            // 1. Upload combined PDF to the 'IDS' bucket
            const uploadRes = await uploadParticipantId(storagePath, file.buffer, file.mimetype);

            // 2. Save or update record in the new 'participant_ids' table via Prisma
            const idRecord = await prisma.participantId.upsert({
                where: { team_id: teamId },
                create: {
                    team_id: teamId,
                    file_path: uploadRes.path,
                    original_name: file.originalname,
                },
                update: {
                    file_path: uploadRes.path,
                    original_name: file.originalname,
                    uploaded_at: new Date(),
                },
            });

            return res.status(200).json({
                success: true,
                message: 'Participant IDs uploaded successfully to IDS bucket and recorded.',
                data: idRecord,
            });
        } catch (err) {
            console.error('[Upload IDs Error]:', err);
            return res.status(500).json({
                success: false,
                error: err.message || 'Failed to upload participant IDs.',
            });
        }
    }
);
module.exports = router;