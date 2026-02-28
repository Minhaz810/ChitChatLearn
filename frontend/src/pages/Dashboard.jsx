import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    CheckCircle,
    TrendingUp,
    Brain,
    Sparkles,
    Settings,
    RotateCcw,
    BookOpenText,
    Flame,
    Trophy,
    Target
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { StatCard, ProgressRing, Loading } from '../components/ui';
import api from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1'];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [quranProgress, setQuranProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quranLoading, setQuranLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const [statsData, quranData] = await Promise.all([
                api.getOverallProgress(),
                api.getQuranProgress().catch(() => null)
            ]);
            setStats(statsData);
            setQuranProgress(quranData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetQuranProgress = async () => {
        if (!window.confirm('Are you sure you want to reset your Quranic progress? This will set your last read verse back to 0.')) {
            return;
        }

        try {
            setQuranLoading(true);
            await api.resetQuranProgress();
            // Refresh quran progress after reset
            const data = await api.getQuranProgress();
            setQuranProgress(data);
        } catch (err) {
            alert(`Failed to reset progress: ${err.message}`);
        } finally {
            setQuranLoading(false);
        }
    };

    if (loading) return <Loading />;

    if (error) {
        return (
            <div className="error-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-error)' }}>
                <p>Failed to load dashboard: {error}</p>
                <button className="btn btn-secondary" onClick={loadStats} style={{ marginTop: '16px' }}>
                    Retry
                </button>
            </div>
        );
    }

    const pieData = [
        { name: 'Mastered', value: stats?.mastered || 0 },
        { name: 'Familiar', value: stats?.familiar || 0 },
        { name: 'Learning', value: stats?.learning || 0 },
        { name: 'New', value: stats?.new || 0 },
    ].filter(d => d.value > 0);

    // Mock history data for chart
    const historyData = [
        { day: 'Mon', words: 5 },
        { day: 'Tue', words: 8 },
        { day: 'Wed', words: 3 },
        { day: 'Thu', words: 12 },
        { day: 'Fri', words: 7 },
        { day: 'Sat', words: 15 },
        { day: 'Sun', words: 10 },
    ];

    return (
        <div className="page-container fade-in">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                        Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Here's your learning progress for today
                    </p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--bg-card)',
                    padding: '8px 16px',
                    borderRadius: '24px',
                    border: '1px solid var(--border-color)'
                }}>
                    <Flame color="var(--color-warning)" size={20} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats?.streak || 0} Day Streak</span>
                </div>
            </header>

            <div className="dashboard-grid">
                {/* Vocabulary Module Card */}
                <Link to="/modules?active=VOCABULARY" className="dashboard-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, border-color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--color-primary)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                            <Brain size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Vocabulary Module</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Master new words daily</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 'auto' }}>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{stats?.dailyProgress || 0}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>Words Learned Today</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{stats?.accuracy || 0}%</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>Avg Accuracy</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: 'var(--color-primary)', fontWeight: 500 }}>
                        <span>Continue Learning</span>
                        <span>&rarr;</span>
                    </div>
                </Link>

                {/* Quran Module Card */}
                <Link to="/modules?active=QURAN" className="dashboard-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, border-color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--color-success)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Quran Module</h2>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Track your daily verse learning</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleResetQuranProgress();
                            }}
                            disabled={quranLoading || !quranProgress}
                            title="Reset Progress"
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                padding: '8px',
                                borderRadius: '6px',
                                color: 'var(--text-secondary)',
                                cursor: (quranLoading || !quranProgress) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseOver={(e) => !quranLoading && quranProgress && (e.currentTarget.style.color = '#10b981', e.currentTarget.style.borderColor = '#10b981')}
                            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)', e.currentTarget.style.borderColor = 'var(--border-color)')}
                        >
                            <RotateCcw size={16} className={quranLoading ? 'spin' : ''} />
                        </button>
                    </div>

                    {quranLoading ? (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div className="spinner-small" />
                        </div>
                    ) : quranProgress ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {quranProgress.sura_name} (Surah {quranProgress.sura_no})
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    {Math.round((quranProgress.last_verse_sent / quranProgress.total_verses) * 100) || 0}%
                                </span>
                            </div>
                            <div className="progress-bar-container" style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden', marginBottom: '24px' }}>
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        height: '100%',
                                        width: `${(quranProgress.last_verse_sent / quranProgress.total_verses) * 100}%`,
                                        background: 'var(--color-success)',
                                        transition: 'width 0.5s ease-out'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 'auto' }}>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{quranProgress.last_verse_sent}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>Current Verse</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{quranProgress.total_verses}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>Total Verses</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
                            No active Quran progress. Click to configure.
                        </div>
                    )}

                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: 'var(--color-success)', fontWeight: 500 }}>
                        <span>Open Quran Settings</span>
                        <span>&rarr;</span>
                    </div>
                </Link>
            </div>
        </div>
    );
}
