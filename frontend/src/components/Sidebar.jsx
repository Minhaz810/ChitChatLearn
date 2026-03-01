import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    History,
    Settings,
    Hexagon,
    LogOut,
    Sun,
    Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/modules', label: 'Module', icon: BookOpen },
    { path: '/history', label: 'History', icon: History },
    { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <img src="/logo.png" alt="ChitChatLearn Logo" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                <h1>ChitChatLearn</h1>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', padding: '0 16px', marginBottom: '8px', fontWeight: '600' }}>
                    Overview
                </div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '24px' }}>
                <button
                    onClick={toggleTheme}
                    className="nav-link"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        width: '100%',
                        cursor: 'pointer',
                        marginBottom: '4px',
                        justifyContent: 'flex-start'
                    }}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                {user && (
                    <button onClick={handleLogout} className="nav-link logout-btn" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', marginBottom: '24px' }}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                )}
                <div style={{ padding: '0 16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    {user?.username && <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>{user.username}</div>}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ChitChatLearn v1.0</div>
                </div>
            </div>
        </aside>
    );
}
