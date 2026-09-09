const { Router } = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { generateJoinCode } = require('../lib/joinCode');
const { sendRegistrationEmail } = require('../lib/mailersend');
const { requireAuth, requireRole } = require('../middleware/auth');
const { publicWriteLimiter } = require('../middleware/ratelimit');
const { verifyTurnstile } = require('../middleware/turnstile');
const { uploadParticipantIds, validatePaymentMimeType } = require('../middleware/upload');
const { uploadParticipantId } = require('../lib/paymentStorage');
const { getSubmissionSettings } = require('../lib/submissionSettings');
const { checkPaymentEligibility } = require('../lib/paymentEligibility');

const router = Router();

const MAX_TEAM_SIZE = 4; // max members including lead

// ─── Validation schemas ───────────────────────────────────────────────────────

const memberSchema = z.object({
  name: z.string().min(2, 'Member name is required.'),
  email: z.string().email('Valid email required.'),
  phone: z.string().min(8, 'Phone required.').default(''),
  role: z.string().optional().default(''),
  year: z.string().optional().default(''),
  dept: z.string().optional().default(''),
  college: z.string().optional().default(''),
});

const registerSchema = z.object({
  teamName: z.string().min(2, 'Team name is required.'),
  problemStatementId: z.string().optional().default(''),
  problemStatement: z.string().optional().default(''),
  teamSize: z.coerce.number().optional().default(3),
  leadName: z.string().min(2, 'Lead name is required.'),
  leadEmail: z.string().email('Valid email required for lead.'),
  leadPhone: z.string().min(8, 'Phone required.'),
  college: z.string().min(2, 'College is required.'),
  year: z.string().min(1, 'Year is required.'),
  dept: z.string().optional().default(''),
  members: z.array(memberSchema).min(2, 'At least 3 total members are required.').max(MAX_TEAM_SIZE - 1, 'A team cannot have more than 4 total members.'),
  password: z.string().min(4).optional(),
  confirmPassword: z.string().optional(),
  // themeTrack is optional; falls back to problemStatementId
  themeTrack: z.string().optional(),
  cf_turnstile_response: z.string().optional(),
});

