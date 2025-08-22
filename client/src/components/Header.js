import React from 'react';
import { Menu, Bell, Wifi, WifiOff } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

const Header = ({ sidebarOpen, setSidebarOpen, isConnected }) => {
  const { alerts } = useAlerts();
  const unreadAlerts = alerts.filter(alert => !alert.read).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-xl font-semibold text-gray-900">
              CI/CD Pipeline Dashboard
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-success-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-danger-500" />
            )}
            <span className={`text-sm font-medium ${isConnected ? 'text-success-600' : 'text-danger-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Alerts indicator */}
          <div className="relative">
            <button
              type="button"
              className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <span className="sr-only">View alerts</span>
              <Bell className="h-6 w-6" />
              {unreadAlerts > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-400 ring-2 ring-white" />
              )}
            </button>
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-danger-500 text-xs text-white flex items-center justify-center">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </div>

          {/* User menu placeholder */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">D</span>
            </div>
            <span className="text-sm font-medium text-gray-700">DevOps</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
