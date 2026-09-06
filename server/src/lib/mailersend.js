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
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #e8eeff;
    }

    .container {
      max-width: 560px;
      margin: 40px auto;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(
        135deg,
        #0a0e17 0%,
        #142034 100%
      );
      padding: 40px 40px 32px;
      border-bottom: 1px solid rgba(45,91,255,0.3);
    }

    .logo {
      font-size: 11px;
      letter-spacing: 3px;
      color: #71a7ff;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .title {
      font-size: 28px;
      font-weight: 700;
      color: #e8eeff;
      margin: 0;
      line-height: 1.2;
    }

    .body {
      padding: 36px 40px;
    }

    .greeting {
      font-size: 16px;
      line-height: 1.6;
      color: #a0b4d0;
      margin-bottom: 24px;
    }

    .card {
      background: rgba(45,91,255,0.08);
      border: 1px solid rgba(45,91,255,0.25);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      gap: 20px;
    }

    .row:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 12px;
      letter-spacing: 1px;
      color: #71a7ff;
      font-weight: 600;
      white-space: nowrap;
    }

    .value {
      font-size: 16px;
      font-weight: 700;
      color: #e8eeff;
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
      text-align: right;
      word-break: break-word;
    }

    .warning {
      background: rgba(255,160,0,0.08);
      border: 1px solid rgba(255,160,0,0.25);
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
      font-size: 13px;
      line-height: 1.5;
      color: #ffa000;
    }

    .cta {
      display: inline-block;
      background: #2d5bff;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 8px;
      margin: 4px 0 20px;
    }

    .footer {
      padding: 24px 40px;
      border-top: 1px solid rgba(255,255,255,0.06);
      font-size: 12px;
      line-height: 1.5;
      color: #506080;
      text-align: center;
    }

    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }

      .header,
      .body,
      .footer {
        padding-left: 24px;
        padding-right: 24px;
      }

      .row {
        align-items: flex-start;
        flex-direction: column;
        gap: 4px;
      }

      .value {
        text-align: left;
      }
    }
  </style>
</head>

<body>

  <div class="container">

    <div class="header">

      <div class="logo">
        CSI · XAVIER INSTITUTE OF ENGINEERING
      </div>

      <h1 class="title">
        You're in. ✦
      </h1>

    </div>

    <div class="body">

      <p class="greeting">
        Hi there, <strong>${teamName}</strong> —
        your team is officially registered for
        <strong>REPOFORGE 2026</strong>.
        Share the join code below with your teammates
        so they can join your team.
      </p>

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
          <span class="label">JOIN CODE</span>
          <span class="value">${joinCode}</span>
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

      <div class="warning">
        ⚠️ Keep your team login credentials private.
        Only share the <strong>Join Code</strong> with your teammates.
      </div>

      <a
        class="cta"
        href="${frontendUrl}/login"
      >
        Login to your dashboard →
      </a>

      <p style="font-size:13px; line-height:1.6; color:#71a7ff; margin:0;">
        <strong>Round 1 Submission Window:</strong>
        Sept 22 – Sept 25, 2026<br/>
        Upload your PPT/PDF abstract from the dashboard before the deadline.
      </p>

    </div>

    <div class="footer">

      CSI Student Chapter · Xavier Institute of Engineering ·
      REPOFORGE 2026<br/>

      You are receiving this because you registered for the hackathon.

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

  return await mailerSend.email.send(emailParams);
}

module.exports = {
  sendRegistrationEmail,
};