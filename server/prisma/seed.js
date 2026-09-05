/**
 * Seed script — Hackathon 2026
 * 
 * Creates:
 *   - 1 Admin user (email: admin@crucible.dev, password: Admin@2026!)
 *   - 2 Judge users
 *   - Initial registration window (open)
 *   - Sample problem statement tracks
 * 
 * Run with: node prisma/seed.js
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Hackathon 2026 database...\n');

  // ─── Admin + Judges ──────────────────────────────────────────────────────────
  const adminPassword = process.env.ADMIN_PASSWORD;
  const judgePassword = process.env.JUDGE_PASSWORD;
  const participantPassword = process.env.PARTICIPANT_PASSWORD;

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const judgeHash = await bcrypt.hash(judgePassword, 12);
  const participantHash = await bcrypt.hash(participantPassword, 12);

  const admin = await prisma.judgeUser.upsert({
    where: { email: 'admin@crucible.dev' },
    update: {},
    create: {
      name: 'Event Admin',
      email: 'admin@crucible.dev',
      password_hash: adminHash,
      role: 'admin',
    },
  });
  console.log(`✅ Admin:   ${admin.email} / Admin@2026!`);

  const judge1 = await prisma.judgeUser.upsert({
    where: { email: 'judge1@crucible.dev' },
    update: {},
    create: {
      name: 'Judge One',
      email: 'judge1@crucible.dev',
      password_hash: judgeHash,
      role: 'judge',
    },
  });
  console.log(`✅ Judge 1: ${judge1.email} / Judge@2026!`);

  const judge2 = await prisma.judgeUser.upsert({
    where: { email: 'judge2@crucible.dev' },
    update: {},
    create: {
      name: 'Judge Two',
      email: 'judge2@crucible.dev',
      password_hash: judgeHash,
      role: 'judge',
    },
  });
  console.log(`✅ Judge 2: ${judge2.email} / Judge@2026!\n`);

  // ─── Sample Participant Team ──────────────────────────────────────────────────
  const sampleTeam = await prisma.team.upsert({
    where: { lead_email: 'participant@crucible.dev' },
    update: {},
    create: {
      id: 'sample-team-01',
      name: 'The Cyber Knights',
      join_code: 'HACK-2026',
      theme_track: 'Sustainable Smart Cities',
      problem_statement_id: 'PS-01',
      problem_statement: 'Building AI-driven traffic optimization system for smart cities.',
      lead_email: 'participant@crucible.dev',
      phone: '+91 98765 43210',
      college: 'Xavier Institute of Engineering',
      year: '3rd Year',
      members: {
        create: [
          { name: 'Alex Lead', email: 'participant@crucible.dev', phone: '+91 98765 43210', role: 'lead' },
          { name: 'Rohan Dev', email: 'rohan@example.com', phone: '+91 98765 43211', role: 'member' },
        ],
      },
      credential: {
        create: {
          password_hash: participantHash,
          email_sent_at: new Date(),
        },
      },
      result: {
        create: { shortlisted: false, published: false },
      },
    },
  });
  console.log(`✅ Participant: ${sampleTeam.lead_email} / TeamLead@2026! (Join code: HACK-2026)\n`);

  // ─── Registration window ─────────────────────────────────────────────────────

  const existing = await prisma.registrationWindow.findFirst();
  if (!existing) {
    await prisma.registrationWindow.create({ data: { open: true } });
    console.log('✅ Registration window created (open: true)\n');
  } else {
    console.log('ℹ️  Registration window already exists\n');
  }

  // ─── Problem statement tracks ─────────────────────────────────────────────────

  for (const track of tracks) {
    await prisma.track.upsert({
      where: { id: 'seed-' + track.category.toLowerCase().replace(/[^a-z]/g, '-') },
      update: {},
      create: { id: 'seed-' + track.category.toLowerCase().replace(/[^a-z]/g, '-'), ...track },
    });
  }
  console.log(`✅ ${tracks.length} problem statement tracks seeded\n`);

  // ─── Initial announcement ─────────────────────────────────────────────────────

  const annCount = await prisma.announcement.count();
  if (annCount === 0) {
    await prisma.announcement.create({
      data: {
        title: 'Welcome to Hackathon 2026!',
        detail: 'Registrations are now open. Form your team, pick your problem statement, and register before the deadline. Good luck to all participants!',
      },
    });
    console.log('✅ Welcome announcement created\n');
  }

  console.log('🎉 Seeding complete!\n');
  console.log('─'.repeat(50));
  console.log('Participant:   participant@crucible.dev / TeamLead@2026!');
  console.log('Admin login:   admin@crucible.dev / Admin@2026!');
  console.log('Judge logins:  judge1@crucible.dev / Judge@2026!');
  console.log('               judge2@crucible.dev / Judge@2026!');
  console.log('─'.repeat(50));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('❌ Seed failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
