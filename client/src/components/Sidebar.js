import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, GitBranch, AlertTriangle, BarChart3, Settings } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Pipelines', href: '/pipelines', icon: GitBranch },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Metrics', href: '/metrics', icon: BarChart3 },
];

const Sidebar = ({ open, setOpen, isConnected }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${open ? 'sidebar-open' : 'sidebar-closed'} lg:translate-x-0`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">CI/CD</span>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            {/* Connection status */}
            <div className="flex items-center space-x-2 mb-4">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success-400' : 'bg-danger-400'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Server Connected' : 'Server Disconnected'}
              </span>
            </div>

            {/* Settings link */}
            <Link
              to="/settings"
              className="nav-link"
              onClick={() => setOpen(false)}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
