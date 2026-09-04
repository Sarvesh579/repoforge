import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLenis } from '../../context/LenisContext.jsx';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import {
  getTracks,
  createTrack,
  updateTrack,
  deleteTrack,
  getAdminTeams,
  stageShortlist,
  getAdminSubmissions,
  assignAdminWinner,
  getHackathonSettings,
  updateHackathonSettings,
  publishHackathonResults,
  unpublishHackathonResults,
  verifyTeamPayment,
  updatePaymentStatus
} from '../../lib/api'; // <--- Switch from portalStorage to real api.js
import LoadingOverlay from '../../components/ui/LoadingOverlay';

import styles from './AdminDashboard.module.css';

/* ── SVG Nav Icons ── */
const NavIcons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
    </svg>
  ),
  problems: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  ),
  teams: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  submissions: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z" />
      <polyline points="13 2 13 9 20 9" />
      <line x1="12" y1="18" x2="12" y2="13" />
      <polyline points="9 15 12 12 15 15" />
    </svg>
  ),
  results: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z" />
      <path d="M4 22h16" />
      <path d="M10 22V10" />
      <path d="M14 22V10" />
      <path d="M6 9h12l-1.5 4a2 2 0 0 1-1.9 1.4H9.4a2 2 0 0 1-1.9-1.4L6 9z" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
    </svg>
  ),
  checkCircle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z" />
      <path d="M4 22h16" />
      <path d="M10 22V10" />
      <path d="M14 22V10" />
      <path d="M6 9h12l-1.5 4a2 2 0 0 1-1.9 1.4H9.4a2 2 0 0 1-1.9-1.4L6 9z" />
    </svg>
  ),
  medal: (color = 'currentColor') => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="15" r="5" />
      <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      <path d="M15 9l-3-6-3 6" />
    </svg>
  ),
};

const SqBtn = ({ children, onClick, type = 'button', danger = false, success = false, lineColor, baseColor, textColor, size = 'sm', fullWidth = false, style = {} }) => {
  const customStyles = { ...style };
  if (lineColor) customStyles['--line-color'] = lineColor;
  if (baseColor) customStyles['--base-color'] = baseColor;
  if (textColor) customStyles['--text-color'] = textColor;

  return (
    <button
      type={type}
      onClick={onClick}
      style={customStyles}
      className={`${styles.sqBtn} ${danger ? styles.sqBtnDanger : ''} ${success ? styles.sqBtnSuccess : ''} ${fullWidth ? styles.sqBtnFull : ''}`}
    >
      {children}
    </button>
  );
};

