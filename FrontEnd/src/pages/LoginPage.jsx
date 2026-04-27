import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../App';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });

      const data = await response.json();

      if (data.status === "success") {
        if (form.email == data.email) {
          login({
            user_name: data.user_name,
            email: data.email || form.email,
            user_id: data.user_id
          });
          navigate("/dashboard");
        } else {
          setErrors({ general: "Invalid email or password" });
        }
      } else {
        setErrors({ general: data.message });
      }

    } catch (error) {
      console.error(error);
      setErrors({ general: "Server error" });
    }

    setLoading(false);
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }));
  };

  return (
    <div className="auth-page">
      {/* ===== Left Sidebar ===== */}
      <div className="auth-sidebar">
        <div className="auth-sidebar-bg" />
        <div className="auth-sidebar-content">
          <Link to="/" className="auth-brand">
            <div className="logo-icon"><Leaf size={18} /></div>
            <span className="font-display">LocalFresh</span>
          </Link>

          <h1 className="auth-hero-title font-display">
            Smarter inventory.<br />
            Less waste.<br />
            More profit.
          </h1>

          <p className="auth-hero-subtitle">
            Predict your daily vegetable and fruit sales using AI —<br />
            and stop throwing money in the bin.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-emoji">🍎</span>
              Predict demand for 100+ produce items
            </div>
            <div className="auth-feature">
              <span className="auth-feature-emoji">📊</span>
              Weekly &amp; monthly waste reports
            </div>
            <div className="auth-feature">
              <span className="auth-feature-emoji">🔔</span>
              Smart restock and discount alerts
            </div>
          </div>
        </div>
      </div>

      {/* ===== Right Form Area ===== */}
      <div className="auth-main">
        <div className="auth-container">
          <div className="auth-header">
            <h2 className="auth-title font-display">Welcome back</h2>
            <p className="auth-subtitle">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="you@freshstore.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <button type="submit" className={`btn btn-primary auth-submit ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In →'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
