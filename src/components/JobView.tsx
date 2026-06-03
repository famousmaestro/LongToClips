import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Share2, Sparkles, AlertTriangle } from 'lucide-react';
import type { Job, Clip } from '../types';
import { Loader2 } from 'lucide-react';

interface Props {
  jobId: string;
  onBack: () => void;
}

export default function JobView({ jobId, onBack }: Props) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        setJob(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchJob();
    const interval = setInterval(() => {
      if (job?.status !== 'completed' && job?.status !== 'failed') {
        fetchJob();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  if (!job) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;
  }

  const isProcessing = ['pending', 'downloading', 'analyzing', 'cutting'].includes(job.status);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white mb-2 truncate" title={job.sourceUrl}>
          Project: {job.sourceUrl}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="capitalize">{job.status}</span>
          <span>•</span>
          <span>{new Date(job.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {isProcessing && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-3xl p-12 text-center max-w-2xl mx-auto">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">AI is working its magic</h3>
          <p className="text-gray-400 mb-8">{job.message || 'Processing video...'}</p>
          
          <div className="w-full bg-gray-900 rounded-full h-3 mb-2 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3"
              initial={{ width: 0 }}
              animate={{ width: `${job.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-right text-sm font-mono text-gray-500">{job.progress}%</div>
        </div>
      )}

      {job.status === 'failed' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12 text-center max-w-2xl mx-auto">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Processing Failed</h3>
          <p className="text-red-400">{job.message}</p>
        </div>
      )}

      {job.status === 'completed' && job.clips && (
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" /> Viral Clips Generated
            </h2>
            <div className="text-sm font-mono text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
              {job.clips.length} results
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {job.clips.map((clip, i) => (
              <ClipCard key={clip.id} clip={clip} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClipCard({ clip, index }: { clip: Clip, index: number, key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-colors"
    >
      <div className="aspect-[9/16] bg-black relative">
        <video 
          src={clip.url}
          controls
          className="w-full h-full object-cover"
          poster="/placeholder-vertical.jpg"
          preload="metadata"
        />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Score: {clip.score}/100
        </div>
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white border border-white/10">
          {clip.duration}s
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{clip.title}</h3>
        <p className="text-sm text-gray-400 mb-6 line-clamp-3">{clip.explanation}</p>
        
        <div className="flex gap-3">
          <button className="flex-1 bg-white hover:bg-gray-100 text-black py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> Download
          </button>
          <button className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-white transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
