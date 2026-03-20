const express = require('express');
const cors = require('cors');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aionboarding', {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String },
    phone: { type: String },
    linkedIn: { type: String },
    analyses: [{ type: Object }] // Store previous analyses
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hackathon_key';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage });

const SKILL_CATALOG = [
    { name: 'JavaScript', aliases: ['javascript', ' js ', 'js,', 'js.', '(js)', '/js', 'ecmascript'], roadmap: 'Build interactive browser projects and practice async patterns.' },
    { name: 'TypeScript', aliases: ['typescript', ' ts ', 'ts,', 'ts.'], roadmap: 'Add type-safe components and API contracts in a small app.' },
    { name: 'React', aliases: ['react', 'react.js', 'reactjs'], roadmap: 'Create reusable UI flows and state-driven components.' },
    { name: 'Node.js', aliases: ['node.js', 'nodejs', ' node '], roadmap: 'Build REST APIs and middleware with real validation.' },
    { name: 'Express', aliases: ['express', 'express.js'], roadmap: 'Learn routing, middleware, and request lifecycle design.' },
    { name: 'MongoDB', aliases: ['mongodb', 'mongo db', 'mongo'], roadmap: 'Model collections, indexes, and CRUD-heavy backend features.' },
    { name: 'SQL', aliases: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite'], roadmap: 'Practice joins, aggregates, and schema design for applications.' },
    { name: 'Python', aliases: ['python'], roadmap: 'Solve automation tasks and backend exercises with clean modular code.' },
    { name: 'Java', aliases: ['java'], roadmap: 'Strengthen OOP, collections, and backend fundamentals.' },
    { name: 'C++', aliases: ['c++', 'cpp'], roadmap: 'Use DSA problems to improve low-level reasoning and performance.' },
    { name: 'HTML', aliases: ['html', 'html5'], roadmap: 'Refine semantic layout and structured content authoring.' },
    { name: 'CSS', aliases: ['css', 'css3'], roadmap: 'Practice responsive layouts, spacing systems, and component styling.' },
    { name: 'Git', aliases: ['git', 'github', 'gitlab'], roadmap: 'Use branches, pull requests, and clean commit history on every project.' },
    { name: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudwatch'], roadmap: 'Deploy one backend and one frontend with logging and storage.' },
    { name: 'Docker', aliases: ['docker', 'containers', 'containerization'], roadmap: 'Containerize an app and run local multi-service environments.' },
    { name: 'REST APIs', aliases: ['rest api', 'restful api', 'api development', 'backend api', 'apis'], roadmap: 'Design endpoints with validation, error handling, and auth basics.' },
    { name: 'GraphQL', aliases: ['graphql'], roadmap: 'Build a schema and compare resolver patterns with REST.' },
    { name: 'Data Structures', aliases: ['data structures', 'dsa', 'algorithms'], roadmap: 'Practice arrays, trees, graphs, and problem-solving speed.' },
    { name: 'Problem Solving', aliases: ['problem solving', 'analytical thinking'], roadmap: 'Solve timed coding problems and explain your reasoning clearly.' },
    { name: 'Communication', aliases: ['communication', 'presentation'], roadmap: 'Summarize technical work clearly in demos, docs, and discussions.' },
    { name: 'Teamwork', aliases: ['teamwork', 'collaboration', 'collaborative'], roadmap: 'Work on shared projects with reviews and task breakdowns.' },
    { name: 'Leadership', aliases: ['leadership', 'mentoring', 'ownership'], roadmap: 'Own a feature end to end and communicate scope, risk, and status.' },
    { name: 'System Design', aliases: ['system design', 'scalability', 'distributed systems'], roadmap: 'Study API design, caching, queues, and scaling tradeoffs with case studies.' },
    { name: 'Testing', aliases: ['testing', 'unit testing', 'jest', 'mocha'], roadmap: 'Add automated tests to an app and improve change confidence.' },
];

const ROLE_SKILL_HINTS = [
    { trigger: ['frontend', 'front end', 'ui'], skills: ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Git'] },
    { trigger: ['backend', 'api', 'server'], skills: ['Node.js', 'Express', 'SQL', 'REST APIs', 'Docker', 'Git'] },
    { trigger: ['full stack', 'fullstack'], skills: ['React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Git'] },
    { trigger: ['data', 'ml', 'ai'], skills: ['Python', 'SQL', 'Problem Solving'] },
    { trigger: ['cloud', 'devops'], skills: ['AWS', 'Docker', 'Git', 'Node.js', 'System Design'] },
];

const COMPANY_PREP_PROFILES = [
    {
        match: ['google', 'alphabet'],
        focusAreas: ['Data Structures', 'Problem Solving', 'System Design', 'Communication'],
        interviewStyle: 'Expect strong coding rounds, problem-solving depth, and clear communication under time pressure.',
        prepTheme: 'Prioritize DSA reps, tradeoff discussion, and concise explanation of project decisions.',
    },
    {
        match: ['microsoft'],
        focusAreas: ['Problem Solving', 'System Design', 'Testing', 'Teamwork'],
        interviewStyle: 'Expect practical engineering discussions, debugging, and collaborative problem solving.',
        prepTheme: 'Prepare end-to-end project stories, testing discipline, and structured coding rounds.',
    },
    {
        match: ['amazon', 'aws'],
        focusAreas: ['Leadership', 'System Design', 'REST APIs', 'Communication'],
        interviewStyle: 'Expect leadership-principle style behavioral rounds plus ownership-focused technical discussion.',
        prepTheme: 'Prepare STAR stories, architecture decisions, and examples of measurable impact.',
    },
    {
        match: ['meta', 'facebook'],
        focusAreas: ['JavaScript', 'React', 'System Design', 'Problem Solving'],
        interviewStyle: 'Expect coding speed, product intuition, and frontend or distributed-system depth depending on role.',
        prepTheme: 'Sharpen coding fluency and be ready to explain product-facing engineering choices.',
    },
    {
        match: ['netflix'],
        focusAreas: ['System Design', 'AWS', 'Communication', 'Leadership'],
        interviewStyle: 'Expect strong ownership, architecture depth, and clarity around scale and tradeoffs.',
        prepTheme: 'Emphasize decision-making, performance, and production-readiness of your projects.',
    },
    {
        match: ['flipkart', 'swiggy', 'zomato', 'paytm', 'razorpay'],
        focusAreas: ['Problem Solving', 'System Design', 'SQL', 'Communication'],
        interviewStyle: 'Expect product-engineering scenarios, scalable backend thinking, and applied coding questions.',
        prepTheme: 'Prepare practical engineering tradeoffs tied to growth, performance, and product constraints.',
    },
];

function unique(list) {
    return [...new Set(list)];
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(text) {
    return ` ${text.toLowerCase().replace(/\s+/g, ' ').trim()} `;
}

function extractSections(text) {
    const sections = {};
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const knownHeadings = ['summary', 'skills', 'technical skills', 'education', 'projects', 'experience', 'work experience', 'internship', 'certifications', 'achievements'];
    let currentHeading = 'general';

    sections[currentHeading] = [];

    for (const line of lines) {
        const cleaned = line.replace(/[:\-]+$/, '').toLowerCase();
        if (knownHeadings.includes(cleaned)) {
            currentHeading = cleaned;
            if (!sections[currentHeading]) {
                sections[currentHeading] = [];
            }
            continue;
        }

        if (!sections[currentHeading]) {
            sections[currentHeading] = [];
        }
        sections[currentHeading].push(line);
    }

    Object.keys(sections).forEach((key) => {
        sections[key] = sections[key].join(' ');
    });

    return sections;
}

function extractSkillsFromText(text, options = {}) {
    const normalized = normalizeText(text);
    const weight = options.weight || 1;
    const foundSkills = [];

    SKILL_CATALOG.forEach((skill) => {
        const matched = skill.aliases.some((alias) => {
            const normalizedAlias = alias.trim().toLowerCase();
            const pattern = new RegExp(`(^|[^a-z0-9+])${escapeRegex(normalizedAlias)}([^a-z0-9+]|$)`, 'i');
            return pattern.test(normalized);
        });

        if (matched) {
            for (let i = 0; i < weight; i++) {
                foundSkills.push(skill.name);
            }
        }
    });

    return foundSkills;
}

function getPrioritizedResumeSkills(resumeText) {
    const sections = extractSections(resumeText);
    const weightedSkills = [
        ...extractSkillsFromText(sections.skills || '', { weight: 3 }),
        ...extractSkillsFromText(sections['technical skills'] || '', { weight: 3 }),
        ...extractSkillsFromText(sections.projects || '', { weight: 2 }),
        ...extractSkillsFromText(sections.experience || '', { weight: 2 }),
        ...extractSkillsFromText(sections['work experience'] || '', { weight: 2 }),
        ...extractSkillsFromText(sections.general || '', { weight: 1 }),
    ];

    const counts = weightedSkills.reduce((acc, skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
    }, {});

    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
}

function inferGoalSkills(goalText) {
    const normalized = normalizeText(goalText);
    const inferred = new Set(extractSkillsFromText(goalText));

    ROLE_SKILL_HINTS.forEach((roleHint) => {
        if (roleHint.trigger.some((term) => normalized.includes(term))) {
            roleHint.skills.forEach((skill) => inferred.add(skill));
        }
    });

    return [...inferred];
}

function formatGoalSummary(goalRole, goalCompany, goalSkills) {
    const parts = [];

    if (goalRole && goalRole.trim()) {
        parts.push(`Target role: ${goalRole.trim()}`);
    }

    if (goalCompany && goalCompany.trim()) {
        parts.push(`Target company: ${goalCompany.trim()}`);
    }

    if (goalSkills && goalSkills.trim()) {
        parts.push(`Priority skills: ${goalSkills.trim()}`);
    }

    return parts.length > 0
        ? parts.join(' | ')
        : 'No career goal provided. Dashboard is based on resume and job description only.';
}

function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

function buildScoreItem(label, score, reason) {
    return {
        label,
        score: clampScore(score),
        reason,
    };
}

function computeResumeScore({ resumeText, jobDescriptionText, goalRole, matchedSkills, targetSkills, resumeSkills }) {
    const sections = extractSections(resumeText);
    const projectsText = `${sections.projects || ''} ${sections.experience || ''} ${sections['work experience'] || ''}`;
    const normalizedTargetContext = normalizeText(`${jobDescriptionText || ''} ${goalRole || ''}`);
    const resumeLines = resumeText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const projectEvidenceSkills = targetSkills.filter((skill) => {
        const skillMeta = SKILL_CATALOG.find((item) => item.name === skill);
        return skillMeta && skillMeta.aliases.some((alias) => normalizeText(projectsText).includes(` ${alias.trim().toLowerCase()} `));
    });
    const actionVerbMatches = (resumeText.match(/\b(built|developed|designed|implemented|created|optimized|led|improved|deployed|engineered)\b/gi) || []).length;
    const measurableMatches = (resumeText.match(/\b\d+[%+x]?\b/g) || []).length;
    const projectMentions = (projectsText.match(/\b(project|built|developed|implemented|intern|experience)\b/gi) || []).length;

    const skillFitBase = targetSkills.length > 0 ? (matchedSkills.length / targetSkills.length) * 100 : Math.min(100, resumeSkills.length * 12);
    const skillFitReason = targetSkills.length > 0
        ? `${matchedSkills.length} of ${targetSkills.length} target skills are already visible in the resume.`
        : `No explicit target was provided, so the score is based on the breadth of extracted resume skills.`;

    const roleSignals = ROLE_SKILL_HINTS.find((roleHint) =>
        roleHint.trigger.some((term) => normalizedTargetContext.includes(term))
    );
    const roleSignalMatches = roleSignals ? roleSignals.skills.filter((skill) => resumeSkills.includes(skill)).length : 0;
    const roleFitBase = roleSignals
        ? (roleSignalMatches / roleSignals.skills.length) * 100
        : skillFitBase * 0.85;
    const roleFitReason = roleSignals
        ? `${roleSignalMatches} of ${roleSignals.skills.length} role-specific signals were found for ${goalRole || 'the target role'}.`
        : 'Role fit is inferred from general overlap with the job description and target skills.';

    const projectFitBase = targetSkills.length > 0
        ? ((projectEvidenceSkills.length / targetSkills.length) * 70) + Math.min(projectMentions * 6, 30)
        : Math.min(projectMentions * 12, 100);
    const projectFitReason = projectEvidenceSkills.length > 0
        ? `${projectEvidenceSkills.length} target skills appear inside projects or experience sections, which is stronger evidence than a plain skills list.`
        : 'Projects and experience sections need stronger evidence tied to the target stack.';

    const communicationBase =
        Math.min(resumeLines.length * 3, 30) +
        Math.min(actionVerbMatches * 8, 35) +
        Math.min(measurableMatches * 7, 35);
    const communicationReason = `${actionVerbMatches} action-oriented statements and ${measurableMatches} measurable signals were detected in the resume text.`;

    const breakdown = [
        buildScoreItem('Skills Fit', skillFitBase, skillFitReason),
        buildScoreItem('Role Fit', roleFitBase, roleFitReason),
        buildScoreItem('Project Fit', projectFitBase, projectFitReason),
        buildScoreItem('Communication', communicationBase, communicationReason),
    ];

    const total = clampScore(
        (breakdown[0].score * 0.35) +
        (breakdown[1].score * 0.25) +
        (breakdown[2].score * 0.25) +
        (breakdown[3].score * 0.15)
    );

    return {
        total,
        band: total >= 80 ? 'Strong' : total >= 60 ? 'Moderate' : 'Needs Work',
        breakdown,
    };
}

function buildCompanyPreparation({ goalCompany, goalRole, targetSkills, matchedSkills, gapSkills }) {
    const companyName = (goalCompany || '').trim();
    const normalizedCompany = companyName.toLowerCase();
    const profile = COMPANY_PREP_PROFILES.find((item) =>
        item.match.some((term) => normalizedCompany.includes(term))
    );

    const focusAreas = unique([
        ...(profile ? profile.focusAreas : []),
        ...gapSkills.slice(0, 2),
        ...targetSkills.slice(0, 2),
    ]).slice(0, 5);

    const strongAreas = focusAreas.filter((area) => matchedSkills.includes(area));
    const weakAreas = focusAreas.filter((area) => gapSkills.includes(area));

    if (!companyName) {
        return {
            companyName: 'General target companies',
            interviewStyle: 'No company-specific target was provided, so this prep is role-driven.',
            focusAreas: focusAreas.length > 0 ? focusAreas : targetSkills.slice(0, 4),
            prepChecklist: [
                `Tailor your resume stories to ${goalRole || 'the target role'}.`,
                'Prepare one project walkthrough with architecture, tradeoffs, and outcomes.',
                'Practice coding and behavioral answers aligned to the role.',
            ],
            readinessNote: 'Add a company name to get company-specific emphasis.',
        };
    }

    return {
        companyName,
        interviewStyle: profile ? profile.interviewStyle : `Expect the interview to prioritize role fit, problem solving, and evidence of project ownership for ${companyName}.`,
        focusAreas,
        prepChecklist: [
            profile ? profile.prepTheme : `Study the engineering expectations and product context of ${companyName}.`,
            strongAreas.length > 0
                ? `Lead with strengths in ${strongAreas.slice(0, 3).join(', ')} during interviews.`
                : 'Strengthen one or two proven strengths that you can discuss with concrete examples.',
            weakAreas.length > 0
                ? `Close the biggest gaps first: ${weakAreas.slice(0, 3).join(', ')}.`
                : 'Turn matching skills into project stories with measurable outcomes.',
        ],
        readinessNote: weakAreas.length > 0
            ? `${weakAreas.length} focus areas still need stronger evidence for ${companyName}.`
            : `Your current profile already covers the main focus areas for ${companyName}.`,
    };
}

function buildProjectRecommendations({ goalRole, goalCompany, matchedSkills, gapSkills, targetSkills }) {
    const projectTypes = [];
    const hasFrontend = ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS'].some((skill) => targetSkills.includes(skill));
    const hasBackend = ['Node.js', 'Express', 'REST APIs', 'MongoDB', 'SQL'].some((skill) => targetSkills.includes(skill));
    const hasCloud = ['AWS', 'Docker', 'System Design'].some((skill) => targetSkills.includes(skill));

    if (hasFrontend && hasBackend) {
        projectTypes.push({
            title: 'Full-Stack Product Workflow',
            pitch: `Build an end-to-end product that reflects ${goalRole || 'your target role'} expectations and can be discussed in interviews for ${goalCompany || 'target companies'}.`,
            stack: unique(['React', 'Node.js', 'Express', 'MongoDB', ...matchedSkills.slice(0, 2), ...gapSkills.slice(0, 2)]).slice(0, 6),
            outcome: 'Demonstrates frontend execution, backend APIs, database design, and deployment thinking.',
        });
    }

    if (hasBackend) {
        projectTypes.push({
            title: 'Backend API and Analytics Service',
            pitch: 'Create a service with authentication, data persistence, and reporting endpoints that mirror production backend expectations.',
            stack: unique(['Node.js', 'Express', 'REST APIs', 'SQL', 'Testing', ...gapSkills.slice(0, 2)]).slice(0, 6),
            outcome: 'Shows API design, validation, testing discipline, and measurable backend ownership.',
        });
    }

    if (hasFrontend) {
        projectTypes.push({
            title: 'Interactive Frontend Dashboard',
            pitch: 'Build a responsive dashboard with stateful UI, filtering, forms, and role-specific user flows.',
            stack: unique(['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript', ...gapSkills.slice(0, 1)]).slice(0, 6),
            outcome: 'Shows component design, UX reasoning, and implementation quality for product-facing teams.',
        });
    }

    if (hasCloud) {
        projectTypes.push({
            title: 'Deployable Cloud Architecture Project',
            pitch: 'Deploy one of your projects with monitoring, containerization, and basic scalability considerations.',
            stack: unique(['AWS', 'Docker', 'Node.js', 'System Design', ...gapSkills.slice(0, 2)]).slice(0, 6),
            outcome: 'Shows production readiness and architecture depth beyond local development.',
        });
    }

    if (projectTypes.length === 0) {
        projectTypes.push({
            title: 'Targeted Portfolio Project',
            pitch: `Build a project directly aligned with ${goalRole || 'your target role'} and use it as interview evidence.`,
            stack: unique([...targetSkills.slice(0, 4), ...gapSkills.slice(0, 2), ...matchedSkills.slice(0, 2)]).slice(0, 6),
            outcome: 'Creates concrete proof of ability for the exact role you are targeting.',
        });
    }

    return projectTypes.slice(0, 3).map((project, index) => ({
        ...project,
        title: `${index + 1}. ${project.title}`,
    }));
}

function buildAtsFeedback({ resumeText, jobDescriptionText, targetSkills, matchedSkills, gapSkills }) {
    const sections = extractSections(resumeText);
    const lines = resumeText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const bulletLikeLines = lines.filter((line) => /^[-*]/.test(line));
    const strongVerbLines = lines.filter((line) => /\b(built|developed|designed|implemented|created|optimized|led|improved|deployed|engineered)\b/i.test(line));
    const quantifiedLines = lines.filter((line) => /\b\d+[%+x]?\b/.test(line));
    const missingKeywords = gapSkills.slice(0, 6);
    const missingCoreSections = [
        !sections.summary ? 'Add a short professional summary aligned to the target role.' : null,
        !sections.skills && !sections['technical skills'] ? 'Add a dedicated Skills or Technical Skills section for ATS parsing.' : null,
        !sections.projects && !sections.experience && !sections['work experience'] ? 'Add Projects or Experience content with concrete technical evidence.' : null,
    ].filter(Boolean);

    const keywordCoverage = targetSkills.length > 0
        ? (matchedSkills.length / targetSkills.length) * 100
        : Math.min(100, strongVerbLines.length * 15);
    const structureScore = clampScore(100 - (missingCoreSections.length * 22) + Math.min(bulletLikeLines.length * 4, 20));
    const impactScore = clampScore(Math.min(strongVerbLines.length * 14, 55) + Math.min(quantifiedLines.length * 15, 45));
    const readabilityScore = clampScore(lines.length >= 8 ? 80 + Math.min(lines.length, 20) : 45 + (lines.length * 3));
    const overallScore = clampScore((keywordCoverage * 0.4) + (structureScore * 0.2) + (impactScore * 0.25) + (readabilityScore * 0.15));

    const strengths = [
        matchedSkills.length > 0 ? `The resume already includes ${matchedSkills.length} target-aligned keywords.` : null,
        strongVerbLines.length > 0 ? `${strongVerbLines.length} lines use action-oriented language.` : null,
        quantifiedLines.length > 0 ? `${quantifiedLines.length} lines include measurable evidence.` : null,
    ].filter(Boolean);

    const warnings = [
        ...missingCoreSections,
        missingKeywords.length > 0 ? `Important ATS keywords are still missing: ${missingKeywords.join(', ')}.` : null,
        quantifiedLines.length === 0 ? 'Very few quantified outcomes were detected. Add numbers, percentages, or scale where possible.' : null,
        bulletLikeLines.length === 0 ? 'Bullet-oriented achievement statements are limited or missing.' : null,
    ].filter(Boolean);

    const improvements = [
        missingKeywords.length > 0 ? `Mirror job-description language for these skills where genuinely applicable: ${missingKeywords.slice(0, 4).join(', ')}.` : 'Keep the top target keywords consistent across summary, skills, and project bullets.',
        'Rewrite project and experience lines to start with an action verb and end with an outcome.',
        quantifiedLines.length === 0 ? 'Add measurable impact such as user count, latency improvement, accuracy, or delivery time.' : 'Preserve quantified bullets and add one more impact metric to the strongest project.',
    ];

    if (strengths.length === 0) {
        strengths.push('The resume has enough raw content to improve with keyword and formatting changes.');
    }

    if (warnings.length === 0) {
        warnings.push('No major ATS blockers were detected. Focus on tailoring wording to each job description.');
    }

    return {
        score: overallScore,
        band: overallScore >= 80 ? 'ATS Ready' : overallScore >= 60 ? 'Needs Tuning' : 'Needs Rewrite',
        missingKeywords,
        strengths,
        warnings,
        improvements,
    };
}

function buildQuizQuestions({ gapSkills, matchedSkills, targetSkills, goalRole }) {
    const quizBank = {
        React: {
            question: 'Which React hook is used to manage local component state?',
            options: ['useMemo', 'useState', 'useEffect', 'useContext'],
            answer: 'useState',
            explanation: 'useState is the standard hook for local state in function components.',
        },
        'Node.js': {
            question: 'What is the main role of Express middleware in a Node.js API?',
            options: ['Compile JavaScript', 'Intercept and process requests or responses', 'Store data permanently', 'Render CSS'],
            answer: 'Intercept and process requests or responses',
            explanation: 'Middleware sits in the request-response cycle and can validate, transform, or route traffic.',
        },
        SQL: {
            question: 'Which SQL clause is used to filter rows before aggregation?',
            options: ['ORDER BY', 'HAVING', 'WHERE', 'GROUP BY'],
            answer: 'WHERE',
            explanation: 'WHERE filters rows before grouping and aggregation occur.',
        },
        AWS: {
            question: 'Which AWS service is commonly used for object storage?',
            options: ['EC2', 'S3', 'Lambda', 'CloudWatch'],
            answer: 'S3',
            explanation: 'Amazon S3 is the standard object storage service.',
        },
        Docker: {
            question: 'What is the main purpose of Docker in application development?',
            options: ['Write frontend code', 'Containerize applications for consistent environments', 'Replace databases', 'Serve DNS records'],
            answer: 'Containerize applications for consistent environments',
            explanation: 'Docker packages apps and dependencies into consistent runtime containers.',
        },
        'Data Structures': {
            question: 'Which data structure follows Last-In-First-Out order?',
            options: ['Queue', 'Stack', 'Heap', 'Graph'],
            answer: 'Stack',
            explanation: 'A stack removes the most recently added item first.',
        },
        'REST APIs': {
            question: 'Which HTTP method is most commonly used to create a new resource?',
            options: ['GET', 'PUT', 'POST', 'DELETE'],
            answer: 'POST',
            explanation: 'POST is typically used to create resources on the server.',
        },
        Testing: {
            question: 'What is the main purpose of a unit test?',
            options: ['Test the entire production environment', 'Verify one small unit of behavior in isolation', 'Replace manual QA permanently', 'Deploy the application'],
            answer: 'Verify one small unit of behavior in isolation',
            explanation: 'Unit tests validate specific logic in isolation from the rest of the system.',
        },
        JavaScript: {
            question: 'Which keyword declares a block-scoped variable in JavaScript?',
            options: ['var', 'let', 'function', 'constantly'],
            answer: 'let',
            explanation: 'let is block scoped and intended for variables that may change.',
        },
        TypeScript: {
            question: 'What does TypeScript add on top of JavaScript?',
            options: ['Database queries', 'Static typing', 'Automatic deployment', 'Browser rendering'],
            answer: 'Static typing',
            explanation: 'TypeScript primarily adds static types and tooling on top of JavaScript.',
        },
    };

    const focusSkills = unique([...gapSkills, ...targetSkills, ...matchedSkills]).slice(0, 4);
    const generated = focusSkills.map((skill) => {
        const base = quizBank[skill];
        if (base) {
            return { skill, ...base };
        }

        return {
            skill,
            question: `Why is ${skill} important for ${goalRole || 'the target role'}?`,
            options: [
                'It is unrelated to delivery',
                'It only matters for design tools',
                'It contributes directly to role-specific execution and project quality',
                'It replaces communication skills',
            ],
            answer: 'It contributes directly to role-specific execution and project quality',
            explanation: `${skill} is relevant because it supports the practical expectations of ${goalRole || 'the target role'}.`,
        };
    });

    return generated.length > 0 ? generated : [{
        skill: 'General Preparation',
        question: `What is the best use of a practice quiz for ${goalRole || 'your target role'}?`,
        options: [
            'Memorize random facts without context',
            'Identify weak areas and reinforce fundamentals',
            'Replace all projects and interviews',
            'Avoid reading the job description',
        ],
        answer: 'Identify weak areas and reinforce fundamentals',
        explanation: 'A targeted quiz is useful when it exposes weak areas that you then fix through practice.',
    }];
}

function buildLearningResources({ gapSkills, targetSkills, goalRole }) {
    const resourceCatalog = {
        React: {
            course: 'React - The Complete Guide',
            certification: 'Meta Front-End Developer Certificate',
            why: 'Improves component architecture, hooks, and production-ready frontend patterns.',
        },
        'Node.js': {
            course: 'Node.js, Express, MongoDB Bootcamp',
            certification: 'OpenJS Node.js Application Developer',
            why: 'Strengthens backend APIs, middleware design, and practical server-side delivery.',
        },
        SQL: {
            course: 'SQL for Data Analysis',
            certification: 'Oracle Database SQL Certified Associate',
            why: 'Builds query fluency, joins, aggregation, and schema reasoning.',
        },
        AWS: {
            course: 'AWS Cloud Practitioner Essentials',
            certification: 'AWS Certified Cloud Practitioner',
            why: 'Adds cloud fundamentals, storage, compute, and deployment confidence.',
        },
        Docker: {
            course: 'Docker and Kubernetes: The Complete Guide',
            certification: 'Docker Certified Associate',
            why: 'Helps with containerization, deployment consistency, and local-to-cloud workflows.',
        },
        'Data Structures': {
            course: 'Data Structures and Algorithms Specialization',
            certification: 'NPTEL Problem Solving Through Programming',
            why: 'Improves coding round performance and algorithmic reasoning.',
        },
        'REST APIs': {
            course: 'REST API Design, Development and Management',
            certification: 'Postman API Fundamentals Student Expert',
            why: 'Reinforces API design, validation, and request lifecycle thinking.',
        },
        Testing: {
            course: 'Testing JavaScript',
            certification: 'ISTQB Foundation Level',
            why: 'Improves code confidence through unit testing and quality discipline.',
        },
        JavaScript: {
            course: 'JavaScript: Understanding the Weird Parts',
            certification: 'Meta JavaScript Programming Certificate',
            why: 'Deepens language fundamentals and debugging confidence.',
        },
        TypeScript: {
            course: 'Understanding TypeScript',
            certification: 'TypeScript Pro Workshops Certificate',
            why: 'Improves type-safe application design and maintainability.',
        },
        'System Design': {
            course: 'Grokking the System Design Interview',
            certification: 'System Design Program Completion Certificate',
            why: 'Builds architecture discussion skills for senior interview rounds.',
        },
        Python: {
            course: 'Python for Everybody',
            certification: 'PCAP Certified Associate in Python Programming',
            why: 'Improves scripting, backend fundamentals, and automation capability.',
        },
    };

    const focusSkills = unique([...gapSkills, ...targetSkills]).slice(0, 4);
    const suggestions = focusSkills.map((skill) => {
        const resource = resourceCatalog[skill];
        if (resource) {
            return { skill, ...resource };
        }

        return {
            skill,
            course: `${skill} Foundations Course`,
            certification: `${skill} Practitioner Certificate`,
            why: `Builds direct capability in ${skill} for ${goalRole || 'the target role'}.`,
        };
    });

    return suggestions.length > 0 ? suggestions : [{
        skill: 'General Career Growth',
        course: 'Software Engineering Foundations',
        certification: 'Industry Foundations Certificate',
        why: `Provides structured guidance for ${goalRole || 'the target role'} when skill gaps are not yet clearly defined.`,
    }];
}

function buildRoadmap(gapSkills, resumeSkills, goalRole, goalCompany) {
    if (gapSkills.length === 0) {
        return [
            {
                title: 'Consolidate strengths',
                description: `Your current profile already overlaps well with the target. Build one polished project and tailor it for ${goalCompany || 'your target companies'}.`,
            },
            {
                title: 'Sharpen interview evidence',
                description: `Turn ${resumeSkills.slice(0, 3).join(', ') || 'your core skills'} into portfolio stories tied to ${goalRole || 'the target role'}.`,
            },
        ];
    }

    return gapSkills.slice(0, 4).map((skill, index) => {
        const skillMeta = SKILL_CATALOG.find((item) => item.name === skill);
        return {
            title: `Phase ${index + 1}: ${skill}`,
            description: skillMeta ? skillMeta.roadmap : `Build proof of work in ${skill} and connect it to your target role.`,
        };
    });
}

function analyzeProfile({ resumeText, jobDescriptionText, goalRole, goalCompany, goalSkills }) {
    const resumeSkills = unique(getPrioritizedResumeSkills(resumeText));
    const jdSkills = unique(extractSkillsFromText(jobDescriptionText));
    const aspirationalSkills = unique(inferGoalSkills(`${goalRole || ''} ${goalCompany || ''} ${goalSkills || ''}`));
    const targetSkills = unique([...jdSkills, ...aspirationalSkills]);
    const matchedSkills = targetSkills.filter((skill) => resumeSkills.includes(skill));
    const gapSkills = targetSkills.filter((skill) => !resumeSkills.includes(skill));

    return {
        summary: formatGoalSummary(goalRole, goalCompany, goalSkills),
        resumeSkills,
        targetSkills,
        matchedSkills,
        gapSkills,
        scorecard: computeResumeScore({
            resumeText,
            jobDescriptionText,
            goalRole,
            matchedSkills,
            targetSkills,
            resumeSkills,
        }),
        companyPreparation: buildCompanyPreparation({
            goalCompany,
            goalRole,
            targetSkills,
            matchedSkills,
            gapSkills,
        }),
        projectRecommendations: buildProjectRecommendations({
            goalRole,
            goalCompany,
            matchedSkills,
            gapSkills,
            targetSkills,
        }),
        atsFeedback: buildAtsFeedback({
            resumeText,
            jobDescriptionText,
            targetSkills,
            matchedSkills,
            gapSkills,
        }),
        quiz: buildQuizQuestions({
            gapSkills,
            matchedSkills,
            targetSkills,
            goalRole,
        }),
        learningResources: buildLearningResources({
            gapSkills,
            targetSkills,
            goalRole,
        }),
        roadmap: buildRoadmap(gapSkills, resumeSkills, goalRole, goalCompany),
    };
}

function decodeAscii85(input) {
    const bytes = [];
    let group = [];

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (/\s/.test(char)) {
            continue;
        }

        if (char === '~') {
            break;
        }

        if (char === 'z' && group.length === 0) {
            bytes.push(0, 0, 0, 0);
            continue;
        }

        const code = input.charCodeAt(i);
        if (code < 33 || code > 117) {
            continue;
        }

        group.push(code - 33);

        if (group.length === 5) {
            let value = 0;
            for (const item of group) {
                value = (value * 85) + item;
            }

            bytes.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
            group = [];
        }
    }

    if (group.length > 0) {
        const padding = 5 - group.length;
        while (group.length < 5) {
            group.push(84);
        }

        let value = 0;
        for (const item of group) {
            value = (value * 85) + item;
        }

        const chunk = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
        bytes.push(...chunk.slice(0, 4 - padding));
    }

    return Buffer.from(bytes);
}

function decodePdfString(value) {
    return value
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\b/g, '\b')
        .replace(/\\f/g, '\f');
}

function extractTextFromDecodedPdfContent(content) {
    const tokens = [];
    const segments = content.match(/(?:\[(?:.|\r?\n)*?\]\s*TJ|\((?:\\.|[^\\)])*\)\s*Tj|T\*)/g) || [];

    for (const segment of segments) {
        if (segment === 'T*') {
            tokens.push('\n');
            continue;
        }

        if (segment.endsWith('Tj')) {
            const match = segment.match(/\(([\s\S]*)\)\s*Tj$/);
            if (match) {
                tokens.push(decodePdfString(match[1]));
            }
            continue;
        }

        if (segment.endsWith('TJ')) {
            const match = segment.match(/\[(.*)\]\s*TJ$/s);
            if (!match) {
                continue;
            }

            const textParts = [...match[1].matchAll(/\((?:\\.|[^\\)])*\)/g)].map((item) =>
                decodePdfString(item[0].slice(1, -1))
            );
            if (textParts.length > 0) {
                tokens.push(textParts.join(''));
            }
        }
    }

    return tokens
        .join('')
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function extractTextFromPdfFallback(filePath) {
    const pdfSource = fs.readFileSync(filePath, 'latin1');
    const streamPattern = /<<[\s\S]*?>>\s*stream\r?\n([\s\S]*?)endstream/g;
    let match;
    const decodedChunks = [];

    while ((match = streamPattern.exec(pdfSource)) !== null) {
        const dictionary = match[0];
        const streamData = match[1];
        let buffer = Buffer.from(streamData, 'latin1');

        try {
            if (/ASCII85Decode/.test(dictionary)) {
                buffer = decodeAscii85(streamData);
            }

            if (/FlateDecode/.test(dictionary)) {
                buffer = zlib.inflateSync(buffer);
            }

            decodedChunks.push(buffer.toString('latin1'));
        } catch (fallbackError) {
            continue;
        }
    }

    const text = extractTextFromDecodedPdfContent(decodedChunks.join('\n'));
    if (!text) {
        throw new Error('Could not extract text from this PDF. It may be image-based or encoded in an unsupported way.');
    }

    return text;
}

async function extractTextFromFile(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!fs.existsSync(file.path)) {
        throw new Error("File not found.");
    }

    try {
        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            try {
                const data = await pdf(dataBuffer);
                return data.text;
            } catch (err) {
                console.warn(`Standard pdf-parse failed: ${err.message}. Attempting fallback parser...`);
                try {
                    const fallbackText = extractTextFromPdfFallback(file.path);
                    return fallbackText;
                } catch (fallbackErr) {
                    throw err; // If fallback fails too, throw original error
                }
            }
        } else if (ext === '.docx' || ext === '.doc') {
            const result = await mammoth.extractRawText({ path: file.path });
            return result.value;
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (err) {
        throw new Error(`Error extracting text: ${err.message}`);
    }
}

app.get('/', (req, res) => {
  res.send('AI Adaptive Onboarding Engine API is running');
});

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, fullName, phone, linkedIn } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already in use' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ email, password: hashedPassword, fullName, phone, linkedIn });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: newUser._id, email: newUser.email, fullName: newUser.fullName, analyses: newUser.analyses } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, email: user.email, analyses: user.analyses } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -------------------

