import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const initialRole = location.state?.role || 'student';

    const [role, setRole] = useState(initialRole);
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [resendStatus, setResendStatus] = useState('idle'); // idle | sending | sent

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setUnverifiedEmail('');
        setLoading(true);

        try {
            const res = await API.post('/auth/login/', { ...form });
            const { token, user } = res.data;

            if (user.role !== role) {
                setError(`This account is registered as "${user.role}", not "${role}".`);
                setLoading(false);
                return;
            }

            login(token, user);
            const dashboards = { student: '/student', faculty: '/faculty', admin: '/admin' };
            navigate(dashboards[user.role] || '/');
        } catch (err) {
            const data = err.response?.data;

            // Handle email_not_verified specifically
            if (data?.error === 'email_not_verified') {
                setError(data.message);
                setUnverifiedEmail(data.email || '');
                setLoading(false);
                return;
            }

            if (data?.non_field_errors) setError(data.non_field_errors[0]);
            else if (typeof data === 'object') setError(Object.values(data).flat().join(' '));
            else setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!unverifiedEmail) return;
        setResendStatus('sending');
        try {
            await API.post('/auth/resend-verification/', { email: unverifiedEmail });
            setResendStatus('sent');
        } catch {
            setResendStatus('idle');
        }
    };

    return (
        <div className="auth-page">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            <div className="auth-card">
                <h1>Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your account</p>

                {/* Role Tabs */}
                <div className="role-tabs">
                    {['student', 'faculty', 'admin'].map((r) => (
                        <button
                            key={r}
                            className={`role-tab ${role === r ? 'active' : ''}`}
                            onClick={() => setRole(r)}
                            type="button"
                        >
                            {r === 'student' ? '🎓' : r === 'faculty' ? '👨‍🏫' : '🛡️'}{' '}
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Error — email not verified (special case) */}
                {unverifiedEmail ? (
                    <div className="alert-banner warning" style={{ flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                        <div>
                            <strong>📧 Email Not Verified</strong>
                            <p style={{ fontSize: '0.85rem', marginTop: 4, color: 'var(--text-secondary)' }}>
                                Please verify <strong>{unverifiedEmail}</strong> before logging in.
                            </p>
                        </div>
                        {resendStatus === 'sent' ? (
                            <span style={{ fontSize: '0.82rem', color: 'var(--accent-green)' }}>
                                ✅ Verification email resent!
                            </span>
                        ) : (
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleResendVerification}
                                disabled={resendStatus === 'sending'}
                            >
                                {resendStatus === 'sending' ? '⏳ Sending...' : '🔄 Resend Verification Email'}
                            </button>
                        )}
                    </div>
                ) : error ? (
                    <div className="form-message error">{error}</div>
                ) : null}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your username"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                        {/* Forgot password link */}
                        <div style={{ textAlign: 'right', marginTop: 6 }}>
                            <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--accent-purple-light)' }}>
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? '⏳ Signing in...' : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
}
