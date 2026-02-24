import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

export default function RegisterPage() {
    const navigate = useNavigate();

    const [role, setRole] = useState('student');
    const [form, setForm] = useState({
        username: '', email: '', password: '', first_name: '', last_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(null); // { email, message }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await API.post('/auth/register/', { ...form, role });
            setRegistered({ email: res.data.email, message: res.data.message });
        } catch (err) {
            const msg = err.response?.data;
            if (typeof msg === 'object') {
                setError(Object.entries(msg).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '));
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    // Show email check screen after successful registration
    if (registered) {
        return (
            <div className="auth-page">
                <CustomCursor />
                <div className="antigravity-bg" />
                <div className="bg-particles" />
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📬</div>
                    <h1 style={{ fontSize: '1.7rem', marginBottom: 8 }}>Check Your Email!</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 24 }}>
                        We sent a verification link to <br />
                        <strong style={{ color: 'var(--accent-purple-light)' }}>{registered.email}</strong>
                    </p>
                    <div className="alert-banner success" style={{ marginBottom: 24, fontSize: '0.88rem' }}>
                        ✅ Click the link in the email to activate your account. It expires in 24 hours.
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                        Didn't receive it? Check your spam folder, or{' '}
                        <Link to="/login" style={{ color: 'var(--accent-purple-light)' }}>
                            go to login to resend
                        </Link>
                        .
                    </p>
                    <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>
                        ← Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            <div className="auth-card">
                <h1>Create Account</h1>
                <p className="auth-subtitle">Join the certification platform</p>

                {/* Role Tabs — no admin */}
                <div className="role-tabs">
                    {['student', 'faculty'].map((r) => (
                        <button
                            key={r}
                            className={`role-tab ${role === r ? 'active' : ''}`}
                            onClick={() => setRole(r)}
                            type="button"
                        >
                            {r === 'student' ? '🎓' : '👨‍🏫'}{' '}
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>

                {error && <div className="form-message error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text" className="form-input" placeholder="John" value={form.first_name} onChange={updateField('first_name')} required />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input type="text" className="form-input" placeholder="Doe" value={form.last_name} onChange={updateField('last_name')} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" className="form-input" placeholder="johndoe" value={form.username} onChange={updateField('username')} required />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-input" placeholder="john@example.com" value={form.email} onChange={updateField('email')} required />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            📧 A verification email will be sent to this address.
                        </p>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={updateField('password')} required minLength={6} />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? '⏳ Creating...' : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
