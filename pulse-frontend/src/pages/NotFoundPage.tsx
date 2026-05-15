import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F4] dark:bg-[#0F1115] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Animated 404 text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          <h1 className="font-heading text-[120px] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] to-[#FF6B6B] select-none opacity-20">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-heading text-3xl font-bold text-[#111] dark:text-white">
              Page not found
            </span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[#5E5E5E] dark:text-gray-400 mb-10 leading-relaxed text-balance"
        >
          The page you're looking for doesn't exist or has been moved. 
          If you followed a poll link, it may have been deleted.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            icon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>
          <Link to="/" className="w-full sm:w-auto">
            <Button
              icon={<Home className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
