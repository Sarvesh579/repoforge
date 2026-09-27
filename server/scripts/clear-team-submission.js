require('dotenv').config();

const readline = require('readline');
const prisma = require('../src/lib/prisma');
const { deleteFile } = require('../src/lib/storage');

const TEAM_ID = 'CSI26-159';

async function main() {
  const team = await prisma.team.findUnique({
    where: { id: TEAM_ID },
    include: { submission: true },
  });

  if (!team) {
    console.error(`Team not found: ${TEAM_ID}`);
    return;
  }

  console.log('\nTeam:');
  console.log(`  Name: ${team.name}`);
  console.log(`  ID: ${team.id}`);
  console.log(`  PS ID: ${team.problem_statement_id || 'None'}`);
  console.log(`  PS: ${team.problem_statement || 'None'}`);

  if (team.submission) {
    console.log(`  Submission: ${team.submission.original_name}`);
    console.log(`  R2 Path: ${team.submission.file_path}`);
  } else {
    console.log('  Submission: None');
  }

  console.log('\nTHIS WILL COMPLETELY RESET THE TEAM SUBMISSION:');
  console.log('  - Delete the submission from R2');
  console.log('  - Delete the submission database record');
  console.log('  - Clear Problem Statement');
  console.log('  - Clear Theme Track');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question('\nType "yes" to continue: ', resolve);
  });

  rl.close();

  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('\nCancelled. No changes were made.');
    return;
  }

  // Delete actual file from Cloudflare R2
  if (team.submission?.file_path) {
    console.log('\nDeleting submission from R2...');

    await deleteFile(team.submission.file_path);

    console.log('R2 file deleted.');
  }

  // Delete DB submission + clear PS
  await prisma.$transaction(async (tx) => {
    if (team.submission) {
      await tx.submission.delete({
        where: {
          team_id: team.id,
        },
      });
    }

    await tx.team.update({
      where: {
        id: team.id,
      },
      data: {
        problem_statement_id: '',
        problem_statement: '',
        theme_track: '',
      },
    });
  });

  console.log('\nTeam successfully reset.');
  console.log(`  Team: ${team.name}`);
  console.log('  Submission: Deleted');
  console.log('  Problem Statement: Cleared');
  console.log('  Theme Track: Cleared');
}

main()
  .catch((err) => {
    console.error('\nError:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });