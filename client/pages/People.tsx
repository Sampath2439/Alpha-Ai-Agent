import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus,
  Upload,
  RefreshCw,
  Building2,
  Mail,
  Play,
  Eye,
  Trash2
} from 'lucide-react';
import { Person, Company } from '@shared/api';
import { useProgressStream } from '@/hooks/useProgressStream';
import Layout from '@/components/Layout';

interface PersonWithCompany extends Person {
  company: Company;
}

export default function People() {
  const [people, setPeople] = useState<PersonWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { getJobProgress } = useProgressStream();

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const response = await fetch('/api/people');
      if (response.ok) {
        const data = await response.json();
        setPeople(data.people || []);
      } else {
        console.warn('People API returned:', response.status, response.statusText);
        setPeople([]); // Set empty array as fallback
      }
    } catch (error) {
      console.error('Failed to load people:', error);
      setPeople([]); // Set empty array as fallback
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
      console.log('Research job queued:', data);
    } catch (error) {
      console.error('Failed to start research:', error);
    }
  };

  const filteredPeople = people.filter(person => 
    person.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.company.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPersonInitial = (name: string | null) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const getStatusBadge = (personId: string) => {
    const progress = getJobProgress(personId);
    if (!progress) {
      return <Badge variant="outline" className="text-xs">Not Started</Badge>;
    }

    switch (progress.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Complete</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="text-xs">In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Queued</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading people...</p>
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">People Management</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage research targets and run deep intelligence gathering</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button variant="outline" className="text-purple-700 border-purple-200 hover:bg-purple-50">
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Import CSV/Excel</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </Button>
              <Button variant="outline" className="hidden lg:flex">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {/* Search and Filter */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:gap-6">
              <div className="flex-1 max-w-full sm:max-w-md">
                <Input
                  placeholder="Search people, companies, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-gray-500 self-center">{filteredPeople.length} people</span>
            </div>
          </div>

          {/* Research Targets */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Research Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {/* Desktop Table Header - Hidden on mobile */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 pb-3 border-b border-gray-200 text-sm font-medium text-gray-500">
                <div className="col-span-3">Person</div>
                <div className="col-span-3">Company</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-3">Actions</div>
              </div>

              {/* Desktop Table Body / Mobile Card Layout */}
              <div className="space-y-4 mt-4">
                {filteredPeople.map((person) => (
                  <div key={person.id}>
                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 last:border-b-0">
                      {/* Person */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-600">
                            {getPersonInitial(person.full_name)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{person.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500 truncate">{person.title || 'No title'}</p>
                        </div>
                      </div>

                      {/* Company */}
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{person.company.name || 'Unknown Company'}</p>
                          <p className="text-sm text-gray-500 truncate">{person.company.domain || 'No domain'}</p>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="col-span-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 truncate">{person.email || 'No email'}</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        {getStatusBadge(person.id)}
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex items-center gap-3">
                        <Link to={`/research/${person.id}`}>
                          <Button variant="outline" size="sm" className="text-xs whitespace-nowrap px-3 py-1.5">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => runResearch(person.id)}
                          disabled={getJobProgress(person.id)?.status === 'in_progress'}
                          className="bg-blue-600 hover:bg-blue-700 text-xs whitespace-nowrap px-3 py-1.5"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {getJobProgress(person.id)?.status === 'in_progress' ? 'Running...' : 'Research'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs text-red-600 hover:text-red-700 px-2 py-1.5">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="lg:hidden border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600">
                              {getPersonInitial(person.full_name)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{person.full_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{person.title || 'No title'}</p>
                          </div>
                        </div>
                        {getStatusBadge(person.id)}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-900">{person.company.name || 'Unknown Company'}</span>
                            {person.company.domain && (
                              <span className="text-gray-500 ml-2">• {person.company.domain}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 truncate">{person.email || 'No email'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <Link to={`/research/${person.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => runResearch(person.id)}
                            disabled={getJobProgress(person.id)?.status === 'in_progress'}
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            {getJobProgress(person.id)?.status === 'in_progress' ? 'Running...' : 'Research'}
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPeople.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No people found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'No people match your search criteria.' : 'Get started by adding your first research target.'}
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Person
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
