// import { Outlet } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { Zap } from 'lucide-react';

// export function AuthLayout() {
//   return (
//     <div className="min-h-screen bg-[#F7F7F4] dark:bg-[#0F1115] flex">
//       {/* Left — branding */}
//       <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-[#6C63FF] to-[#FF6B6B] p-12 relative overflow-hidden">
//         {/* Noise texture */}
//         <div className="absolute inset-0 opacity-[0.03]" style={{
//           backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
//         }} />
        
//         {/* Floating orbs */}
//         <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
//         <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-black/10 rounded-full blur-3xl" />

//         <div className="relative z-10">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
//               <Zap className="w-5 h-5 text-white" />
//             </div>
//             <span className="font-heading font-bold text-2xl text-white">Pulse</span>
//           </div>
//         </div>

//         <div className="relative z-10 space-y-6">
//           <motion.h1
//             initial={{ opacity: 0, y: 24 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2, duration: 0.6 }}
//             className="font-heading text-5xl font-bold text-white leading-tight"
//           >
//             The future of
//             <br />
//             collaborative
//             <br />
//             polling.
//           </motion.h1>
//           <motion.p
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.6 }}
//             className="text-white/70 text-lg max-w-xs leading-relaxed"
//           >
//             Create polls, gather responses in realtime, and share live
//             analytics — all in one place.
//           </motion.p>

//           {/* Fake poll card */}
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ delay: 0.6, duration: 0.6 }}
//             className="bg-white/15 backdrop-blur-xl rounded-2xl p-5 border border-white/20 max-w-xs"
//           >
//             <p className="text-white font-medium mb-3 text-sm">
//               What's your preferred work style?
//             </p>
//             {[
//               { label: 'Remote first', pct: 72 },
//               { label: 'Hybrid model', pct: 21 },
//               { label: 'In-office', pct: 7 },
//             ].map(({ label, pct }) => (
//               <div key={label} className="mb-2.5 last:mb-0">
//                 <div className="flex justify-between text-xs text-white/70 mb-1">
//                   <span>{label}</span>
//                   <span>{pct}%</span>
//                 </div>
//                 <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
//                   <motion.div
//                     className="h-full bg-white rounded-full"
//                     initial={{ width: 0 }}
//                     animate={{ width: `${pct}%` }}
//                     transition={{ delay: 0.8 + pct * 0.005, duration: 0.8, ease: 'easeOut' }}
//                   />
//                 </div>
//               </div>
//             ))}
//           </motion.div>
//         </div>

//         <div className="relative z-10 text-white/50 text-xs">
//           © 2026 Pulse Platform. All rights reserved.
//         </div>
//       </div>

//       {/* Right — auth form */}
//       <div className="flex-1 flex items-center justify-center p-6">
//         <motion.div
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.5 }}
//           className="w-full max-w-sm"
//         >
//           {/* Mobile logo */}
//           <div className="lg:hidden flex items-center gap-2 mb-10">
//             <div className="w-8 h-8 bg-gradient-to-br from-[#6C63FF] to-[#FF6B6B] rounded-xl flex items-center justify-center">
//               <Zap className="w-4 h-4 text-white" />
//             </div>
//             <span className="font-heading font-bold text-xl text-[#111] dark:text-white">Pulse</span>
//           </div>
//           <Outlet />
//         </motion.div>
//       </div>
//     </div>
//   );
// }






import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex" style={{ background: '#080B12', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        .aurora-orb-1 {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 70%);
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
          background: radial-gradient(circle, rgba(236,72,153,0.28) 0%, rgba(236,72,153,0) 70%);
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
          background: radial-gradient(circle, rgba(34,211,238,0.2) 0%, rgba(34,211,238,0) 70%);
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
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          backdrop-filter: blur(20px);
        }

        .poll-bar-bg {
          background: rgba(255,255,255,0.07);
        }
        .poll-bar-fill {
          background: linear-gradient(90deg, #6366f1, #ec4899);
        }

        .stat-badge {
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.05em;
        }

        .logo-ring {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          border-radius: 14px;
          padding: 1px;
        }
        .logo-inner {
          background: #080B12;
          border-radius: 13px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-icon {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }

        .right-panel {
          background: #0C0F18;
          border-left: 1px solid rgba(255,255,255,0.05);
        }

        .headline {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 52px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #fff;
        }
        .headline span {
          background: linear-gradient(135deg, #818cf8, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* LEFT — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden" style={{ background: '#080B12' }}>
        <div className="aurora-orb-1" />
        <div className="aurora-orb-2" />
        <div className="aurora-orb-3" />
        <div className="grain" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="logo-ring">
            <div className="logo-inner">
              <Zap size={18} style={{ color: '#818cf8' }} />
            </div>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.02em' }}>Pulse</span>
          <span className="stat-badge" style={{ marginLeft: 8 }}>BETA</span>
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
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, maxWidth: 320, fontFamily: "'DM Sans', sans-serif" }}
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
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>What's your preferred work style?</p>
              <span className="stat-badge">Live</span>
            </div>
            <div className="divider-line mb-4" />
            {[
              { label: 'Remote first', pct: 72 },
              { label: 'Hybrid model', pct: 21 },
              { label: 'In-office', pct: 7 },
            ].map(({ label, pct }, i) => (
              <div key={label} className="mb-3 last:mb-0">
                <div className="flex justify-between mb-1" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  <span>{label}</span>
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{pct}%</span>
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
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>247 responses · Updates every 3s</p>
          </motion.div>
        </div>

        <div className="relative z-10" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
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
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="logo-ring">
              <div className="logo-inner" style={{ width: 32, height: 32, borderRadius: 10 }}>
                <Zap size={14} style={{ color: '#818cf8' }} />
              </div>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff' }}>Pulse</span>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}