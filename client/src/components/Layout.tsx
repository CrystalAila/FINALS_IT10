import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, logActivity } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user && logActivity) {
      logActivity(`Visited ${location.pathname}`);
    }
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-badge">🐓</div>
          <div className="brand-copy">
            <div className="brand-title">Poultry Link</div>
            <div className="brand-subtitle">Modern agriculture marketplace</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to={`/${user?.role}${user?.role === 'admin' ? '/dashboard' : '/dashboard'}`}
            className={`sidebar-link ${location.pathname.includes(`/${user?.role}`) ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin/users"
                className={`sidebar-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
              >
                User Management
              </Link>
              <Link
                to="/admin/logs"
                className={`sidebar-link ${location.pathname === '/admin/logs' ? 'active' : ''}`}
              >
                Activity Logs
              </Link>
            </>
          )}
          <span className="sidebar-role">Role: {user?.role}</span>
          <button type="button" className="btn btn-secondary" onClick={() => logout()}>
            Logout
          </button>
        </nav>
      </aside>

      <div className="content-container">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>☰</button>
            <p className="topbar-welcome">Welcome back, <strong>{user?.fullname}</strong></p>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <input
              className="form-control"
              placeholder="Search"
              style={{ width: '60%', maxWidth: '560px' }}
              onChange={() => {}}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-muted)' }}>POULTRY LINK</div>
            <div className="logo-badge" style={{ width: 40, height: 40 }}>🐓</div>
          </div>
        </header>

        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
