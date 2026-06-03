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
