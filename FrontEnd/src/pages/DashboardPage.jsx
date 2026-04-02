import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
  Leaf, LayoutDashboard, BarChart3, Package, Bell, Settings,
  LogOut, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Menu, X, Sun, Moon, ChevronDown, ArrowUpRight, ArrowDownRight,
  Zap, Recycle, DollarSign, Target
} from 'lucide-react';
import { useAuth } from '../App';
import { useTheme } from '../App';
import './DashboardPage.css';

// ===== Mock Data =====
const salesData = [
  { week: 'W1', actual: 420, predicted: 440 },
  { week: 'W2', actual: 380, predicted: 360 },
  { week: 'W3', actual: 510, predicted: 490 },
  { week: 'W4', actual: 295, predicted: 310 },
  { week: 'W5', actual: 460, predicted: 470 },
  { week: 'W6', actual: 530, predicted: 510 },
  { week: 'W7', actual: null, predicted: 545 },
  { week: 'W8', actual: null, predicted: 490 },
];

const wasteData = [
  { category: 'Tomatoes', waste: 12, saved: 88 },
  { category: 'Spinach', waste: 22, saved: 78 },
  { category: 'Mangoes', waste: 8, saved: 92 },
  { category: 'Bananas', waste: 15, saved: 85 },
  { category: 'Potatoes', waste: 5, saved: 95 },
  { category: 'Berries', waste: 28, saved: 72 },
];

const pieData = [
  { name: 'Vegetables', value: 55, color: '#22c55e' },
  { name: 'Fruits', value: 30, color: '#f97316' },
  { name: 'Herbs', value: 15, color: '#3b82f6' },
];

const alerts = [
  { type: 'warning', icon: AlertTriangle, product: 'Spinach', message: 'High waste risk in 48h — consider 20% discount', color: '#f97316' },
  { type: 'success', icon: CheckCircle, product: 'Mangoes', message: '↑ 35% demand surge predicted this weekend', color: '#22c55e' },
  { type: 'warning', icon: AlertTriangle, product: 'Berries', message: 'Overstock detected — reorder pause recommended', color: '#ef4444' },
  { type: 'info', icon: Zap, product: 'Tomatoes', message: 'Prediction accuracy improved to 94% this week', color: '#3b82f6' },
];

const inventory = [
  { product: 'Tomatoes', category: 'Vegetable', stock: 245, predicted: 280, wasteRisk: 'Low', trend: 'up' },
  { product: 'Spinach', category: 'Vegetable', stock: 180, predicted: 130, wasteRisk: 'High', trend: 'down' },
  { product: 'Mangoes', category: 'Fruit', stock: 320, predicted: 430, wasteRisk: 'Low', trend: 'up' },
  { product: 'Bananas', category: 'Fruit', stock: 415, predicted: 390, wasteRisk: 'Medium', trend: 'down' },
  { product: 'Potatoes', category: 'Vegetable', stock: 560, predicted: 540, wasteRisk: 'Low', trend: 'up' },
  { product: 'Strawberries', category: 'Fruit', stock: 95, predicted: 60, wasteRisk: 'High', trend: 'down' },
];

const KPIS = [
  { title: 'Waste Reduced', value: '38%', delta: '+6% vs last month', trend: 'up', icon: Recycle, color: '#22c55e' },
  { title: 'Cost Saved', value: '₹2.4L', delta: '+₹0.3L vs last month', trend: 'up', icon: DollarSign, color: '#10b981' },
  { title: 'Prediction Accuracy', value: '93%', delta: '+2% vs last month', trend: 'up', icon: Target, color: '#3b82f6' },
  { title: 'Active Alerts', value: '4', delta: '3 need action', trend: 'neutral', icon: Bell, color: '#f97316' },
];

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'predictions', label: 'Predictions', icon: TrendingUp },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// ===== Custom Tooltip =====
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tooltip-value">
          {p.name}: <strong>{p.value ?? 'N/A'}</strong> kg
        </p>
      ))}
    </div>
  );
};

