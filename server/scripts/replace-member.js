require('dotenv').config();

const readline = require('readline');
const prisma = require('../src/lib/prisma');

const TEAM_ID = 'CSI26-003';
const MEMBER_TO_REPLACE = 'swaroop dhuri';

const NEW_MEMBER = {
  name: 'Manav Rajan Chudasama',
  college: 'DJ Sanghvi',
  phone: '8591009481',
  email: '',
  year: '4th Year',
};

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n========================================');
  console.log('       REPLACE TEAM MEMBER');
  console.log('========================================\n');

  const team = await prisma.team.findUnique({
    where: {
      id: TEAM_ID,
    },
    include: {
      members: true,
    },
  });

  if (!team) {
    console.error(`Team not found: ${TEAM_ID}`);
    return;
  }

  const targetName = MEMBER_TO_REPLACE.trim().toLowerCase();

  const member = team.members.find(
    (m) => m.name.trim().toLowerCase() === targetName
  );

  if (!member) {
    console.error(
      `Member "${MEMBER_TO_REPLACE}" not found in team ${TEAM_ID}.`
    );

    console.log('\nCurrent team members:');
    for (const m of team.members) {
      console.log(`  - ${m.name} (${m.email})`);
    }

    return;
  }

  console.log(`Team       : ${team.name}`);
  console.log(`Team ID    : ${team.id}`);

  console.log('\nMember being replaced:');
  console.log(`  Name     : ${member.name}`);
  console.log(`  Email    : ${member.email}`);
  console.log(`  Phone    : ${member.phone}`);
  console.log(`  College  : ${member.college}`);
  console.log(`  Year     : ${member.year}`);
  console.log(`  Role     : ${member.role}`);

  console.log('\nNew member:');
  console.log(`  Name     : ${NEW_MEMBER.name}`);
  console.log(`  Email    : ${NEW_MEMBER.email || '(empty)'}`);
  console.log(`  Phone    : ${NEW_MEMBER.phone}`);
  console.log(`  College  : ${NEW_MEMBER.college}`);
  console.log(`  Year     : ${NEW_MEMBER.year}`);

  const answer = await askConfirmation(
    '\nType "yes" to replace this member: '
  );

  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('\nCancelled. No changes were made.');
    return;
  }

  const updatedMember = await prisma.teamMember.update({
    where: {
      id: member.id,
    },
    data: {
      name: NEW_MEMBER.name,
      college: NEW_MEMBER.college,
      phone: NEW_MEMBER.phone,
      email: NEW_MEMBER.email,
      year: NEW_MEMBER.year,
    },
  });

  console.log('\n========================================');
  console.log('       MEMBER UPDATED SUCCESSFULLY');
  console.log('========================================\n');

  console.log(`Team ID : ${TEAM_ID}`);
  console.log(`Member  : ${updatedMember.name}`);
  console.log(`Email   : ${updatedMember.email || '(empty)'}`);
  console.log(`Phone   : ${updatedMember.phone}`);
  console.log(`College : ${updatedMember.college}`);
  console.log(`Year    : ${updatedMember.year}`);
}

main()
  .catch((error) => {
    console.error('\nFailed to update member:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });