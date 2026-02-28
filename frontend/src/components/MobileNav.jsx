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

    // Show simplified top bar and bottom nav only on mobile
    return (
        <div className="mobile-nav-wrapper" style={{ display: 'none' }}>
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
            </header>

            {/* Bottom Tab Bar */}
            <nav className="mobile-bottom-bar" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '65px',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                paddingBottom: 'env(safe-area-inset-bottom)',
                zIndex: 100
            }}>
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`mobile-tab ${isActive ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                                textDecoration: 'none',
                                flex: 1,
                                padding: '8px 0'
                            }}
                        >
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 500 }}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}

