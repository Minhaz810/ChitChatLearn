import { useState, useEffect } from 'react';
import {
    Bell,
    Clock,
    Moon,
    Palette,
    MessageCircle,
    Save,
    RefreshCw,
    Play,
    Pause
} from 'lucide-react';
import { Loading } from '../components/ui';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        start_time: '08:00',
        end_time: '22:00',
        interval_minutes: 20,
        is_paused: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await api.getSchedulerSettings();
            setSettings({
                start_time: data.start_time,
                end_time: data.end_time,
                interval_minutes: data.interval_minutes,
                is_paused: data.is_paused
            });
        } catch (err) {
            console.error('Failed to load settings:', err);
            // Use defaults if API fails
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            await api.updateSchedulerSettings(settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePauseToggle = async () => {
        try {
            if (settings.is_paused) {
                await api.resumeScheduler();
            } else {
                await api.pauseScheduler();
            }
            setSettings({ ...settings, is_paused: !settings.is_paused });
        } catch (err) {
            setError(err.message);
        }
    };

    const SettingCard = ({ icon: Icon, title, description, children }) => (
        <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Icon size={24} color="var(--color-primary-light)" />
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{description}</p>
                    {children}
                </div>
            </div>
        </div>
    );

    const Toggle = ({ checked, onChange, disabled }) => (
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                border: 'none',
                background: checked ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                position: 'relative',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                opacity: disabled ? 0.6 : 1
            }}
        >
            <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: checked ? 27 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </button>
    );

    if (loading) return <Loading />;

    return (
        <div className="fade-in">
            <header className="page-header">
                <h1>Settings</h1>
                <p>Configure your learning preferences</p>
            </header>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid var(--color-error)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '24px',
                    color: 'var(--color-error)'
                }}>
                    {error}
                </div>
            )}

            {/* Active Hours */}
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                Active Hours
            </h2>

            <SettingCard
                icon={Moon}
                title="Messaging Window"
                description="Questions will only be sent during these hours"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Start Time
                        </label>
                        <input
                            type="time"
                            value={settings.start_time}
                            onChange={(e) => setSettings({ ...settings, start_time: e.target.value })}
                            className="input"
                            style={{ width: 'auto', paddingLeft: '12px' }}
                        />
                    </div>
                    <span style={{ color: 'var(--text-muted)', marginTop: '20px' }}>to</span>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            End Time
                        </label>
                        <input
                            type="time"
                            value={settings.end_time}
                            onChange={(e) => setSettings({ ...settings, end_time: e.target.value })}
                            className="input"
                            style={{ width: 'auto', paddingLeft: '12px' }}
                        />
                    </div>
                </div>
            </SettingCard>

            {/* Quiz Interval */}
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', marginTop: '32px' }}>
                Quiz Settings
            </h2>

            <SettingCard
                icon={Clock}
                title="Question Interval"
                description="How often should new questions be sent?"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={settings.interval_minutes}
                        onChange={(e) => setSettings({ ...settings, interval_minutes: parseInt(e.target.value) })}
                        style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{
                        minWidth: 80,
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: 500
                    }}>
                        {settings.interval_minutes} min
                    </span>
                </div>
            </SettingCard>

            {/* Scheduler Control */}
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', marginTop: '32px' }}>
                Scheduler Control
            </h2>

            <SettingCard
                icon={settings.is_paused ? Play : Pause}
                title={settings.is_paused ? "Scheduler Paused" : "Scheduler Active"}
                description={settings.is_paused
                    ? "No new questions will be sent until resumed"
                    : "Questions are being sent according to your schedule"}
            >
                <button
                    className={`btn ${settings.is_paused ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handlePauseToggle}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {settings.is_paused ? (
                        <>
                            <Play size={18} />
                            Resume Scheduler
                        </>
                    ) : (
                        <>
                            <Pause size={18} />
                            Pause Scheduler
                        </>
                    )}
                </button>
            </SettingCard>



            {/* Telegram Integration */}
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', marginTop: '32px' }}>
                Telegram Integration
            </h2>

            <SettingCard
                icon={MessageCircle}
                title="Connect to Telegram"
                description="Link your Telegram account to receive vocabulary questions"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Click the button below to connect your Telegram account. A secure temporary token will be generated to link your account.
                    </p>
                    <button
                        onClick={async () => {
                            try {
                                const { connection_token } = await api.getTelegramToken();
                                window.open(`https://t.me/chitchatlearn_bot?start=${connection_token}`, '_blank');
                            } catch (err) {
                                setError('Failed to generate Telegram connection token');
                            }
                        }}
                        className="btn btn-primary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#0088cc',
                            width: 'fit-content',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                        Connect to Telegram
                    </button>
                </div>
            </SettingCard>

            {/* Save Button */}
            <div style={{ marginTop: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <RefreshCw size={18} className="spinner" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save Settings
                        </>
                    )}
                </button>
                {saved && (
                    <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✓ Settings saved
                    </span>
                )}
            </div>
        </div>
    );
}
