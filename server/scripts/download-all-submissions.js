// server/
// node scripts/download-all-submissions.js

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
  S3Client,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

const prisma = require('../src/lib/prisma');

const BUCKET =
  process.env.CLOUDFLARE_R2_BUCKET || 'hackathon-submissions';

const OUTPUT_DIR = path.join(
  __dirname,
  'downloaded-submissions'
);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim();
}

async function downloadFile(filePath, outputPath) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: filePath,
  });

  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error('R2 returned no file data.');
  }

  const fileStream = fs.createWriteStream(outputPath);

  await new Promise((resolve, reject) => {
    response.Body.pipe(fileStream);

    response.Body.on('error', reject);
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}

async function downloadSubmissions() {
  try {
    /*
     * Get all PPT/PPTX/PDF submissions and their team information.
     *
     * The submission itself determines whether the file should
     * be downloaded. Problem Statement is only used to determine
     * the destination folder.
     */
    const submissions = await prisma.submission.findMany({
      include: {
        team: {
          select: {
            id: true,
            name: true,
            lead_email: true,
            problem_statement_id: true,
            problem_statement: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'asc',
      },
    });

    console.log(`Found ${submissions.length} submissions.\n`);

    if (submissions.length === 0) {
      console.log('No submissions found.');
      return;
    }

    // Create root output directory
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const submission of submissions) {
      const team = submission.team;

      /*
       * The submission exists, so we download it regardless
       * of whether a Problem Statement has been selected.
       *
       * If PS exists:
       *   downloaded-submissions/PS001/
       *
       * If PS does not exist:
       *   downloaded-submissions/PS000/
       */
      const psId = team.problem_statement_id?.trim();

      const folderName = psId || 'PS000';

      /*
       * Sanitize names for Windows filesystem compatibility.
       */
      const safeFolderName = sanitizeFilename(folderName);

      const safeFilename = sanitizeFilename(
        submission.original_name
      );

      /*
       * Create destination folder.
       */
      const psFolder = path.join(
        OUTPUT_DIR,
        safeFolderName
      );

      fs.mkdirSync(psFolder, { recursive: true });

      const outputPath = path.join(
        psFolder,
        safeFilename
      );

      console.log('----------------------------------------');
      console.log(`PS:         ${psId || 'NONE'}`);
      console.log(`Folder:     ${safeFolderName}`);
      console.log(`Team ID:    ${team.id}`);
      console.log(`Team Name:  ${team.name}`);
      console.log(`File:       ${submission.original_name}`);
      console.log(`R2 Path:    ${submission.file_path}`);

      if (!psId) {
        console.log(
          '⚠ No problem statement selected. Downloading to PS000.'
        );
      }

      /*
       * If the file already exists locally,
       * don't download it again.
       */
      if (fs.existsSync(outputPath)) {
        console.log(`↷ Already exists. Skipping.`);
        skipped++;
        continue;
      }

      try {
        await downloadFile(
          submission.file_path,
          outputPath
        );

        console.log(`✓ Downloaded: ${outputPath}`);
        downloaded++;
      } catch (error) {
        console.error(
          `✗ Download failed: ${error.message}`
        );
        failed++;
      }
    }

    console.log('\n========================================');
    console.log('DOWNLOAD COMPLETE');
    console.log('========================================');
    console.log(`Downloaded: ${downloaded}`);
    console.log(`Skipped:    ${skipped}`);
    console.log(`Failed:     ${failed}`);
    console.log(`Total:      ${submissions.length}`);
    console.log(`Output:     ${OUTPUT_DIR}`);
    console.log('========================================');
  } catch (error) {
    console.error(
      'Failed to retrieve submissions:',
      error
    );

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

downloadSubmissions();