const joinSchema = z.object({
  joinCode: z.string().optional(),
  name: z.string().min(2, 'Your name is required.'),
  email: z.string().email('Valid email required.'),
  phone: z.string().min(8, 'Phone required.').default(''),
  role: z.string().optional().default(''),
  year: z.string().optional().default(''),
  dept: z.string().optional().default(''),
  college: z.string().optional().default(''),
  cf_turnstile_response: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTempPassword(length = 10) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Generate serial team ID formatted as "CSI26-###"
 * Finds the current maximum sequential number in DB and increments by 1.
 */
async function generateNextTeamId(tx = prisma) {
  const teams = await tx.team.findMany({
    select: { id: true },
  });

  let maxNum = 0;
  for (const t of teams) {
    const match = String(t.id).match(/^CSI26-(\d{3,})$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `CSI26-${String(nextNum).padStart(3, '0')}`;
}

// ─── POST /api/team/register ──────────────────────────────────────────────────

router.post(
  '/register',
  publicWriteLimiter,
  // Registration is now submitted as multipart/form-data: text fields + the
  // combined participant-IDs PDF under the field name "idsFile".
  (req, res, next) => {
    uploadParticipantIds.single('idsFile')(req, res, function (err) {
      if (err) {
        console.error('[Team/Register] Multer error:', err);
        const message = err.code === 'LIMIT_FILE_SIZE'
          ? 'Participant ID proofs PDF must be 1 MB or smaller.'
          : (err.message || 'File upload error');
        return res.status(400).json({ success: false, error: message });
      }
      next();
    });
  },
  validatePaymentMimeType,
  verifyTurnstile,
  async (req, res) => {
    // Multer/multipart puts nested data on the wire as a JSON string — parse it
    // back into an array before validation.
    if (typeof req.body.members === 'string') {
      try {
        req.body.members = JSON.parse(req.body.members);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid members payload.' });
      }
    }

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed.',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const idsFile = req.file;
    if (!idsFile) {
      return res.status(400).json({ success: false, error: 'Participant ID proofs PDF is required.' });
    }

    const {
      teamName, problemStatementId, problemStatement,
      leadName, leadEmail, leadPhone, college, year, dept, members,
      password,
      themeTrack,
    } = parsed.data;

    // Registration deadline: Sept 26, 2026 23:59:59 IST
    const REGISTRATION_DEADLINE = new Date('2026-09-26T18:29:59.000Z'); // 23:59 IST = 18:29 UTC
    if (new Date() > REGISTRATION_DEADLINE) {
      return res.status(403).json({ success: false, error: 'Registrations closed on 26th September 2026.' });
    }

    // Check registration window is open
    const window = await prisma.registrationWindow.findFirst();
    if (window && !window.open) {
      return res.status(403).json({ success: false, error: 'Registrations are currently closed.' });
    }

    // Check total members won't exceed cap
    if (members.length + 1 > MAX_TEAM_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Team size cannot exceed ${MAX_TEAM_SIZE} members (including lead).`,
      });
    }

    // Check if team name already registered (case-insensitive)
    const existingTeamName = await prisma.team.findFirst({
      where: { name: { equals: teamName.trim(), mode: 'insensitive' } },
    });
    if (existingTeamName) {
      return res.status(409).json({ success: false, error: 'This team name is already taken. Please choose another name.' });
    }

    // Check if lead email already registered
    const existingTeam = await prisma.team.findUnique({ where: { lead_email: leadEmail.toLowerCase() } });
    if (existingTeam) {
      return res.status(409).json({ success: false, error: 'This email is already registered as a team lead.' });
    }

    try {
      const finalPassword = password || generateTempPassword();
      const passwordHash = await bcrypt.hash(finalPassword, 12);

      // Generate serial team ID formatted as "CSI26-###"
      const teamId = await generateNextTeamId();
      const idsExt = idsFile.originalname.slice(idsFile.originalname.lastIndexOf('.')).toLowerCase() || '.pdf';
      const idsStoragePath = `${teamId}/participant-ids${idsExt}`;

      let idsUploadResult;
      try {
        idsUploadResult = await uploadParticipantId(idsStoragePath, idsFile.buffer, idsFile.mimetype);
      } catch (uploadErr) {
        console.error('[Team/Register] Failed to upload participant IDs PDF:', uploadErr);
        return res.status(500).json({ success: false, error: 'Failed to upload participant ID proofs. Please try again.' });
      }

      const hasMemberCollegeField = Boolean(prisma.teamMember?.fields?.college);

      const leadMemberData = {
        name: leadName,
        email: leadEmail.toLowerCase(),
        phone: leadPhone,
        role: 'lead',
        custom_role: 'Team Lead',
        year,
        dept: dept || '',
      };
      if (hasMemberCollegeField) {
        leadMemberData.college = college;
      }

      const otherMembersData = members.map((m) => {
        const item = {
          name: m.name,
          email: m.email.toLowerCase(),
          phone: m.phone,
          role: 'member',
          custom_role: m.role || 'Member',
          year: m.year || '',
          dept: m.dept || '',
        };
        if (hasMemberCollegeField) {
          item.college = m.college || college;
        }
        return item;
      });

      const team = await prisma.$transaction(async (tx) => {
        const newTeam = await tx.team.create({
          data: {
            id: teamId,
            name: teamName.trim(),
            join_code: teamId, // default to teamId for schema uniqueness
            theme_track: themeTrack || problemStatementId || '',
            problem_statement_id: problemStatementId || '',
            problem_statement: problemStatement || '',
            lead_email: leadEmail.toLowerCase(),
            phone: leadPhone,
            college,
            year,
            dept: dept || '',
            members: {
              create: [
                leadMemberData,
                ...otherMembersData,
              ],
            },
            credential: {
              create: {
                password_hash: passwordHash,
                email_sent_at: null,
              },
            },
          },
        });

        // If running on a server before prisma generate updated the client, update college via raw SQL
        if (!hasMemberCollegeField) {
          try {
            await tx.$executeRawUnsafe(
              `UPDATE team_members SET college = $1 WHERE email = $2`,
              college,
              leadEmail.toLowerCase()
            );
            for (const m of members) {
              await tx.$executeRawUnsafe(
                `UPDATE team_members SET college = $1 WHERE email = $2`,
                m.college || college,
                m.email.toLowerCase()
              );
            }
          } catch (rawErr) {
            console.warn('[Team/Register] Raw SQL college fallback note:', rawErr.message);
          }
        }

        // Create an initial Result row (not shortlisted/published yet)
        await tx.result.create({ data: { team_id: newTeam.id } });

        // Record the participant IDs PDF that was just uploaded to the 'ids' bucket
        await tx.participantId.create({
          data: {
            team_id: newTeam.id,
            file_path: idsUploadResult.path || idsStoragePath,
            original_name: idsFile.originalname,
          },
        });

        return newTeam;
      });

      // Send credential email (non-blocking — don't fail registration if email fails)
      sendRegistrationEmail({
        to: leadEmail,
        teamName: team.name,
        teamId: team.id,
        password: finalPassword,
      })
        .then(() => prisma.credential.update({
          where: { team_id: team.id },
          data: { email_sent_at: new Date() },
        }))
        .catch((err) => console.error('[Email] Credential email failed:', err.message));

      return res.status(201).json({
        success: true,
        data: {
          teamId: team.id,
          email: leadEmail.toLowerCase(),
          message: 'Registration successful! Login credentials have been sent to your email.',
        },
      });
    } catch (err) {
      console.error('[Team/Register]', err);
      return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
    }
  });

// ─── POST /api/team/join ──────────────────────────────────────────────────────

router.post('/join', publicWriteLimiter, verifyTurnstile, async (req, res) => {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { joinCode, name, email, phone, role, year, dept, college } = parsed.data;

  try {
    const lookupKey = (joinCode || '').toUpperCase().trim();
    const team = await prisma.team.findFirst({
      where: {
        OR: [
          { id: { equals: lookupKey, mode: 'insensitive' } },
          { join_code: { equals: lookupKey, mode: 'insensitive' } },
        ],
      },
      include: { members: true },
    });

    if (!team) {
      return res.status(404).json({ success: false, error: 'No team found with that Team ID.' });
    }

    if (team.members.length >= MAX_TEAM_SIZE) {
      return res.status(400).json({ success: false, error: `This team is already full (max ${MAX_TEAM_SIZE} members).` });
    }

    const alreadyMember = team.members.some((m) => m.email === email.toLowerCase());
    if (alreadyMember) {
      return res.status(409).json({ success: false, error: 'This email is already a member of a team.' });
    }

      const hasMemberCollegeField = Boolean(prisma.teamMember?.fields?.college);
      const memberData = {
        team_id: team.id,
        name,
        email: email.toLowerCase(),
        phone,
        role: 'member',
        year: year || '',
        dept: dept || '',
      };
      if (hasMemberCollegeField) {
        memberData.college = college || team.college || '';
      }

      const member = await prisma.teamMember.create({
        data: memberData,
      });

      if (!hasMemberCollegeField && (college || team.college)) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE team_members SET college = $1 WHERE id = $2`,
            college || team.college,
            member.id
          );
        } catch (rawErr) {
          console.warn('[Team/Join] Fallback college update note:', rawErr.message);
        }
      }


    return res.status(201).json({
      success: true,
      data: {
        memberId: member.id,
        teamName: team.name,
        message: `You've joined ${team.name}!`,
      },
    });
  } catch (err) {
    console.error('[Team/Join]', err);
    return res.status(500).json({ success: false, error: 'Failed to join team. Please try again.' });
  }
});

// ─── GET /api/team/me ─────────────────────────────────────────────────────────

router.get('/me', requireAuth, requireRole('team'), async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.user.teamId },
      include: {
        members: { orderBy: { joined_at: 'asc' } },
        submission: true,
        payment: true,
        result: true,
      },
    });

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }

    return res.json({ success: true, data: team });
  } catch (err) {
    console.error('[Team/Me]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch team data.' });
  }
});

