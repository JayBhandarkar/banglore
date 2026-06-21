'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Cpu, 
  Map, 
  BarChart3, 
  History, 
  ShieldAlert, 
  Zap, 
  Activity,
  Sun,
  Moon
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [time, setTime] = useState('');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Event Simulator', path: '/simulator', icon: Cpu },
    { name: 'Hotspot Map', path: '/map', icon: Map },
    { name: 'Analytics & Insights', path: '/analytics', icon: BarChart3 },
    { name: 'Prediction History', path: '/history', icon: History },
    { name: 'Admin Panel', path: '/admin', icon: ShieldAlert },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Activity size={20} color="var(--accent-blue)" />
        <span>GRIDLOCK.AI</span>
      </div>
      
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`menu-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-dot"></div>
          <span>SYSTEM ACTIVE</span>
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
          {time || 'Loading...'}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          ASTRAM Engine v2.0
        </div>
        <button 
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            marginTop: '12px',
            transition: 'all 0.15s ease'
          }}
          className="theme-toggle-btn"
        >
          {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          <span>{theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}</span>
        </button>
      </div>
    </aside>
  );
}
