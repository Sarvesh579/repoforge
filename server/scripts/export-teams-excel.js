require('dotenv').config();

const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.set('connection_limit', '1');
databaseUrl.searchParams.set('pool_timeout', '30');

process.env.DATABASE_URL = databaseUrl.toString();

const ExcelJS = require('exceljs');
const path = require('path');
const prisma = require('../src/lib/prisma');

const OUTPUT_FILE = path.join(
  __dirname,
  'teams-export.xlsx'
);

async function exportTeams() {
  try {
    console.log('Fetching teams from database...');

    const teams = await prisma.team.findMany({
      include: {
        members: {
          orderBy: {
            joined_at: 'asc',
          },
        },
        submission: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    console.log(`Found ${teams.length} teams.`);

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Hackathon System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Teams');

    /*
     * Create columns.
     */
    const columns = [
      // Team details
      { header: 'Team Name', key: 'teamName', width: 25 },
      { header: 'Team ID', key: 'teamId', width: 15 },
      { header: 'PS ID', key: 'psId', width: 15 },
      { header: 'Submission Status', key: 'submissionStatus', width: 20 },

      // Leader
      { header: 'Leader Name', key: 'leaderName', width: 25 },
      { header: 'Leader Email', key: 'leaderEmail', width: 30 },
      { header: 'Leader Phone', key: 'leaderPhone', width: 18 },
      { header: 'Leader Year', key: 'leaderYear', width: 12 },
      { header: 'Leader Department', key: 'leaderDept', width: 20 },
      { header: 'Leader College', key: 'leaderCollege', width: 30 },

      // Member 1
      { header: 'Member 1 Name', key: 'member1Name', width: 25 },
      { header: 'Member 1 Email', key: 'member1Email', width: 30 },
      { header: 'Member 1 Phone', key: 'member1Phone', width: 18 },
      { header: 'Member 1 Year', key: 'member1Year', width: 12 },
      { header: 'Member 1 Department', key: 'member1Dept', width: 20 },
      { header: 'Member 1 College', key: 'member1College', width: 30 },
      { header: 'Member 1 Role', key: 'member1Role', width: 18 },

      // Member 2
      { header: 'Member 2 Name', key: 'member2Name', width: 25 },
      { header: 'Member 2 Email', key: 'member2Email', width: 30 },
      { header: 'Member 2 Phone', key: 'member2Phone', width: 18 },
      { header: 'Member 2 Year', key: 'member2Year', width: 12 },
      { header: 'Member 2 Department', key: 'member2Dept', width: 20 },
      { header: 'Member 2 College', key: 'member2College', width: 30 },
      { header: 'Member 2 Role', key: 'member2Role', width: 18 },

      // Member 3
      { header: 'Member 3 Name', key: 'member3Name', width: 25 },
      { header: 'Member 3 Email', key: 'member3Email', width: 30 },
      { header: 'Member 3 Phone', key: 'member3Phone', width: 18 },
      { header: 'Member 3 Year', key: 'member3Year', width: 12 },
      { header: 'Member 3 Department', key: 'member3Dept', width: 20 },
      { header: 'Member 3 College', key: 'member3College', width: 30 },
      { header: 'Member 3 Role', key: 'member3Role', width: 18 },
    ];

    worksheet.columns = columns;

    /*
     * Process each team.
     */
    for (const team of teams) {
      // Find the actual lead
      const leader =
        team.members.find(
          (member) => member.role === 'lead'
        ) || team.members[0];

      // Everything except the leader becomes Member 1/2/3
      const otherMembers = team.members
        .filter((member) => member.id !== leader?.id)
        .slice(0, 3);

      const row = {
        // Team
        teamName: team.name,
        teamId: team.id,
        psId: team.problem_statement_id || '',
        submissionStatus: team.submission
          ? 'Submitted'
          : 'Not Submitted',

        // Leader
        leaderName: leader?.name || '',
        leaderEmail: leader?.email || '',
        leaderPhone: leader?.phone || '',
        leaderYear: leader?.year || '',
        leaderDept: leader?.dept || '',
        leaderCollege: leader?.college || '',

      };

      /*
       * Add Member 1, Member 2 and Member 3.
       */
      for (let i = 0; i < 3; i++) {
        const member = otherMembers[i];
        const number = i + 1;

        row[`member${number}Name`] =
          member?.name || '';

        row[`member${number}Email`] =
          member?.email || '';

        row[`member${number}Phone`] =
          member?.phone || '';

        row[`member${number}Year`] =
          member?.year || '';

        row[`member${number}Dept`] =
          member?.dept || '';

        row[`member${number}College`] =
          member?.college || '';

        row[`member${number}Role`] =
          member?.custom_role || '';
      }

      worksheet.addRow(row);
    }

    /*
     * Format header.
     */
    const headerRow = worksheet.getRow(1);

    headerRow.font = {
      bold: true,
      size: 11,
    };

    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };

    headerRow.height = 30;

    /*
     * Add borders and alignment.
     */
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = {
          vertical: 'top',
          wrapText: true,
        };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    /*
     * Freeze the header row.
     */
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1,
      },
    ];

    /*
     * Enable filtering.
     */
    worksheet.autoFilter = {
      from: 'A1',
      to: `${worksheet.getColumn(worksheet.columnCount).letter}1`,
    };

    /*
     * Save Excel file.
     */
    await workbook.xlsx.writeFile(OUTPUT_FILE);

    console.log('\n========================================');
    console.log('EXPORT COMPLETE');
    console.log('========================================');
    console.log(`Teams exported: ${teams.length}`);
    console.log(`File: ${OUTPUT_FILE}`);
    console.log('========================================');
  } catch (error) {
    console.error('\nFailed to export teams:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

exportTeams();