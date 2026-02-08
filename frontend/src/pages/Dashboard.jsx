import { useState, useEffect } from 'react';
import {
    BookOpen,
    CheckCircle,
    TrendingUp,
    Brain,
    Sparkles
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

const COLORS = ['#10b981', '#7c3aed', '#f59e0b', '#3b82f6'];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await api.getOverallProgress();
            setStats(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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
        <div className="fade-in">
            <header className="page-header">
                <h1>Dashboard</h1>
                <p>Track your vocabulary learning progress</p>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard
                    icon={BookOpen}
                    value={stats?.total_words || 0}
                    label="Total Words"
                    variant="primary"
                />
                <StatCard
                    icon={CheckCircle}
                    value={stats?.mastered || 0}
                    label="Mastered"
                    variant="success"
                />
                <StatCard
                    icon={TrendingUp}
                    value={stats?.learning || 0}
                    label="Learning"
                    variant="warning"
                />
                <StatCard
                    icon={Brain}
                    value={stats?.familiar || 0}
                    label="Familiar"
                    variant="info"
                />
            </div>

            {/* Charts Row */}
            <div className="responsive-grid" style={{ marginBottom: '24px' }}>
                {/* Progress Ring */}
                <div className="chart-container">
                    <div className="chart-header">
                        <h3 className="chart-title">Overall Mastery</h3>
                        <Sparkles size={20} color="var(--color-accent)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '20px' }}>
                        <ProgressRing value={stats?.mastery_percentage || 0} size={160} strokeWidth={12} />
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-secondary)' }}>
                        {stats?.mastered || 0} of {stats?.total_words || 0} words mastered
                    </p>
                </div>

                {/* Distribution Pie Chart */}
                <div className="chart-container">
                    <div className="chart-header">
                        <h3 className="chart-title">Word Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {pieData.map((entry, index) => (
                            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[index] }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Weekly Activity Chart */}
            <div className="chart-container">
                <div className="chart-header">
                    <h3 className="chart-title">Weekly Activity</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={historyData}>
                        <defs>
                            <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="day"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="var(--text-muted)"
                            fontSize={12}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="words"
                            stroke="#7c3aed"
                            fillOpacity={1}
                            fill="url(#colorWords)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
