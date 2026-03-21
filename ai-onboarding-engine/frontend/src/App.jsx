import { useState } from 'react';
import {
  Upload,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Target,
  Activity,
  Building2,
  Sparkles,
} from 'lucide-react';
import './App.css';
import HeroSection from './HeroSection';
import PremiumPage from './PremiumPage';

function App() {
  const [resume, setResume] = useState(null);
  const [uploadType, setUploadType] = useState('text');
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [goalRole, setGoalRole] = useState('');
  const [goalCompany, setGoalCompany] = useState('');
  const [goalSkills, setGoalSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'premium'

  // Auth States
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLinkedIn, setAuthLinkedIn] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Demo State
  const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);
  const [demoUsageCount, setDemoUsageCount] = useState(Number(localStorage.getItem('demoUsageCount')) || 0);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    // Step 1: Login or Finalize Registration
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    const payload = authMode === 'login' 
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword, fullName: authFullName, phone: authPhone, linkedIn: authLinkedIn };

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsAuthModalOpen(false);
      setAuthPassword('');
      setAuthFullName('');
      setAuthPhone('');
      setAuthLinkedIn('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setExtractedData(null);
    setResume(null);
    setJobDescriptionFile(null);
    setJobDescriptionText('');
    setResponse(null);
    setError(null);
    setIsDemoUnlocked(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleJobDescFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setJobDescriptionFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
      setError('Please upload a resume.');
      return;
    }

    if (uploadType === 'text' && !jobDescriptionText) {
      setError('Please enter job description text.');
      return;
    }

    if (uploadType === 'file' && !jobDescriptionFile) {
      setError('Please upload a job description file.');
      return;
    }

    if (!user && demoUsageCount >= 1) {
      setError('Your free demo has expired. Please sign up to generate unlimited analyses!');
      setAuthMode('register');
      setIsAuthModalOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setExtractedData(null);

    const formData = new FormData();
    formData.append('resume', resume);

    if (uploadType === 'file') {
      formData.append('jobDescription', jobDescriptionFile);
    } else {
      formData.append('jobDescriptionText', jobDescriptionText);
    }
    formData.append('goalRole', goalRole);
    formData.append('goalCompany', goalCompany);
    formData.append('goalSkills', goalSkills);

    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      const rawBody = await res.text();
      let data = {};

      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          throw new Error(`Server returned an invalid response: ${rawBody}`);
        }
      }

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      if (!data.message) {
        throw new Error('Server returned an empty response.');
      }

      if (!data.analysis) {
        throw new Error('Server did not return analysis data.');
      }

      setResponse(data.message);
      setExtractedData({
        resumeText: data.resumeText,
        jobDescriptionText: data.jobDescriptionText,
        analysis: data.analysis,
      });

      if (!user) {
        const newCount = demoUsageCount + 1;
        setDemoUsageCount(newCount);
        localStorage.setItem('demoUsageCount', newCount.toString());
      }
    } catch (err) {
      setError(err.message || 'Failed to upload files. Please make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const analysis = extractedData?.analysis;

  return (
    <>
      {!(user || isDemoUnlocked) && (
        <HeroSection 
          onGetStartedClick={() => {
            setAuthMode('register');
            setIsAuthModalOpen(true);
          }}
          onGetDemoClick={() => {
            setIsDemoUnlocked(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
      
      {(user || isDemoUnlocked) && currentView === 'dashboard' && (
        <div className="app-container" id="demo-section" style={{ marginTop: '2rem' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>AI Adaptive Onboarding Engine</h1>
            <p className="subtitle">Upload your resume, job description, and optional career goal to generate a focused onboarding plan.</p>
          </div>
          <div className="auth-controls">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{user.fullName || user.email}</span>
                <button className="tab-btn" style={{ padding: '0.4rem 0.8rem' }} onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <button 
                className="submit-btn" 
                style={{ width: 'auto', padding: '0.6rem 1.25rem' }} 
                onClick={() => setIsAuthModalOpen(true)}
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </header>

      <main className="main-content">
        <div className="card">
          <h2><Upload className="icon" /> Upload Data</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Upload Resume (PDF/DOCX)</label>
              <div className="file-input-wrapper">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <FileText size={24} color="var(--primary-color)" />
                  <span>{resume ? resume.name : 'Click to browse or drag & drop'}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Job Description Options</label>
              <div className="choice-row">
                <label className="radio-option">
                  <input type="radio" checked={uploadType === 'text'} onChange={() => setUploadType('text')} /> Text Input
                </label>
                <label className="radio-option">
                  <input type="radio" checked={uploadType === 'file'} onChange={() => setUploadType('file')} /> File Upload
                </label>
              </div>

              {uploadType === 'text' ? (
                <textarea
                  className="text-input"
                  placeholder="Paste the job requirements or description here..."
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                />
              ) : (
                <div className="file-input-wrapper">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleJobDescFileChange} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <FileText size={24} color="var(--primary-color)" />
                    <span>{jobDescriptionFile ? jobDescriptionFile.name : 'Click to browse or drag & drop'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="goal-block">
              <div className="goal-header">
                <Sparkles size={18} />
                <span>Optional Career Goal</span>
              </div>

              <div className="goal-grid">
                <div className="form-group">
                  <label>Target Role</label>
                  <input
                    className="text-field"
                    type="text"
                    placeholder="Frontend Developer, Backend Engineer, Full Stack Developer..."
                    value={goalRole}
                    onChange={(e) => setGoalRole(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Target Company</label>
                  <input
                    className="text-field"
                    type="text"
                    placeholder="Google, Microsoft, Flipkart..."
                    value={goalCompany}
                    onChange={(e) => setGoalCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Skills You Ultimately Want To Build</label>
                <textarea
                  className="text-input"
                  placeholder="Example: React, system design, AWS, backend APIs, DSA"
                  value={goalSkills}
                  onChange={(e) => setGoalSkills(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Send size={18} /> Generate Analysis
                </>
              )}
            </button>

            {error && (
              <div className="response-message error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {response && (
              <div className="response-message">
                <CheckCircle size={20} />
                <span>{response}</span>
              </div>
            )}
          </form>
        </div>

        <div className="card">
          <h2><Activity className="icon" /> Analysis Dashboard</h2>
          {extractedData ? (
            <div className="tabbed-dashboard">
              <div className="tabs-header">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`} onClick={() => setActiveTab('roadmap')}>Roadmap & Projects</button>
                <button className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`} onClick={() => setActiveTab('company')}>Company Prep</button>
                <button className={`tab-btn ${activeTab === 'deep' ? 'active' : ''}`} onClick={() => setActiveTab('deep')}>Deep Analysis</button>
              </div>

              <div className="tab-content tab-pane-fade" key={activeTab}>
                {activeTab === 'overview' && (
                  <div className="dashboard-stack">
                    <div className="summary-panel">
                      <div className="summary-title"><Building2 size={18} /> AI Executive Summary</div>
                      <p>{analysis.summary}</p>
                    </div>

                    <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="scorecard-panel" style={{ margin: 0 }}>
                        <div className="scorecard-header" style={{ marginBottom: 0, borderBottom: 'none' }}>
                          <div>
                            <div className="summary-title"><CheckCircle size={18} /> Resume Match</div>
                            <p className="scorecard-copy" style={{ fontSize: '0.8rem' }}>Based on skills, evidence, & overlap.</p>
                          </div>
                          <div className="score-badge">
                            <strong>{analysis.scorecard.total}/100</strong>
                            <span>{analysis.scorecard.band}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ats-panel" style={{ margin: 0, padding: '1.5rem' }}>
                        <div className="ats-header" style={{ margin: 0, borderBottom: 'none' }}>
                          <div>
                            <div className="summary-title"><AlertCircle size={18} /> ATS Parsing</div>
                            <p className="ats-copy" style={{ fontSize: '0.8rem' }}>Keyword density, structure, & quality.</p>
                          </div>
                          <div className="ats-badge">
                            <strong>{analysis.atsFeedback.score}/100</strong>
                            <span>{analysis.atsFeedback.band}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="insight-grid">
                      <div className="insight-card">
                        <h3><AlertCircle size={18} color="#d97706" /> Critical Skill Gaps</h3>
                        <div className="tag-list">
                          {analysis.gapSkills.length > 0 ? (
                            analysis.gapSkills.map((skill) => <span className="tag tag-gap" key={skill}>{skill}</span>)
                          ) : (
                            <span className="muted-copy">No major skill gaps detected.</span>
                          )}
                        </div>
                      </div>
                      <div className="insight-card">
                        <h3><CheckCircle size={18} /> Matched Skills</h3>
                        <div className="tag-list">
                          {analysis.matchedSkills.length > 0 ? (
                            analysis.matchedSkills.map((skill) => <span className="tag tag-success" key={skill}>{skill}</span>)
                          ) : (
                            <span className="muted-copy">No clear overlap.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'roadmap' && (
                  <div className="dashboard-stack">
                    <div className="projects-panel">
                      <div className="summary-title"><BookOpen size={18} /> Personalized Project Recommendations</div>
                      <div className="project-grid">
                        {analysis.projectRecommendations.map((project) => (
                          <div className="project-card" key={project.title}>
                            <h3>{project.title}</h3>
                            <p>{project.pitch}</p>
                            <div className="tag-list">
                              {project.stack.map((skill) => <span className="tag" key={skill}>{skill}</span>)}
                            </div>
                            <div className="project-outcome" style={{ marginTop: '0.75rem' }}>{project.outcome}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="insight-card" style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="var(--primary-color)" /> Learning Roadmap
                      </h3>
                      <div className="roadmap-list">
                        {analysis.roadmap.map((item) => (
                          <div className="roadmap-item" key={item.title}>
                            <strong>{item.title}</strong>
                            <p>{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="quiz-panel" style={{ margin: 0, cursor: 'pointer' }} onClick={() => setCurrentView('premium-quizzes')}>
                        <div className="quiz-compact">
                          <div>
                            <div className="summary-title"><Sparkles size={18} /> Premium Quizzes</div>
                          </div>
                          <div className="premium-badge">Premium</div>
                        </div>
                      </div>
                      <div className="resources-panel" style={{ margin: 0, cursor: 'pointer' }} onClick={() => setCurrentView('premium-paths')}>
                        <div className="quiz-compact">
                          <div>
                            <div className="summary-title"><BookOpen size={18} /> Learning Paths</div>
                          </div>
                          <div className="premium-badge">Premium</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'company' && (
                  <div className="company-panel" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                    <div className="company-panel-header" style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="summary-title"><Building2 size={18} /> Company-Specific Preparation</div>
                      <span className="company-name-chip" style={{ marginTop: '1rem', display: 'inline-block' }}>{analysis.companyPreparation.companyName}</span>
                      <p className="company-style-copy" style={{ marginTop: '1rem' }}>{analysis.companyPreparation.interviewStyle}</p>
                      <div className="company-focus-list" style={{ marginTop: '1rem' }}>
                        {analysis.companyPreparation.focusAreas.map((area) => <span className="tag" key={area}>{area}</span>)}
                      </div>
                    </div>
                    
                    <div className="company-columns" style={{ marginTop: '1.5rem' }}>
                      <div className="company-column" style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Preparation Checklist</h3>
                        <div className="company-list">
                          {analysis.companyPreparation.prepChecklist.map((item) => <div className="company-list-item" key={item}>{item}</div>)}
                        </div>
                      </div>
                      <div className="company-column" style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Readiness Note</h3>
                        <div className="company-note">{analysis.companyPreparation.readinessNote}</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'deep' && (
                  <div className="dashboard-stack">
                    <div className="ats-panel">
                      <div className="ats-header">
                        <div>
                          <div className="summary-title"><AlertCircle size={18} /> Detailed ATS Resume Feedback</div>
                        </div>
                      </div>
                      <div className="ats-grid">
                        <div className="ats-column">
                          <h3>Missing Keywords</h3>
                          <div className="tag-list">
                            {analysis.atsFeedback.missingKeywords.length > 0 ? (
                              analysis.atsFeedback.missingKeywords.map((skill) => <span className="tag tag-gap" key={skill}>{skill}</span>)
                            ) : <span className="muted-copy">No major ATS keyword gaps detected.</span>}
                          </div>
                        </div>
                        <div className="ats-column">
                          <h3>Strengths</h3>
                          <div className="ats-list">
                            {analysis.atsFeedback.strengths.map((item) => <div className="ats-item ats-item-good" key={item}>{item}</div>)}
                          </div>
                        </div>
                        <div className="ats-column">
                          <h3>Warnings</h3>
                          <div className="ats-list">
                            {analysis.atsFeedback.warnings.map((item) => <div className="ats-item ats-item-warn" key={item}>{item}</div>)}
                          </div>
                        </div>
                        <div className="ats-column">
                          <h3>Recommended Fixes</h3>
                          <div className="ats-list">
                            {analysis.atsFeedback.improvements.map((item) => <div className="ats-item" key={item}>{item}</div>)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="extracted-text-section">
                      <div className="text-container">
                        <div className="text-container-header"><FileText size={18} /> Resume Text</div>
                        <div className="text-container-body">{extractedData.resumeText}</div>
                      </div>
                      <div className="text-container">
                        <div className="text-container-header"><FileText size={18} /> Job Description Text</div>
                        <div className="text-container-body">{extractedData.jobDescriptionText}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="placeholder-section">
              <div className="placeholder-item">
                <h3><Sparkles size={18} /> Career Goal Support</h3>
                <p>Add an optional target role, company, and future skills. The dashboard will use that context to shape the analysis.</p>
              </div>

              <div className="placeholder-item">
                <h3><Target size={18} /> Extracted Skills</h3>
                <p>Resume skills will be detected from the uploaded text after submission.</p>
              </div>

              <div className="placeholder-item">
                <h3><BookOpen size={18} /> Learning Roadmap</h3>
                <p>Roadmap steps will be generated from the gap between your current profile and the target role.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    )}

    {(user || isDemoUnlocked) && currentView.startsWith('premium-') && (
      <PremiumPage type={currentView.split('premium-')[1]} onBack={() => setCurrentView('dashboard')} />
    )}

    {isAuthModalOpen && (
      <div className="auth-modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <h2>{authMode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {authMode === 'login' ? 'Login to track your AI analyses and dashboard roadmap.' : 'Sign up to persist your resumes and AI analyses.'}
          </p>
          
          <form onSubmit={handleAuthSubmit} autoComplete="off">
            {authMode === 'register' && (
              <>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="text-field" 
                    value={authFullName} 
                    onChange={e => setAuthFullName(e.target.value)} 
                    placeholder="John Doe"
                    autoComplete="new-name"
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Mobile Number</label>
                  <input 
                    type="tel" 
                    className="text-field" 
                    value={authPhone} 
                    onChange={e => setAuthPhone(e.target.value)} 
                    placeholder="+91 "
                    autoComplete="new-tel"
                    required 
                  />
                </div>
              </>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Email Address</label>
              <input 
                type="email" 
                className="text-field" 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)} 
                placeholder="you@example.com"
                autoComplete="new-email"
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Password</label>
              <input 
                type="password" 
                className="text-field" 
                value={authPassword} 
                onChange={e => setAuthPassword(e.target.value)} 
                placeholder="••••••••"
                autoComplete="new-password"
                required 
              />
            </div>
            
            {authMode === 'register' && (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>LinkedIn Profile (Optional)</label>
                <input 
                  type="url" 
                  className="text-field" 
                  value={authLinkedIn} 
                  onChange={e => setAuthLinkedIn(e.target.value)} 
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            )}


            
            {authError && <div className="response-message error" style={{marginBottom: '1rem', padding: '0.5rem'}}><AlertCircle size={16}/> {authError}</div>}
            
            <button type="submit" className="submit-btn" disabled={authLoading}>
              {authLoading 
                ? 'Processing...' 
                : authMode === 'login' 
                  ? 'Login' 
                  : 'Create Account'}
            </button>
          </form>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button 
              className="tab-btn" 
              onClick={() => { 
                setAuthMode(authMode === 'login' ? 'register' : 'login'); 
                setAuthError(''); 
              }}
              style={{ fontSize: '0.85rem' }}
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}

export default App;
