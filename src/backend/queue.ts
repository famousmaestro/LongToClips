import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import PQueue from 'p-queue';

import { processDownload } from './workers/downloadWorker.js';
import { processTranscription } from './workers/transcriptionWorker.js';
import { processSegmentation } from './workers/segmentationWorker.js';
import { processClipGeneration } from './workers/clipGenerationWorker.js';
import { processEnhancement } from './workers/enhancementWorker.js';
import { processExport } from './workers/exportWorker.js';
import * as jobDb from './jobDb.js';

const DRIVER = process.env.QUEUE_DRIVER || 'memory';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const localMemoryQueues: Record<string, PQueue> = {};

function getLocalQueue(name: string, concurrency: number = 1) {
    if (!localMemoryQueues[name]) {
        localMemoryQueues[name] = new PQueue({ concurrency }); // default concurrency 1 per phase locally
    }
    return localMemoryQueues[name];
}

class QueueManager {
    private bullQueues: Record<string, Queue> = {};
    private connection?: IORedis;

    constructor() {
        if (DRIVER === 'redis') {
            this.connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
            
            // Handle error silently if redis isn't running so it doesn't crash entirely if user accidentally sets DRIVER=redis
            this.connection.on('error', (err) => {
                console.error('Redis connection issue in BullMQ wrapper:', err);
            });
        }
    }

    createQueueAndWorker(name: string, processor: (job: any) => Promise<any>, onSuccess?: (result: any) => Promise<void>) {
        if (DRIVER === 'redis' && this.connection) {
            const queue = new Queue(name, { 
                connection: this.connection as any,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 }
                }
            });
            this.bullQueues[name] = queue;

            const worker = new Worker(name, processor, { connection: this.connection as any });
            if (onSuccess) {
                worker.on('completed', async (job, result) => {
                    await onSuccess(result);
                });
            }
            worker.on('failed', (job, err) => {
                if (job) {
                   console.error(`[Worker ${name}] Job failed:`, err);
                   jobDb.updateJob(job.data.jobId, { status: 'failed', message: `Error in ${name}: ${err.message}` });
                }
            });
            return {
                add: (jobName: string, data: any) => queue.add(jobName, data)
            };
        } else {
            // Memory Fallback
            const pQueue = getLocalQueue(name, 1);
            return {
                add: async (jobName: string, data: any) => {
                    pQueue.add(async () => {
                        try {
                            const mockJobWrapper = { id: Math.random().toString(), name: jobName, data };
                            const result = await processor(mockJobWrapper);
                            if (onSuccess) {
                                await onSuccess(result);
                            }
                        } catch (err: any) {
                            console.error(`[Mock Worker ${name}] failed:`, err);
                            jobDb.updateJob(data.jobId, { status: 'failed', message: `Error in ${name}: ${err.message}` });
                        }
                    });
                }
            }
        }
    }
}

export const queueManager = new QueueManager();

const exportQ = queueManager.createQueueAndWorker('export', processExport);
const enhanceQ = queueManager.createQueueAndWorker('enhancement', processEnhancement, async (res) => {
    await exportQ.add('exportJob', res);
});
const clipGenQ = queueManager.createQueueAndWorker('clip-generation', processClipGeneration, async (res) => {
    await enhanceQ.add('enhanceJob', res);
});
const segmentQ = queueManager.createQueueAndWorker('segmentation', processSegmentation, async (res) => {
    const { segments, videoPath, transcriptPath, jobId } = res;
    if (segments.length === 0) {
        jobDb.updateJob(jobId, { status: 'failed', message: 'AI found no suitable clips.' });
        return;
    }
    for (let i = 0; i < segments.length; i++) {
        await clipGenQ.add('clipGenJob', {
            jobId,
            videoPath,
            segment: segments[i],
            clipIndex: i,
            totalClips: segments.length
        });
    }
});
const transcribeQ = queueManager.createQueueAndWorker('transcription', processTranscription, async (res) => {
    await segmentQ.add('segmentJob', res);
});
const downloadQ = queueManager.createQueueAndWorker('download', processDownload, async (res) => {
    await transcribeQ.add('transcribeJob', res);
});

export async function addJobToQueue(jobId: string, url: string) {
    await downloadQ.add('downloadVideo', { jobId, url });
}
