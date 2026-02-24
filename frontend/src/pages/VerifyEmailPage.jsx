import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

export default function VerifyEmailPage() {
    const { token } = useParams();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await API.get(`/auth/verify-email/${token}/`);
                setMessage(res.data.message);
                setStatus('success');
                // Auto login if token returned
                if (res.data.token && res.data.user) {
                    login(res.data.token, res.data.user);
                    setTimeout(() => {
                        const dashboards = { student: '/student', faculty: '/faculty', admin: '/admin' };
                        navigate(dashboards[res.data.user.role] || '/');
                    }, 2500);
                }
            } catch (err) {
                const msg = err.response?.data?.error || 'Verification failed.';
                setMessage(msg);
                setStatus('error');
            }
        };
        verify();
    }, [token]);

    return (
        <div className="auth-page">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            <div className="auth-card" style={{ textAlign: 'center' }}>
                {status === 'verifying' && (
                    <>
                        <div className="spinner" style={{ margin: '0 auto 20px' }} />
                        <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Verifying your email...</h1>
                        <p className="auth-subtitle">Please wait a moment.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
                        <h1 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Email Verified!</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
                            {message}
                        </p>
                        <div className="alert-banner success" style={{ justifyContent: 'center' }}>
                            ✅ Redirecting to your dashboard...
                        </div>
                        <p className="auth-footer" style={{ marginTop: 20 }}>
                            Not redirecting? <Link to="/login">Sign In manually</Link>
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
                        <h1 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Verification Failed</h1>
                        <div className="alert-banner error" style={{ marginBottom: 24 }}>
                            {message}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.88rem' }}>
                            The link may have expired. Request a new verification email below.
                        </p>
                        <Link to="/register" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }}>
                            Register Again
                        </Link>
                        <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>
                            Go to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
