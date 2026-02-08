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
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vocabulary', label: 'Vocabulary', icon: BookOpen },
    { path: '/history', label: 'History', icon: HistoryIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                            {user?.username && <div className="user-info">{user.username}</div>}
                            <div className="version">ChitChatLearn v1.0</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
