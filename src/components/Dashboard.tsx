import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Video, AlertCircle, CheckCircle, ChevronRight, Play } from 'lucide-react';
import type { Job } from '../types';

interface Props {
  onSelectJob: (id: string) => void;
}

export default function Dashboard({ onSelectJob }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />;
      default: return <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />;
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Your Projects</h2>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/20 rounded-3xl border border-gray-800 border-dashed">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No projects yet. Create your first clip above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className="bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/80 transition-colors p-6 rounded-2xl cursor-pointer flex items-center gap-6"
            >
              <div className="w-32 h-20 bg-gray-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative group">
                  <Play className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate truncate max-w-md" title={job.sourceUrl}>
                  {job.sourceUrl}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5 capitalize">
                    {getStatusIcon(job.status)}
                    {job.status}
                  </span>
                  <span>•</span>
                  <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  {job.clips && (
                    <>
                      <span>•</span>
                      <span className="text-purple-400">{job.clips.length} Clips ready</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="shrink-0 text-gray-500">
                <ChevronRight className="w-6 h-6" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Ensure Loader2 is defined properly if not imported at top
import { Loader2 } from 'lucide-react';
