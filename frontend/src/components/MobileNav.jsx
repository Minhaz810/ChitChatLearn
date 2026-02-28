import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    History as HistoryIcon,
    Settings as SettingsIcon,
    LogOut,
    Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/modules', label: 'Module', icon: BookOpen },
    { path: '/history', label: 'History', icon: HistoryIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function MobileNav() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isOpen, setIsOpen] = React.useState(false);

    // Show simplified top bar with hamburger menu only on mobile
    return (
        <div className="mobile-nav-wrapper">
            {/* Top Bar for Mobile */}
            <header className="mobile-header" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '60px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                zIndex: 100
            }}>
                <div className="mobile-logo" style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '18px', letterSpacing: '-0.5px' }}>
                    ChitChatLearn
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '8px', cursor: 'pointer' }}
                >
                    <Menu size={24} />
                </button>
            </header>

            {/* Hamburger Dropdown Menu */}
            {isOpen && (
                <div className="mobile-dropdown" style={{
                    position: 'fixed',
                    top: '60px',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'var(--bg-card)',
                    zIndex: 99,
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: isActive ? 'var(--bg-secondary)' : 'transparent',
                                    color: isActive ? 'var(--color-primary)' : 'var(--text-primary)',
                                    textDecoration: 'none',
                                    fontWeight: isActive ? 600 : 500,
                                    border: isActive ? '1px solid var(--border-color)' : '1px solid transparent'
                                }}
                            >
                                <item.icon size={24} />
                                <span style={{ fontSize: '16px' }}>{item.label}</span>
                            </NavLink>
                        );
                    })}

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            logout();
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            marginTop: 'auto',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-warning)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            borderRadius: '12px'
                        }}
                    >
                        <LogOut size={24} />
                        <span style={{ fontSize: '16px' }}>Log Out</span>
                    </button>
                </div>
            )}
        </div>
    );
}

