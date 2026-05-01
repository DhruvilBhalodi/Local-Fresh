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
  'Bananas', 'Apples', 'Oranges', 'Grapes', 'Mangoes',
  'Papaya', 'Guava', 'Pomegranate', 'Watermelon', 'Custard Apple'
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
    OK: { cls: 'shelf-ok', label: '✅ OK' },
    EXPIRING_SOON: { cls: 'shelf-soon', label: '⚠️ Soon' },
    EXPIRING_TODAY: { cls: 'shelf-today', label: '🔴 Today' },
    EXPIRED: { cls: 'shelf-expired', label: '💀 Expired' },
    NO_BATCH: { cls: 'shelf-none', label: '—' },
  };
  const { cls, label } = map[flag] || map.NO_BATCH;
  return <span className={`shelf-badge ${cls}`}>{label}</span>;
}

// ─── TAB 1: Overview ──────────────────────────────────────────────────────────
function OverviewTab({ user, fetchData: reloadMain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [salesForm, setSalesForm] = useState(ALL_FRUITS.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));
  const [wasteForm, setWasteForm] = useState(ALL_FRUITS.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));

  const today = new Date().toISOString().split('T')[0];

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
        setData({ kpis: {}, pieData: [], wastePieData: [], inventory: [], alerts: [] });
      }
    } catch (e) {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSalesSubmit = async () => {
    const sales_data = {};
    Object.entries(salesForm).forEach(([f, v]) => { if (v && parseFloat(v) > 0) sales_data[f] = parseFloat(v); });
    if (Object.keys(sales_data).length === 0) return;

    try {
      const res = await fetch(`${API}/api/update-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, date: today, sales_data })
      });
      if (res.ok) {
        setShowSalesModal(false);
        setSalesForm(ALL_FRUITS.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));
        fetchData();
        if (reloadMain) reloadMain();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to log sales.");
      }
    } catch (e) { console.error(e); }
  };

  const handleWasteSubmit = async () => {
    const waste_data = {};
    Object.entries(wasteForm).forEach(([f, v]) => { if (v && parseFloat(v) > 0) waste_data[f] = parseFloat(v); });
    if (Object.keys(waste_data).length === 0) return;

    try {
      const res = await fetch(`${API}/api/update-waste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, date: today, waste_data })
      });
      if (res.ok) {
        setShowWasteModal(false);
        setWasteForm(ALL_FRUITS.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));
        fetchData();
        if (reloadMain) reloadMain();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to log waste.");
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="dash-loading"><RefreshCw className="spin" size={28} /><span>Loading overview…</span></div>;
  if (error) return <div className="dash-error"><AlertTriangle size={32} /><p>{error}</p><button className="btn btn-primary btn-sm" onClick={fetchData}>Retry</button></div>;

  const kpis = [
    { title: 'Total Sales', value: `${data?.kpis?.totalSales || 0} kg`, icon: DollarSign, color: '#48a574' },
    { title: 'Total Waste', value: `${data?.kpis?.totalWaste || 0} kg`, icon: Recycle, color: '#ef4444' },
    { title: 'Model Confidence', value: `${data?.kpis?.efficiency || 0}%`, icon: Target, color: '#a855f7' },
    { title: 'Vendor ID', value: `#${user?.user_id}`, icon: Package, color: '#3b82f6' },
  ];

  return (
    <div className="tab-content">
      {showSalesModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header" style={{ borderBottomColor: 'rgba(72, 165, 116, 0.2)' }}>
              <h3 style={{ color: '#48a574' }}><DollarSign size={20} /> Submit Sales Log</h3>
              <button className="modal-close" onClick={() => setShowSalesModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ gridColumn: 'span 2', marginBottom: 15, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="text-xs font-bold text-muted uppercase">Logging For</label>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: 4 }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              {ALL_FRUITS.map(fruit => (
                <div key={fruit} className="modal-row">
                  <span className="modal-fruit-name">{FRUIT_EMOJIS[fruit]} {fruit}</span>
                  <input type="number" placeholder="kg" className="input modal-qty-input" value={salesForm[fruit]} onChange={e => setSalesForm({ ...salesForm, [fruit]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowSalesModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#48a574' }} onClick={handleSalesSubmit}>Submit Sales</button>
            </div>
          </div>
        </div>
      )}

      {showWasteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
              <h3 style={{ color: '#ef4444' }}><Recycle size={20} /> Submit Waste Log</h3>
              <button className="modal-close" onClick={() => setShowWasteModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ gridColumn: 'span 2', marginBottom: 15, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="text-xs font-bold text-muted uppercase">Logging For</label>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: 4 }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              {ALL_FRUITS.map(fruit => (
                <div key={fruit} className="modal-row">
                  <span className="modal-fruit-name">{FRUIT_EMOJIS[fruit]} {fruit}</span>
                  <input type="number" placeholder="kg" className="input modal-qty-input" value={wasteForm[fruit]} onChange={e => setWasteForm({ ...wasteForm, [fruit]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowWasteModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444' }} onClick={handleWasteSubmit}>Submit Waste</button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Charts Column (Left) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pie chart: Weekly Sales */}
          <div className="card chart-card narrow pie-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Weekly Sales</div>
                <div className="text-sm text-muted">Last 7 days</div>
              </div>
              <DollarSign size={18} style={{ color: '#48a574' }} />
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
            <button className="btn btn-primary btn-sm"
              style={{ width: '100%', marginTop: 20, background: '#48a574', borderRadius: 50, fontWeight: 700 }}
              onClick={() => {
                setSalesForm(ALL_FRUITS.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));
                setShowSalesModal(true);
              }}
            >
              <DollarSign size={14} /> Submit Sales Log
            </button>
          </div>

          {/* Pie chart: Waste Distribution */}
          <div className="card chart-card narrow pie-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Waste Distribution</div>
                <div className="text-sm text-muted">Last 7 days</div>
              </div>
              <Recycle size={18} style={{ color: '#ef4444' }} />
            </div>
            {data?.wastePieData?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.wastePieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4}>
                      {data.wastePieData.map((_, i) => <Cell key={i} fill={['#ef4444', '#f97316', '#eab308', '#fb923c', '#fca5a5', '#dc2626'][i % 6]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {data.wastePieData.map((item, i) => (
                    <div key={i} className="pie-legend-item">
                      <span className="pie-dot" style={{ background: ['#ef4444', '#f97316', '#eab308', '#fb923c', '#fca5a5', '#dc2626'][i % 6] }} />
                      <span className="text-sm">{FRUIT_EMOJIS[item.name] || '🍑'} {item.name}</span>
                      <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>{item.value.toFixed(1)} kg</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">No waste recorded recently</div>
            )}
            <button className="btn btn-primary btn-sm"
              style={{ width: '100%', marginTop: 20, background: '#ef4444', borderRadius: 50, fontWeight: 700 }}
              onClick={() => {
                setWasteForm(ALL_FRUITS.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));
                setShowWasteModal(true);
              }}
            >
              <Recycle size={14} /> Submit Waste Log
            </button>
          </div>
        </div>

        {/* Inventory table */}
        <div className="card chart-card wide inventory-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Inventory Stock</div>
              <div className="text-sm text-muted">Current active stock</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchData}><RefreshCw size={14} /></button>
          </div>
          <div className="table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Active Stock (kg)</th>
                  <th>Expired Stock (kg)</th>
                  <th>Notes (First to Expire)</th>
                </tr>
              </thead>
              <tbody>
                {data?.inventory?.length > 0 ? data.inventory.map((item, i) => (
                  <tr key={i}>
                    <td className="product-name">{FRUIT_EMOJIS[item.product] || '🍑'} {item.product}</td>
                    <td style={{ fontWeight: 600, color: '#48a574' }}>{item.stock ?? '0'}</td>
                    <td style={{ color: item.expired > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: item.expired > 0 ? 600 : 400 }}>{item.expired ?? '0'}</td>
                    <td className="text-sm text-muted">{item.note || '—'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="empty-state">No active inventory found.</td></tr>
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
            <BarChart2 size={18} style={{ color: '#48a574' }} /> Stats
          </div>
        </div>
        <div className="alerts-grid">
          {data?.alerts?.length > 0 ? data.alerts.map((a, i) => (
            <div key={i} className="alert-card">
              <AlertTriangle size={16} style={{ color: '#f97316', flexShrink: 0 }} />
              <span className="text-sm">{a.message}</span>
            </div>
          )) : (
            <div className="text-muted text-sm" style={{ padding: '12px 0' }}>✅ No upcoming stats or alerts.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: Today's Prediction ────────────────────────────────────────────────
function PredictionTab({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forceRefreshing, setForceRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState(ALL_FRUITS.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const fetchPrediction = useCallback(async (force = false) => {
    if (!user?.user_id) return;
    setLoading(true);
    if (force) setForceRefreshing(true);
    setError(null);
    setPurchaseSuccess(false);
    try {
      const res = await fetch(`${API}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, force_refresh: force })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setData(json);
      } else {
        setError(json.message || 'Prediction failed.');
      }
    } catch (e) {
      setError('Cannot reach the server.');
    } finally {
      setLoading(false);
      setForceRefreshing(false);
    }
  }, [user?.user_id]);

  useEffect(() => { fetchPrediction(); }, [fetchPrediction]);

  const handlePurchaseSubmit = async () => {
    const items = Object.entries(purchaseQty)
      .filter(([_, qty]) => qty !== '' && parseFloat(qty) > 0)
      .map(([fruit, qty]) => ({ fruit_name: fruit, quantity_kg: parseFloat(qty) }));
    if (items.length === 0) return;

    try {
      const res = await fetch(`${API}/api/record-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, items })
      });
      if (res.ok) {
        setShowModal(false);
        setPurchaseQty(ALL_FRUITS.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));
        setPurchaseSuccess(true);
        fetchPrediction();
      }
    } catch (err) { console.error(err); }
  };

  const weatherIcon = (cond) => {
    if (!cond) return <Cloud size={16} />;
    const c = cond.toLowerCase();
    if (c.includes('sunny') || c.includes('clear')) return <Sun size={16} style={{ color: '#eab308' }} />;
    if (c.includes('rain') || c.includes('drizzle') || c.includes('thunder')) return <Droplets size={16} style={{ color: '#3b82f6' }} />;
    return <Cloud size={16} style={{ color: '#94a3b8' }} />;
  };

  const weatherSourceBadge = (source) => {
    if (!source || source === 'live') return <span style={{ fontSize: '0.65rem', background: 'rgba(72,165,116,0.15)', color: '#48a574', borderRadius: 99, padding: '1px 7px', fontWeight: 700, marginLeft: 6 }}>🟢 Live</span>;
    if (source === 'custom') return <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 99, padding: '1px 7px', fontWeight: 700, marginLeft: 6 }}>🔵 Custom</span>;
    return <span style={{ fontSize: '0.65rem', background: 'rgba(234,179,8,0.15)', color: '#eab308', borderRadius: 99, padding: '1px 7px', fontWeight: 700, marginLeft: 6 }}>🟡 Fallback</span>;
  };

  if (loading && !data && !forceRefreshing) return <div className="dash-loading"><RefreshCw className="spin" size={28} /><span>Loading predictions…</span></div>;

  return (
    <div className="tab-content">
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Record Purchase</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {ALL_FRUITS.map(fruit => (
                <div key={fruit} className="modal-row">
                  <span className="modal-fruit-name">{FRUIT_EMOJIS[fruit]} {fruit}</span>
                  <input type="number" placeholder="kg" className="input modal-qty-input" value={purchaseQty[fruit]} onChange={e => setPurchaseQty({ ...purchaseQty, [fruit]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePurchaseSubmit}>Save Purchase</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="dash-error"><AlertTriangle size={28} /><p>{error}</p></div>}

      {data && (
        <>
          {purchaseSuccess && <div className="purchase-success-banner"><CheckCircle size={18} /> Purchase recorded! Inventory updated.</div>}

          <div className="card context-bar">
            <div className="ctx-item"><span className="ctx-label">Date</span><strong>{data.date}</strong></div>
            <div className="ctx-sep" />
            <div className="ctx-item">{weatherIcon(data.weather?.condition)}<span className="ctx-label" style={{ marginLeft: 6 }}>Weather</span><strong>{data.weather?.description || data.weather?.condition} ({data.weather?.temperature_c}°C){weatherSourceBadge(data.weather?.source)}</strong></div>
            <div className="ctx-sep" />
            <div className="ctx-item"><span className="ctx-label">Season</span><strong>{data.season}</strong></div>
          </div>

          <div className="card best-fruit-card">
            <div className="best-fruit-badge">⭐ Best Fruit of the Day</div>
            <div className="best-fruit-emoji">{data.best_fruit_emoji}</div>
            <div className="best-fruit-name">{data.best_fruit}</div>
            <div className="best-fruit-conf-label">Model Confidence</div>
            <div className="confidence-bar-wrapper"><div className="confidence-bar" style={{ width: `${data.best_fruit_confidence}%` }} /></div>
            <div className="confidence-value">{data.best_fruit_confidence}%</div>
          </div>

          <div className="card chart-card inventory-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Purchase Recommendations</div>
                <div className="text-sm text-muted">Total order: <strong>{data.total_order_kg} kg</strong></div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                setPurchaseQty(ALL_FRUITS.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));
                setShowModal(true);
              }}><ShoppingCart size={14} /> Record Purchase</button>
            </div>
            <div className="table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Fruit</th>
                    <th style={{ textAlign: 'right' }}>Predicted Sales (kg)</th>
                    <th style={{ textAlign: 'right' }}>Recommended Purchase (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_FRUITS.map(fruit => (
                    <tr key={fruit} style={fruit === data.best_fruit ? { background: 'rgba(72, 165, 116, 0.08)' } : {}}>
                      <td className="product-name">{FRUIT_EMOJIS[fruit]} {fruit} {fruit === data.best_fruit && <span className="best-badge">⭐ Best</span>}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{data.predicted_sales?.[fruit] ?? '0'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)' }}>{data.recommendations?.[fruit] ?? '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => fetchPrediction(true)} disabled={forceRefreshing}>
              {forceRefreshing ? <RefreshCw className="spin" size={14} /> : <><Brain size={14} /> Force Fresh Prediction</>}
            </button>
          </div>
        </>
      )}
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
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'prediction', label: "Today's Prediction", icon: Brain },
  ];

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar glass ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="logo-icon"><Leaf size={18} /></div>
            <span className="sidebar-brand-text font-display">Local<span className="text-gradient">Fresh</span></span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}><X size={16} /></button>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              id={`tab-${tab.id}`}
            >
              <tab.icon size={18} /> {tab.label}
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
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dashboard-main">
        {/* Topbar */}
        <div className="topbar glass">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} id="sidebar-toggle-btn">
              <Menu size={22} />
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
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'prediction' && <PredictionTab user={user} />}
        </div>
      </main>
    </div>
  );
}