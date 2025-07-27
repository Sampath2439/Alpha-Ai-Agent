import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Database,
  Activity
} from 'lucide-react';
import { Person, Company, Campaign, ContextSnippet, ResearchProgress } from '@shared/api';

interface PersonWithCompany extends Person {
  company: Company;
}

export default function Index() {
  const [people, setPeople] = useState<PersonWithCompany[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [researchJobs, setResearchJobs] = useState<Map<string, ResearchProgress>>(new Map());

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

  const runResearch = async (personId: string) => {
    try {
      const response = await fetch(`/api/enrich/${personId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start research');
      }

      const data = await response.json();
      
      // Mock progress updates (in real app would use WebSocket)
      const mockProgress: ResearchProgress = {
        job_id: data.job_id,
        person_id: personId,
        status: 'in_progress',
        current_iteration: 1,
        max_iterations: 3,
        current_query: 'Starting research...',
        found_fields: [],
        missing_fields: ['company_value_prop', 'product_names', 'pricing_model', 'key_competitors', 'company_domain']
      };

      setResearchJobs(prev => new Map(prev.set(personId, mockProgress)));

      // Simulate progress updates
      let iteration = 1;
      const interval = setInterval(() => {
        if (iteration <= 3) {
          const updatedProgress: ResearchProgress = {
            ...mockProgress,
            current_iteration: iteration,
            current_query: `Research iteration ${iteration}...`,
            found_fields: iteration > 1 ? ['company_value_prop'] : [],
            missing_fields: iteration > 1 ? ['product_names', 'pricing_model', 'key_competitors', 'company_domain'] : mockProgress.missing_fields
          };
          
          setResearchJobs(prev => new Map(prev.set(personId, updatedProgress)));
          iteration++;
        } else {
          // Complete the research
          const completedProgress: ResearchProgress = {
            ...mockProgress,
            status: 'completed',
            current_iteration: 3,
            found_fields: ['company_value_prop', 'product_names', 'pricing_model', 'key_competitors', 'company_domain'],
            missing_fields: []
          };
          
          setResearchJobs(prev => new Map(prev.set(personId, completedProgress)));
          clearInterval(interval);
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to start research:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'in_progress': 'secondary',
      'failed': 'destructive',
      'queued': 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Alpha Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Alpha Platform</h1>
                <p className="text-sm text-slate-600">Deep Research Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                System Online
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Campaigns</CardTitle>
              <Building2 className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{campaigns.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{companies.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">People</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{people.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Jobs</CardTitle>
              <Search className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {Array.from(researchJobs.values()).filter(job => job.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="people" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People & Research
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Research Targets
                </CardTitle>
                <CardDescription>
                  Run deep research on people and companies to gather intelligence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {people.map((person) => {
                    const researchProgress = researchJobs.get(person.id);
                    
                    return (
                      <div key={person.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-700">
                                {person.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{person.full_name}</h3>
                              <p className="text-sm text-slate-600">{person.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>{person.email}</span>
                            <span>•</span>
                            <span>{person.company.name}</span>
                            <span>•</span>
                            <span>{person.company.domain}</span>
                          </div>
                          
                          {researchProgress && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(researchProgress.status)}
                                {getStatusBadge(researchProgress.status)}
                                <span className="text-sm text-slate-600">
                                  Iteration {researchProgress.current_iteration} of {researchProgress.max_iterations}
                                </span>
                              </div>
                              
                              {researchProgress.current_query && (
                                <p className="text-sm text-slate-600">
                                  {researchProgress.current_query}
                                </p>
                              )}
                              
                              <div className="flex gap-2 flex-wrap">
                                <span className="text-xs text-green-600">
                                  Found: {researchProgress.found_fields.length} fields
                                </span>
                                <span className="text-xs text-orange-600">
                                  Missing: {researchProgress.missing_fields.length} fields
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link to={`/research/${person.id}`}>
                            <Button variant="outline" size="sm">
                              <Search className="h-4 w-4 mr-2" />
                              View Results
                            </Button>
                          </Link>
                          <Button
                            onClick={() => runResearch(person.id)}
                            disabled={researchProgress?.status === 'in_progress'}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            {researchProgress?.status === 'in_progress' ? 'Researching...' : 'Run Research'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Active Campaigns
                </CardTitle>
                <CardDescription>
                  Manage and monitor your research campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border border-slate-200 rounded-lg bg-white/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                          <p className="text-sm text-slate-600">
                            Created {new Date(campaign.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={campaign.status === 'active' ? 'default' : 'secondary'}
                          className={campaign.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
