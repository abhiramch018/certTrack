import { Link } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';

export default function LandingPage() {
    return (
        <div className="landing">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            {/* Navigation */}
            <nav className="landing-nav">
                <div className="landing-nav-left">
                    <Link to="/login" state={{ role: 'student' }}>🎓 Student</Link>
                    <Link to="/login" state={{ role: 'faculty' }}>👨‍🏫 Faculty</Link>
                    <Link to="/login" state={{ role: 'admin' }}>🛡️ Admin</Link>
                </div>
                <div className="landing-nav-right">
                    <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <div className="hero-left">
                        <div className="hero-badge">✨ Powered by Django & React</div>
                        <h1>
                            Track Your<br />
                            <span className="gradient-text">Certifications</span><br />
                            With Confidence
                        </h1>
                        <p>
                            A comprehensive platform for uploading, verifying, and monitoring
                            professional certifications. Role-based access for students,
                            faculty, and administrators with automated expiry alerts.
                        </p>
                        <div className="hero-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
                            <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="hero-visual">
                            <div className="visual-item">
                                <div className="visual-icon purple">📜</div>
                                <div>
                                    <h4>Upload Certifications</h4>
                                    <p>PDF & image support with instant validation</p>
                                </div>
                            </div>
                            <div className="visual-item">
                                <div className="visual-icon cyan">✅</div>
                                <div>
                                    <h4>Faculty Verification</h4>
                                    <p>Fair rotation system with workload balancing</p>
                                </div>
                            </div>
                            <div className="visual-item">
                                <div className="visual-icon green">📊</div>
                                <div>
                                    <h4>Performance Tracking</h4>
                                    <p>Real-time scores and analytics dashboard</p>
                                </div>
                            </div>
                            <div className="visual-item">
                                <div className="visual-icon pink">🔔</div>
                                <div>
                                    <h4>Expiry Alerts</h4>
                                    <p>30-day advance notification system</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
