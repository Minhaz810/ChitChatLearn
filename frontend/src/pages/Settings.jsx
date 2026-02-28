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

const SettingCard = ({ icon: Icon, title, description, children }) => (
    <div className="dashboard-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{
                width: 40,
                height: 40,
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <Icon size={20} color="var(--color-primary)" />
            </div>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>{description}</p>
                {children}
            </div>
        </div>
    </div>
);

export default function Settings() {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        start_time: '08:00',
        end_time: '22:00',
        interval_minutes: 20,
        is_paused: false,
        timezone: 'UTC'
    });
    const [questionMode, setQuestionMode] = useState('QUESTION_ANSWER');
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

            const modeData = await api.getQuestionMode();
            setQuestionMode(modeData.mode);
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
            await Promise.all([
                api.updateSchedulerSettings(settings),
                api.updateQuestionMode({ mode: questionMode })
            ]);
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

    if (loading) return <Loading />;

    return (
        <div className="page-container fade-in">
            <header className="page-header" style={{ marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                        Settings
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Configure your learning preferences
                    </p>
                </div>
            </header>

            {error && (
                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--color-error)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '24px',
                    color: 'var(--color-error)'
                }}>
                    {error}
                </div>
            )}

            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
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
                    style={{ width: '100%', maxWidth: '400px' }}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Start Time
                        </label>
                        <input
                            type="time"
                            value={settings.start_time}
                            onChange={(e) => setSettings({ ...settings, start_time: e.target.value })}
                            className="input"
                            style={{ width: 'auto' }}
                        />
                    </div>
                    <span style={{ color: 'var(--text-muted)', marginTop: '20px' }}>to</span>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            End Time
                        </label>
                        <input
                            type="time"
                            value={settings.end_time}
                            onChange={(e) => setSettings({ ...settings, end_time: e.target.value })}
                            className="input"
                            style={{ width: 'auto' }}
                        />
                    </div>
                </div>
            </SettingCard>

            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', marginTop: '48px', color: 'var(--text-primary)' }}>
                Quiz Settings
            </h2>

            <SettingCard
                icon={Clock}
                title="Question Interval"
                description="How often should new questions be sent?"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '400px' }}>
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
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontWeight: 500,
                        fontSize: '14px',
                        color: 'var(--text-primary)'
                    }}>
                        {settings.interval_minutes} min
                    </span>
                </div>
            </SettingCard>

            <SettingCard
                icon={Palette}
                title="Chat Mode"
                description="Choose your preferred way of answering questions"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: questionMode === 'MCQ' ? 'var(--bg-secondary)' : 'var(--bg-card)',
                        borderRadius: '8px',
                        border: `1px solid ${questionMode === 'MCQ' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="radio"
                            name="questionMode"
                            value="MCQ"
                            checked={questionMode === 'MCQ'}
                            onChange={() => setQuestionMode('MCQ')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>MCQ</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Multiple choice questions with 4 options</div>
                        </div>
                    </label>

                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: questionMode === 'QUESTION_ANSWER' ? 'var(--bg-secondary)' : 'var(--bg-card)',
                        borderRadius: '8px',
                        border: `1px solid ${questionMode === 'QUESTION_ANSWER' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="radio"
                            name="questionMode"
                            value="QUESTION_ANSWER"
                            checked={questionMode === 'QUESTION_ANSWER'}
                            onChange={() => setQuestionMode('QUESTION_ANSWER')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Question & Answer</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Directly provide the meaning of the word</div>
                        </div>
                    </label>

                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: questionMode === 'PLAIN_TEXT' ? 'var(--bg-secondary)' : 'var(--bg-card)',
                        borderRadius: '8px',
                        border: `1px solid ${questionMode === 'PLAIN_TEXT' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="radio"
                            name="questionMode"
                            value="PLAIN_TEXT"
                            checked={questionMode === 'PLAIN_TEXT'}
                            onChange={() => setQuestionMode('PLAIN_TEXT')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Plain Text</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Discuss and explore concepts without a strict format</div>
                        </div>
                    </label>
                </div>
            </SettingCard>

            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', marginTop: '48px', color: 'var(--text-primary)' }}>
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
                    type="button"
                    className={`btn ${settings.is_paused ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={(e) => {
                        e.preventDefault();
                        handlePauseToggle();
                    }}
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

            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', marginTop: '48px', color: 'var(--text-primary)' }}>
                Telegram Integration
            </h2>

            <SettingCard
                icon={MessageCircle}
                title="Connect to Telegram"
                description="Link your Telegram account to receive vocabulary questions"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
                    {!showInstructions ? (
                        <>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Click the button below to connect your Telegram account. A secure temporary token will be generated to link your account.
                            </p>
                            <button
                                type="button"
                                onClick={async (e) => {
                                    e.preventDefault();
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
                                    width: 'fit-content'
                                }}
                            >
                                <MessageCircle size={18} />
                                Connect to Telegram
                            </button>
                        </>
                    ) : (
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            padding: '24px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <ol style={{
                                paddingLeft: '24px',
                                margin: '0 0 16px 0',
                                fontSize: '14px',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                lineHeight: 1.6
                            }}>
                                <li>Copy token below.</li>
                                <div style={{
                                    margin: '8px 0 16px 0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Your Temporary Token:
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        background: 'var(--bg-card)',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        alignItems: 'center'
                                    }}>
                                        <code style={{
                                            flex: 1,
                                            fontSize: '13px',
                                            wordBreak: 'break-all',
                                            color: 'var(--color-primary)',
                                            fontWeight: 500
                                        }}>
                                            {connectionToken}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
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
                                                transition: 'color 0.2s',
                                                borderRadius: '4px'
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
                                            color: 'var(--color-primary)',
                                            marginLeft: '4px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            textDecoration: 'none',
                                            fontWeight: 500
                                        }}
                                    >
                                        @chitchatlearn_bot <ExternalLink size={14} />
                                    </a>
                                </li>
                                <li>Send <code>/start</code> to the bot and paste your token.</li>
                            </ol>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowInstructions(false);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    marginTop: '16px',
                                    textDecoration: 'underline'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </SettingCard >

            <div style={{ marginTop: '48px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={(e) => {
                        e.preventDefault();
                        handleSave();
                    }}
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
                    <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
                        <Check size={18} /> Settings saved
                    </span>
                )}
            </div>
        </div >
    );
}