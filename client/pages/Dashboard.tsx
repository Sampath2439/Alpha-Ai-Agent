import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  Activity
} from 'lucide-react';
import { Person, Company, Campaign } from '@shared/api';
import { useProgressStream } from '@/hooks/useProgressStream';
import Layout from '@/components/Layout';

interface PersonWithCompany extends Person {
  company: Company;
}

export default function Dashboard() {
  const [people, setPeople] = useState<PersonWithCompany[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAllJobs } = useProgressStream();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [peopleRes, campaignsRes, companiesRes] = await Promise.all([
        fetch('/api/people'),
        fetch('/api/campaigns'),
        fetch('/api/companies')
      ]);

      const peopleData = await peopleRes.json();
      const campaignsData = await campaignsRes.json();
      const companiesData = await companiesRes.json();

      setPeople(peopleData.people || []);
      setCampaigns(campaignsData || []);
      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const allJobs = getAllJobs();
  const completedJobs = allJobs.filter(job => job.status === 'completed').length;
  const inProgressJobs = allJobs.filter(job => job.status === 'in_progress').length;

  const getCompanyIcon = (company: string) => {
    const firstLetter = company.charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
        <span className="text-sm font-semibold text-blue-700">{firstLetter}</span>
      </div>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const recentActivity = allJobs
    .sort((a, b) => b.job_id.localeCompare(a.job_id))
    .slice(0, 4)
    .map(job => {
      const person = people.find(p => p.id === job.person_id);
      return { ...job, person };
    });

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Research Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">AI-powered deep research and competitive intelligence</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Link to="/people" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Manage People</span>
                  <span className="sm:hidden">People</span>
                </Button>
              </Link>
              <Link to="/research-results" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">View Results</span>
                  <span className="sm:hidden">Results</span>
                </Button>
              </Link>
              <Button variant="outline" className="w-full sm:w-auto text-green-700 border-green-200 hover:bg-green-50 hidden lg:flex">
                <Target className="w-4 h-4 mr-2" />
                Add Research Target
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'active').length}</p>
                    <p className="text-xs text-gray-500">1 total campaigns</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Companies Tracked</p>
                    <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
                    <p className="text-xs text-gray-500">Across all campaigns</p>
                  </div>
                  <Building2 className="w-5 h-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Research Targets</p>
                    <p className="text-2xl font-bold text-gray-900">{people.length}</p>
                    <p className="text-xs text-gray-500">People to research</p>
                  </div>
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Research</p>
                    <p className="text-2xl font-bold text-gray-900">{completedJobs}</p>
                    <p className="text-xs text-gray-500">{inProgressJobs} in progress</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">100%</p>
                    <p className="text-xs text-gray-500">Research completion</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Research Time</p>
                    <p className="text-2xl font-bold text-gray-900">2.3m</p>
                    <p className="text-xs text-gray-500">Per target</p>
                  </div>
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                  <span className="text-sm text-gray-500">4 items</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    {getCompanyIcon(activity.person?.company?.name || 'Unknown')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.person?.company?.name || 'Unknown Company'}</p>
                      <p className="text-xs text-gray-500">
                        Research target: {activity.person?.full_name || 'Unknown'} • Jul 25, 2025
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(activity.status)}
                      <Badge 
                        variant={activity.status === 'completed' ? 'default' : activity.status === 'in_progress' ? 'secondary' : 'outline'}
                        className={
                          activity.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
                        }
                      >
                        {activity.status === 'completed' ? 'Completed' : 
                         activity.status === 'in_progress' ? 'In progress' : 'Queued'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Status & Research Progress */}
            <div className="space-y-6">
              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Agent Status</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ready
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Research</span>
                    <span className="text-sm font-medium text-gray-900">{inProgressJobs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Queue Status</span>
                    <span className="text-sm font-medium text-gray-900">Empty</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Research Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-gray-900">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total People</span>
                      <span className="font-medium text-gray-900">{people.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Researched</span>
                      <span className="font-medium text-gray-900">{completedJobs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
