import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpecularButton from '../../components/ui/SpecularButton';
import StarBorder from '../../components/ui/StarBorder';
import { useAuth } from '../../context/AuthContext';
import { useLenis } from '../../context/LenisContext.jsx';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import {
  getParticipantTracks,
  uploadSubmission,
  getMySubmission,
  uploadPaymentProof,
  getMyTeam,
  apiFetch,
  updateTeamMembers,
  getHackathonSettings,
  getTeamDashboardSettings,
} from '../../lib/api';

import qrCodeImg from '../../assets/kesar-300-qr-code.png';
import styles from './UserDashboard.module.css';

/* ── SVG Icons ── */
const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
    </svg>
  ),
  problems: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  ),
  team: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  submission: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z" />
      <polyline points="13 2 13 9 20 9" />
      <line x1="12" y1="18" x2="12" y2="13" />
      <polyline points="9 15 12 12 15 15" />
    </svg>
  ),
  creditCard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  folder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  megaphone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  crown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    </svg>
  ),
  checkCircle: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  uploadCloud: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      <polyline points="16 16 12 12 8 16" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  code: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  palette: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
      <circle cx="6.5" cy="12.5" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.75 1.7-1.67 0-.42-.16-.81-.43-1.1-.26-.3-.42-.7-.42-1.14 0-.92.75-1.67 1.67-1.67H16c3.3 0 6-2.7 6-6 0-4.75-4.5-8.5-10-8.5z" />
    </svg>
  ),
  cpu: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
    </svg>
  ),
  statusDot: (
    <svg width="8" height="8" viewBox="0 0 8 8" style={{ display: 'inline-block' }}>
      <circle cx="4" cy="4" r="3.5" fill="#22c55e" />
    </svg>
  ),
  alertTriangle: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  camera: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  fileText: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  award: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  arrowRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

const SqBtn = ({ children, onClick, type = 'button', lineColor = '#FAB600', baseColor = '#261005', textColor = '#ffffff', danger = false, size = 'sm', fullWidth = false }) => (
  <SpecularButton
    size={size}
    radius={10}
    lineColor={danger ? '#ff6b75' : lineColor}
    baseColor={danger ? '#2a1215' : baseColor}
    textColor={danger ? '#ff6b75' : textColor}
    intensity={1}
    speed={0.35}
    onClick={onClick}
    type={type}
    className={fullWidth ? 'full-width' : ''}
  >
    {children}
  </SpecularButton>
);

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
  { id: 'problems', label: 'Problem Statements', icon: Icons.problems },
  { id: 'team', label: 'My Team', icon: Icons.team },
  { id: 'submission', label: 'Submission', icon: Icons.submission },
  { id: 'payment', label: 'Offline Payment', icon: Icons.creditCard },
];

