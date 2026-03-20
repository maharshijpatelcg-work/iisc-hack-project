import React from 'react';
import './HeroSection.css';
import { Play, ArrowRight, FileText, Briefcase, Zap, Map, CheckCircle2, XCircle } from 'lucide-react';

const HeroSection = ({ onGetStartedClick, onGetDemoClick }) => {
  // Fallback scroll function if props are missing
  const scrollToDemo = () => {
    const demosection = document.getElementById('demo-section');
    if (demosection) {
      demosection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section">
      {/* Background Elements */}
      <div className="hero-background">
        <div className="gradient-mesh"></div>
        <div className="grid-overlay"></div>
        <div className="floating-particles">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}></div>
          ))}
        </div>
      </div>

      <div className="hero-container">
        {/* LEFT COLUMN: Content */}
        <div className="hero-content">
          <div className="startup-badge">
            <span className="badge-dot"></span> AI ADAPTIVE ENGINE
          </div>
          
          <h1 className="hero-headline">
            Turn Every Hire Into a <br/>
            <span className="text-gradient">Personalized Success Story</span>
          </h1>
          
          <p className="hero-subtext">
            Analyze resumes, match job requirements, detect skill gaps, and generate personalized onboarding roadmaps powered by AI.
          </p>
          
          <div className="hero-cta-group">
            <button className="btn-primary cta-glow" onClick={onGetStartedClick || scrollToDemo}>
              Get Started <ArrowRight size={20} />
            </button>
            <button className="btn-secondary" onClick={onGetDemoClick || scrollToDemo}>
              <Play fill="currentColor" size={16} /> See Demo
            </button>
          </div>

          <div className="feature-chips">
            <div className="chip"><FileText size={16} color="#c084fc"/> Resume Analysis</div>
            <div className="chip"><Zap size={16} color="#818cf8"/> Skill Gap Detection</div>
            <div className="chip"><Map size={16} color="#34d399"/> Personalized Learning</div>
            <div className="chip"><Briefcase size={16} color="#f472b6"/> AI Onboarding Automation</div>
          </div>
        </div>

        {/* RIGHT COLUMN: Cinematic Animation */}
        <div className="hero-visual">
          <div className="glass-backdrop"></div>
          
          <div className="visualization-container">
            
            {/* Step 1: Resume Input */}
            <div className="anim-card input-resume">
              <div className="glass-panel">
                <div className="panel-header">
                  <FileText className="panel-icon blue-glow" size={24} />
                  <span>Resume.pdf</span>
                </div>
                <div className="panel-body">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            </div>

            {/* Step 2: Job Desc Input */}
            <div className="anim-card input-job">
              <div className="glass-panel">
                <div className="panel-header">
                  <Briefcase className="panel-icon purple-glow" size={24} />
                  <span>Job_Requirements</span>
                </div>
                <div className="panel-body">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            </div>

            {/* Step 4: Connecting Streams */}
            <div className="connection-streams">
              <svg className="stream-svg" viewBox="0 0 200 200" preserveAspectRatio="none">
                <path d="M 0,20 C 100,20 100,100 200,100" className="stream-path stream-left" />
                <path d="M 0,180 C 100,180 100,100 200,100" className="stream-path stream-right" />
              </svg>
            </div>

            {/* Step 3: AI Engine Core */}
            <div className="ai-core-container">
              <div className="ai-core">
                <div className="core-inner">
                   <Zap size={36} color="#fff" />
                </div>
                <div className="core-ring ring-1"></div>
                <div className="core-ring ring-2"></div>
                <div className="core-ring ring-3"></div>
              </div>
              <div className="core-label">AI PROCESSING ENGINE</div>
            </div>

            {/* Step 5: Skill Gap Nodes */}
            <div className="skill-nodes-container">
              <div className="skill-node match-node">
                <CheckCircle2 size={16} /> Frontend Dev
              </div>
              <div className="skill-node match-node delay-1">
                <CheckCircle2 size={16} /> React JS
              </div>
              <div className="skill-node gap-node delay-2">
                <XCircle size={16} /> System Design
              </div>
            </div>

            {/* Step 6: Roadmap UI */}
            <div className="roadmap-ui">
              <div className="glass-panel roadmap-panel">
                <div className="roadmap-header">
                  <Map size={18} /> Personalized Roadmap
                </div>
                <div className="roadmap-steps">
                  <div className="step-item active">
                    <div className="step-dot"></div>
                    <div className="step-text">Week 1: Architecture</div>
                  </div>
                  <div className="step-line active"></div>
                  <div className="step-item">
                    <div className="step-dot"></div>
                    <div className="step-text">Week 2: System Design</div>
                  </div>
                  <div className="step-line"></div>
                  <div className="step-item">
                    <div className="step-dot"></div>
                    <div className="step-text">Week 3: Integration</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating UI Badges */}
            <div className="floating-badge badge-1">
              <strong>78%</strong> Skill Match
            </div>
            <div className="floating-badge badge-2">
              Missing: <strong>Cloud Exp</strong>
            </div>
            <div className="floating-badge badge-3">
              Onboarding <strong>40%</strong>
            </div>

          </div>
        </div>
      </div>
      
      {/* Cinematic bottom fade */}
      <div className="hero-fade-bottom"></div>
    </section>
  );
};

export default HeroSection;
