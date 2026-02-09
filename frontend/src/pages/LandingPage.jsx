import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const LandingPage = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="landing-nav-brand">
                        <span className="brand-icon desktop-icon">💬</span>
                        <div className="brand-text">
                            <span className="brand-word-main">ChitChat</span>
                            <div className="brand-sub-wrapper">
                                <span className="brand-icon mobile-icon">💬</span>
                                <span className="brand-word-sub">Learn</span>
                            </div>
                        </div>
                    </div>

                    <div className="nav-mobile-actions">
                        <button
                            onClick={toggleTheme}
                            className="theme-toggle-btn"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>

                    <div className="landing-nav-links">
                        <Link to="/login" className="btn btn-secondary">Login</Link>
                        <Link to="/signup" className="btn btn-primary">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="hero-content">
                    <div className="hero-badge">🚀 AI-Powered Vocabulary Learning</div>
                    <h1 className="hero-title">
                        Master New Words Through
                        <span className="gradient-text"> Intelligent Conversations</span>
                    </h1>
                    <p className="hero-subtitle">
                        ChitChatLearn uses AI to quiz you on vocabulary at scheduled intervals via Telegram.
                        Chat naturally, get instant feedback, and watch your vocabulary grow effortlessly.
                    </p>
                    <div className="hero-actions">
                        <Link to="/signup" className="btn btn-primary btn-lg">
                            <span>Start Learning Free</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <Link to="/signup?redirect=telegram" className="btn btn-telegram btn-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                            <span>Connect to Telegram</span>
                        </Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="chat-mockup">
                        <div className="chat-header">
                            <span className="chat-avatar">🤖</span>
                            <span>ChitChatLearn Bot</span>
                        </div>
                        <div className="chat-messages">
                            <div className="chat-message bot">
                                <p>🎯 What does <strong>"ephemeral"</strong> mean?</p>
                            </div>
                            <div className="chat-message user">
                                <p>Something that lasts for a short time?</p>
                            </div>
                            <div className="chat-message bot">
                                <p>✅ <strong>Correct!</strong> "Ephemeral" means lasting for a very short time. Great job! 🎉</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="landing-section">
                <div className="section-header">
                    <h2>How It Works</h2>
                    <p>Three simple steps to vocabulary mastery</p>
                </div>
                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <div className="step-icon">📚</div>
                        <h3>Import Your Vocabulary</h3>
                        <p>Upload your word list or choose from curated vocabulary chunks. Organize words by topics or difficulty levels.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <div className="step-icon">⚙️</div>
                        <h3>Configure Your Schedule</h3>
                        <p>Set your learning window and question intervals. The AI bot will send questions at your preferred times via Telegram.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <div className="step-icon">💬</div>
                        <h3>Chat & Learn</h3>
                        <p>Answer questions naturally in Telegram. Get instant AI feedback, explanations, and track your progress in real-time.</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing-section features-section">
                <div className="section-header">
                    <h2>Powerful Features</h2>
                    <p>Everything you need for effective vocabulary learning</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI-Powered Questions</h3>
                        <p>Intelligent questions generated based on context, usage, and your learning progress.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📱</div>
                        <h3>Telegram Integration</h3>
                        <p>Learn on-the-go with seamless Telegram messaging. No app switching required.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⏰</div>
                        <h3>Smart Scheduling</h3>
                        <p>Spaced repetition at intervals you choose. Learning fits into your daily routine.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Progress Tracking</h3>
                        <p>Visual dashboard showing mastery levels, streaks, and areas needing attention.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💡</div>
                        <h3>Instant Feedback</h3>
                        <p>AI evaluates your answers and provides detailed explanations and corrections.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔄</div>
                        <h3>Adaptive Learning</h3>
                        <p>Focus more on words you struggle with. The system adapts to your needs.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing-cta">
                <div className="cta-content">
                    <h2>Ready to Expand Your Vocabulary?</h2>
                    <p>Join thousands of learners using AI-powered conversations to master new words.</p>
                    <div className="cta-actions">
                        <Link to="/signup" className="btn btn-primary btn-lg">
                            Create Free Account
                        </Link>
                        <Link to="/signup?redirect=telegram" className="btn btn-telegram btn-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                            Connect to Telegram
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand-section">
                        <div className="footer-brand">
                            <span className="brand-icon desktop-icon">💬</span>
                            <div className="brand-text">
                                <span className="brand-word-main">ChitChat</span>
                                <div className="brand-sub-wrapper">
                                    <span className="brand-icon mobile-icon">💬</span>
                                    <span className="brand-word-sub">Learn</span>
                                </div>
                            </div>
                        </div>
                        <p className="footer-tagline">Learn vocabulary through intelligent conversations.</p>
                    </div>

                    <div className="footer-contact-section">
                        <h3>Contact Us</h3>
                        <div className="contact-item">
                            <span>📍</span>
                            <p>Rampura, Dhaka</p>
                        </div>
                        <div className="contact-item">
                            <span>📞</span>
                            <div className="contact-phones">
                                <a href="tel:+8801891798387">+880 1891-798387</a>
                                <a href="tel:+8801737898249">+880 1737-898249</a>
                            </div>
                        </div>
                        <div className="contact-item">
                            <span>✉️</span>
                            <a href="mailto:minhazchowdhury810@gmail.com">minhazchowdhury810@gmail.com</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} ChitChatLearn. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

