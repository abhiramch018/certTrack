import { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await API.post('/auth/forgot-password/', { email });
            setMessage(res.data.message);
            setStatus('success');
        } catch (err) {
            const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
            setMessage(msg);
            setStatus('error');
        }
    };

    return (
        <div className="auth-page">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔐</div>
                    <h1>Forgot Password</h1>
                    <p className="auth-subtitle">
                        Enter your email address and we'll send you a reset link.
                    </p>
                </div>

                {status === 'success' ? (
                    <div>
                        <div className="alert-banner success" style={{ justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '24px', gap: 8 }}>
                            <div style={{ fontSize: '2rem' }}>📬</div>
                            <strong>Check your inbox!</strong>
                            <p style={{ fontSize: '0.88rem', marginTop: 4, color: 'var(--text-secondary)' }}>
                                {message}
                            </p>
                        </div>
                        <p className="auth-footer" style={{ marginTop: 24 }}>
                            Back to <Link to="/login">Sign In</Link>
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {status === 'error' && (
                            <div className="form-message error">{message}</div>
                        )}
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? '⏳ Sending...' : '📧 Send Reset Link'}
                        </button>
                        <p className="auth-footer" style={{ marginTop: 20 }}>
                            Remember your password? <Link to="/login">Sign In</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
