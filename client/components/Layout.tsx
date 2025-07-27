import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Database,
  Activity,
  UserCheck
} from 'lucide-react';
import { useProgressStream } from '@/hooks/useProgressStream';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isConnected, getAllJobs } = useProgressStream();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'People', href: '/people', icon: Users },
    { name: 'Research Results', href: '/research-results', icon: FileText },
  ];

  const activeJobs = getAllJobs().filter(job => job.status === 'in_progress').length;
  const peopleTracked = getAllJobs().length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Deep Research</h1>
              <p className="text-xs text-gray-500">AI Agent Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* System Status */}
          <div className="mt-8">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">SYSTEM STATUS</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Agent Status</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">People Tracked</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{peopleTracked}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Researcher Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">R</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Researcher</p>
              <p className="text-xs text-gray-500">Deep Research Agent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
