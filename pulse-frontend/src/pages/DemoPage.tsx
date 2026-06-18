import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, BarChart3, Share2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const highlights = [
  {
    icon: Zap,
    color: 'var(--accent)',
    title: 'Build in seconds',
    body: 'Multi-question polls with expiry, access control, and instant sharing.',
  },
  {
    icon: BarChart3,
    color: 'var(--accent)',
    title: 'Live analytics',
    body: 'Watch votes arrive in real-time with animated charts and counters.',
  },
  {
    icon: Share2,
    color: 'var(--accent)',
    title: 'Publish results',
    body: 'Share a beautiful public results page with anyone — no login needed.',
  },
];

export default function DemoPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col"
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="max-w-4xl mx-auto px-6 py-10 md:py-14 pb-20 w-full"
      >
        {/* Video embed */}
        <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 dark:ring-white/10 bg-black">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="aspect-video w-full"
          >
            <iframe
              src="https://www.youtube.com/embed/NNQ5FWcaKWA?rel=0&modestbranding=1&color=white"
              title="Pulse Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10"
        >
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="card p-5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${item.color}18` }}
              >
                <item.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold text-text-heading dark:text-text-dark-h mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-text-muted dark:text-text-dark leading-relaxed">
                {item.body}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mt-16 text-center"
        >
          <p className="font-heading text-2xl font-semibold text-text-heading dark:text-text-dark-h mb-6">
            Ready to run your own poll?
          </p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/login">
              <Button size="lg">
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="secondary">
                Back to Home
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
