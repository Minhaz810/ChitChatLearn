export function StatCard({ icon: Icon, value, label, variant = 'primary' }) {
    return (
        <div className="stat-card">
            <div className={`icon ${variant}`}>
                <Icon size={20} />
            </div>
            <div className="value">{value}</div>
            <div className="label">{label}</div>
        </div>
    );
}

export function Badge({ level }) {
    const labels = {
        new: 'New',
        learning: 'Learning',
        familiar: 'Familiar',
        mastered: 'Mastered',
    };

    return (
        <span className={`badge ${level}`}>
            {labels[level] || level}
        </span>
    );
}

export function ProgressBar({ value, max = 100 }) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div className="progress-bar">
            <div className="fill" style={{ width: `${percentage}%` }} />
        </div>
    );
}

export function ProgressRing({ value, size = 120, strokeWidth = 8 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="progress-ring" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    stroke="var(--border-color)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke="var(--color-primary)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
            </svg>
            <span className="progress-text">{Math.round(value)}%</span>
        </div>
    );
}

export function Loading() {
    return (
        <div className="loading">
            <div className="spinner" />
        </div>
    );
}

export function EmptyState({ icon: Icon, message }) {
    return (
        <div className="empty-state">
            {Icon && <Icon size={48} color="var(--text-muted)" />}
            <p>{message}</p>
        </div>
    );
}

export function WordCard({ word, bengali_translation, english_translation, synonyms, graspLevel, correctCount, onClick }) {
    return (
        <div className="word-card" onClick={onClick}>
            <div className="word-header">
                <h3 className="word-title">{word}</h3>
                <Badge level={graspLevel} />
            </div>
            <div className="word-translations">
                <p className="word-meaning-bn">{bengali_translation}</p>
                {english_translation && <p className="word-meaning-en">{english_translation}</p>}
                {synonyms && (
                    <div className="word-synonyms">
                        {synonyms.split(',').slice(0, 3).map((syn, i) => (
                            <span key={i} className="synonym-tag">{syn.trim()}</span>
                        ))}
                        {synonyms.split(',').length > 3 && <span className="synonym-more">+{synonyms.split(',').length - 3}</span>}
                    </div>
                )}
            </div>
            <div className="word-footer">
                <ProgressBar value={correctCount} max={3} />
                <span className="word-stats">{correctCount}/3 correct</span>
            </div>
        </div>
    );
}