// ===== KPI Card =====
function KPICard({ title, value, delta, trend, icon: Icon, color }) {
  return (
    <div className="kpi-card card">
      <div className="kpi-top">
        <div className="kpi-icon" style={{ background: `${color}1a`, color }}>
          <Icon size={20} />
        </div>
        {trend === 'up' ? (
          <span className="kpi-trend up"><ArrowUpRight size={14} /> Up</span>
        ) : trend === 'down' ? (
          <span className="kpi-trend down"><ArrowDownRight size={14} /> Down</span>
        ) : (
          <span className="kpi-trend neutral"><AlertTriangle size={14} /></span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-title">{title}</div>
      <div className="kpi-delta text-muted text-sm">{delta}</div>
    </div>
  );
}

// ===== Alert Item =====
function AlertCard({ type, icon: Icon, product, message, color }) {
  return (
    <div className="alert-card" style={{ borderLeftColor: color }}>
      <div className="alert-icon" style={{ color }}>
        <Icon size={18} />
      </div>
      <div className="alert-body">
        <div className="alert-product">{product}</div>
        <div className="alert-message text-secondary text-sm">{message}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const chartStrokeColor = theme === 'dark' ? '#1f2937' : '#e5e7eb';
  const axisColor = theme === 'dark' ? '#4b5563' : '#9ca3af';

  return (
    <div className="dashboard">
      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar glass ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Link to="/" className="flex gap-2" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div className="logo-icon"><Leaf size={16} /></div>
            <span className="font-display sidebar-brand-text">Local<span className="text-gradient">Fresh</span></span>
          </Link>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`sidebar-link ${activeNav === n.id ? 'active' : ''}`}
              onClick={() => { setActiveNav(n.id); setSidebarOpen(false); }}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0] ?? 'U'}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role text-muted text-xs">{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ===== MAIN ===== */}
      <main className="dashboard-main">
        {/* Topbar */}
        <header className="topbar glass">
          <div className="topbar-left">
            <button className="hamburger sidebar-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="topbar-title font-display">
                {NAV.find(n => n.id === activeNav)?.label}
              </h1>
              <p className="topbar-subtitle text-muted text-xs">
                {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              </p>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="topbar-user">
              <div className="user-avatar sm">{user?.name?.[0] ?? 'U'}</div>
              <span className="text-sm hide-mobile">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="dashboard-content">

          {/* ===== OVERVIEW ===== */}
          {activeNav === 'overview' && (
            <div className="tab-content animate-fade-in">
              {/* KPIs */}
              <section className="section-block">
                <div className="grid grid-4">
                  {KPIS.map((k, i) => <KPICard key={i} {...k} />)}
                </div>
              </section>

              {/* Charts Row */}
              <section className="section-block charts-row">
                {/* Sales Prediction */}
                <div className="chart-card card">
                  <div className="chart-card-header">
                    <div>
                      <h3 className="chart-card-title">Sales Prediction vs Actual</h3>
                      <p className="text-muted text-xs">8-week view · kg sold per week</p>
                    </div>
                    <span className="badge">Live Model</span>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={salesData} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartStrokeColor} />
                      <XAxis dataKey="week" tick={{ fontSize:12, fill:axisColor }} />
                      <YAxis tick={{ fontSize:12, fill:axisColor }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize:12 }} />
                      <Line type="monotone" dataKey="actual" name="Actual" stroke="#22c55e" strokeWidth={2.5} dot={{ r:4 }} connectNulls={false} />
                      <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r:4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Pie */}
                <div className="chart-card card pie-card">
                  <div className="chart-card-header">
                    <div>
                      <h3 className="chart-card-title">Sales by Category</h3>
                      <p className="text-muted text-xs">This month</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {pieData.map((d, i) => (
                      <div key={i} className="pie-legend-item">
                        <span className="pie-dot" style={{ background: d.color }} />
                        <span className="text-sm text-secondary">{d.name}</span>
                        <span className="text-sm font-bold">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Waste Bar + Alerts */}
              <section className="section-block charts-row">
                {/* Waste by Category */}
                <div className="chart-card card wide">
                  <div className="chart-card-header">
                    <div>
                      <h3 className="chart-card-title">Waste % by Product</h3>
                      <p className="text-muted text-xs">Current month average</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={wasteData} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartStrokeColor} />
                      <XAxis dataKey="category" tick={{ fontSize:11, fill:axisColor }} />
                      <YAxis tick={{ fontSize:11, fill:axisColor }} unit="%" />
                      <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                      <Legend wrapperStyle={{ fontSize:12 }} />
                      <Bar dataKey="waste" name="Waste %" fill="#ef4444" opacity={0.85} radius={[4,4,0,0]} />
                      <Bar dataKey="saved" name="Saved %" fill="#22c55e" opacity={0.85} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Alerts */}
                <div className="chart-card card narrow">
                  <div className="chart-card-header">
                    <h3 className="chart-card-title">Live Alerts</h3>
                    <span className="alert-count">{alerts.length}</span>
                  </div>
                  <div className="alerts-list">
                    {alerts.map((a, i) => <AlertCard key={i} {...a} />)}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ===== PREDICTIONS ===== */}
          {activeNav === 'predictions' && (
            <div className="tab-content animate-fade-in">
              <section className="section-block">
                <div className="chart-card card full-chart">
                  <div className="chart-card-header">
                    <div>
                      <h3 className="chart-card-title">8-Week Sales Forecast</h3>
                      <p className="text-muted text-xs">AI model · Updated daily · Accuracy 93%</p>
                    </div>
                    <span className="badge">Weeks 7-8 are forecasted</span>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <LineChart data={salesData} margin={{ top:12, right:12, left:-10, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartStrokeColor} />
                      <XAxis dataKey="week" tick={{ fontSize:13, fill:axisColor }} />
                      <YAxis tick={{ fontSize:13, fill:axisColor }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#22c55e" strokeWidth={3} dot={{ r:5 }} />
                      <Line type="monotone" dataKey="predicted" name="Predicted Sales" stroke="#3b82f6" strokeWidth={3} strokeDasharray="8 4" dot={{ r:5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="section-block">
                <div className="chart-card card full-chart">
                  <div className="chart-card-header">
                    <h3 className="chart-card-title">Waste Risk by Product</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={wasteData} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartStrokeColor} />
                      <XAxis dataKey="category" tick={{ fontSize:12, fill:axisColor }} />
                      <YAxis unit="%" tick={{ fontSize:12, fill:axisColor }} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="waste" name="Waste %" fill="#ef4444" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}

          {/* ===== INVENTORY ===== */}
          {activeNav === 'inventory' && (
            <div className="tab-content animate-fade-in">
              <div className="card inventory-card">
                <div className="chart-card-header" style={{ padding:'20px 24px 0' }}>
                  <h3 className="chart-card-title">Product Inventory & Prediction</h3>
                  <span className="badge">{inventory.length} Products</span>
                </div>
                <div className="table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Current Stock (kg)</th>
                        <th>Predicted Demand (kg)</th>
                        <th>Waste Risk</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((row, i) => (
                        <tr key={i}>
                          <td className="product-name">{row.product}</td>
                          <td>
                            <span className="category-badge">{row.category}</span>
                          </td>
                          <td className="text-center">{row.stock}</td>
                          <td className="text-center">{row.predicted}</td>
                          <td>
                            <span className={`risk-badge ${row.wasteRisk.toLowerCase()}`}>{row.wasteRisk}</span>
                          </td>
                          <td>
                            {row.trend === 'up'
                              ? <span className="trend up"><TrendingUp size={16} /></span>
                              : <span className="trend down"><TrendingDown size={16} /></span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== ALERTS ===== */}
          {activeNav === 'alerts' && (
            <div className="tab-content animate-fade-in">
              <div className="alerts-grid">
                {alerts.map((a, i) => <AlertCard key={i} {...a} />)}
              </div>
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeNav === 'settings' && (
            <div className="tab-content animate-fade-in">
              <div className="card settings-card">
                <h3 className="chart-card-title" style={{ marginBottom:24 }}>Account Settings</h3>
                <div className="settings-row">
                  <div>
                    <div className="settings-label">Display Name</div>
                    <div className="text-secondary text-sm">{user?.name}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm">Edit</button>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-label">Email</div>
                    <div className="text-secondary text-sm">{user?.email}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm">Edit</button>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-label">Role</div>
                    <div className="text-secondary text-sm">{user?.role}</div>
                  </div>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-label">Theme</div>
                    <div className="text-secondary text-sm">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Toggle
                  </button>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-label text-red">Logout</div>
                    <div className="text-secondary text-sm">Sign out of your account</div>
                  </div>
                  <button className="btn btn-sm" style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' }} onClick={handleLogout}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
