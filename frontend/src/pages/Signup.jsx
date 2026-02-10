import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirm_password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        try {
            await signup({
                email: formData.email,
                username: formData.username,
                password: formData.password,
                confirm_password: formData.confirm_password,
            });
            // Check if there's a redirect parameter
            const redirect = searchParams.get('redirect');
            if (redirect === 'telegram') {
                navigate('/settings');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass stagger-item">
                <div className="auth-header">
                    <div className="auth-icon">
                        <UserPlus size={32} color="#3b82f6" />
                    </div>
                    <h1>ChitChatLearn</h1>
                    <p>Join us and start mastering new words</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={20} className="input-icon" />
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <div className="input-wrapper">
                            <User size={20} className="input-icon" />
                            <input
                                type="text"
                                id="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="johndoe"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                maxLength={72}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm_password">Confirm Password</label>
                        <div className="input-wrapper">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                id="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                maxLength={72}
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? <div className="spinner-small" /> : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