// ─── DELETE /api/team/member/:memberId ────────────────────────────────────────

router.delete('/member/:memberId', requireAuth, requireRole('team'), async (req, res) => {
  try {
    const member = await prisma.teamMember.findUnique({
      where: { id: req.params.memberId },
      include: { team: true },
    });

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found.' });
    }

    if (member.team_id !== req.user.teamId) {
      return res.status(403).json({ success: false, error: 'You can only manage your own team members.' });
    }

    if (member.role === 'lead') {
      return res.status(400).json({ success: false, error: 'Cannot remove the team lead.' });
    }

    await prisma.teamMember.delete({ where: { id: member.id } });

    return res.json({ success: true, data: { deletedId: member.id } });
  } catch (err) {
    console.error('[Team/RemoveMember]', err);
    return res.status(500).json({ success: false, error: 'Failed to remove member.' });
  }
});

// ─── POST /api/team/change-password ──────────────────────────────────────────

router.post('/change-password', requireAuth, requireRole('team'), async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors });
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const credential = await prisma.credential.findUnique({ where: { team_id: req.user.teamId } });
    if (!credential) {
      return res.status(404).json({ success: false, error: 'Credential not found.' });
    }

    const valid = await bcrypt.compare(currentPassword, credential.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.credential.update({
      where: { team_id: req.user.teamId },
      data: { password_hash: newHash },
    });

    return res.json({ success: true, data: { message: 'Password updated successfully.' } });
  } catch (err) {
    console.error('[Team/ChangePassword]', err);
    return res.status(500).json({ success: false, error: 'Password update failed.' });
  }
});