export default function UserDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState({ name: 'RepoForge Hackathon', year: 2026, hackathonStatus: 'Live', acceptingSubmissions: true });
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);

  // Current logged in team info
  const teamId = auth?.teamId || auth?.user?.id || 'PHX024';
  const cacheKey = `repoforge_live_team_${teamId}`;

  // Live API team data (with instant cache on refresh)
  const [liveTeam, setLiveTeam] = useState(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [teamLoading, setTeamLoading] = useState(!liveTeam);
  const [dynamicSettings, setDynamicSettings] = useState(getHackathonSettings());
  const [teamResult, setTeamResult] = useState(null);
  const [paymentEligibility, setPaymentEligibility] = useState(null);
  // Prefer live API data; fall back strictly to neutral placeholder (Member 1, Member 2, Member 3)
  const currentTeam = useMemo(() => {
    if (liveTeam) {
      // Map DB schema → shape the dashboard expects
      return {
        id: liveTeam.id,
        name: liveTeam.name || 'Your Team',
        teamName: liveTeam.name || 'Your Team',
        college: liveTeam.college || '',
        leadEmail: liveTeam.lead_email || '',
        joinCode: liveTeam.join_code || '',
        phone: liveTeam.phone || '',
        year: liveTeam.year || '',
        dept: liveTeam.dept || '',
        themeTrack: liveTeam.theme_track || '',
        problemId: liveTeam.problem_statement_id || '',
        problemTitle: liveTeam.problem_statement || '',
        shortlisted: liveTeam.result?.shortlist_status === 'Shortlisted' || (liveTeam.result?.shortlisted ?? false),
        shortlistStatus: liveTeam.result?.shortlist_status || (liveTeam.result?.shortlisted ? 'Shortlisted' : 'Under-Review'),
        submission: liveTeam.submission ?? null,
        members: (liveTeam.members && liveTeam.members.length > 0 ? liveTeam.members : [
          { name: 'Member 1', role: 'lead', custom_role: 'Team Leader' },
          { name: 'Member 2', role: 'member', custom_role: 'Member' },
          { name: 'Member 3', role: 'member', custom_role: 'Member' },
        ]).map((m, idx) => ({
          id: m.id || `temp-${idx}`,
          name: m.name || `Member ${idx + 1}`,
          email: m.email || '',
          phone: m.phone || '',
          role: m.custom_role || (m.role === 'lead' ? 'Team Leader' : m.role) || `Member`,
          year: m.year || '',
          dept: m.dept || '',
          avatar: ((m.name || `M${idx + 1}`).trim().split(' ').map((w) => w[0]).slice(0, 2).join('') || `M${idx + 1}`).toUpperCase(),
        })),
      };
    }

    // Default neutral placeholder while live team is loading
    return {
      id: teamId,
      name: 'Your Team',
      teamName: 'Your Team',
      college: '',
      leadEmail: auth?.user?.email || '',
      joinCode: '...',
      members: [
        { name: 'Member 1', role: 'Team Leader', avatar: 'M1' },
        { name: 'Member 2', role: 'Member', avatar: 'M2' },
        { name: 'Member 3', role: 'Member', avatar: 'M3' },
      ],
    };
  }, [liveTeam, teamId, auth?.user?.email]);

  const shortlistStatus = currentTeam?.shortlistStatus || teamResult?.shortlist_status || (currentTeam?.shortlisted || teamResult?.shortlisted ? 'Shortlisted' : 'Under-Review');
  const isShortlisted = shortlistStatus === 'Shortlisted';
  const canAccessPayment = paymentEligibility?.eligible ?? isShortlisted;
  const isLeader = auth?.role === 'user' || auth?.role === 'leader' || true;

  useEffect(() => {
    if (!canAccessPayment && activeTab === 'payment') {
      setActiveTab('dashboard');
    }
  }, [activeTab, canAccessPayment]);

  // Fetch live team data from backend on mount
  useEffect(() => {
    let cancelled = false;

    const refreshDashboardSettings = () => getTeamDashboardSettings()
      .then((res) => {
        if (!cancelled && res?.data) {
          if (res.data.settings) {
            setSettings(res.data.settings);
            setDynamicSettings(res.data.settings);
          }
          if (res.data.result) setTeamResult(res.data.result);
          if (res.data.paymentEligibility) setPaymentEligibility(res.data.paymentEligibility);
        }
      })
      .catch(() => { });

    refreshDashboardSettings();
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  useLiveRefresh(async () => {
    const [teamRes, subRes, settingsRes, tracksRes] = await Promise.all([
      getMyTeam().catch(() => null),
      getMySubmission().catch(() => null),
      getTeamDashboardSettings().catch(() => null),
      getParticipantTracks().catch(() => null),
    ]);

    if (teamRes?.data) {
      setLiveTeam(teamRes.data);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(teamRes.data));
      } catch { }
    }
    if (subRes?.data) {
      setSubmissionState({
        fileName: subRes.data.original_name || subRes.data.fileName,
        fileSize: subRes.data.file_size || 'PDF/PPT',
        date: new Date(subRes.data.uploaded_at || Date.now()).toLocaleDateString(),
      });
    }
    if (settingsRes?.data) {
      setSettings(settingsRes.data.settings || settingsRes.data);
      setDynamicSettings(settingsRes.data.settings || settingsRes.data);
      if (settingsRes.data.result) setTeamResult(settingsRes.data.result);
      if (settingsRes.data.paymentEligibility) setPaymentEligibility(settingsRes.data.paymentEligibility);
    }
    if (tracksRes?.data) {
      setProblems(tracksRes.data.map((track) => ({
        id: track.id || track.track_id,
        title: track.title || track.name,
        description: track.description,
        domain: track.domain || track.category || track.theme || 'General',
        tags: track.tags || [],
      })));
    }
  });

  // User selection & submission & payment state
  // Inside your UserDashboard component function:
  const [selectedProb, setSelectedProb] = useState(null);
  const [submission, setSubmissionState] = useState(null);
  const [paymentRecord, setPaymentRecord] = useState(null);
  const paymentStatus = paymentRecord?.status || null;

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewProblemModal, setViewProblemModal] = useState(null);
  const [confirmSelectModal, setConfirmSelectModal] = useState(null);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [membersForm, setMembersForm] = useState([]);
  const [txnIdInput, setTxnIdInput] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState('');

  // Fetch live tracks, announcements, team, submission, and payment data on mount
  useEffect(() => {
    let cancelled = false;

    // 1. Fetch participant tracks
    getParticipantTracks()
      .then((res) => {
        if (!cancelled && res?.data) {
          const mappedProblems = res.data.map(track => ({
            id: track.id || track.track_id,
            title: track.title || track.name,
            description: track.description,
            domain: track.domain || track.category || track.theme || 'General',
            tags: track.tags || []
          }));
          setProblems(mappedProblems);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch backend tracks:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingProblems(false);
      });

    // 3. Fetch live team and submission from the backend
    Promise.all([
      getMyTeam().catch(() => null),
      getMySubmission().catch(() => null),
    ]).then(([teamRes, subRes]) => {
      if (cancelled) return;

      if (teamRes?.data) {
        setLiveTeam(teamRes.data);
        if (teamRes.data.payment) {
          const paymentData = {
            fileName: teamRes.data.payment.original_name,
            status: teamRes.data.payment.status,
          };
          setPaymentRecord(paymentData);
        }
      }

      if (subRes?.data) {
        setSubmissionState({
          fileName: subRes.data.original_name || subRes.data.fileName,
          fileSize: subRes.data.file_size || 'PDF/PPT',
          date: new Date(subRes.data.uploaded_at || Date.now()).toLocaleDateString(),
        });
      }
    });

    const refreshPaymentStatus = async () => {
      const teamRes = await getMyTeam().catch(() => null);
      if (cancelled || !teamRes?.data) return;

      setLiveTeam(teamRes.data);
      if (teamRes.data.payment) {
        setPaymentRecord({
          fileName: teamRes.data.payment.original_name,
          status: teamRes.data.payment.status,
        });
      }
    };

    window.addEventListener('focus', refreshPaymentStatus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshPaymentStatus);
    };
  }, [teamId]);
  const lenis = useLenis();

  // Lock background body scroll & pause Lenis smooth scroll when any modal is open
  const isAnyModalOpen = Boolean(viewProblemModal || confirmSelectModal || showEditTeamModal);
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      lenis?.stop();
    } else {
      document.body.style.overflow = '';
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
      lenis?.start();
    };
  }, [isAnyModalOpen, lenis]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Countdown timer calculation
  const daysRemaining = useMemo(() => {
    if (!settings.deadline) return 0;
    const diff = new Date(settings.deadline) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [settings.deadline]);

  // Handlers
  const handlePaymentScreenshotUpload = async (file) => {
    if (!file) return;

    // Basic validation for image formats
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, or WEBP).');
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      alert('Payment screenshot must be 1 MB or smaller.');
      return;
    }

    try {
      const res = await uploadPaymentProof(file);
      if (res.success) {
        // Update local UI state with server response data
        setPaymentRecord({
          fileName: res.data.fileName,
          status: res.data.status,
        });
          const teamRes = await getMyTeam();
          if (teamRes?.data) setLiveTeam(teamRes.data);
        showToast('Payment screenshot uploaded successfully! Pending verification.');
      }
    } catch (err) {
      alert(err.message || 'Payment upload failed. Please try again.');
    }
  };

  const openEditTeamModal = () => {
    // Prefer live team members; fall back to local team members
    const rawMembers = liveTeam?.members || currentTeam?.members || [];
    const list = JSON.parse(JSON.stringify(rawMembers)).map((m) => ({
      ...m,
      role: m.custom_role || m.role || 'Member',
      avatar: (m.name || 'TM').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
    }));
    setMembersForm(list);
    setShowEditTeamModal(true);
  };

  const handleSaveTeamMembers = async (e) => {
    e.preventDefault();
    if (membersForm.length < 3 || membersForm.length > 4) {
      alert('A team must have between 3 and 4 members.');
      return;
    }

    try {
      // Call update API
      await updateTeamMembers(currentTeam?.id || teamId, membersForm);

      const teamRes = await getMyTeam();
      if (teamRes?.data) setLiveTeam(teamRes.data);
      setShowEditTeamModal(false);
      showToast('Team member details updated successfully!');
    } catch (error) {
      console.error('Failed to update members:', error);
      alert('Failed to update team members. Please try again.');
    }
  };

  const handleAddMemberForm = () => {
    if (membersForm.length !== 3) {
      alert('Add Member is available only when the team has 3 members.');
      return;
    }
    setMembersForm([...membersForm, { name: '', role: 'Developer', avatar: 'TM' }]);
  };

  const handleRemoveMemberForm = (index) => {
    if (membersForm.length !== 4 || index === 0) {
      alert('Remove is available only for non-lead members when the team has 4 members.');
      return;
    }
    setMembersForm(membersForm.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...membersForm];
    updated[index][field] = value;
    if (field === 'name') {
      const parts = value.trim().split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : (value.slice(0, 2) || 'TM').toUpperCase();
      updated[index].avatar = initials;
    }
    setMembersForm(updated);
  };

  // Inside UserDashboard.jsx

  const handleSelectProblem = async (prob) => {
    try {
      // Call your API helper to save selection on the backend
      const response = await apiFetch('/api/team/select-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: prob.id })
      });

      if (response.success) {
        // Update local state so UI instantly highlights it as selected
        setSelectedProb(prob);

        // If you maintain a live team state object in the dashboard, update it too:
        setLiveTeam(prev => ({
          ...prev,
          problem_statement_id: prob.id,
          problem_statement: prob.title,
          theme_track: prob.category || prob.domain
        }));
        const teamRes = await getMyTeam();
        if (teamRes?.data) setLiveTeam(teamRes.data);

        showToast(`Selected Problem ${prob.id}!`);
      }
    } catch (err) {
      console.error('Failed to select problem statement:', err);
      alert(err.message || 'Failed to select problem statement.');
    }
  };

  const confirmProblemSelection = async () => {
    if (!confirmSelectModal) return;
    const probToSelect = confirmSelectModal;
    setConfirmSelectModal(null);
    await handleSelectProblem(probToSelect);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.ppt', '.pptx'].includes(ext)) {
      alert('Invalid file format. Please upload a .pdf, .ppt, or .pptx file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Presentation file must be 10 MB or smaller.');
      return;
    }

    try {
      const res = await uploadSubmission(file);
      if (res.success) {
        setSubmissionState({
          ...res.data,
          fileName: res.data.fileName || res.data.filename,
          fileSize: res.data.fileSize || `${Math.round((res.data.size || file.size) / 1024 / 1024 * 100) / 100} MB`,
          date: res.data.date || new Date(res.data.uploadedAt || Date.now()).toLocaleDateString(),
          status: 'Submitted',
        });
        const submissionRes = await getMySubmission();
        if (submissionRes?.data) {
          setSubmissionState({
            fileName: submissionRes.data.original_name || submissionRes.data.fileName,
            fileSize: submissionRes.data.file_size || 'PDF/PPT',
            date: new Date(submissionRes.data.uploaded_at || Date.now()).toLocaleDateString(),
            status: 'Submitted',
          });
        }
        showToast('Presentation submitted successfully to Supabase & Neon!');
      }
    } catch (err) {
      alert(err.message || 'Upload failed. Please try again.');
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const acceptingSubmissions = dynamicSettings?.acceptingSubmissions !== false;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredProblems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return problems.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }, [problems, searchQuery]);

  const getRoleIcon = (role = '') => {
    const r = (role || '').toLowerCase();
    if (r.includes('lead')) return Icons.crown;
    if (r.includes('design') || r.includes('ux')) return Icons.palette;
    if (r.includes('ai') || r.includes('research') || r.includes('ml')) return Icons.cpu;
    if (r.includes('dev') || r.includes('full stack') || r.includes('backend') || r.includes('embedded') || r.includes('engineer')) return Icons.code;
    return Icons.user;
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 2000,
              background: 'rgba(14, 20, 34, 0.95)',
              border: '1px solid rgba(113, 167, 255, 0.4)',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: 12,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Side Navbar */}
      <aside className={styles.sidebar}>
        <div className={styles.brandGroup} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', lineHeight: 1.2, gap: '20px' }}>
            <img style={{ maxHeight: '50px', width: 'auto', height: 'auto', objectFit: 'contain' }} src="/logo.png" alt="RepoForge" />
            <img style={{ maxHeight: '50px', width: 'auto', height: 'auto', objectFit: 'contain' }} src="/title-logo.png" alt="RepoForge" />
          </div>
          <span className={styles.brandSub}>PARTICIPANT</span>
        </div>

        <nav className={styles.tabs}>
          {NAV_TABS.filter((tab) => tab.id !== 'payment' || canAccessPayment).map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabItem} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {Icons.user}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <strong className={styles.userTeamName}>{currentTeam?.teamName || 'Participant'}</strong>
              <span className={styles.userTeamId}>{teamId}</span>
            </div>
          </div>


          <div style={{ marginTop: 8, width: '100%' }}>
            <button type="button" className={`${styles.sidebarAction} ${styles.sidebarActionDanger}`} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* ── 1. DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div>
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeText}>
                <h1>Welcome back, {currentTeam?.teamName || 'Team'}!</h1>
                <p>Track your team progress, selected problem statement, and presentation deadline.</p>
              </div>
              <div className={styles.statusPill}>
                {Icons.statusDot} Hackathon Status: {dynamicSettings.acceptingSubmissions === false ? 'Submissions Closed' : settings.hackathonStatus}
              </div>
            </div>

            <div className={styles.statusGrid}>
              {/* Featured 2x2 Problem Card */}
              <div className={styles.featuredProblemCard}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={styles.cardIcon}>{Icons.target}</span>
                      <span className={styles.cardLabel}>Your Selected Problem</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 12px', lineHeight: 1.35, letterSpacing: '-0.02em' }}>
                    {selectedProb ? selectedProb.title : 'No Problem Statement Selected Yet'}
                  </h3>

                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                    {selectedProb
                      ? selectedProb.description || 'Focus on building an automated, scalable solution with high real-world impact for jury evaluation.'
                      : 'Explore available hackathon problem statements (PS001–PS010) and select your official track to get started.'}
                  </p>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-start' }}>
                  <StarBorder
                    as="button"
                    color="#FAB600"
                    backgroundColor="#261005"
                    borderColor="rgba(250, 182, 0, 0.4)"
                    onClick={() => setActiveTab('problems')}
                  >
                    {selectedProb ? 'Change / Explore Problems →' : 'Select a Problem Statement →'}
                  </StarBorder>
                </div>
              </div>

              {/* Col 3, Row 1: Shortlist Status */}
              <div className={styles.statusCard}>
                <span className={styles.cardIcon}>{Icons.star}</span>
                <span className={styles.cardLabel}>Shortlist Status</span>
                <span className={styles.cardValue}>
                  {(() => {
                    const s = currentTeam?.shortlistStatus || (currentTeam?.shortlisted ? 'Shortlisted' : null) || teamResult?.shortlist_status || (teamResult?.shortlisted ? 'Shortlisted' : 'Under-Review');
                    if (s === 'Shortlisted') return <span style={{ color: '#22c55e' }}>✦ Shortlisted</span>;
                    if (s === 'Waitlisted') return <span style={{ color: '#eab308' }}>⧖ Waitlisted</span>;
                    if (s === 'Eliminated') return <span style={{ color: '#ef4444' }}>✕ Eliminated</span>;
                    return <span style={{ color: '#94a3b8' }}>⊙ Under Review</span>;
                  })()}
                </span>
              </div>

              {/* Col 4, Row 1: Submission Status */}
              <div className={styles.statusCard}>
                <span className={styles.cardIcon}>{Icons.folder}</span>
                <span className={styles.cardLabel}>Submission Status</span>
                <span className={styles.cardValue}>
                  {submission?.status === 'Submitted' || currentTeam?.submissionStatus === 'Submitted' || submission ? (
                    <span style={{ color: '#22c55e' }}>Submitted</span>
                  ) : submission?.status === 'Draft' ? (
                    <span style={{ color: '#eab308' }}>Draft Saved</span>
                  ) : (
                    'Pending Upload'
                  )}
                </span>
              </div>

              {/* Col 3, Row 2: Submission Deadline */}
              <div className={styles.statusCard}>
                <span className={styles.cardIcon}>{Icons.clock}</span>
                <span className={styles.cardLabel}>Submission Deadline</span>
                <span className={styles.cardValue}>
                  {daysRemaining > 0 ? `${daysRemaining} Days Remaining` : 'Deadline Passed'}
                </span>
              </div>

              {/* Col 4, Row 2: Offline Round Eligibility / Payment */}
              {canAccessPayment && (
                <div className={styles.statusCard}>
                  <span className={styles.cardIcon}>{Icons.creditCard}</span>
                  <span className={styles.cardLabel}>Offline Round Eligibility</span>
                  <span className={styles.cardValue} style={{ fontSize: '0.88rem' }}>
                    {paymentStatus === 'Verified' ? (
                      <span style={{ color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        {Icons.checkCircle} Verified & Eligible
                      </span>
                    ) : paymentStatus === 'Pending' ? (
                      <span style={{ color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        {Icons.clock} Pending Verification
                      </span>
                    ) : paymentStatus === 'Rejected' ? (
                      <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        {Icons.alertTriangle} Payment Rejected
                      </span>
                    ) : (
                      <StarBorder
                        as="button"
                        color="#ff6b75"
                        backgroundColor="#2a1215"
                        borderColor="rgba(255, 107, 117, 0.4)"
                        textColor="#ff6b75"
                        onClick={() => setActiveTab('payment')}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {Icons.alertTriangle} Pay Fee Now {Icons.arrowRight}
                        </span>
                      </StarBorder>
                    )}
                  </span>
                </div>
              )}
              {/* Col: Result Announcement Card */}
              {teamResult?.published && (
                <div className={styles.statusCard} style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(217,119,6,0.05))', border: '1px solid rgba(234,179,8,0.4)' }}>
                  <span className={styles.cardIcon} style={{ color: '#eab308' }}>{Icons.award}</span>
                  <span className={styles.cardLabel}>Final Hackathon Verdict</span>
                  <span className={styles.cardValue} style={{ fontSize: '1.1rem', color: '#eab308', fontWeight: 800 }}>
                    {teamResult.rank >= 1 && teamResult.rank <= 4
                      ? `🎉 Winner! Secured Rank #${teamResult.rank}`
                      : '💡 Results are out. Better luck next time!'}
                  </span>
                </div>
              )}

            </div>

            <div className={styles.panelsLayout}>

              {/* Right Column: Your Team Quick View */}
              <div>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {Icons.team} Your Team ({currentTeam?.members?.length || 4})
                    </h3>
                    <SqBtn onClick={() => setActiveTab('team')}>View All</SqBtn>
                  </div>
                  <div className={styles.memberList}>
                    {currentTeam?.members?.map((m) => (
                      <div key={m.name} className={styles.memberItem}>
                        <div className={styles.memberAvatar}>
                          {getRoleIcon(m.role)}
                        </div>
                        <div>
                          <div className={styles.memberName}>{m.name}</div>
                          <div className={styles.memberRole} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {getRoleIcon(m.role)} {m.role}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. PROBLEM STATEMENTS TAB ── */}
        {activeTab === 'problems' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Explore Problem Statements</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', fontSize: '0.9rem' }}>
                  Browse available hackathon challenges and select your official track.
                </p>
              </div>
              <input
                type="text"
                placeholder="Search by ID, title, domain, or tag..."
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '10px 16px',
                  color: '#fff',
                  width: 300,
                  outline: 'none',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loadingProblems ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono' }}>
                Loading tracks from backend...
              </div>
            ) : filteredProblems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)' }}>
                No problem statements found.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {filteredProblems.map((prob) => {
                  const isSelected = selectedProb?.id === prob.id;
                  return (
                    <div
                      key={prob.id}
                      style={{
                        background: 'linear-gradient(145deg, rgba(38,16,5,0.92), rgba(26,12,5,0.88))',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: isSelected ? '1.5px solid #FAB600' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 20,
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 16,
                        boxShadow: isSelected
                          ? '0 0 20px rgba(250,182,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)'
                          : '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                      }}
                    >
                      {/* Card content mapping (Keep your existing card markup here) */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'JetBrains Mono', color: '#FAB600', fontWeight: 700, fontSize: '0.82rem' }}>
                            {prob.id}
                          </span>
                          <span style={{ background: 'rgba(250,182,0,0.15)', color: '#FAB600', padding: '4px 10px', borderRadius: 999, fontSize: '0.7rem', fontFamily: 'JetBrains Mono' }}>
                            {prob.domain}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '12px 0 8px' }}>{prob.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{prob.description}</p>
                      </div>

                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                          {/* Safe handling if tags is string or array */}
                          {(Array.isArray(prob.tags) ? prob.tags : (prob.tags ? prob.tags.split(',') : [])).map((t) => (
                            <span key={t} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>
                              #{typeof t === 'string' ? t.trim() : t}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <StarBorder onClick={() => setViewProblemModal(prob)} color="#FAB600" backgroundColor="#261005" borderColor="rgba(250, 182, 0, 0.4)" textColor="#ffffff" speed="5s">
                            View Details
                          </StarBorder>
                          <StarBorder onClick={() => handleSelectProblem(prob)} color={isSelected ? '#22c55e' : '#FAB600'} backgroundColor={isSelected ? '#0a2a16' : '#261005'} borderColor={isSelected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(250, 182, 0, 0.4)'} textColor={isSelected ? '#22c55e' : '#ffffff'} speed="4s">
                            {isSelected ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{Icons.check} Selected</span> : 'Select Problem'}
                          </StarBorder>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 3. MY TEAM TAB ── */}
        {activeTab === 'team' && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{currentTeam?.teamName}</h2>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#FAB600', fontSize: '0.85rem' }}>Team ID: {currentTeam?.id}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={styles.statusPill}>{Icons.statusDot} Registered & Active</span>
                {isLeader && (
                  <SqBtn onClick={openEditTeamModal} size="sm">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {Icons.edit} Edit Team Members
                    </span>
                  </SqBtn>
                )}
              </div>
            </div>

            <h3 style={{ marginTop: 24, fontSize: '1.1rem' }}>Team Members ({currentTeam?.members?.length})</h3>
            <div className={styles.memberList} style={{ marginTop: 16 }}>
              {currentTeam?.members?.map((m) => (
                <div key={m.name} className={styles.memberItem} style={{ padding: 16 }}>
                  <div className={styles.memberAvatar} style={{ width: 44, height: 44, fontSize: '1rem' }}>
                    {getRoleIcon(m.role)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '1rem' }}>{m.name}</strong>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {getRoleIcon(m.role)} {m.role}
                    </div>
                  </div>
                  {m.role.includes('Leader') && (
                    <span style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontFamily: 'JetBrains Mono', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {Icons.crown} Team Lead
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. SUBMISSION TAB ── */}
        {activeTab === 'submission' && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Final Presentation Submission</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', fontSize: '0.9rem' }}>
                  Upload your pitch deck (.pdf, .ppt, .pptx up to 10MB) for jury evaluation.
                </p>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.82rem', color: submission ? '#22c55e' : '#eab308' }}>
                {submission ? 'Submitted' : 'Pending'}
              </span>
            </div>

            {submission ? (
              <div style={{ padding: 24, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, marginTop: 20 }}>
                <h3 style={{ margin: 0, color: '#22c55e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {Icons.checkCircle} Presentation Submitted!
                </h3>
                <p style={{ color: '#ffffff', marginTop: 12, fontSize: '0.95rem' }}>
                  File Name: <strong style={{ color: '#FAB600' }}>{submission.fileName}</strong>
                  <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>({submission.fileSize || 'PDF/PPT'})</span>
                </p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
                  Submitted on: {submission.date}
                </p>
                <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22c55e', fontSize: '0.82rem', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                  ✓ Final Submission Locked
                </div>
              </div>
            ) : !acceptingSubmissions ? (
              <div style={{ padding: 24, background: 'rgba(255,107,117,0.08)', border: '1px solid rgba(255,107,117,0.3)', borderRadius: 20, marginTop: 20 }}>
                <h3 style={{ margin: 0, color: '#ff6b75', fontSize: '1.2rem' }}>Presentation Submissions Closed</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: '10px 0 0', lineHeight: 1.5 }}>
                  The organizers are no longer accepting presentation uploads.
                </p>
              </div>
            ) : (
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload-input').click()}
                style={{ marginTop: 24 }}
              >
                <span className={styles.dropIcon}>{Icons.uploadCloud}</span>
                <strong style={{ fontSize: '1.1rem' }}>Click or Drag & Drop to Upload Presentation</strong>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  Supports PDF, PPT, PPTX up to 10 MB
                </span>
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>
            )}
          </div>
        )}

        {/* ── 5. OFFLINE ROUND PAYMENT TAB ── */}
        {activeTab === 'payment' && canAccessPayment && (
          <div className={styles.panel} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 0, padding: 24, boxSizing: 'border-box' }}>
            <div className={styles.panelHeader} style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>Offline Round Registration & Payment</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', fontSize: '0.88rem' }}>
                  Scan the QR code below, complete your team fee, and upload the payment receipt screenshot for verification.
                </p>
              </div>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.82rem',
                  padding: '5px 14px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background:
                    paymentStatus === 'Verified'
                      ? 'rgba(34, 197, 94, 0.15)'
                      : paymentStatus === 'Pending'
                        ? 'rgba(234, 179, 8, 0.15)'
                        : 'rgba(255, 107, 117, 0.15)',
                  color:
                    paymentStatus === 'Verified'
                      ? '#22c55e'
                      : paymentStatus === 'Pending'
                        ? '#eab308'
                        : '#ff6b75',
                  border: `1px solid ${paymentStatus === 'Verified'
                    ? 'rgba(34, 197, 94, 0.3)'
                    : paymentStatus === 'Pending'
                      ? 'rgba(234, 179, 8, 0.3)'
                      : 'rgba(255, 107, 117, 0.3)'
                    }`,
                }}
              >
                {paymentStatus === 'Verified' ? (
                  <>{Icons.checkCircle} Payment Verified</>
                ) : paymentStatus === 'Pending' ? (
                  <>{Icons.clock} Pending Verification</>
                ) : (
                  <>{Icons.alertTriangle} Registration Unpaid</>
                )}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 24, flex: 1 }}>
              {/* Left Column: QR Code & Payment Details */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justify: 'space-between',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  height: '100%',
                }}
              >
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', color: '#FAB600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Official Registration Fee
                    </span>
                    <h3 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffffff', margin: '4px 0 0' }}>₹300 / Team</h3>
                  </div>

                  {/* QR Code Container */}
                  <div
                    style={{
                      background: '#000000',
                      padding: 14,
                      borderRadius: 18,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      margin: '14px auto',
                      display: 'inline-block',
                    }}
                  >
                    <img
                      src={qrCodeImg}
                      alt="UPI QR Code for Hackathon Registration Payment"
                      style={{ width: 240, height: 240, borderRadius: 14, objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                </div>

                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      background: 'rgba(250,182,0,0.08)',
                      border: '1px solid rgba(250,182,0,0.2)',
                      borderRadius: 12,
                      padding: '10px 16px',
                      width: '100%',
                      boxSizing: 'border-box',
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono' }}>UPI ID</span>
                    <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#FAB600', fontFamily: 'JetBrains Mono' }}>parabkesarp20@okhdfcbank</div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
                    Scan using GPay, PhonePe, Paytm, or BHIM to pay ₹300. Upload your payment screenshot for verification.
                  </p>
                </div>
              </div>

              {/* Right Column: Screenshot Upload Dropzone & Status Card */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  boxSizing: 'border-box',
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '1.15rem', color: '#ffffff' }}>Payment Screenshot Submission</h3>

                  {paymentRecord ? (
                    <div style={{ padding: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono' }}>UPLOADED SCREENSHOT</span>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#FAB600', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {Icons.fileText} {paymentRecord.fileName}
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('reupload-payment-input').click()}
                        style={{
                          marginTop: 14,
                          background: 'rgba(113, 167, 255, 0.1)',
                          border: '1px solid rgba(113, 167, 255, 0.25)',
                          borderRadius: 8,
                          padding: '8px 16px',
                          color: '#FAB600',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {Icons.refresh} Re-upload Screenshot
                      </button>
                      <input
                        id="reupload-payment-input"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => e.target.files?.[0] && handlePaymentScreenshotUpload(e.target.files[0])}
                      />
                    </div>
                  ) : (
                    <div
                      className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handlePaymentScreenshotUpload(file);
                      }}
                      onClick={() => document.getElementById('payment-screenshot-input').click()}
                      style={{ padding: '36px 20px', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span className={styles.dropIcon} style={{ display: 'inline-flex', justifyContent: 'center', color: '#FAB600', marginBottom: 8 }}>
                        {Icons.camera}
                      </span>
                      <strong style={{ fontSize: '1.02rem', color: '#ffffff' }}>Click or Drag & Drop Payment Screenshot</strong>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: 4 }}>
                        Supports PNG, JPG, JPEG, WEBP (Max 1MB)
                      </span>
                      <input
                        id="payment-screenshot-input"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => e.target.files?.[0] && handlePaymentScreenshotUpload(e.target.files[0])}
                      />
                    </div>
                  )}
                </div>

                {/* Status Box */}
                <div style={{ marginTop: 16 }}>
                  {paymentStatus === 'Verified' ? (
                    <div
                      style={{
                        padding: 18,
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))',
                        border: '1px solid rgba(34,197,94,0.4)',
                        borderRadius: 16,
                        textAlign: 'center',
                        boxShadow: '0 0 25px rgba(34, 197, 94, 0.15)',
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', marginBottom: 6 }}>
                        {Icons.award}
                      </div>
                      <strong style={{ color: '#22c55e', fontSize: '1.05rem', display: 'block' }}>Payment Verified & Approved!</strong>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', margin: '4px 0 0', lineHeight: 1.5 }}>
                        Congratulations! Your team <strong>{currentTeam?.teamName}</strong> is officially verified and eligible to compete in the Offline Hackathon Round at the Main Campus Auditorium!
                      </p>
                    </div>
                  ) : paymentStatus === 'Pending' ? (
                    <div
                      style={{
                        padding: 16,
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: 16,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#eab308', marginBottom: 4 }}>
                        {Icons.clock}
                      </div>
                      <strong style={{ color: '#eab308', fontSize: '0.95rem', display: 'block' }}>Payment Pending Verification</strong>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: '4px 0 0', lineHeight: 1.4 }}>
                        The organizing team is reviewing your uploaded payment screenshot. Verification usually takes 2–4 hours. Once verified, your status will update automatically!
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 16,
                        background: 'rgba(255, 107, 117, 0.08)',
                        border: '1px solid rgba(255, 107, 117, 0.25)',
                        borderRadius: 16,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b75', marginBottom: 4 }}>
                        {Icons.alertTriangle}
                      </div>
                      <strong style={{ color: '#ff6b75', fontSize: '0.92rem', display: 'block' }}>Registration Fee Unpaid</strong>
                      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                        Please upload your payment screenshot above to submit for offline round verification.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal for Problem Selection */}
      {confirmSelectModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setConfirmSelectModal(null)}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent="true"
          >
            <h2>Confirm Problem Selection</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              Are you sure you want to select <strong>{confirmSelectModal.id} — {confirmSelectModal.title}</strong> as your official hackathon problem statement?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <StarBorder
                onClick={() => setConfirmSelectModal(null)}
                color="#ff6b75"
                backgroundColor="#2a1215"
                borderColor="rgba(255, 107, 117, 0.4)"
                textColor="#ff6b75"
              >
                Cancel
              </StarBorder>
              <StarBorder
                onClick={confirmProblemSelection}
                color="#22c55e"
                backgroundColor="#0a2a16"
                borderColor="rgba(34, 197, 94, 0.5)"
                textColor="#22c55e"
              >
                Confirm Selection
              </StarBorder>
            </div>
          </div>
        </div>
      )}

      {/* Problem View Modal */}
      {viewProblemModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setViewProblemModal(null)}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent="true"
          >
            <span style={{ fontFamily: 'JetBrains Mono', color: '#FAB600', fontWeight: 700 }}>{viewProblemModal.id}</span>
            <h2>{viewProblemModal.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{viewProblemModal.description}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <StarBorder
                onClick={() => setViewProblemModal(null)}
                color="#FAB600"
                backgroundColor="#261005"
                borderColor="rgba(250, 182, 0, 0.4)"
                textColor="#ffffff"
              >
                Close
              </StarBorder>
            </div>
          </div>
        </div>
      )}


      {/* Edit Team Members Modal */}
      {showEditTeamModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowEditTeamModal(false)}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(100%, 620px)', maxHeight: '85vh', overflow: 'hidden' }}
            data-lenis-prevent="true"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Edit Team Members</h2>
              {membersForm.length === 3 && (
                <SqBtn onClick={handleAddMemberForm} size="sm">+ Add Member</SqBtn>
              )}
            </div>

            <div className={styles.editMembersScroll} data-lenis-prevent="true">
              <form onSubmit={handleSaveTeamMembers} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {membersForm.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono', color: '#FAB600', fontSize: '0.85rem', fontWeight: 700 }}>
                      Member {idx + 1} {idx === 0 ? '(Team Leader)' : ''}
                    </span>
                    {membersForm.length === 4 && idx > 0 && (
                      <SqBtn onClick={() => handleRemoveMemberForm(idx)} danger size="sm">
                        Remove
                      </SqBtn>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Full Name</label>
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                        placeholder="Member Name"
                        required
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: '0.9rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Role</label>
                      <input
                        type="text"
                        value={m.role}
                        onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                        placeholder="e.g. Developer, Designer, AI Lead"
                        required
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: '0.9rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                  <SqBtn onClick={() => setShowEditTeamModal(false)} danger>
                    Cancel
                  </SqBtn>
                  <SqBtn type="submit" lineColor="#22c55e" baseColor="#0a2a16" textColor="#22c55e">
                    Save Changes
                  </SqBtn>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
