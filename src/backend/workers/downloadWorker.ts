import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { exec } from 'child_process';
import util from 'util';
import ytdl from '@distube/ytdl-core';
import * as jobDb from '../jobDb.js';

const execPromise = util.promisify(exec);

export async function processDownload(job: any) {
  const { jobId, url } = job.data;
  jobDb.updateJob(jobId, { status: 'downloading', message: 'Downloading source video...' });
  
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  const outputPath = path.join(tempDir, `${jobId}.mp4`);

  try {
    const ytDlpCmd = `yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}" "${url}"`;
    await execPromise('yt-dlp --version');
    console.log(`[Job ${jobId}] Downloading via yt-dlp...`);
    await execPromise(ytDlpCmd);
  } catch (err) {
    console.log(`[Job ${jobId}] yt-dlp fallback to ytdl-core...`);
    await new Promise((resolve, reject) => {
      const videoStream = ytdl(url, { filter: 'audioandvideo', quality: 'lowestvideo' });
      const writeStream = fsSync.createWriteStream(outputPath);
      videoStream.pipe(writeStream);
      videoStream.on('error', reject);
      writeStream.on('finish', () => resolve(undefined));
    });
  }

  return { jobId, videoPath: outputPath };
}
