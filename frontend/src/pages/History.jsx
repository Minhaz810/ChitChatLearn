import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Loading, EmptyState, Badge } from '../components/ui';
import api from '../services/api';

export default function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await api.getQuestionHistory(50);
            setHistory(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getScoreIcon = (score, isCorrect) => {
        if (isCorrect) return <CheckCircle size={18} color="var(--color-success)" />;
        if (score >= 60) return <AlertCircle size={18} color="var(--color-warning)" />;
        return <XCircle size={18} color="var(--color-error)" />;
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'var(--color-success)';
        if (score >= 60) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        return date.toLocaleDateString();
    };

    const questionTypeLabels = {
        meaning: 'Bengali Translation',
        example: 'Example',
        synonym: 'Synonym'
    };

    if (loading) return <Loading />;

    if (error) {
        return (
            <div className="error-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-error)' }}>
                <p>Failed to load history: {error}</p>
                <button className="btn btn-secondary" onClick={loadHistory} style={{ marginTop: '16px' }}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="page-container fade-in">
            <header className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                        Question History
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Review your past quiz answers and feedback
                    </p>
                </div>
            </header>

            {history.length === 0 ? (
                <EmptyState
                    icon={Clock}
                    message="No question history yet. Start answering questions on Telegram!"
                />
            ) : (
                <div className="table-container dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Word</th>
                                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Type</th>
                                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Your Answer</th>
                                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Score</th>
                                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Feedback</th>
                                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item, index) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.word}</strong>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span
                                            style={{
                                                padding: '4px 8px',
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}
                                        >
                                            {questionTypeLabels[item.question_type] || item.question_type}
                                        </span>
                                    </td>
                                    <td style={{
                                        padding: '16px 24px',
                                        maxWidth: '200px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {item.user_answer || '-'}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {getScoreIcon(item.score, item.is_correct)}
                                            <span style={{
                                                fontWeight: 600,
                                                color: getScoreColor(item.score),
                                                fontSize: '14px'
                                            }}>
                                                {item.score !== null ? `${item.score}/100` : '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{
                                        padding: '16px 24px',
                                        maxWidth: '250px',
                                        fontSize: '14px',
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.5
                                    }}>
                                        {item.feedback || '-'}
                                    </td>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                        {formatDate(item.timestamp)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
