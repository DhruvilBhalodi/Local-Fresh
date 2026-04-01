import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf, TrendingUp, ShieldCheck, Bell, ChevronRight,
  ArrowRight, BarChart2, AlertTriangle, Zap, Star,
  Users, Package, Recycle, CheckCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import './LandingPage.css';

// ===== Animated Counter =====
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ===== Feature Card =====
function FeatureCard({ icon: Icon, title, description, color, delay }) {
  return (
    <div className="feature-card card" style={{ animationDelay: `${delay}ms` }}>
      <div className="feature-icon" style={{ background: `${color}1a`, color }}>
        <Icon size={24} />
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc text-secondary">{description}</p>
    </div>
  );
}

// ===== Step Card =====
function StepCard({ number, title, description, delay }) {
  return (
    <div className="step-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="step-number">{number}</div>
      <div className="step-content">
        <h4 className="step-title">{title}</h4>
        <p className="step-desc text-secondary">{description}</p>
      </div>
    </div>
  );
}

// ===== Testimonial =====
function TestimonialCard({ name, role, text, rating }) {
  return (
    <div className="testimonial-card card">
      <div className="testimonial-stars">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} size={14} fill="currentColor" color="#eab308" />
        ))}
      </div>
      <p className="testimonial-text">"{text}"</p>
      <div className="testimonial-author">
        <div className="author-avatar">{name[0]}</div>
        <div>
          <div className="author-name">{name}</div>
          <div className="author-role text-muted text-sm">{role}</div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: 'AI Sales Prediction',
      description: 'Machine learning models trained on 2+ years of historical sales data to forecast demand precisely for every SKU.',
      color: '#22c55e',
      delay: 0,
    },
    {
      icon: AlertTriangle,
      title: 'Waste Early Alerts',
      description: 'Get notified 48–72 hours before produce is likely to expire unsold so you can discount, donate, or redirect it.',
      color: '#f97316',
      delay: 100,
    },
    {
      icon: BarChart2,
      title: 'Real-Time Analytics',
      description: 'Interactive dashboards showing waste trends, cost savings, and prediction accuracy across all product categories.',
      color: '#3b82f6',
      delay: 200,
    },
    {
      icon: ShieldCheck,
      title: 'Smart Inventory',
      description: 'Automated reorder suggestions that prevent both overstocking and stockouts — keeping shelves fresh and profitable.',
      color: '#a855f7',
      delay: 300,
    },
    {
      icon: Zap,
      title: 'Instant Insights',
      description: 'See actionable recommendations the moment you log in. No raw data mining required — FreshCast surfaces what matters.',
      color: '#eab308',
      delay: 400,
    },
    {
      icon: Recycle,
      title: 'Sustainability Score',
      description: 'Track your environmental impact with a monthly sustainability report and carbon footprint estimation per ton of waste reduced.',
      color: '#10b981',
      delay: 500,
    },
  ];

  const steps = [
    { number: '01', title: 'Connect Your Data', description: 'Upload past sales CSVs or connect your POS / ERP system via API in minutes.' },
    { number: '02', title: 'AI Trains & Predicts', description: 'Our models analyze seasonality, weather, promotions, and trends to predict future demand.' },
    { number: '03', title: 'Receive Smart Alerts', description: 'Get daily digests with which items to discount, promote, or reorder before waste happens.' },
    { number: '04', title: 'Track Your Impact', description: 'Watch your waste percentage drop and cost savings accumulate on your live dashboard.' },
  ];

  const testimonials = [
    { name: 'Rajan Mehta', role: 'Store Manager, FreshMart', text: 'We cut our vegetable waste by 38% in the first month. The predictions are surprisingly accurate even for leafy greens.', rating: 5 },
    { name: 'Priya Sharma', role: 'Operations Head, GreenGrocer', text: 'The early-warning alerts save us ₹2 lakh+ per month by letting us run flash sales before produce turns.', rating: 5 },
    { name: 'Anil Verma', role: 'Distributor, OrganicBox', text: 'Finally a tool built for Indian seasonal patterns. It understands mango season and monsoon demand shifts!', rating: 5 },
  ];

  return (
    <div className="landing">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="hero-section">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="container hero-content">
          <div className={`hero-text ${heroVisible ? 'visible' : ''}`}>
            <div className="badge mb-4">
              <Leaf size={14} /> AI-Powered Food Waste Reduction
            </div>
            <h1 className="hero-title font-display">
              Stop Wasting.<br />
              Start Predicting.
            </h1>
            <p className="hero-subtitle text-secondary">
              FreshCast uses machine learning on your historical sales data to predict demand for vegetables and fruits — so you order smarter and waste less.
            </p>
            <div className="hero-cta-wrapper" style={{ marginBottom: '32px' }}>
              <div className="hero-actions" style={{ marginBottom: '12px' }}>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start Free Trial <ArrowRight size={18} />
                </Link>
              </div>
              <p className="text-secondary flex" style={{ fontSize: '16px', alignItems: 'center', fontWeight: '500' }}>
                <CheckCircle size={18} style={{ marginRight: '8px', color: 'var(--accent-green)' }} />
                No credit card needed
              </p>
            </div>


            {/* <div className="hero-actions flex items-center gap-3">
              <Link
                to="/register"
                className="btn btn-primary btn-lg flex items-center"
              >
                Start Free Trial <ArrowRight size={18} />
              </Link>

              <span className="mt-[50px] text-secondary text-base ml-6 leading-none flex items-center">
                No credit card needed
              </span>
            </div> */}
            <div className="stats-mini-row mt-8">
              <div className="stat-mini">
                <div className="stat-mini-val font-display">47%</div>
                <div className="stat-mini-label text-secondary">Less waste on<br />average</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-val font-display">3.2X</div>
                <div className="stat-mini-label text-secondary">ROI in first<br />month</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-val font-display">500+</div>
                <div className="stat-mini-label text-secondary">Stores using<br />FreshCast</div>
              </div>
            </div>
          </div>

          {/* Hero Chart Preview */}
          <div className={`hero-visual ${heroVisible ? 'visible' : ''}`}>
            <div className="chart-preview card tilted-card">
              <div className="savings-pill">
                <Zap size={14} fill="currentColor" /> Save ₹12,400 this week
              </div>
              <div className="chart-header">
                <div>
                  <div className="text-xs font-bold text-muted mb-1 uppercase tracking-wider">Today's Forecast</div>
                  <h3 className="chart-title font-display text-2xl m-0">Waste Alert Dashboard</h3>
                </div>
                <span className="badge text-xs badge-soft-green">Live</span>
              </div>
              <div className="waste-alert-list mt-6">
                {[
                  { name: 'Tomatoes', emoji: '🍅', stock: 48, pred: 35, status: 'Monitor', color: 'yellow' },
                  { name: 'Bananas', emoji: '🍌', stock: 120, pred: 115, status: 'On Track', color: 'green' },
                  { name: 'Spinach', emoji: '🥬', stock: 22, pred: 8, status: 'High Risk', color: 'red' },
                  { name: 'Strawberries', emoji: '🍓', stock: 60, pred: 58, status: 'On Track', color: 'green' },
                  { name: 'Lettuce', emoji: '🥗', stock: 35, pred: 14, status: 'High Risk', color: 'red' },
                ].map((item, i) => (
                  <div key={i} className="waste-alert-item" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="alert-item-left">
                      <div className="alert-emoji">{item.emoji}</div>
                      <div>
                        <div className="alert-product-name">{item.name}</div>
                        <div className="alert-product-stats text-muted text-xs">
                          Stock: {item.stock} &bull; Pred: {item.pred}
                        </div>
                      </div>
                    </div>
                    <div className={`alert-status-badge ${item.color}`}>
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="stats-section" id="stats">
        <div className="container">
          <div className="stats-grid">
            {[
              { value: 40, suffix: '%', label: 'Avg. Waste Reduction' },
              { value: 500, suffix: '+', label: 'Active Retailers' },
              { value: 2, suffix: 'M+', label: 'SKUs Tracked Daily' },
              { value: 92, suffix: '%', label: 'Prediction Accuracy' },
            ].map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-value text-gradient font-display">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="stat-label text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header text-center">
            <div className="badge mb-3">Features</div>
            <h2 className="section-title font-display">
              Everything You Need to <span className="text-gradient">Slash Waste</span>
            </h2>
            <p className="section-subtitle text-secondary">
              From demand forecasting to real-time alerts — FreshCast covers the full waste-reduction lifecycle.
            </p>
          </div>
          <div className="grid grid-3 features-grid">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section how-section" id="how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <div className="badge mb-3">Process</div>
            <h2 className="section-title font-display">
              Up &amp; Running in <span className="text-gradient">4 Simple Steps</span>
            </h2>
          </div>
          <div className="steps-grid">
            {steps.map((s, i) => <StepCard key={i} {...s} delay={i * 100} />)}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="badge mb-3">Testimonials</div>
            <h2 className="section-title font-display">
              Loved by <span className="text-gradient">Fresh Produce Teams</span>
            </h2>
          </div>
          <div className="grid grid-3">
            {testimonials.map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-orb" />
            <div className="badge mb-4">Get Started Today</div>
            <h2 className="cta-title font-display">
              Ready to Reduce Waste &amp;<br />
              <span className="text2-gradient">Boost Your Margins?</span>
            </h2>
            <p className="cta-subtitle text-secondary">
              Join 500+ retailers already saving lakhs per month with FreshCast predictions.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Free 14-Day Trial <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                Already have an account? Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="logo-icon"><Leaf size={18} /></div>
              <span className="font-display font-bold text-lg">Fresh<span className="text-gradient">Cast</span></span>
            </div>
            <div className="footer-links">
              <a href="#features" className="footer-link">Features</a>
              <a href="#how-it-works" className="footer-link">How It Works</a>
              <Link to="/login" className="footer-link">Login</Link>
              <Link to="/register" className="footer-link">Register</Link>
            </div>
            <div className="footer-copy text-muted text-sm">
              © 2026 FreshCast. Reducing food waste, one prediction at a time.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
