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
        <div className="fade-in" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>System overview and user management</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </header>

            <div className="stats-grid" style={{ marginBottom: '32px' }}>
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

            <div className="card glass">
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={20} color="var(--color-primary)" />
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>User List</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>ID</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Username</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Role</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '16px' }}>{user.id}</td>
                                    <td style={{ padding: '16px', fontWeight: 500 }}>{user.username}</td>
                                    <td style={{ padding: '16px' }}>{user.email}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            backgroundColor: user.role_name === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: user.role_name === 'admin' ? '#ef4444' : '#3b82f6'
                                        }}>
                                            {user.role_name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: user.is_active ? '#10b981' : '#6b7280'
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