const WinnerTeamSelect = ({ teams, value, onChange, accentColor = '#FAB600' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedTeam = teams.find((team) => team.id === value);
  const selectedLabel = selectedTeam ? `${selectedTeam.name || selectedTeam.teamName} (${selectedTeam.id})` : '';
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTeams = teams.filter((team) => {
    const label = `${team.name || team.teamName || ''} ${team.id || ''}`.toLowerCase();
    return label.includes(normalizedQuery);
  });

  return (
    <div className={styles.winnerSelect} style={{ '--winner-accent': accentColor }}>
      <input
        type="text"
        className={styles.winnerSelectInput}
        value={isOpen ? query : selectedLabel}
        placeholder="Select or search team"
        onFocus={() => {
          setQuery('');
          setIsOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        aria-label="Search teams for rank assignment"
      />
      <span className={styles.winnerSelectChevron}>⌄</span>
      {isOpen && (
        <div className={styles.winnerSelectMenu}>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(''); setIsOpen(false); }}>
            Select Team
          </button>
          {filteredTeams.map((team) => (
            <button
              type="button"
              key={team.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(team.id); setQuery(''); setIsOpen(false); }}
            >
              {team.name || team.teamName} ({team.id})
            </button>
          ))}
          {!filteredTeams.length && <span className={styles.winnerSelectEmpty}>No teams found</span>}
        </div>
      )}
    </div>
  );
};

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: NavIcons.dashboard },
  { id: 'problems', label: 'Problem Statements', icon: NavIcons.problems },
  { id: 'teams', label: 'Teams', icon: NavIcons.teams },
  { id: 'submissions', label: 'Submissions', icon: NavIcons.submissions },
  { id: 'results', label: 'Results', icon: NavIcons.results },
  { id: 'settings', label: 'Settings', icon: NavIcons.settings },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');

  const [problems, setProblems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [winners, setWinners] = useState({ first: null, second: null, third: null, fourth: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [viewProblem, setViewProblem] = useState(null);

  // Form states
  const [probForm, setProbForm] = useState({ title: '', category: 'General', short_description: '', description: '', difficulty: 'Intermediate', reward: '', tags: '', published: false });
  const [settings, setSettings] = useState({
    name: 'RepoForge Hackathon',
    year: 2026,
    deadline: '',
    payment_deadline: '',
    hackathonStatus: 'Live',
    registrationStatus: 'Open',
    acceptingSubmissions: true,
  });
  // Fetch Database Data on Mount & Tab Change
  // Inside fetchData() in AdminDashboard.jsx
  // Inside fetchData() in AdminDashboard.jsx
  const fetchData = async () => {
    try {
      const [tracksRes, teamsRes, subsRes] = await Promise.all([
        getTracks(),
        getAdminTeams(),
        getAdminSubmissions(),
      ]);

      if (tracksRes.success) {
        setProblems(tracksRes.data.map((track) => ({
          ...track,
          domain: track.domain || track.category || 'General',
        })));
      }
      if (teamsRes.success) setTeams(teamsRes.data);
      if (subsRes.success) setSubmissions(subsRes.data);

      // Map existing ranks from team result objects to the winners state
      const winnerMap = { first: null, second: null, third: null, fourth: null };
      teamsRes.data.forEach(t => {
        if (t.result?.rank === 1) winnerMap.first = t.id;
        if (t.result?.rank === 2) winnerMap.second = t.id;
        if (t.result?.rank === 3) winnerMap.third = t.id;
        if (t.result?.rank === 4) winnerMap.fourth = t.id;
      });
      setWinners(winnerMap);
    } catch (err) {
      showToast('Failed to sync data from database.');
    }
  };
  useEffect(() => {
    fetchData();
    getHackathonSettings().then((res) => {
      if (res?.success && res.data) setSettings(res.data);
    }).catch(() => {
      showToast('Failed to load hackathon settings.');
    });
  }, []);

  useLiveRefresh(async () => {
    await Promise.all([
      fetchData(),
      getHackathonSettings().then((res) => {
        if (res?.success && res.data) setSettings(res.data);
      }),
    ]);
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Analytics computed from real database state
  const metrics = useMemo(() => {
    const totalTeams = teams.length;
    const submittedTeams = teams.filter((t) => t.submissionStatus === 'submitted').length;
    const pendingReviews = teams.filter((t) => t.submissionStatus === 'submitted' && !t.shortlisted).length;
    const shortlistedCount = teams.filter((t) => t.shortlisted).length;
    return { totalTeams, submittedTeams, pendingReviews, shortlistedCount, problemsCount: problems.length };
  }, [teams, problems]);

  // Handlers connected to Backend APIs
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await updateHackathonSettings(settings);
      if (response?.data) setSettings(response.data);
      showToast('Settings saved & submission rules updated!');
    } catch (err) {
      showToast('Error saving settings');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPaymentDeadline = async () => {
    if (!settings.payment_deadline) {
      showToast('Choose a payment deadline first.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await updateHackathonSettings(settings);
      if (response?.data) setSettings(response.data);
      showToast('Payment deadline set successfully!');
    } catch (err) {
      showToast('Error setting payment deadline.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleVerify = async (teamId) => {
    setActionLoading(true);
    try {
      const res = await verifyTeamPayment(teamId);
      if (res?.success) {
        alert("✅ Payment successfully verified!");
        await fetchData();
      } else {
        alert(res?.error || "Failed to verify payment.");
      }
    } catch (error) {
      alert("An error occurred while verifying.");
    } finally {
      setActionLoading(false);
    }
  };
  const handleStatusChange = async (teamId, newStatus) => {
    setActionLoading(true);
    try {
      // Call the imported function directly
      const res = await updatePaymentStatus(teamId, newStatus);

      if (res?.success) {
        setTeams((prevTeams) =>
          prevTeams.map((t) =>
            t.id === teamId
              ? { ...t, payment: { ...t.payment, status: newStatus } }
              : t
          )
        );
        await fetchData();
        alert(`Payment status updated to ${newStatus}`);
      } else {
        alert(res?.error || "Failed to update status.");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(error.message || "An error occurred.");
    } finally {
      setActionLoading(false);
    }
  };
  const handleCreateProblem = async (e) => {
    e.preventDefault();
    try {
      if (editingProblem) {
        await updateTrack(editingProblem.id, probForm);
        showToast('Problem Statement updated in DB!');
      } else {
        await createTrack(probForm);
        showToast('New Problem Statement added to DB!');
      }
      setShowAddModal(false);
      setEditingProblem(null);
      setProbForm({ title: '', category: 'General', short_description: '', description: '', difficulty: 'Intermediate', reward: '' });
      fetchData();
    } catch (err) {
      showToast('Operation failed');
    }
  };

  const handleDeleteProblem = async (id) => {
    if (window.confirm('Are you sure you want to delete this Problem Statement?')) {
      try {
        await deleteTrack(id);
        showToast('Problem Statement removed from DB');
        fetchData();
      } catch (err) {
        showToast('Delete failed');
      }
    }
  };
  const openEditModal = (prob) => {
    setEditingProblem(prob);
    setProbForm({
      id: prob.id || '',
      title: prob.title || '',
      category: prob.category || prob.domain || 'General',
      short_description: prob.short_description || '',
      tags: Array.isArray(prob.tags) ? prob.tags.join(', ') : (prob.tags || ''),
      description: prob.description || '',
      difficulty: prob.difficulty || 'Intermediate',
      reward: prob.reward || '',
      published: Boolean(prob.published),
    });
    setShowAddModal(true);
  };
  const handleTogglePublish = async (prob) => {
    try {
      const newStatus = !prob.published;
      await updateTrack(prob.id, { ...prob, published: newStatus });
      showToast(`Problem ${prob.id} is now ${newStatus ? 'Published' : 'Hidden'} for participants!`);
      fetchData();
    } catch (err) {
      showToast('Failed to update publication status.');
      console.error(err);
    }
  };

  const handleToggleShortlist = async (teamId, status) => {
    // status is one of: 'Shortlisted' | 'Waitlisted' | 'Under-Review' | 'Eliminated'
    try {
      await stageShortlist(teamId, status);
      await fetchData();
      showToast(`Status updated to: ${status}`);
    } catch (err) {
      console.error('Error updating shortlist status:', err);
      showToast('Failed to update shortlist status.');
    }
  };
  const handleAssignWinner = async (position, teamId) => {
    try {
      await assignAdminWinner(position, teamId);
      showToast(`Assigned ${position} place winner`);
      setWinners({ ...winners, [position]: teamId });
      fetchData();
    } catch (err) {
      showToast('Failed to assign winner');
    }
  };
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishResults = async () => {
    if (!window.confirm("Are you sure you want to publish all results?")) return;

    // Extract all team IDs from your loaded teams state
    const allTeamIds = teams.map((t) => t.id);

    setIsPublishing(true);
    try {
      const res = await publishHackathonResults(allTeamIds);
      if (res?.success) {
        alert("🎉 Results are now live and published to all teams!");
      } else {
        alert(res?.error || "Failed to publish results.");
      }
    } catch (error) {
      alert("An error occurred while publishing.");
    } finally {
      setIsPublishing(false);
    }
  };
  const handleUnpublishResults = async () => {
    if (!window.confirm('Are you sure you want to hide the published results from all user dashboards?')) return;

    try {
      const res = await unpublishHackathonResults();
      if (res?.success) {
        alert('Results are now hidden from user dashboards.');
        await fetchData();
      } else {
        alert(res?.error || 'Failed to unpublish results.');
      }
    } catch (err) {
      alert('An error occurred while unpublishing results.');
    }
  };
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filtered lists
  const filteredProblems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return problems.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [problems, searchQuery]);

  const filteredTeams = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.college.toLowerCase().includes(q)
    );
  }, [teams, searchQuery]);

  return (
    <div className={styles.container}>
      <LoadingOverlay visible={actionLoading} label="Saving changes..." />
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              zIndex: 2000,
              background: '#261005',
              border: '1px solid #FAB600',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '12px',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', lineHeight: 1.2, gap: '20px' }}>
            <img style={{ maxHeight: '50px', width: 'auto', height: 'auto', objectFit: 'contain' }} src="/logo.png" alt="RepoForge" />
            <img style={{ maxHeight: '50px', width: 'auto', height: 'auto', objectFit: 'contain' }} src="/title-logo.png" alt="RepoForge" />
          </div>
          <span className={styles.brandSub}>ADMINISTRATION</span>
        </div>

        <nav className={styles.nav}>
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              <span className={styles.navText}>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminProfile}>
            <div className={styles.adminAvatar}>AD</div>
            <div className={styles.adminDetails}>
              <span className={styles.adminName}>Administrator</span>
              <span className={styles.adminId}>ADMIN001</span>
            </div>
          </div>
          <SqBtn onClick={handleLogout} danger lineColor="#ff6b75">
            Logout
          </SqBtn>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <h1>{NAV_TABS.find((t) => t.id === activeTab)?.label}</h1>
            <p>{settings.name} — Control Center</p>
          </div>
          <div className={styles.headerActions}>
            <span className={`${styles.badge} ${settings.registrationStatus === 'Open' ? styles.badgeGreen : styles.badgeYellow}`}>
              Registration: {settings.registrationStatus}
            </span>
          </div>
        </div>

        {/* ── 1. DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Total Teams</span>
                <span className={styles.metricValue}>{metrics.totalTeams}</span>
                <span className={styles.metricBadge}>Registered Teams</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Pending Reviews</span>
                <span className={styles.metricValue}>{metrics.pendingReviews}</span>
                <span className={styles.metricBadge}>Submitted Teams</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Problem Statements</span>
                <span className={styles.metricValue}>{metrics.problemsCount}</span>
                <span className={styles.metricBadge}>PS001 – PS{String(metrics.problemsCount).padStart(3, '0')}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Shortlisted Teams</span>
                <span className={styles.metricValue}>{metrics.shortlistedCount}</span>
                <span className={styles.metricBadge}>Final Round</span>
              </div>
            </div>


            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Recent Team Registrations</h3>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Team ID</th>
                      <th>Team Name</th>
                      <th>Leader</th>
                      <th>Problem Selected</th>
                      <th>Submission Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'JetBrains Mono', color: '#FAB600', whiteSpace: 'nowrap' }}>{t.id}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <strong>{t.name}</strong>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{t.members?.find((m) => m.role === 'leader')?.name || t.members?.[0]?.name || ''}</td>
                        <td style={{ minWidth: 180, maxWidth: 280, lineHeight: 1.4 }}>{t.problemStatementId || 'Pending Selection'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`${styles.badge} ${t.submitted ? styles.badgeGreen : styles.badgeYellow}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {t.submission ? <>{NavIcons.checkCircle} Submitted</> : <>{NavIcons.clock} Pending</>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. PROBLEM STATEMENTS TAB ── */}
        {activeTab === 'problems' && (
          <div>
            <div className={styles.sectionHeader} style={{ marginBottom: 24 }}>
              <input
                type="text"
                placeholder="Search problems by ID, Title, Domain or Tag..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SqBtn
                onClick={() => {
                  setProbForm({ id: '', title: '', domain: '', tags: '', description: '', difficulty: 'Intermediate' });
                  setEditingProblem(null);
                  setShowAddModal(true);
                }}
              >
                + Add New Problem
              </SqBtn>
            </div>

            <div className={styles.problemsGrid}>
              {filteredProblems.map((prob) => {
                // Put console.log safely here inside the function block
                console.log("print log ", prob);

                return (
                  <div key={prob.id} className={styles.probCard}>
                    <div>
                      <div className={styles.probHeader}>
                        <span className={styles.probId}>{prob.id}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`${styles.badge} ${prob.published ? styles.badgeGreen : styles.badgeYellow}`}>
                            {prob.published ? 'Published' : 'Draft'}
                          </span>
                          <span className={`${styles.badge} ${styles.badgeBlue}`}>{prob.domain}</span>
                        </div>
                      </div>
                      <h3 className={styles.probTitle} style={{ marginTop: 12 }}>
                        {prob.title}
                      </h3>
                      <p className={styles.probDesc} style={{ marginTop: 8 }}>
                        {prob.description}
                      </p>
                    </div>

                    <div>
                      <div className={styles.tagGroup}>
                        {(Array.isArray(prob?.tags)
                          ? prob.tags
                          : typeof prob?.tags === 'string'
                            ? prob.tags.split(',')
                            : []
                        ).map((tag, idx) => (
                          <span key={idx} className={styles.tag}>
                            #{typeof tag === 'string' ? tag.trim() : tag}
                          </span>
                        ))}
                      </div>
                      <div className={styles.probActions} style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <SqBtn
                          onClick={() => handleTogglePublish(prob)}
                          size="sm"
                          lineColor={prob.published ? '#ff6b75' : '#22c55e'}
                          baseColor={prob.published ? '#2a1215' : '#0a2a16'}
                        >
                          {prob.published ? 'Unpublish' : 'Publish PS'}
                        </SqBtn>
                        <SqBtn onClick={() => setViewProblem(prob)} size="sm">
                          View
                        </SqBtn>
                        <SqBtn onClick={() => openEditModal(prob)} size="sm" lineColor="#eab308">
                          Edit
                        </SqBtn>
                        <SqBtn onClick={() => handleDeleteProblem(prob.id)} size="sm" danger>
                          Delete
                        </SqBtn>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* ── 3. TEAMS MANAGEMENT TAB ── */}
        {activeTab === 'teams' && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Registered Teams({filteredTeams.length})</h3>
              <input
                type="text"
                placeholder="Search team name, ID, leader..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Team ID</th>
                    <th>Team Name</th>
                    <th>Leader Email</th>
                    <th>Problem</th>
                    <th>Submission</th>
                    <th>Payment & Verification</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((t) => {
                    const isSubmitted = Boolean(t.submitted || t.submission || t.submissionFile || t.submissionStatus === 'submitted');
                    const hasPayment = t.payment !== null && t.payment !== undefined;
                    const paymentStatus = t.payment?.status || 'Not Uploaded';

                    return (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'JetBrains Mono', color: '#FAB600', whiteSpace: 'nowrap' }}>{t.id}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <strong>{t.name || t.teamName}</strong>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{t.members?.find((m) => m.role === 'leader')?.email || t.members?.[0]?.email || 'No Email'}</td>
                        <td style={{ minWidth: 180, maxWidth: 300, lineHeight: 1.4 }}>{t.problemStatementId || t.problem_statement_id || 'None'}</td>

                        {/* Submission Status */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`${styles.badge} ${isSubmitted ? styles.badgeGreen : styles.badgeYellow}`}>
                            {isSubmitted ? 'Submitted' : 'Pending'}
                          </span>
                        </td>

                        {/* Payment Proof & Status Column */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {!hasPayment ? (
                            <span className={`${styles.badge} ${styles.badgeYellow}`} style={{ fontSize: '0.75rem' }}>
                              Not Uploaded
                            </span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ fontSize: '0.75rem' }}>
                                  Uploaded
                                </span>

                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: paymentStatus === 'Verified' ? '#22c55e' : '#eab308' }}>
                                  {paymentStatus}
                                </span>
                                {paymentStatus !== 'Verified' ? (
                                  <button
                                    onClick={() => handleStatusChange(t.id, 'Verified')}
                                    style={{
                                      padding: '0.2rem 0.4rem',
                                      backgroundColor: '#16a34a',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    Verify
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(t.id, 'Pending')}
                                    style={{
                                      padding: '0.2rem 0.4rem',
                                      backgroundColor: '#6b7280',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    Revert
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Merged Shortlist / Remove Action Column */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <select
                            value={t.shortlistStatus || (t.shortlisted ? 'Shortlisted' : 'Under-Review')}
                            onChange={(e) => handleToggleShortlist(t.id, e.target.value)}
                            style={{
                              background: '#140800',
                              color:
                                (t.shortlistStatus || (t.shortlisted ? 'Shortlisted' : 'Under-Review')) === 'Shortlisted' ? '#22c55e' :
                                  (t.shortlistStatus || '') === 'Waitlisted' ? '#eab308' :
                                    (t.shortlistStatus || '') === 'Eliminated' ? '#ef4444' : '#94a3b8',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid rgba(250,182,0,0.25)',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              width: '100%',
                            }}
                          >
                            <option value="Under-Review">Under Review</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Waitlisted">Waitlisted</option>
                            <option value="Eliminated">Eliminated</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ── 4. SUBMISSIONS REVIEW TAB ── */}
        {activeTab === 'submissions' && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Team Presentation Submissions</h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Team Name & ID</th>
                    <th>File Name</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => {
                    console.log("Team object t:", t); // <-- Inspect t here
                    return (
                      <tr key={t.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <strong>{t.teamName || t.name}</strong> <span style={{ fontFamily: 'JetBrains Mono', color: '#FAB600' }}>({t.id})</span>
                        </td>
                        <td style={{ minWidth: 160 }}>
                          {t.submission?.original_name || t.submissionFile || '—'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {t.submission?.submitted_at ? new Date(t.submission.submitted_at).toLocaleString() : (t.submissionDate || 'Not Submitted')}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`${styles.badge} ${(t.submission || t.submitted) ? styles.badgeGreen : styles.badgeYellow}`}>
                            {(t.submission || t.submitted) ? 'Submitted' : 'Pending Submission'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 5. RESULTS & WINNERS TAB ── */}
        {activeTab === 'results' && (
          <div>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {NavIcons.trophy} Assign Hackathon Winners
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  Select shortlisted teams to place on the winner podium.
                </p>
              </div>

              <div className={styles.winnersRow}>
                {/* 1st Place */}
                <div className={`${styles.winnerBox} ${winners.first ? styles.assigned : ''}`}>
                  <span className={styles.medalIcon}>{NavIcons.medal('#eab308')}</span>
                  <strong>1st Place Winner</strong>
                  <span style={{ fontSize: '0.85rem', color: '#eab308' }}>
                    {teams.find((t) => t.id === winners.first)?.teamName || 'Unassigned'}
                  </span>
                  <WinnerTeamSelect
                    teams={teams}
                    value={winners.first}
                    onChange={(teamId) => handleAssignWinner('first', teamId)}
                  />

                </div>

                {/* 2nd Place */}
                <div className={`${styles.winnerBox} ${winners.second ? styles.assigned : ''}`}>
                  <span className={styles.medalIcon}>{NavIcons.medal('#94a3b8')}</span>
                  <strong>2nd Place Winner</strong>
                  <span style={{ fontSize: '0.85rem', color: '#FAB600' }}>
                    {teams.find((t) => t.id === winners.second)?.teamName || 'Unassigned'}
                  </span>
                  <WinnerTeamSelect
                    teams={teams}
                    value={winners.second}
                    accentColor="#94a3b8"
                    onChange={(teamId) => handleAssignWinner('second', teamId)}
                  />
                </div>

                {/* 3rd Place */}
                <div className={`${styles.winnerBox} ${winners.third ? styles.assigned : ''}`}>
                  <span className={styles.medalIcon}>{NavIcons.medal('#f97316')}</span>
                  <strong>3rd Place Winner</strong>
                  <span style={{ fontSize: '0.85rem', color: '#f97316' }}>
                    {teams.find((t) => t.id === winners.third)?.teamName || 'Unassigned'}
                  </span>
                  <WinnerTeamSelect
                    teams={teams}
                    value={winners.third}
                    accentColor="#f97316"
                    onChange={(teamId) => handleAssignWinner('third', teamId)}
                  />
                </div>

                {/* 4th Place */}
                <div className={`${styles.winnerBox} ${winners.fourth ? styles.assigned : ''}`}>
                  <span className={styles.medalIcon}>{NavIcons.medal('#60a5fa')}</span>
                  <strong>4th Place Winner</strong>
                  <span style={{ fontSize: '0.85rem', color: '#60a5fa' }}>
                    {teams.find((t) => t.id === winners.fourth)?.teamName || 'Unassigned'}
                  </span>
                  <WinnerTeamSelect
                    teams={teams}
                    value={winners.fourth}
                    accentColor="#60a5fa"
                    onChange={(teamId) => handleAssignWinner('fourth', teamId)}
                  />
                </div>
              </div>

              {/* ─── ADD THIS BELOW YOUR RESULTS SECTION ─── */}
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(250, 182, 0, 0.06)', border: '1px solid rgba(250, 182, 0, 0.22)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Publish Hackathon Results</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    This will update all team dashboards to display their final verdict, rank, or shortlist status.
                  </p>
                </div>

                <button
                  onClick={handlePublishResults}
                  disabled={isPublishing}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isPublishing ? '#E07B00' : '#FAB600',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: isPublishing ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {isPublishing ? 'Publishing...' : '🚀 Publish All Results'}
                </button>
                <button
                  type="button"
                  onClick={handleUnpublishResults}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 107, 117, 0.65)',
                    color: '#ff6b75',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Unpublish Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. SETTINGS MANAGEMENT TAB ── */}
        {activeTab === 'settings' && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>⚙️ Hackathon Configuration</h3>
            </div>
            <form onSubmit={handleSaveSettings} className={styles.formGrid}>
              <div className={styles.field}>
                <label>Hackathon Name</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label>Hackathon Year</label>
                <input
                  type="number"
                  value={settings.year}
                  onChange={(e) => setSettings({ ...settings, year: Number(e.target.value) })}
                />
              </div>
              <div className={styles.field}>
                <label>Hackathon PPT Uploads</label>
                <select
                  value={settings.acceptingSubmissions ? 'Yes' : 'No'}
                  onChange={(e) => setSettings({ ...settings, acceptingSubmissions: e.target.value === 'Yes' })}
                >
                  <option value="Yes">Open (Accepting PPTs)</option>
                  <option value="No">Closed (PPT uploads stopped)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Submission Deadline</label>
                <input
                  type="date"
                  value={settings.deadline}
                  onChange={(e) => setSettings({ ...settings, deadline: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label>Payment Deadline</label>
                <input
                  type="datetime-local"
                  value={settings.payment_deadline ? settings.payment_deadline.slice(0, 16) : ''}
                  onChange={(e) => setSettings({ ...settings, payment_deadline: e.target.value })}
                />
                <SqBtn
                  type="button"
                  onClick={handleSetPaymentDeadline}
                  lineColor="#FAB600"
                  baseColor="#261005"
                  style={{ marginTop: 10, width: 'fit-content' }}
                >
                  Set Payment Deadline
                </SqBtn>
              </div>

              <div className={styles.field}>
                <label>Hackathon Status</label>
                <select
                  value={settings.hackathonStatus}
                  onChange={(e) => setSettings({ ...settings, hackathonStatus: e.target.value })}
                >
                  <option value="Live">Live</option>
                  <option value="Paused">Paused</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Registration Status</label>
                <select
                  value={settings.registrationStatus}
                  onChange={(e) => setSettings({ ...settings, registrationStatus: e.target.value })}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className={styles.field} style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                <SqBtn type="submit" lineColor="#22c55e" baseColor="#0a2a16">
                  Save All Settings
                </SqBtn>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Add / Edit Problem Modal */}
      {showAddModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingProblem ? 'Edit Problem Statement' : 'Add Problem Statement'}</h2>
            <form onSubmit={handleCreateProblem} style={{ display: 'grid', gap: 16 }}>
              <div className={styles.field}>
                <label>Problem ID (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PS011"
                  value={probForm.id}
                  onChange={(e) => setProbForm({ ...probForm, id: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Problem Title"
                  value={probForm.title}
                  onChange={(e) => setProbForm({ ...probForm, title: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Domain *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Healthcare, AI, Smart City"
                  value={probForm.category}
                  onChange={(e) => setProbForm({ ...probForm, category: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="AI, IoT, Cloud"
                  value={probForm.tags}
                  onChange={(e) => setProbForm({ ...probForm, tags: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <textarea
                  rows={4}
                  placeholder="Detailed description of the challenge..."
                  value={probForm.description}
                  onChange={(e) => setProbForm({ ...probForm, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <SqBtn onClick={() => setShowAddModal(false)} danger>
                  Cancel
                </SqBtn>
                <SqBtn type="submit" lineColor="#22c55e">
                  {editingProblem ? 'Update Problem' : 'Create Problem'}
                </SqBtn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Problem Detail Modal */}
      {viewProblem && (
        <div className={styles.modalBackdrop} onClick={() => setViewProblem(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.probHeader}>
              <span className={styles.probId}>{viewProblem.id}</span>
              <span className={`${styles.badge} ${styles.badgeBlue}`}>{viewProblem.domain}</span>
            </div>
            <h2>{viewProblem.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{viewProblem.description}</p>
            <div className={styles.tagGroup}>
              {(Array.isArray(viewProblem.tags) ? viewProblem.tags : viewProblem.tags.split(',')).map((t) => (
                <span key={t} className={styles.tag}>
                  #{t.trim()}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <SqBtn onClick={() => setViewProblem(null)}>Close</SqBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
