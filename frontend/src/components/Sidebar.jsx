import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    History,
    Settings,
    GraduationCap,
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
                <GraduationCap size={32} color="#7c3aed" />
                <h1>ChitChatLearn</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                    onClick={toggleTheme}
                    className="nav-link"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        width: '100%',
                        cursor: 'pointer',
                        marginBottom: '8px',
                        justifyContent: 'flex-start'
                    }}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                {user && (
                    <button onClick={handleLogout} className="nav-link logout-btn" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', marginBottom: '16px' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {user?.username && <div style={{ marginBottom: '4px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.username}</div>}
                    ChitChatLearn v1.0
                </div>
            </div>
        </aside>
    );
}
