import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Devices', href: '/devices', icon: '🏭' },
    { name: 'Alerts', href: '/alerts', icon: '🚨' },
    { name: 'Reports', href: '/reports', icon: '📈' },
    { name: 'Logs', href: '/logs', icon: '📋' },
  ];

  const adminNavigation = [
    { name: 'Device Management', href: '/admin/devices', icon: '⚙️' },
    { name: 'User Management', href: '/admin/users', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Voltas BMS Dashboard
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </a>
                ))}
                {user?.role === 'admin' && adminNavigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    {user?.name} ({user?.role})
                  </span>
                  <button
                    onClick={logout}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;