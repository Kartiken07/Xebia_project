import express from 'express';
import multer from 'multer';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all candidates
router.get('/candidates', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'MANAGER']), async (req, res) => {
  const candidates = await db.candidates.find();
  res.json({ success: true, candidates });
});

// Register candidate
router.post('/candidates', authenticateToken, requireRole(['SUPER_ADMIN', 'HR']), async (req, res) => {
  const { candidateName, email, experience, skills } = req.body;

  if (!candidateName || !email) {
    return res.status(400).json({ success: false, message: 'Candidate Name and Email are required' });
  }

  const existing = await db.candidates.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Candidate with this email already registered' });
  }

  const cand = await db.candidates.create({
    candidateName,
    email,
    experience: parseInt(experience) || 0,
    skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
    status: 'Applied',
    resumeFileName: '',
    interviewSchedule: null,
    interviewNotes: '',
    aiAnalysis: null
  });

  res.json({ success: true, candidate: cand });
});

// Update candidate details (schedule interview, post feedback, offer generation)
router.put('/candidates/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'HR', 'MANAGER']), async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  const candidate = await db.candidates.findById(id);
  if (!candidate) {
    return res.status(404).json({ success: false, message: 'Candidate not found' });
  }

  // Interview cannot be scheduled without screening (Recruitment rule)
  if (updateFields.interviewSchedule && candidate.status === 'Applied') {
    return res.status(400).json({
      success: false,
      message: 'Candidate must complete screening before scheduling an interview.'
    });
  }

  // Offer only after HR approval/Interview stages
  if (updateFields.status === 'Offer Letter' && candidate.status !== 'HR Interview' && candidate.status !== 'Technical Interview') {
    return res.status(400).json({
      success: false,
      message: 'Offer Letter can only be issued after interview rounds.'
    });
  }

  const updated = await db.candidates.findByIdAndUpdate(id, updateFields);
  res.json({ success: true, candidate: updated });
});

// AI Resume Analysis Endpoint (M-04/AI Resume Analysis)
router.post('/candidates/:id/analyze-resume', authenticateToken, requireRole(['SUPER_ADMIN', 'HR']), async (req, res) => {
  const { id } = req.params;
  const candidate = await db.candidates.findById(id);

  if (!candidate) {
    return res.status(404).json({ success: false, message: 'Candidate not found' });
  }

  // Perform mock semantic parsing of candidate's details & experience
  // In a real environment, we'd extract text from PDFs. Here we simulate it beautifully.
  const hasReact = candidate.skills.some(s => s.toLowerCase().includes('react'));
  const hasNode = candidate.skills.some(s => s.toLowerCase().includes('node'));
  const hasMongo = candidate.skills.some(s => s.toLowerCase().includes('mongo'));

  const skillsFound = [];
  const missingSkills = [];

  if (hasReact) skillsFound.push('React'); else missingSkills.push('React');
  if (hasNode) skillsFound.push('Node.js'); else missingSkills.push('Node.js');
  if (hasMongo) skillsFound.push('MongoDB'); else missingSkills.push('MongoDB');

  // Add standard target workforce stack
  const checkList = ['Docker', 'AWS', 'Redis', 'TypeScript'];
  checkList.forEach(s => {
    if (candidate.skills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))) {
      skillsFound.push(s);
    } else {
      missingSkills.push(s);
    }
  });

  // Calculate matching score
  const score = Math.min(100, Math.max(30, 40 + (skillsFound.length * 10) + (candidate.experience * 4)));

  const analysisResult = {
    score: `${score}%`,
    matchedSkills: skillsFound,
    missingSkills: missingSkills,
    summary: `${candidate.candidateName} presents ${candidate.experience} years of experience. ${
      score > 75 ? 'Strong profile matching the organization core stack.' : 'Intermediate profile. May require training on missing stack components.'
    }`
  };

  await db.candidates.findByIdAndUpdate(id, {
    aiAnalysis: analysisResult,
    status: 'Screening' // Automatically advance to screening upon resume analysis
  });

  res.json({ success: true, analysis: analysisResult });
});

export default router;
