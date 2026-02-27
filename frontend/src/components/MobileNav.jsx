import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Menu,
    X,
    GraduationCap,
    LayoutDashboard,
    BookOpen,
    History as HistoryIcon,
    Settings as SettingsIcon,
    LogOut,
    Sun,
    Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/modules', label: 'Module', icon: BookOpen },
    { path: '/history', label: 'History', icon: HistoryIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsOpen(false);
    };

    return (
        <div className="mobile-nav-wrapper">
            <header className="mobile-header">
                <div className="mobile-logo">
                    <GraduationCap size={24} color="#7c3aed" />
                    <span>ChitChatLearn</span>
                </div>
                <button className="mobile-menu-toggle" onClick={toggleMenu}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {isOpen && (
                <div className="mobile-menu-overlay" onClick={toggleMenu}>
                    <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <nav className="mobile-menu-nav">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `mobile-nav-link ${isActive ? 'active' : ''}`
                                    }
                                    onClick={() => setIsOpen(false)}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                            {user && (
                                <button onClick={handleLogout} className="mobile-nav-link logout">
                                    <LogOut size={20} />
                                    <span>Logout</span>
                                </button>
                            )}
                        </nav>

                        <div className="mobile-menu-footer">
                            <button
                                onClick={toggleTheme}
                                className="mobile-nav-link"
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    justifyContent: 'flex-start',
                                    marginBottom: '16px',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>
                            {user?.username && <div className="user-info">{user.username}</div>}
                            <div className="version">ChitChatLearn v1.0</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
