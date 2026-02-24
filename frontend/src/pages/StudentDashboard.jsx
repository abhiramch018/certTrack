import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('certificates');
    const [certificates, setCertificates] = useState([]);
    const [performance, setPerformance] = useState(null);
    const [alerts, setAlerts] = useState({ count: 0, expiring_certificates: [] });
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', organization: '', issue_date: '', expiry_date: '' });
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [certRes, perfRes, alertRes] = await Promise.all([
                API.get('/certificates/my/'),
                API.get('/certificates/performance/'),
                API.get('/certificates/alerts/'),
            ]);
            setCertificates(certRes.data);
            setPerformance(perfRes.data);
            setAlerts(alertRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) { setUploadMsg({ type: 'error', text: 'Please select a file.' }); return; }

        // ── Client-side expiry date validation ──
        if (uploadForm.expiry_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(uploadForm.expiry_date);
            const issue = uploadForm.issue_date ? new Date(uploadForm.issue_date) : null;

            if (expiry < today) {
                const formatted = expiry.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                setUploadMsg({ type: 'error', text: `⛔ This certificate expired on ${formatted}. You cannot upload an already-expired certificate.` });
                return;
            }
            if (issue && expiry <= issue) {
                setUploadMsg({ type: 'error', text: '⛔ Expiry date must be after the issue date.' });
                return;
            }
        }

        setUploading(true);
        setUploadMsg({ type: '', text: '' });

        const formData = new FormData();
        formData.append('title', uploadForm.title);
        formData.append('organization', uploadForm.organization);
        formData.append('issue_date', uploadForm.issue_date);
        if (uploadForm.expiry_date) formData.append('expiry_date', uploadForm.expiry_date);
        formData.append('file', uploadFile);

        try {
            await API.post('/certificates/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadMsg({ type: 'success', text: 'Certificate uploaded successfully!' });
            setUploadForm({ title: '', organization: '', issue_date: '', expiry_date: '' });
            setUploadFile(null);
            setShowUpload(false);
            fetchData();
        } catch (err) {
            const data = err.response?.data;
            // Prioritise field-specific expiry message from backend
            const msg =
                data?.expiry_date?.[0] ||
                data?.non_field_errors?.[0] ||
                data?.error ||
                data?.file?.[0] ||
                (typeof data === 'object' ? Object.values(data).flat().join(' ') : null) ||
                'Upload failed. Please try again.';
            setUploadMsg({ type: 'error', text: `⛔ ${msg}` });
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    const scorePercent = performance ? Math.max(0, Math.min(100, performance.score)) : 0;

    if (loading) {
        return (
            <div className="dashboard">
                <CustomCursor /><div className="antigravity-bg" /><div className="bg-particles" />
                <div className="loading-container" style={{ width: '100%' }}><div className="spinner" /> Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>CertTrack</h2>
                    <span>Student Portal</span>
                </div>
                <nav className="sidebar-nav">
                    <a className={`sidebar-link ${activeTab === 'certificates' ? 'active' : ''}`} onClick={() => setActiveTab('certificates')}>📜 My Certificates</a>
                    <a className={`sidebar-link ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>📊 Performance</a>
                    <a className={`sidebar-link ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
                        🔔 Expiry Alerts {alerts.count > 0 && <span className="badge badge-pending" style={{ marginLeft: 'auto' }}>{alerts.count}</span>}
                    </a>
                </nav>
                <div className="sidebar-footer">
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                        👤 {user?.first_name || user?.username}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleLogout}>Sign Out</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Alert Banner */}
                {alerts.count > 0 && (
                    <div className="alert-banner warning">
                        ⚠️ <strong>{alerts.count} certificate(s)</strong> expiring within 30 days!
                    </div>
                )}

                {uploadMsg.text && (
                    <div className={`alert-banner ${uploadMsg.type}`}>
                        {uploadMsg.type === 'success' ? '✅' : '❌'} {uploadMsg.text}
                    </div>
                )}

                {/* Certificates Tab */}
                {activeTab === 'certificates' && (
                    <>
                        <div className="page-header flex justify-between items-center">
                            <div>
                                <h1>My Certificates</h1>
                                <p>Manage and track your certifications</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>➕ Upload Certificate</button>
                        </div>

                        {/* Stats Row */}
                        <div className="stats-grid">
                            <div className="stat-card purple">
                                <div className="stat-value">{performance?.total || 0}</div>
                                <div className="stat-label">Total Uploaded</div>
                            </div>
                            <div className="stat-card green">
                                <div className="stat-value">{performance?.accepted || 0}</div>
                                <div className="stat-label">Accepted</div>
                            </div>
                            <div className="stat-card amber">
                                <div className="stat-value">{performance?.pending || 0}</div>
                                <div className="stat-label">Pending</div>
                            </div>
                            <div className="stat-card pink">
                                <div className="stat-value">{performance?.rejected || 0}</div>
                                <div className="stat-label">Rejected</div>
                            </div>
                        </div>

                        {/* Certificate List */}
                        {certificates.length === 0 ? (
                            <div className="card text-center" style={{ padding: 60 }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📜</div>
                                <h3 style={{ marginBottom: 8 }}>No certificates yet</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Upload your first certificate to get started!</p>
                            </div>
                        ) : (
                            certificates.map((cert) => (
                                <div key={cert.id} className="cert-card">
                                    <div className="cert-card-header">
                                        <h3>{cert.title}</h3>
                                        <span className={`badge badge-${cert.status}`}>{cert.status}</span>
                                    </div>
                                    <div className="cert-card-meta">
                                        <span>🏢 {cert.organization}</span>
                                        <span>📅 Issued: {cert.issue_date}</span>
                                        {cert.expiry_date && <span>⏰ Expires: {cert.expiry_date}</span>}
                                        <span>👨‍🏫 Faculty: {cert.faculty_name}</span>
                                    </div>
                                    {cert.remarks && <div className="cert-card-remarks">💬 {cert.remarks}</div>}
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && (
                    <>
                        <div className="page-header">
                            <h1>Performance Metrics</h1>
                            <p>Score = (Accepted × 10) − (Rejected × 2)</p>
                        </div>

                        <div className="card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', fontWeight: 900, marginBottom: 8 }} className="text-gradient">
                                {performance?.score || 0}
                            </div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Performance Score</p>

                            <div className="progress-bar-container" style={{ marginBottom: 24 }}>
                                <div className="progress-bar-fill" style={{ width: `${scorePercent}%` }} />
                            </div>

                            <div className="stats-grid" style={{ marginBottom: 0 }}>
                                <div className="stat-card green">
                                    <div className="stat-value">{performance?.accepted || 0}</div>
                                    <div className="stat-label">Accepted (+10 each)</div>
                                </div>
                                <div className="stat-card pink">
                                    <div className="stat-value">{performance?.rejected || 0}</div>
                                    <div className="stat-label">Rejected (−2 each)</div>
                                </div>
                                <div className="stat-card amber">
                                    <div className="stat-value">{performance?.pending || 0}</div>
                                    <div className="stat-label">Pending Review</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                    <>
                        <div className="page-header">
                            <h1>Expiry Alerts</h1>
                            <p>Certificates expiring within the next 30 days</p>
                        </div>

                        {alerts.expiring_certificates.length === 0 ? (
                            <div className="card text-center" style={{ padding: 60 }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                                <h3 style={{ marginBottom: 8 }}>All Clear!</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>No certificates expiring soon.</p>
                            </div>
                        ) : (
                            alerts.expiring_certificates.map((cert) => (
                                <div key={cert.id} className="cert-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                                    <div className="cert-card-header">
                                        <h3>⚠️ {cert.title}</h3>
                                        <span className="badge badge-pending">Expiring</span>
                                    </div>
                                    <div className="cert-card-meta">
                                        <span>🏢 {cert.organization}</span>
                                        <span>⏰ Expires: {cert.expiry_date}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* Upload Modal */}
                {showUpload && (
                    <div className="modal-overlay" onClick={() => setShowUpload(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2 style={{ marginBottom: 4 }}>Upload Certificate</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>Submit a new certification for faculty review</p>

                            {/* Error message inside modal */}
                            {uploadMsg.text && uploadMsg.type === 'error' && (
                                <div className="alert-banner error" style={{ marginBottom: 16, fontSize: '0.88rem' }}>
                                    {uploadMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleUpload}>
                                <div className="form-group">
                                    <label>Certificate Title</label>
                                    <input type="text" className="form-input" placeholder="AWS Cloud Practitioner" value={uploadForm.title}
                                        onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Organization</label>
                                    <input type="text" className="form-input" placeholder="Amazon Web Services" value={uploadForm.organization}
                                        onChange={(e) => setUploadForm({ ...uploadForm, organization: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label>Issue Date</label>
                                        <input type="date" className="form-input" value={uploadForm.issue_date}
                                            onChange={(e) => setUploadForm({ ...uploadForm, issue_date: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Expiry Date (Optional)</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={uploadForm.expiry_date}
                                            style={uploadForm.expiry_date && new Date(uploadForm.expiry_date) < new Date(new Date().setHours(0, 0, 0, 0)) ? { borderColor: 'var(--accent-red)', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
                                            onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })} />
                                        {uploadForm.expiry_date && new Date(uploadForm.expiry_date) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                                            <p className="form-error" style={{ marginTop: 6 }}>⛔ This date is in the past — certificate is already expired.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Certificate File (PDF, JPG, PNG)</label>
                                    <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setUploadFile(e.target.files[0])} required />
                                </div>
                                <div className="flex gap-2" style={{ marginTop: 8 }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                                        {uploading ? '⏳ Uploading...' : '✅ Submit'}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
