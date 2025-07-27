import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Database,
  Activity,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import { useProgressStream } from '@/hooks/useProgressStream';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isConnected, getAllJobs } = useProgressStream();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'People', href: '/people', icon: Users },
    { name: 'Research Results', href: '/research-results', icon: FileText },
  ];

  const activeJobs = getAllJobs().filter(job => job.status === 'in_progress').length;
  const peopleTracked = getAllJobs().length;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base lg:text-lg font-semibold text-gray-900">Deep Research</h1>
                  <p className="text-xs text-gray-500">AI Agent Platform</p>
                </div>
              </div>
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={closeSidebar}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">NAVIGATION</p>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/people' && location.pathname.startsWith('/research/')) ||
                  (item.href === '/research-results' && location.pathname === '/research-results');
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* System Status */}
            <div className="mt-6 lg:mt-8">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">SYSTEM STATUS</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Activity className={`w-4 h-4 flex-shrink-0 ${isConnected ? 'text-green-500' : 'text-yellow-500'}`} />
                    <span className="text-sm text-gray-600 truncate">Agent Status</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs flex-shrink-0 ${
                      isConnected
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    {isConnected ? 'Real-time' : 'Ready'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate">People Tracked</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 flex-shrink-0">{peopleTracked}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Researcher Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600">R</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Researcher</p>
                <p className="text-xs text-gray-500 truncate">Deep Research Agent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Deep Research</span>
            </div>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
