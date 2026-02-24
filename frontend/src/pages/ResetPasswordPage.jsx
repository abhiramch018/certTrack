import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({ password: '', password2: '' });
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [message, setMessage] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password2) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }
        if (form.password.length < 6) {
            setStatus('error');
            setMessage('Password must be at least 6 characters.');
            return;
        }
        setStatus('loading');
        try {
            const res = await API.post(`/auth/reset-password/${token}/`, form);
            setMessage(res.data.message);
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            const msg = err.response?.data?.error || 'Reset failed. The link may have expired.';
            setMessage(msg);
            setStatus('error');
        }
    };

    // Strength indicator
    const strength = (() => {
        const p = form.password;
        if (!p) return null;
        if (p.length < 6) return { label: 'Too Short', color: 'var(--accent-red)', width: '25%' };
        if (p.length < 8) return { label: 'Weak', color: 'var(--accent-amber)', width: '45%' };
        if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p))
            return { label: 'Strong', color: 'var(--accent-green)', width: '100%' };
        return { label: 'Medium', color: 'var(--accent-cyan)', width: '70%' };
    })();

    return (
        <div className="auth-page">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔑</div>
                    <h1>Set New Password</h1>
                    <p className="auth-subtitle">Choose a strong new password for your account.</p>
                </div>

                {status === 'success' ? (
                    <div>
                        <div className="alert-banner success" style={{ flexDirection: 'column', textAlign: 'center', padding: 24, gap: 8 }}>
                            <div style={{ fontSize: '2rem' }}>✅</div>
                            <strong>Password Reset!</strong>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                {message} Redirecting to login in 3 seconds...
                            </p>
                        </div>
                        <p className="auth-footer" style={{ marginTop: 20 }}>
                            <Link to="/login">Go to Sign In now →</Link>
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {status === 'error' && (
                            <div className="form-message error">⛔ {message}</div>
                        )}

                        <div className="form-group">
                            <label>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Min 6 characters"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                    style={{ paddingRight: 48 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'none', color: 'var(--text-muted)', fontSize: '1.1rem' }}
                                >
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {/* Strength bar */}
                            {strength && (
                                <div style={{ marginTop: 8 }}>
                                    <div className="progress-bar-container" style={{ height: 6 }}>
                                        <div className="progress-bar-fill" style={{ width: strength.width, background: strength.color }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: strength.color, marginTop: 4, display: 'block' }}>
                                        {strength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Repeat your password"
                                value={form.password2}
                                onChange={(e) => setForm({ ...form, password2: e.target.value })}
                                required
                                style={form.password2 && form.password !== form.password2 ? { borderColor: 'var(--accent-red)' } : {}}
                            />
                            {form.password2 && form.password !== form.password2 && (
                                <p className="form-error" style={{ marginTop: 6 }}>⛔ Passwords do not match</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? '⏳ Resetting...' : '🔐 Reset Password'}
                        </button>
                        <p className="auth-footer" style={{ marginTop: 20 }}>
                            <Link to="/login">← Back to Sign In</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
