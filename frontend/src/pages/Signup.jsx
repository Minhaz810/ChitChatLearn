import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Hexagon } from 'lucide-react';

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
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '24px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '430px',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                padding: '40px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.02)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'inline-flex', marginBottom: '16px' }}>
                        <Hexagon size={40} color="var(--color-primary)" strokeWidth={2.5} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                        Create an account
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Join us and start mastering new words
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#FEE2E2',
                            color: '#991B1B',
                            padding: '12px',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="email" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                background: 'transparent'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="username" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Username</label>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="johndoe"
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                background: 'transparent'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                            <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Password</label>
                            <input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                maxLength={72}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    background: 'transparent'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                            <label htmlFor="confirm_password" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Confirm</label>
                            <input
                                type="password"
                                id="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                maxLength={72}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    background: 'transparent'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '15px',
                            fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '8px',
                            transition: 'background 0.2s',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
                        {loading ? 'Creating Account...' : 'Sign up'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
