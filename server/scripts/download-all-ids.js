require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const prisma = require('../src/lib/prisma');

const ID_BUCKET =
  process.env.IDS_SUPABASE_BUCKET || 'hackathon-submissions';

const OUTPUT_DIR = path.join(
  __dirname,
  'shortlisted-waitlisted-ids'
);

let supabase;

function getSupabase() {
  if (!supabase) {
    if (
      !process.env.IDS_SUPABASE_URL ||
      !process.env.IDS_SUPABASE_SERVICE_KEY
    ) {
      throw new Error(
        'IDS_SUPABASE_URL or IDS_SUPABASE_SERVICE_KEY is missing from .env'
      );
    }

    supabase = createClient(
      process.env.IDS_SUPABASE_URL,
      process.env.IDS_SUPABASE_SERVICE_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    );
  }

  return supabase;
}

function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim();
}

async function downloadFile(filePath, outputPath) {
  const client = getSupabase();

  const { data, error } = await client.storage
    .from(ID_BUCKET)
    .download(filePath);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Supabase returned no file data.');
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  fs.writeFileSync(outputPath, buffer);
}

async function downloadIdCards() {
  try {
    const teams = await prisma.team.findMany({
      where: {
        result: {
          shortlist_status: {
            in: ['Shortlisted', 'Waitlisted'],
          },
        },

        participantId: {
          isNot: null,
        },
      },

      select: {
        id: true,
        name: true,
        lead_email: true,

        result: {
          select: {
            shortlist_status: true,
          },
        },

        participantId: {
          select: {
            file_path: true,
            original_name: true,
          },
        },
      },

      orderBy: {
        id: 'asc',
      },
    });

    console.log(
      `Found ${teams.length} shortlisted/waitlisted teams with ID cards.\n`
    );

    if (teams.length === 0) {
      console.log('No matching ID cards found.');
      return;
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const team of teams) {
      const participantId = team.participantId;

      console.log('----------------------------------------');
      console.log(`Team ID : ${team.id}`);
      console.log(`Team    : ${team.name}`);
      console.log(`Status  : ${team.result?.shortlist_status}`);
      console.log(`Email   : ${team.lead_email}`);

      if (!participantId?.file_path) {
        console.log('⚠ No ID card file path. Skipping.');
        failed++;
        continue;
      }

      const safeTeamId = sanitizeFilename(team.id);
      const safeTeamName = sanitizeFilename(team.name);

      const outputFilename =
        `${safeTeamId}-${safeTeamName}.pdf`;

      const outputPath = path.join(
        OUTPUT_DIR,
        outputFilename
      );

      console.log(`Supabase Bucket : ${ID_BUCKET}`);
      console.log(`Supabase Path   : ${participantId.file_path}`);
      console.log(`Output          : ${outputFilename}`);

      if (fs.existsSync(outputPath)) {
        console.log('↷ Already exists. Skipping.');
        skipped++;
        continue;
      }

      try {
        await downloadFile(
          participantId.file_path,
          outputPath
        );

        console.log(`✓ Downloaded: ${outputFilename}`);
        downloaded++;
      } catch (error) {
        console.error(
          `✗ Download failed: ${error.message}`
        );

        failed++;
      }
    }

    console.log('\n========================================');
    console.log('ID CARD DOWNLOAD COMPLETE');
    console.log('========================================');
    console.log(`Downloaded : ${downloaded}`);
    console.log(`Skipped    : ${skipped}`);
    console.log(`Failed     : ${failed}`);
    console.log(`Total      : ${teams.length}`);
    console.log(`Output     : ${OUTPUT_DIR}`);
    console.log('========================================');
  } catch (error) {
    console.error(
      '\nFailed to retrieve ID cards:',
      error
    );

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

downloadIdCards();