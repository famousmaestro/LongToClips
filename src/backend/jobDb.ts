export type JobStatus = 'pending' | 'downloading' | 'analyzing' | 'cutting' | 'completed' | 'failed';

export interface Clip {
  id: string;
  url: string;
  title: string;
  score: number;
  explanation: string;
  duration: number;
}

export interface Job {
  id: string;
  sourceUrl: string;
  status: JobStatus;
  progress: number;
  message?: string;
  clips?: Clip[];
  createdAt: number;
  updatedAt: number;
}

const jobs = new Map<string, Job>();

export function createJob(id: string, sourceUrl: string): Job {
  const job: Job = {
    id,
    sourceUrl,
    status: 'pending',
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<Job>) {
  const job = jobs.get(id);
  if (job) {
    Object.assign(job, updates, { updatedAt: Date.now() });
  }
}

export function getAllJobs(): Job[] {
  return Array.from(jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
}
