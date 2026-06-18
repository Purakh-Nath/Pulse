import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {Zap,BarChart3,Users,Share2,ArrowRight,Star,Globe,} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { useAuthStore } from '@/stores/authStore';

const features = [
  {
    icon: Zap,
    title: 'Instant Poll Creation',
    description:
      'Build beautiful, multi-question polls in seconds. Add options, set expiry, and go live immediately.',
    color: 'var(--accent)',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    description:
      'Watch responses flow in real-time. Animated charts and live counters tell the story as it unfolds.',
    color: 'var(--accent)',
  },
  {
    icon: Users,
    title: 'Collaborative Participation',
    description:
      'See who\'s active in real-time. Share polls with a link — no account required to respond.',
    color: 'var(--accent)',
  },
  {
    icon: Share2,
    title: 'Publish & Share Results',
    description:
      'Publish final results publicly. Share beautiful result pages that anyone can view.',
    color: 'var(--accent)',
  },
];

const testimonials = [
  {
    quote:
      'Pulse completely changed how we run our team retros. The live results are mesmerizing.',
    name: 'Sarah Chen',
    role: 'Engineering Lead',
    initials: 'SC',
    color: 'var(--accent)',
  },
  {
    quote:
      'We use Pulse for every product decision now. Real-time data, beautiful design.',
    name: 'Marcus Rivera',
    role: 'Product Manager',
    initials: 'MR',
    color: 'var(--accent)',
  },
  {
    quote:
      "The poll builder is genuinely fun to use. Typeform-level UX but more powerful.",
    name: 'Priya Nair',
    role: 'UX Designer',
    initials: 'PN',
    color: 'var(--accent)',
  },
];

const stats = [
  { value: 48200, label: 'Polls Created', suffix: '+' },
  { value: 2100000, label: 'Responses Collected', suffix: '+' },
  { value: 12400, label: 'Active Users', suffix: '+' },
];

// Floating poll card data
const floatingCards = [
  {
    title: 'Best team collaboration tool?',
    options: [
      { label: 'Slack', pct: 48 },
      { label: 'Notion', pct: 31 },
      { label: 'Linear', pct: 21 },
    ],
    responses: 847,
    color: 'var(--accent)',
    angle: -6,
    x: '-5%',
    y: '10%',
  },
  {
    title: 'Preferred programming language?',
    options: [
      { label: 'TypeScript', pct: 62 },
      { label: 'Python', pct: 24 },
      { label: 'Rust', pct: 14 },
    ],
    responses: 2134,
    color: 'var(--accent)',
    angle: 4,
    x: '55%',
    y: '5%',
  },
];

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border dark:border-border-dark bg-bg/80 dark:bg-bg-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-heading font-extrabold text-3xl tracking-tighter text-text-heading dark:text-text-dark-h">
              Pulse
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm">
                  Go to Dashboard
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-text-muted dark:text-text-dark hover:text-text-heading dark:hover:text-text-dark-h transition-colors"
                >
                  Sign in
                </Link>
                <Link to="/login">
                  <Button size="sm">
                    Get Started Free
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center pt-16 overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full"
        >
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-accent-bg border border-accent-border rounded-full px-4 py-1.5 mb-8"
            >
              <LiveBadge variant="purple" label="REALTIME" />
              <span className="text-sm font-medium text-accent">
                Collaborative polling platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="font-heading text-6xl md:text-7xl lg:text-8xl font-bold text-text-heading dark:text-text-dark-h leading-[0.95] tracking-tight mb-6"
            >
              Polls that
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-hover">
                feel alive.
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-xl text-text-muted dark:text-text-dark max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Create polls, collect realtime responses, and watch live analytics
              unfold. Built for teams, communities, and creators who want their
              data to tell a story.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
            >
<Link to={isAuthenticated ? '/dashboard' : '/login'}>
  <Button size="xl" className="w-full sm:w-auto">
    {isAuthenticated ? 'Go to Dashboard' : 'Start for free'}
    <ArrowRight className="w-5 h-5" />
  </Button>
</Link>

              <Link to="/poll/demo" target="_blank">
                <Button size="xl" variant="secondary" className="w-full sm:w-auto">
                  See a live poll
                  <Globe className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16"
            >
              {stats.map(({ value, label, suffix }) => (
                <div key={label} className="text-center">
                  <div className="font-heading text-3xl font-bold text-text-heading dark:text-text-dark-h">
                    <AnimatedCounter value={value} suffix={suffix} formatFn={(n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}k` : n.toString()} />
                  </div>
                  <div className="text-xs text-text-muted dark:text-text-dark mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Floating cards */}
          <div className="relative mt-20 h-80 hidden lg:block">
            {floatingCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.15, type: 'spring', stiffness: 150, damping: 20 }}
                style={{
                  position: 'absolute',
                  left: card.x,
                  top: card.y,
                  rotate: card.angle,
                }}
                whileHover={{ scale: 1.03, rotate: 0, zIndex: 10 }}
                className="w-72 card p-5 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading text-sm font-semibold text-text-heading dark:text-text-dark-h line-clamp-1">
                    {card.title}
                  </span>
                  <LiveBadge />
                </div>
                <div className="space-y-2.5">
                  {card.options.map(({ label, pct }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-text-muted dark:text-text-dark mb-1">
                        <span>{label}</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: card.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 1.2 + i * 0.2, duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-text-muted">
                  <Users className="w-3 h-3" />
                  <AnimatedCounter value={card.responses} /> responses
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-32 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="font-heading text-5xl font-bold text-text-heading dark:text-text-dark-h mb-4">
            Everything you need.
            <br />
            <span className="text-text-muted dark:text-text-dark font-normal">
              Nothing you don't.
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="card p-8"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${feature.color}18` }}
              >
                <feature.icon
                  className="w-6 h-6 text-accent"
                />
              </div>
              <h3 className="font-heading text-xl font-semibold text-text-heading dark:text-text-dark-h mb-2">
                {feature.title}
              </h3>
              <p className="text-text-muted dark:text-text-dark leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-bg dark:bg-bg-dark">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl font-bold text-text-heading dark:text-text-dark-h mb-3">
              Loved by teams everywhere
            </h2>
            <div className="flex items-center justify-center gap-1 text-warning">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <p className="text-text-heading dark:text-text-dark-h text-sm leading-relaxed mb-5">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-heading dark:text-text-dark-h">
                      {t.name}
                    </div>
                    <div className="text-xs text-text-muted dark:text-text-dark">
                      {t.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-accent to-accent-hover rounded-3xl p-16 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="font-heading text-5xl font-bold text-white mb-4">
              Ready to feel the Pulse?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-md mx-auto">
              Join thousands of teams creating polls that matter. No credit card required.
            </p>
            <Link to={isAuthenticated ? '/dashboard' : '/login'}>
              <Button
                size="xl"
                className="bg-white text-accent hover:bg-white/90 shadow-md text-text-heading"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start for free'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border dark:border-border-dark py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-heading font-extrabold text-lg tracking-tight text-text-heading dark:text-text-dark-h">
              Pulse
            </span>
          </div>
          <p className="text-xs text-text-muted dark:text-text-dark">
            © 2026 Pulse Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
