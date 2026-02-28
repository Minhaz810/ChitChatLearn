import { useState, useEffect } from 'react';
import { Users, BarChart3, ShieldCheck, LogOut } from 'lucide-react';
import { StatCard, Loading } from '../../components/ui';
import adminApi from '../../services/admin';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsData, usersData] = await Promise.all([
                adminApi.getStats(),
                adminApi.getUsers()
            ]);
            setStats(statsData);
            setUsers(usersData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        localStorage.removeItem('admin_token');
        localStorage.removeItem('user_role');
        navigate('/admin/login');
    };

    if (loading) return <Loading />;

    if (error) {
        return (
            <div className="error-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-error)' }}>
                <p>Failed to load admin dashboard: {error}</p>
                <button className="btn btn-secondary" onClick={loadData} style={{ marginTop: '16px' }}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="page-container fade-in">
            <header className="page-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                        Admin Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                        System overview and user management
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)', border: '1px solid var(--border-color)' }}
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </header>

            <div className="stats-grid" style={{ marginBottom: '48px' }}>
                <StatCard
                    icon={Users}
                    value={stats?.total_users || 0}
                    label="Total Registered Users"
                    variant="primary"
                />
                <StatCard
                    icon={ShieldCheck}
                    value="Active"
                    label="System Status"
                    variant="success"
                />
                <StatCard
                    icon={BarChart3}
                    value={users.length}
                    label="Users Listed"
                    variant="info"
                />
            </div>

            <div className="dashboard-card">
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Users size={20} color="var(--color-primary)" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>User List</h2>
                </div>
                <div style={{ overflowX: 'auto', padding: '12px 24px 24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px 0', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={{ padding: '16px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>{user.id}</td>
                                    <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{user.username}</td>
                                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{user.email}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '99px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            backgroundColor: user.role_name === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
                                            color: user.role_name === 'admin' ? 'var(--color-error)' : 'var(--text-primary)',
                                            border: `1px solid ${user.role_name === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)'}`
                                        }}>
                                            {user.role_name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: user.is_active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: user.is_active ? 'var(--color-success)' : 'var(--text-muted)'
                                            }} />
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
