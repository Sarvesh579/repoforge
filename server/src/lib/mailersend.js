require('dotenv').config();
const {
  MailerSend,
  EmailParams,
  Sender,
  Recipient,
} = require('mailersend');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

/**
 * Send registration confirmation email to the team.
 *
 * Contains:
 * - Team name
 * - Team ID
 * - Join code
 * - Team login email
 * - Team login password
 * - Dashboard login link
 * - Round 1 submission window
 */
async function sendRegistrationEmail({
  to,
  teamName,
  teamId,
  joinCode,
  password,
}) {
  if (!process.env.MAILERSEND_API_KEY) {
    throw new Error('MAILERSEND_API_KEY is not configured');
  }

  if (!process.env.MAILERSEND_FROM_EMAIL) {
    throw new Error('MAILERSEND_FROM_EMAIL is not configured');
  }

  if (!to) {
    throw new Error('Recipient email is required');
  }

  const frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:5173';

  const sender = new Sender(
    process.env.MAILERSEND_FROM_EMAIL,
    process.env.MAILERSEND_FROM_NAME || 'REPOFORGE 2026'
  );

  const recipient = new Recipient(to, teamName);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>You're registered — REPOFORGE 2026</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0a0e17;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #e8eeff;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #101722;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
    }

    /* Header */
    .header {
      background: linear-gradient(
        135deg,
        #0a0e17 0%,
        #142034 100%
      );
      padding: 40px;
      border-bottom: 1px solid rgba(45, 91, 255, 0.3);
    }

    .logo {
      margin: 0 0 14px;
      font-size: 11px;
      line-height: 1.4;
      letter-spacing: 2.5px;
      color: #71a7ff;
      font-weight: 600;
    }

    .title {
      margin: 0;
      font-size: 28px;
      line-height: 1.25;
      font-weight: 700;
      color: #e8eeff;
    }

    /* Body */
    .body {
      padding: 36px 40px;
    }

    .greeting {
      margin: 0 0 28px;
      font-size: 15px;
      line-height: 1.7;
      color: #aebbd0;
    }

    .greeting strong {
      color: #e8eeff;
      font-weight: 600;
    }

    /* Credentials Card */
    .card {
      margin-bottom: 24px;
      padding: 22px 24px;
      background: rgba(45, 91, 255, 0.07);
      border: 1px solid rgba(45, 91, 255, 0.24);
      border-radius: 12px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 13px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .row:first-child {
      padding-top: 2px;
    }

    .row:last-child {
      padding-bottom: 2px;
      border-bottom: none;
    }

    .label {
      flex-shrink: 0;
      font-size: 11px;
      line-height: 1.4;
      letter-spacing: 1.2px;
      color: #71a7ff;
      font-weight: 600;
    }

    .value {
      max-width: 65%;
      font-size: 14px;
      line-height: 1.5;
      font-weight: 600;
      color: #0032baff;
      text-align: right;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    /* Security Notice */
    .warning {
      margin-bottom: 24px;
      padding: 15px 18px;
      background: rgba(255, 160, 0, 0.07);
      border: 1px solid rgba(255, 160, 0, 0.22);
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.6;
      color: #d9a94a;
    }

    .warning strong {
      color: #f0b84b;
      font-weight: 600;
    }

    /* CTA */
    .cta-wrapper {
      margin-bottom: 24px;
    }

    .cta {
      display: inline-block;
      padding: 12px 26px;
      background: #2d5bff;
      border-radius: 8px;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      line-height: 1.4;
      font-weight: 600;
    }

    /* Submission Information */
    .submission {
      margin: 0;
      padding-top: 2px;
      font-size: 13px;
      line-height: 1.7;
      color: #8fa3c0;
    }

    .submission strong {
      color: #71a7ff;
      font-weight: 600;
    }

    /* Footer */
    .footer {
      padding: 24px 40px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 11px;
      line-height: 1.7;
      color: #c00000ff;
      text-align: center;
    }

    /* Mobile */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        margin: 0;
        border-radius: 0;
      }

      .header,
      .body,
      .footer {
        padding-left: 24px;
        padding-right: 24px;
      }

      .header {
        padding-top: 32px;
        padding-bottom: 28px;
      }

      .body {
        padding-top: 30px;
        padding-bottom: 30px;
      }

      .title {
        font-size: 25px;
      }

      .row {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }

      .value {
        max-width: 100%;
        text-align: left;
      }

      .cta {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>

<body>

  <div class="container">

    <!-- Header -->
    <div class="header">

      <div class="logo">
        CSI · XAVIER INSTITUTE OF ENGINEERING
      </div>

      <h1 class="title">
        You're in. ✦
      </h1>

    </div>

    <!-- Main Content -->
    <div class="body">

      <p class="greeting">
        Hi there, <strong>${teamName}</strong> —
        your team is officially registered for
        <strong>REPOFORGE 2026</strong>.
      </p>

      <!-- Team Credentials -->
      <div class="card">

        <div class="row">
          <span class="label">TEAM NAME</span>
          <span class="value">${teamName}</span>
        </div>

        <div class="row">
          <span class="label">TEAM ID</span>
          <span class="value">${teamId}</span>
        </div>

        <div class="row">
          <span class="label">TEAM LOGIN EMAIL</span>
          <span class="value">${to}</span>
        </div>

        <div class="row">
          <span class="label">PASSWORD</span>
          <span class="value">${password}</span>
        </div>

      </div>

      <!-- Security Notice -->
      <div class="warning">
        Keep your team login credentials private.
        Do not share your password with anyone.
      </div>

      <!-- Dashboard CTA -->
      <div class="cta-wrapper">
        <a
          class="cta"
          href="${frontendUrl}/login"
        >
          Login to Your Dashboard →
        </a>
      </div>

      <!-- Submission Information -->
      <p class="submission">
        <strong>Round 1 Submission Window:</strong><br />
        September 22 – September 25, 2026<br />
        Upload your PPT/PDF abstract from the dashboard before the deadline.
      </p>

    </div>

    <!-- Footer -->
    <div class="footer">

      CSI Student Chapter · Xavier Institute of Engineering · REPOFORGE 2026<br />

      You are receiving this email because your team registered for the hackathon.

    </div>

  </div>

</body>
</html>

`;

  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo([recipient])
    .setSubject(
      `✦ REPOFORGE 2026 — You're in! Team credentials inside`
    )
    .setHtml(html);

  try {
    return await mailerSend.email.send(emailParams);
  } catch (err) {
    const detail =
      err?.body?.message ||
      (err?.body?.errors ? JSON.stringify(err.body.errors) : null) ||
      err?.message ||
      'Unknown MailerSend error';
    console.error('[MailerSend] API delivery failed:', detail);
    throw new Error(detail);
  }
}

module.exports = {
  sendRegistrationEmail,
};