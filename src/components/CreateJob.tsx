import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Upload, ArrowRight, Loader2 } from 'lucide-react';

interface Props {
  onJobCreated: (jobId: string) => void;
}

export default function CreateJob({ onJobCreated }: Props) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create job');
      
      onJobCreated(data.jobId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold font-sans tracking-tight text-white mb-6">
          One Long Video.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Ten Viral Shorts.
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Drop a YouTube link, and our AI will find the most engaging hooks, reframe to vertical, and add captions automatically.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 p-6 rounded-3xl shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Youtube className="w-6 h-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube Link (e.g. https://youtube.com/watch?v=...)"
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-medium py-4 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing</>
            ) : (
              <>Generate Clips <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
        {error && (
          <p className="text-red-400 text-sm mt-4 px-2">{error}</p>
        )}
      </motion.div>
      
      <div className="mt-16 text-center text-sm font-mono text-gray-500">
        <p>Supported platforms for MVP: YouTube.</p>
        <p>File upload coming soon for paying subscribers.</p>
      </div>
    </div>
  );
}
