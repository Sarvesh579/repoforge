// Steps to run
// Edit the team details leadEmail and newTeamName
// On command line:
//  cd server
//  node scripts/update-team-name.js
// Confirm the fetched details
// Wait for success msg

const prisma = require('../src/lib/prisma');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function updateTeamName() {
  const leadEmail = 'example@gmail.com'; // <----- EDIT
  const newTeamName = 'new Team Name'; // <----- EDIT

  try {
    // Find the team using the lead's email
    const team = await prisma.team.findUnique({
      where: {
        lead_email: leadEmail.toLowerCase().trim(),
      },
    });

    if (!team) {
      console.log(`No team found with lead email: ${leadEmail}`);
      return;
    }

    console.log('Team found:');
    console.log(`  Team ID: ${team.id}`);
    console.log(`  Lead email: ${team.lead_email}`);
    console.log(`  Old name: ${team.name}`);
    console.log(`  New Name: ${newTeamName}`);

    const answer = await new Promise((resolve) => {
      rl.question(
        `\nAre you sure you want to change "${team.name}" to "${newTeamName}"? (y/n): `,
        resolve
      );
    });

    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('Update cancelled.');
      return;
    }

    const updatedTeam = await prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        name: newTeamName.trim(),
      },
    });

    console.log('\nTeam updated successfully!');
    console.log(`  Team ID: ${updatedTeam.id}`);
    console.log(`  New name: ${updatedTeam.name}`);
  } catch (error) {
    console.error('Failed to update team:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

updateTeamName();