const cpUpload = upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'jobDescription', maxCount: 1 }]);

app.post('/upload', (req, res) => {
  cpUpload(req, res, async (uploadError) => {
    console.log("--- Received Upload Request ---");

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return res.status(400).json({ error: uploadError.message || "File upload failed." });
    }

    try {
        if (!req.files || !req.files['resume'] || !req.files['resume'][0]) {
            return res.status(400).json({ error: "Resume file is missing." });
        }

        const resumeFile = req.files['resume'][0];
        const goalRole = req.body.goalRole || '';
        const goalCompany = req.body.goalCompany || '';
        const goalSkills = req.body.goalSkills || '';
        let resumeText = '';
        let jobDescriptionText = '';

        // Extract Resume Text
        resumeText = await extractTextFromFile(resumeFile);
        if (!resumeText || resumeText.trim() === '') {
            return res.status(400).json({ error: "Could not extract text from Resume. The file might be empty or unreadable." });
        }

        // Handle Job Description
        if (req.body.jobDescriptionText && req.body.jobDescriptionText.trim() !== '') {
            jobDescriptionText = req.body.jobDescriptionText;
        } else if (req.files['jobDescription'] && req.files['jobDescription'][0]) {
            jobDescriptionText = await extractTextFromFile(req.files['jobDescription'][0]);
            if (!jobDescriptionText || jobDescriptionText.trim() === '') {
                return res.status(400).json({ error: "Could not extract text from Job Description file." });
            }
        } else {
            return res.status(400).json({ error: "Job Description is missing (provide either text or file)." });
        }

        const analysis = analyzeProfile({
            resumeText,
            jobDescriptionText,
            goalRole,
            goalCompany,
            goalSkills,
        });

        // Optional: Save to Database if user is logged in
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await User.findById(decoded.userId);
                if (user) {
                    user.analyses.push({
                        date: new Date(),
                        goalRole,
                        goalCompany,
                        score: analysis.scorecard.total,
                        summary: analysis.summary,
                        analysisPayload: analysis 
                    });
                    await user.save();
                }
            } catch (jwtErr) {
                console.log("JWT decode skipped or failed:", jwtErr.message);
            }
        }

        res.json({
            message: "Files processed successfully",
            resumeText: resumeText,
            jobDescriptionText: jobDescriptionText,
            analysis,
        });

    } catch (error) {
        console.error("Extraction error:", error);
        res.status(500).json({ error: error.message });
    }
  });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});


