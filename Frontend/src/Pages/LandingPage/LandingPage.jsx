import React from "react";
import { motion } from "framer-motion";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-root">
      {/* Removed custom navbar to avoid duplicate navbars */}
      <div className="landing-hero">
        <motion.div
          className="glow-bg"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        />
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Swap Skills. <span className="gradient-text">Grow Together.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            Connect. Learn. Teach. Unlock your potential with <b>SkillSwap</b>.
          </motion.p>
          <div className="hero-cta">
            <motion.a
              href="/register"
              className="cta-btn main"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
            </motion.a>
            <motion.a
              href="#how"
              className="cta-btn secondary"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.97 }}
            >
              How It Works
            </motion.a>
          </div>
        </div>
      </div>
      <div className="animated-cards">
        <motion.div className="card" whileHover={{ scale: 1.05, boxShadow: "0 0 32px #00e6ff55" }}>
          <h3>Offer a Skill</h3>
          <p>Share your expertise and help others grow.</p>
        </motion.div>
        <motion.div className="card" whileHover={{ scale: 1.05, boxShadow: "0 0 32px #7f5cff55" }}>
          <h3>Learn a Skill</h3>
          <p>Find mentors and learn something new every day.</p>
        </motion.div>
        <motion.div className="card" whileHover={{ scale: 1.05, boxShadow: "0 0 32px #00e6ff55" }}>
          <h3>Community Stories</h3>
          <p>See how SkillSwap is changing lives worldwide.</p>
        </motion.div>
      </div>
      {/* Animated floating particles */}
      <div className="animated-particles">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            animate={{
              y: [0, Math.random() * 60 + 40, 0],
              x: [0, Math.random() * 80 - 40, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: Math.random() * 6 + 4,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 70 + 10}%`,
              background: i % 2 === 0 ? "#00e6ff" : "#7f5cff",
            }}
          />
        ))}
      </div>
      <div className="landing-footer">
        &copy; 2025 SkillSwap. All rights reserved.
      </div>
    </div>
  );
};

export default LandingPage;