router.get('/participant_tracks', async (req, res) => {

  try {
    const tracks = await prisma.track.findMany({
      where: {
        published: true
      }
    });

    res.status(200).json({
      success: true,
      data: tracks
    });
  } catch (error) {
    console.error('Error fetching participant tracks[cite: 9]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve participant tracks'
    });
  }
});

router.post('/select-track', requireAuth, requireRole('team'), async (req, res) => {
  try {
    const { trackId } = req.body;
    const teamId = req.user.teamId;

    // 1. Find the selected track to pull its details
    const track = await prisma.track.findUnique({
      where: { id: trackId }
    });

    if (!track) {
      return res.status(404).json({ success: false, error: 'Track not found.' });
    }

    // 2. Update the Team record with the problem statement details
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        problem_statement_id: track.id,
        problem_statement: track.title,
        theme_track: track.category
      }
    });

    return res.json({
      success: true,
      message: 'Problem statement linked to team successfully.',
      data: updatedTeam
    });
  } catch (err) {
    console.error('[Team/SelectTrack]', err);
    return res.status(500).json({ success: false, error: 'Failed to select problem statement.' });
  }
});


// Add to team.js

// ─── PUT /api/team/members ────────────────────────────────────────────────────

router.put('/members', requireAuth, requireRole('team'), async (req, res) => {
  const { members } = req.body;
  const teamId = req.user.teamId;

  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one team member is required.' });
  }

  if (members.length > MAX_TEAM_SIZE) {
    return res.status(400).json({ success: false, error: `Team size cannot exceed ${MAX_TEAM_SIZE} members.` });
  }

  try {
    const updatedTeam = await prisma.$transaction(async (tx) => {
      // 1. Delete old members and bulk insert new ones in parallel or direct sequence without extra findMany overhead
      await tx.teamMember.deleteMany({ where: { team_id: teamId } });

      const hasMemberCollegeField = Boolean(prisma.teamMember?.fields?.college);
      const newMembersData = members.map((m, idx) => {
        const isLead = idx === 0 || m.role?.toLowerCase() === 'lead' || m.role?.toLowerCase() === 'team leader';
        const data = {
          team_id: teamId,
          name: m.name,
          email: m.email || `${teamId.toLowerCase()}_m${idx + 1}@placeholder.com`,
          phone: m.phone || '',
          role: isLead ? 'lead' : 'member',
          custom_role: m.role || (isLead ? 'Team Lead' : 'Member'),
          year: m.year || '',
          dept: m.dept || '',
        };
        if (hasMemberCollegeField) {
          data.college = m.college || '';
        }
        return data;
      });

      await tx.teamMember.createMany({ data: newMembersData });

      if (!hasMemberCollegeField) {
        for (const m of members) {
          if (m.college && m.email) {
            try {
              await tx.$executeRawUnsafe(
                `UPDATE team_members SET college = $1 WHERE team_id = $2 AND email = $3`,
                m.college,
                teamId,
                m.email.toLowerCase()
              );
            } catch (rawErr) {
              console.warn('[Team/UpdateMembers] Fallback college update note:', rawErr.message);
            }
          }
        }
      }

      // If lead's college is updated, sync it to team.college as well
      const leadCollege = members[0]?.college;
      if (leadCollege) {
        await tx.team.update({
          where: { id: teamId },
          data: { college: leadCollege },
        });
      }

      // 2. Return final updated team
      return await tx.team.findUnique({
        where: { id: teamId },
        include: { members: { orderBy: { joined_at: 'asc' } }, submission: true, payment: true, result: true },
      });
    }, {
      maxWait: 10000, // 10s max wait to acquire a connection
      timeout: 10000, // 10s timeout limit for transaction execution
    });

    return res.json({ success: true, data: updatedTeam });
  } catch (err) {
    console.error('[Team/UpdateMembers]', err);
    return res.status(500).json({ success: false, error: 'Failed to update team members.' });
  }
});
// ─── GET /api/team/settings-and-results ──────────────────────────────────────
router.get('/settings-and-results', requireAuth, requireRole('team'), async (req, res) => {
  try {
    const settings = await getSubmissionSettings(prisma);

    const result = await prisma.result.findUnique({
      where: { team_id: req.user.teamId }
    });
    const paymentEligibility = await checkPaymentEligibility(prisma, req.user.teamId);

    return res.json({
      success: true,
      data: {
        settings,
        result: result || { shortlisted: false, shortlist_status: 'Under-Review', rank: null, published: false },
        paymentEligibility,
      }
    });
  } catch (err) {
    console.error('[Team/SettingsAndResults]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch settings and results.' });
  }
});
module.exports = router;