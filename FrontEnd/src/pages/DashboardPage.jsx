import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, Brain, Recycle, LayoutDashboard,
  DollarSign, Target, Package, AlertTriangle,
  RefreshCw, Cloud, Sun, Droplets, Thermometer,
  ShoppingCart, CheckCircle, X, LogOut, Leaf, Menu
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { useAuth } from '../App';
import { useTheme } from '../App';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const API = 'http://localhost:5000';

const PIE_COLORS = ['#48a574', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#6366f1'];

const FRUIT_EMOJIS = {
  Bananas: '🍌', Apples: '🍎', Oranges: '🍊', Grapes: '🍇',
  Mangoes: '🥭', Papaya: '🧡', Guava: '🍐', Pomegranate: '❤️',
  Watermelon: '🍉', 'Custard Apple': '💚'
};

const ALL_FRUITS = [
  'Bananas','Apples','Oranges','Grapes','Mangoes',
  'Papaya','Guava','Pomegranate','Watermelon','Custard Apple'
];

const FESTIVALS = ['None', 'Diwali', 'Holi', 'Christmas', 'Navratri', 'Eid'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-top">
        <div className="kpi-icon" style={{ background: `${color}22`, color }}>
          <Icon size={22} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-title">{title}</div>
    </div>
  );
}

function ShelfBadge({ flag }) {
  const map = {
    OK:            { cls: 'shelf-ok',      label: '✅ OK' },
    EXPIRING_SOON: { cls: 'shelf-soon',    label: '⚠️ Soon' },
    EXPIRING_TODAY:{ cls: 'shelf-today',   label: '🔴 Today' },
    EXPIRED:       { cls: 'shelf-expired', label: '💀 Expired' },
    NO_BATCH:      { cls: 'shelf-none',    label: '—' },
  };
  const { cls, label } = map[flag] || map.NO_BATCH;
  return <span className={`shelf-badge ${cls}`}>{label}</span>;
}

