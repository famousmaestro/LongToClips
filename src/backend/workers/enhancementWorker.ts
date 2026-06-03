import ffmpeg from "fluent-ffmpeg";
import path from "path";
import * as jobDb from '../jobDb.js';

export async function processEnhancement(job: any) {
  const { jobId, clipPath, segment, clipIndex, totalClips } = job.data;
  
  const tempDir = path.join(process.cwd(), 'temp');
  const outputFileName = `${jobId}_clip_${clipIndex}_enhanced.mp4`;
  const outputPath = path.join(tempDir, outputFileName);

  await new Promise((resolve, reject) => {
    ffmpeg(clipPath)
      .complexFilter([
        "[0:v]crop=ih*(9/16):ih[cropped]",
        "[cropped]scale=1080:1920[scaled]"
      ])
      .outputOptions([
        '-map [scaled]',
        '-map 0:a',
        '-c:v libx264',
        '-preset fast',
        '-crf 20',
        '-c:a copy'
      ])
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });

  return { jobId, enhancedClipPath: outputPath, segment, clipIndex, totalClips };
}
