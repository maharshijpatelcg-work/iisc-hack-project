import React from 'react';
import { ArrowLeft, Crown, Zap, BookOpen, Star, CheckCircle2, Award, Brain, Target, Compass } from 'lucide-react';
import './PremiumPage.css';

const PremiumPage = ({ type, onBack }) => {
  // Define content variations based on the type passed
  const isQuizzes = type === 'quizzes';

  const content = isQuizzes ? {
    badge: "PREMIUM AI QUIZZES",
    badgeIcon: <Brain size={20} className="crown-icon" />,
    heading: "Master Interviews with",
    gradientText: "Adaptive Quizzes",
    subtext: "Test your knowledge dynamically. Our AI identifies your weaknesses and generates targeted quizzes to strengthen your conceptual grasp before the real interview.",
    features: [
      {
        iconWrapper: "gold-glow",
        icon: <Zap size={28} />,
        title: "Infinite Mock Quizzes",
        desc: "Practice with an endless supply of questions dynamically generated based on the specific role and company.",
        benefits: ["Real-time difficulty scaling", "Company-specific question banks"]
      },
      {
        iconWrapper: "green-glow",
        icon: <Star size={28} />,
        title: "Detailed Explanations",
        desc: "Don't just get grades; get insights. Every incorrect answer provides a deep dive explanation into why and how to improve.",
        benefits: ["Line-by-line code breakdowns", "System architecture diagrams"]
      },
      {
        iconWrapper: "purple-glow",
        icon: <Target size={28} />,
        title: "Weakness Targeting",
        desc: "The AI tracks your incorrect answers over time, forcing you to practice the exact areas where you struggle the most.",
        benefits: ["Historical performance tracking", "Personalized study goals"]
      }
    ],
    pricing: {
      title: "Quiz Mastery Tier",
      price: "9",
      desc: "Perfect for testing your knowledge before the big day.",
      buttonText: "Unlock Premium Quizzes",
      benefits: [
        "Unlimited AI Quizzes",
        "Company-specific Question Banks",
        "Historical Progress Tracking",
        "Export Results to PDF"
      ]
    }
  } : {
    badge: "LEARNING PATHS PRO",
    badgeIcon: <Compass size={20} className="crown-icon" />,
    heading: "Your Personalized Highway to",
    gradientText: "Career Success",
    subtext: "Stop guessing what to learn. Access hyper-focused study guides created by parsing thousands of top-tier job descriptions to match your dream role.",
    features: [
      {
        iconWrapper: "purple-glow",
        icon: <BookOpen size={28} />,
        title: "Deep-Dive Roadmaps",
        desc: "Get week-by-week actionable plans tailored to bridge your exact skill gaps efficiently.",
        benefits: ["Curated video references", "Step-by-step project guides"]
      },
      {
        iconWrapper: "gold-glow",
        icon: <Award size={28} />,
        title: "Industry Project Portfolio",
        desc: "Learn by doing. Our AI assigns you micro-projects that mimic real tasks at companies like Google and Amazon.",
        benefits: ["Real-world data handling", "Scalable architecture tasks"]
      },
      {
        iconWrapper: "green-glow",
        icon: <CheckCircle2 size={28} />,
        title: "1-on-1 AI Mentorship",
        desc: "Get stuck? Talk to our 24/7 AI mentor trained on senior engineering standards and best practices.",
        benefits: ["Code review assistance", "System design feedback"]
      }
    ],
    pricing: {
      title: "Paths Pro Tier",
      price: "19",
      desc: "The ultimate toolkit to land your dream role.",
      buttonText: "Upgrade to Learning Paths Pro",
      benefits: [
        "Unlimited Roadmap Generations",
        "Curated Project Assignments",
        "24/7 AI Mentorship Chat",
        "Priority Email Support"
      ]
    }
  };

  return (
    <div className="premium-page-container">
      {/* Background Elements */}
      <div className="premium-background">
        <div className="gradient-mesh premium"></div>
        <div className="grid-overlay"></div>
      </div>

      <header className="premium-header-nav">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
      </header>

      <main className="premium-main">
        <div className="premium-hero">
          <div className="premium-badge-large">
            {content.badgeIcon} {content.badge}
          </div>
          <h1 className="hero-headline">
            {content.heading} <br />
            <span className="text-gradient-gold">{content.gradientText}</span>
          </h1>
          <p className="hero-subtext">
            {content.subtext}
          </p>
        </div>

        <div className="premium-features-grid">
          {content.features.map((feature, idx) => (
            <div className="feature-card glass-panel-premium" key={idx}>
              <div className={`feature-icon-wrapper ${feature.iconWrapper}`}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <ul className="feature-list">
                {feature.benefits.map((benefit, i) => (
                  <li key={i}><CheckCircle2 size={16} className="text-gold" /> {benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pricing-section glass-panel">
           <div className="pricing-left">
             <div className="pricing-content">
               <div className="pricing-header">
                 <h2>{content.pricing.title}</h2>
                 <div className="price-tag">
                   <span className="currency">$</span>
                   <span className="amount">{content.pricing.price}</span>
                   <span className="period">/mo</span>
                 </div>
               </div>
               <p className="pricing-desc">{content.pricing.desc}</p>
               <button className="btn-primary cta-glow premium-cta">
                 {content.pricing.buttonText}
               </button>
             </div>
             
             <div className="pricing-qr">
               <div className="qr-wrapper">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Payment+for+${encodeURIComponent(content.pricing.title)}+-+$${content.pricing.price}&margin=0`} alt="Scan to Pay QR" />
               </div>
               <span className="qr-text">Scan to Pay</span>
             </div>
           </div>
           
           <div className="pricing-benefits">
             {content.pricing.benefits.map((benefit, idx) => (
               <div className="benefit-item" key={idx}>
                 <Award size={20} className="text-gold" /> {benefit}
               </div>
             ))}
           </div>
        </div>

      </main>
    </div>
  );
};

export default PremiumPage;
