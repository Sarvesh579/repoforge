const PAYMENT_CAP = 30;

function isSuccessfulPayment(payment) {
  return Boolean(payment?.is_paid) || payment?.status === 'success' || payment?.status === 'Verified';
}

function parseDeadline(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

async function checkPaymentEligibility(prisma, userId) {
  const [team, settings, successfulPayments] = await Promise.all([
    prisma.team.findUnique({ where: { id: userId }, include: { result: true, payment: true } }),
    prisma.hackathonSetting.findUnique({ where: { id: 1 } }),
    prisma.payment.count({ where: { OR: [{ is_paid: true }, { status: 'success' }, { status: 'Verified' }] } }),
  ]);

  const shortlistStatus = team?.result?.shortlist_status || (team?.result?.shortlisted ? 'Shortlisted' : 'Under-Review');
  const paid = isSuccessfulPayment(team?.payment);
  const deadlineTimestamp = parseDeadline(settings?.payment_deadline);
  const deadlineReached = deadlineTimestamp !== null && Date.now() >= deadlineTimestamp;
  const remainingSlots = Math.max(PAYMENT_CAP - successfulPayments, 0);
  let waitlistPosition = null;

  if (shortlistStatus === 'Waitlisted' && deadlineReached && remainingSlots > 0) {
    const waitlistedTeams = await prisma.team.findMany({
      where: {
        result: { is: { shortlist_status: 'Waitlisted' } },
        OR: [
          { payment: null },
          { payment: { is: { is_paid: false, status: { notIn: ['success', 'Verified'] } } } },
        ],
      },
      select: { id: true },
      orderBy: { created_at: 'asc' },
      take: remainingSlots,
    });
    waitlistPosition = waitlistedTeams.findIndex(({ id }) => id === userId);
  }

  const eligible = Boolean(
    team && !paid && successfulPayments < PAYMENT_CAP &&
    (shortlistStatus === 'Shortlisted' ||
      (shortlistStatus === 'Waitlisted' && deadlineReached && waitlistPosition !== -1 && waitlistPosition !== null)),
  );

  return {
    eligible,
    phase: deadlineReached ? 'post-deadline' : 'pre-deadline',
    reason: eligible ? null : successfulPayments >= PAYMENT_CAP ? 'Payment capacity has been reached.' : 'Payment is not currently available for this team.',
    totalPaid: successfulPayments,
    capacity: PAYMENT_CAP,
    paymentDeadline: settings?.payment_deadline || '',
    deadlineReached,
    shortlistStatus,
    isPaid: paid,
  };
}

module.exports = {
  PAYMENT_CAP,
  checkPaymentEligibility,
  check_payment_eligibility: checkPaymentEligibility,
  isSuccessfulPayment,
};