// ─── TAB 1: Overview ──────────────────────────────────────────────────────────
function OverviewTab({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/dashboard?user_id=${user.user_id}`);
      const json = await res.json();
      if (json.status === 'success') {
        setData(json);
        setError(null);
      } else {
        setData({ kpis: {}, pieData: [], inventory: [], alerts: [] });
      }
    } catch (e) {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="dash-loading"><RefreshCw className="spin" size={28} /><span>Loading overview…</span></div>;
  if (error)   return <div className="dash-error"><AlertTriangle size={32}/><p>{error}</p><button className="btn btn-primary btn-sm" onClick={fetchData}>Retry</button></div>;

  const kpis = [
    { title: 'Total Sales',   value: `${data?.kpis?.totalSales || 0} kg`,    icon: DollarSign, color: '#48a574' },
    { title: 'Total Waste',   value: `${data?.kpis?.totalWaste || 0} kg`,    icon: Recycle,    color: '#ef4444' },
    { title: 'Efficiency',    value: `${data?.kpis?.efficiency  || 0}%`,     icon: Target,     color: '#a855f7' },
    { title: 'Vendor ID',     value: `#${user?.user_id}`,                    icon: Package,    color: '#3b82f6' },
  ];

  return (
    <div className="tab-content">
      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Pie chart */}
        <div className="card chart-card narrow pie-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Top Selling Fruits</div>
              <div className="text-sm text-muted">All-time distribution</div>
            </div>
          </div>
          {data?.pieData?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.pieData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4}>
                    {data.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {data.pieData.map((item, i) => (
                  <div key={i} className="pie-legend-item">
                    <span className="pie-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm">{FRUIT_EMOJIS[item.name] || '🍑'} {item.name}</span>
                    <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>{Math.round(item.value)} kg</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">No sales data yet</div>
          )}
        </div>

        {/* Inventory table */}
        <div className="card chart-card wide inventory-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Recent Stock Status</div>
              <div className="text-sm text-muted">Last 10 records</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchData} id="refresh-overview-btn"><RefreshCw size={14} /></button>
          </div>
          <div className="table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>End Stock (kg)</th>
                  <th>Waste</th>
                  <th>Date</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {data?.inventory?.length > 0 ? data.inventory.map((item, i) => (
                  <tr key={i}>
                    <td className="product-name">{FRUIT_EMOJIS[item.product] || '🍑'} {item.product}</td>
                    <td>{item.stock ?? '—'}</td>
                    <td>{item.waste_quantity ?? 0} kg</td>
                    <td>{item.date}</td>
                    <td>
                      <span className={`risk-badge ${(item.wasteRisk || 'low').toLowerCase()}`}>
                        {item.wasteRisk || 'Low'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="empty-state">No inventory records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="card chart-card full-chart">
        <div className="chart-card-header">
          <div className="chart-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: '#eab308' }} /> Spoilage Alerts
          </div>
        </div>
        <div className="alerts-grid">
          {data?.alerts?.length > 0 ? data.alerts.map((a, i) => (
            <div key={i} className="alert-card">
              <AlertTriangle size={16} style={{ color: '#f97316', flexShrink: 0 }} />
              <span className="text-sm">{a.message}</span>
            </div>
          )) : (
            <div className="text-muted text-sm" style={{ padding: '12px 0' }}>✅ No upcoming spoilage alerts.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: Today's Prediction ────────────────────────────────────────────────
function PredictionTab({ user }) {
  const [festival, setFestival] = useState('None');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState({});
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [recordingPurchase, setRecordingPurchase] = useState(false);

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPurchaseSuccess(false);
    try {
      const res = await fetch(`${API}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.user_id, festival })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setData(json);
        // Pre-fill modal quantities with recommendations
        const initQty = {};
        Object.entries(json.recommendations || {}).forEach(([f, q]) => { initQty[f] = q; });
        setPurchaseQty(initQty);
      } else {
        setError(json.message || 'Prediction failed.');
      }
    } catch (e) {
      setError('Cannot reach the server. Is Flask running?');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, festival]);

  useEffect(() => { fetchPrediction(); }, []); // auto-load once

  const handleRecordPurchase = async () => {
    setRecordingPurchase(true);
    try {
      const fruits = Object.keys(purchaseQty).filter(f => parseFloat(purchaseQty[f]) > 0);
      const res = await fetch(`${API}/api/record-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.user_id, fruits, quantities: purchaseQty })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setPurchaseSuccess(true);
        setShowModal(false);
        // Re-fetch to update shelf status
        fetchPrediction();
      }
    } catch (e) {
      alert('Failed to record purchase.');
    } finally {
      setRecordingPurchase(false);
    }
  };

  const weatherIcon = (cond) => {
    if (!cond) return <Cloud size={16}/>;
    const c = cond.toLowerCase();
    if (c.includes('sunny')) return <Sun size={16} style={{ color: '#eab308' }} />;
    if (c.includes('rain'))  return <Droplets size={16} style={{ color: '#3b82f6' }} />;
    return <Cloud size={16} style={{ color: '#94a3b8' }} />;
  };

  return (
    <div className="tab-content">
      {/* Controls bar */}
      <div className="card prediction-controls">
        <div className="pred-ctrl-group">
          <label className="form-label">Festival / Holiday</label>
          <select className="form-control" style={{ maxWidth: 200 }}
            value={festival} onChange={e => setFestival(e.target.value)} id="festival-select">
            {FESTIVALS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchPrediction} disabled={loading} id="run-prediction-btn">
          {loading ? <span className="spinner" /> : <><Brain size={14} /> Run Prediction</>}
        </button>
      </div>

      {error && (
        <div className="dash-error">
          <AlertTriangle size={28}/><p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchPrediction}>Retry</button>
        </div>
      )}

      {loading && !data && (
        <div className="dash-loading"><RefreshCw className="spin" size={28}/><span>Running ML models…</span></div>
      )}

      {data && (
        <>
          {purchaseSuccess && (
            <div className="purchase-success-banner">
              <CheckCircle size={18}/> Purchase recorded successfully! Shelf tracking updated.
            </div>
          )}

          {/* Context bar */}
          <div className="card context-bar">
            <div className="ctx-item"><span className="ctx-label">Date</span><strong>{data.date}</strong></div>
            <div className="ctx-sep" />
            <div className="ctx-item"><span className="ctx-label">Day</span><strong>{data.day_of_week}</strong></div>
            <div className="ctx-sep" />
            <div className="ctx-item"><span className="ctx-label">Season</span><strong>{data.season}</strong></div>
            <div className="ctx-sep" />
            <div className="ctx-item">{weatherIcon(data.weather?.condition)}<span className="ctx-label" style={{marginLeft:6}}>Weather</span><strong>{data.weather?.condition}</strong></div>
            <div className="ctx-sep" />
            <div className="ctx-item"><Thermometer size={14} style={{color:'#ef4444'}}/><strong>{data.weather?.temperature_c}°C</strong></div>
            <div className="ctx-sep" />
            <div className="ctx-item"><Droplets size={14} style={{color:'#3b82f6'}}/><strong>{data.weather?.humidity}%</strong></div>
            <div className="ctx-sep" />
            <div className="ctx-item"><span className="ctx-label">Weekend</span><strong>{data.is_weekend}</strong></div>
          </div>

          {/* Best Fruit hero card */}
          <div className="card best-fruit-card">
            <div className="best-fruit-badge">⭐ Best Fruit of the Day</div>
            <div className="best-fruit-emoji">{data.best_fruit_emoji || FRUIT_EMOJIS[data.best_fruit] || '🍑'}</div>
            <div className="best-fruit-name font-display">{data.best_fruit}</div>
            <div className="best-fruit-conf-label">Model Confidence</div>
            <div className="confidence-bar-wrapper">
              <div className="confidence-bar" style={{ width: `${data.best_fruit_confidence}%` }} />
            </div>
            <div className="confidence-value">{data.best_fruit_confidence}%</div>
          </div>

          {/* Alerts */}
          {(data.alerts?.expired?.length > 0 || data.alerts?.expiring_today?.length > 0 || data.alerts?.expiring_soon?.length > 0) && (
            <div className="pred-alerts-section">
              {data.alerts.expired?.length > 0 && (
                <div className="pred-alert expired">
                  💀 <strong>Expired batches:</strong> {data.alerts.expired.join(', ')}
                </div>
              )}
              {data.alerts.expiring_today?.length > 0 && (
                <div className="pred-alert expiring-today">
                  🔴 <strong>Expiring today:</strong> {data.alerts.expiring_today.join(', ')}
                </div>
              )}
              {data.alerts.expiring_soon?.length > 0 && (
                <div className="pred-alert expiring-soon">
                  ⚠️ <strong>Expiring soon:</strong> {data.alerts.expiring_soon.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Recommendations table */}
          <div className="card chart-card inventory-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Purchase Recommendations</div>
                <div className="text-sm text-muted">Total order: <strong>{data.total_order_kg} kg</strong></div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} id="record-purchase-btn">
                <ShoppingCart size={14} /> Record Purchase
              </button>
            </div>
            <div className="table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Fruit</th>
                    <th style={{ textAlign: 'right' }}>Recommended (kg)</th>
                    <th style={{ textAlign: 'center' }}>Shelf Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_FRUITS.map(fruit => (
                    <tr key={fruit} style={fruit === data.best_fruit ? { background: 'rgba(72,165,116,0.08)' } : {}}>
                      <td className="product-name">
                        {FRUIT_EMOJIS[fruit] || '🍑'} {fruit}
                        {fruit === data.best_fruit && <span className="best-badge">⭐ Best</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)' }}>
                        {data.recommendations?.[fruit] ?? '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <ShelfBadge flag={data.shelf_status?.[fruit]?.flag || 'NO_BATCH'} />
                      </td>
                      <td className="text-sm text-muted">{data.shelf_status?.[fruit]?.message || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Purchase Modal */}
      {showModal && data && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-display">Confirm Today's Purchase</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} id="close-modal-btn"><X size={18}/></button>
            </div>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              Adjust quantities as needed. These will be saved as new batches.
            </p>
            <div className="modal-body">
              {ALL_FRUITS.map(fruit => (
                <div key={fruit} className="modal-row">
                  <span className="modal-fruit-name">{FRUIT_EMOJIS[fruit]} {fruit}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="form-control modal-qty-input"
                    value={purchaseQty[fruit] ?? 0}
                    onChange={e => setPurchaseQty(q => ({ ...q, [fruit]: parseFloat(e.target.value) || 0 }))}
                    id={`purchase-qty-${fruit.replace(/\s+/g,'-').toLowerCase()}`}
                  />
                  <span className="text-sm text-muted">kg</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleRecordPurchase}
                disabled={recordingPurchase} id="confirm-purchase-btn">
                {recordingPurchase ? <span className="spinner"/> : <><CheckCircle size={14}/> Confirm Purchase</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB 3: Waste Tracking ────────────────────────────────────────────────────
function WasteTab({ user }) {
  const [wasteForm, setWasteForm] = useState(
    Object.fromEntries(ALL_FRUITS.map(f => [f, '']))
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const [histData, setHistData] = useState([]);

  const today = new Date().toISOString().slice(0, 10);

  const fetchHistory = useCallback(async () => {
    if (!user?.user_id) return;
    setHistLoading(true);
    try {
      const res = await fetch(`${API}/api/waste-history?user_id=${user.user_id}`);
      const json = await res.json();
      if (json.status === 'success') {
        // Aggregate by fruit for bar chart
        const agg = {};
        json.data.forEach(row => {
          if (!agg[row.fruit]) agg[row.fruit] = 0;
          agg[row.fruit] += row.waste_kg;
        });
        setHistData(Object.entries(agg).map(([name, waste]) => ({
          name: `${FRUIT_EMOJIS[name] || ''} ${name}`,
          waste: Math.round(waste * 10) / 10
        })).sort((a,b) => b.waste - a.waste));
      }
    } catch(e) {}
    finally { setHistLoading(false); }
  }, [user?.user_id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    const waste_data = {};
    Object.entries(wasteForm).forEach(([f, v]) => {
      if (v !== '' && parseFloat(v) > 0) waste_data[f] = parseFloat(v);
    });
    try {
      const res = await fetch(`${API}/api/update-waste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.user_id, waste_data, date: today })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setSuccess(true);
        setWasteForm(Object.fromEntries(ALL_FRUITS.map(f => [f, ''])));
        fetchHistory();
      }
    } catch(e) { alert('Failed to submit waste data.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="tab-content">
      {success && (
        <div className="purchase-success-banner">
          <CheckCircle size={18}/> Waste data logged successfully for {today}.
        </div>
      )}

      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        {/* Waste form */}
        <div className="card chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Log Today's Waste</div>
              <div className="text-sm text-muted">{today}</div>
            </div>
          </div>
          <form onSubmit={handleSubmit} id="waste-form">
            <div className="waste-form-grid">
              {ALL_FRUITS.map(fruit => (
                <div key={fruit} className="waste-form-row">
                  <label className="waste-form-label">
                    {FRUIT_EMOJIS[fruit]} {fruit}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className="form-control waste-input"
                      placeholder="0"
                      value={wasteForm[fruit]}
                      onChange={e => setWasteForm(f => ({ ...f, [fruit]: e.target.value }))}
                      id={`waste-${fruit.replace(/\s+/g,'-').toLowerCase()}`}
                    />
                    <span className="text-sm text-muted">kg</span>
                  </div>
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}
              disabled={submitting} id="submit-waste-btn">
              {submitting ? <span className="spinner"/> : <><Recycle size={14}/> Submit Waste Log</>}
            </button>
          </form>
        </div>

        {/* Bar chart */}
        <div className="card chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Waste by Fruit</div>
              <div className="text-sm text-muted">Last 7 days (kg)</div>
            </div>
          </div>
          {histLoading ? (
            <div className="dash-loading"><RefreshCw className="spin" size={22}/></div>
          ) : histData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={histData} margin={{ left: 0, right: 16, top: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                <Bar dataKey="waste" name="Waste (kg)" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No waste data for the last 7 days.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const tabs = [
    { id: 'overview',    label: 'Overview',           icon: LayoutDashboard },
    { id: 'prediction',  label: "Today's Prediction",  icon: Brain           },
    { id: 'waste',       label: 'Waste Tracking',      icon: Recycle         },
  ];

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar glass ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="logo-icon"><Leaf size={18}/></div>
            <span className="sidebar-brand-text font-display">Local<span className="text-gradient">Fresh</span></span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}><X size={16}/></button>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              id={`tab-${tab.id}`}
            >
              <tab.icon size={18}/> {tab.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{(user?.user_name || 'V')[0].toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.user_name}</div>
              <div className="text-xs text-muted user-role">Vendor #{user?.user_id}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout" id="logout-btn">
            <LogOut size={16}/>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dashboard-main">
        {/* Topbar */}
        <div className="topbar glass">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} id="sidebar-toggle-btn">
              <Menu size={22}/>
            </button>
            <div>
              <div className="topbar-title">
                {tabs.find(t => t.id === activeTab)?.label}
              </div>
              <div className="topbar-subtitle text-xs text-muted">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={toggleTheme} id="theme-toggle-btn" title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="topbar-user">
              <div className="user-avatar sm">{(user?.user_name || 'V')[0].toUpperCase()}</div>
              <span className="text-sm hide-mobile">{user?.user_name}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {activeTab === 'overview'   && <OverviewTab   user={user} />}
          {activeTab === 'prediction' && <PredictionTab user={user} />}
          {activeTab === 'waste'      && <WasteTab      user={user} />}
        </div>
      </main>
    </div>
  );
}