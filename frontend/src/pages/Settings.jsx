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
    Pause,
    Copy,
    Check,
    ExternalLink,
    Globe
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
        is_paused: false,
        timezone: 'UTC'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [connectionToken, setConnectionToken] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [copied, setCopied] = useState(false);

    const TIMEZONES = [
        "UTC",
        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "Asia/Dubai",
        "Asia/Kolkata",
        "Asia/Dhaka",
        "Asia/Bangkok",
        "Asia/Shanghai",
        "Asia/Tokyo",
        "Australia/Sydney"
    ];

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
                is_paused: data.is_paused,
                timezone: data.timezone || 'UTC'
            });
        } catch (err) {
            console.error('Failed to load settings:', err);
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

            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                Time & Schedule
            </h2>

            <SettingCard
                icon={Globe}
                title="Timezone"
                description="Set your local timezone for accurate scheduling"
            >
                <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                >
                    {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                    ))}
                </select>
            </SettingCard>

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
                        min="20"
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

            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', marginTop: '32px' }}>
                Telegram Integration
            </h2>

            <SettingCard
                icon={MessageCircle}
                title="Connect to Telegram"
                description="Link your Telegram account to receive vocabulary questions"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!showInstructions ? (
                        <>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Click the button below to connect your Telegram account. A secure temporary token will be generated to link your account.
                            </p>
                            <button
                                onClick={async () => {
                                    try {
                                        setSaving(true);
                                        const { connection_token } = await api.getTelegramToken();
                                        setConnectionToken(connection_token);
                                        setShowInstructions(true);
                                    } catch (err) {
                                        setError('Failed to generate Telegram connection token');
                                    } finally {
                                        setSaving(false);
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
                                <MessageCircle size={18} />
                                Connect to Telegram
                            </button>
                        </>
                    ) : (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <ol style={{
                                paddingLeft: '20px',
                                margin: '0 0 16px 0',
                                fontSize: '14px',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <li>Copy token below.</li>
                                <div style={{
                                    margin: '12px 0 16px 0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Your Temporary Token:
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        alignItems: 'center'
                                    }}>
                                        <code style={{
                                            flex: 1,
                                            fontSize: '12px',
                                            wordBreak: 'break-all',
                                            color: 'var(--color-primary-light)'
                                        }}>
                                            {connectionToken}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(connectionToken);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: copied ? 'var(--color-success)' : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'color 0.2s'
                                            }}
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <li>
                                    Open your Telegram bot:
                                    <a
                                        href="https://t.me/chitchatlearn_bot"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: 'var(--color-primary-light)',
                                            marginLeft: '4px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        @chitchatlearn_bot <ExternalLink size={14} />
                                    </a>
                                </li>
                                <li>Send <code>/start</code> to the bot and paste your token.</li>
                            </ol>

                            <button
                                onClick={() => setShowInstructions(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    marginTop: '12px',
                                    textDecoration: 'underline'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </SettingCard >

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
        </div >
    );
}