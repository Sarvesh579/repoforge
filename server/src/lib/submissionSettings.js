const SUBMISSION_LIMIT = 800;
// Submission deadline: Sept 27, 2026 23:59:59 IST (18:29:59 UTC)
const DEFAULT_SUBMISSION_DEADLINE = new Date('2026-09-27T18:29:59.000Z');

function parseSubmissionDeadline(deadlineStr) {
  if (!deadlineStr) return DEFAULT_SUBMISSION_DEADLINE;
  // If it's a date string like "2026-09-27", set to 23:59:59 IST (18:29:59 UTC)
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr)) {
    const d = new Date(`${deadlineStr}T18:29:59.000Z`);
    return isNaN(d.getTime()) ? DEFAULT_SUBMISSION_DEADLINE : d;
  }
  const d = new Date(deadlineStr);
  return isNaN(d.getTime()) ? DEFAULT_SUBMISSION_DEADLINE : d;
}

async function getSubmissionSettings(prisma) {
  let settings = await prisma.hackathonSetting.findUnique({ where: { id: 1 } });
  const submissionCount = await prisma.submission.count();
  const submissionDeadline = parseSubmissionDeadline(settings?.deadline);
  const now = new Date();

  // 1. Auto-close if submission count limit reached
  if (submissionCount >= SUBMISSION_LIMIT && (!settings || settings.acceptingSubmissions)) {
    settings = await prisma.hackathonSetting.upsert({
      where: { id: 1 },
      create: { id: 1, acceptingSubmissions: false },
      update: { acceptingSubmissions: false },
    });
  }

  // 2. Auto-close if submission deadline has passed, UNLESS the admin has manually updated settings after the deadline
  if (
    now > submissionDeadline &&
    settings &&
    settings.acceptingSubmissions &&
    settings.updated_at &&
    settings.updated_at < submissionDeadline
  ) {
    settings = await prisma.hackathonSetting.update({
      where: { id: 1 },
      data: { acceptingSubmissions: false },
    });
  }

  const isAccepting = submissionCount >= SUBMISSION_LIMIT
    ? false
    : (settings?.acceptingSubmissions ?? (now <= submissionDeadline));

  return {
    ...(settings || { id: 1, acceptingSubmissions: isAccepting }),
    acceptingSubmissions: isAccepting,
    submissionCount,
    submissionLimit: SUBMISSION_LIMIT,
  };
}

module.exports = { SUBMISSION_LIMIT, DEFAULT_SUBMISSION_DEADLINE, getSubmissionSettings };