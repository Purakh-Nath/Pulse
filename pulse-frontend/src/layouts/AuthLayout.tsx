import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-bg-dark font-body text-text-dark">
      <style>{`
        .aurora-orb-1 {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232, 82, 10, 0.15) 0%, rgba(232, 82, 10, 0) 70%);
          top: -80px;
          left: -120px;
          filter: blur(40px);
          animation: drift1 12s ease-in-out infinite alternate;
        }
        .aurora-orb-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232, 82, 10, 0.1) 0%, rgba(232, 82, 10, 0) 70%);
          bottom: 60px;
          right: -60px;
          filter: blur(50px);
          animation: drift2 15s ease-in-out infinite alternate;
        }
        .aurora-orb-3 {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232, 82, 10, 0.08) 0%, rgba(232, 82, 10, 0) 70%);
          bottom: 200px;
          left: 120px;
          filter: blur(40px);
          animation: drift3 10s ease-in-out infinite alternate;
        }
        @keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px, 30px) scale(1.1); } }
        @keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px, -40px) scale(1.15); } }
        @keyframes drift3 { from { transform: translate(0,0); } to { transform: translate(30px, -20px); } }

        .grain {
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        .glass-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          backdrop-filter: blur(20px);
        }

        .poll-bar-bg {
          background: rgba(255,255,255,0.05);
        }
        .poll-bar-fill {
          background: var(--accent);
        }

        .stat-badge {
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          color: var(--accent);
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.05em;
        }

        .divider-line {
          height: 1px;
          background: var(--border);
        }

        .right-panel {
          background: var(--bg-2);
          border-left: 1px solid var(--border);
        }

        .headline {
          font-family: var(--heading);
          font-weight: 600;
          font-size: 52px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--text-h);
        }
        .headline span {
          color: var(--accent);
        }
      `}</style>

      {/* LEFT — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-bg-dark">
        <div className="aurora-orb-1" />
        <div className="aurora-orb-2" />
        <div className="aurora-orb-3" />
        <div className="grain" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="font-heading font-extrabold text-3xl tracking-tighter text-white">
            Pulse
          </span>
          <span className="stat-badge">BETA</span>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="headline">
              Polls that<br />
              <span>move fast.</span><br />
              Results that<br />stick.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-text-muted text-[15px] leading-relaxed max-w-[320px]"
          >
            Real-time responses. Live analytics. Built for teams who move at the speed of ideas.
          </motion.p>

          {/* Poll Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-2xl p-5 max-w-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-text-dark-h text-[13px] font-medium">What's your preferred work style?</p>
              <span className="stat-badge">Live</span>
            </div>
            <div className="divider-line mb-4" />
            {[
              { label: 'Remote first', pct: 72 },
              { label: 'Hybrid model', pct: 21 },
              { label: 'In-office', pct: 7 },
            ].map(({ label, pct }, i) => (
              <div key={label} className="mb-3 last:mb-0">
                <div className="flex justify-between mb-1 text-[12px] text-text-muted">
                  <span>{label}</span>
                  <span className="text-accent font-semibold">{pct}%</span>
                </div>
                <div className="h-1 poll-bar-bg rounded-full overflow-hidden">
                  <motion.div
                    className="h-full poll-bar-fill rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.9 + i * 0.15, duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
            <div className="divider-line mt-4 mb-3" />
            <p className="text-[11px] text-text-muted opacity-70">247 responses · Updates every 3s</p>
          </motion.div>
        </div>

        <div className="relative z-10 text-[11px] text-text-muted opacity-70">
          © 2026 Pulse Platform
        </div>
      </div>

      {/* RIGHT — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 right-panel relative">
        <div className="grain" />
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center mb-10">
            <span className="font-heading font-extrabold text-2xl tracking-tighter text-white">
              Pulse
            </span>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}