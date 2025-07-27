import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Building2, 
  Users, 
  DollarSign, 
  Target,
  Globe,
  Package,
  ExternalLink,
  Download,
  Eye
} from 'lucide-react';
import { Person, Company, ContextSnippet } from '@shared/api';

interface PersonWithCompany extends Person {
  company: Company;
}

export default function ResearchResults() {
  const { personId } = useParams<{ personId: string }>();
  const [person, setPerson] = useState<PersonWithCompany | null>(null);
  const [snippets, setSnippets] = useState<ContextSnippet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (personId) {
      loadResearchData();
    }
  }, [personId]);

  const loadResearchData = async () => {
    try {
      const [personRes, snippetsRes] = await Promise.all([
        fetch(`/api/people/${personId}`),
        fetch(`/api/snippets/person/${personId}`)
      ]);

      if (personRes.ok) {
        const personData = await personRes.json();
        setPerson(personData);

        // Also get company snippets
        const companySnippetsRes = await fetch(`/api/snippets/company/${personData.company.id}`);
        if (companySnippetsRes.ok) {
          const companySnippetsData = await companySnippetsRes.json();
          setSnippets(companySnippetsData.snippets || []);
        }
      }

      if (snippetsRes.ok) {
        const snippetsData = await snippetsRes.json();
        setSnippets(prev => [...prev, ...(snippetsData.snippets || [])]);
      }
    } catch (error) {
      console.error('Failed to load research data:', error);
    } finally {
      setLoading(false);
    }
  };

  const latestSnippet = snippets.length > 0 ? snippets[snippets.length - 1] : null;
  const researchData = latestSnippet?.payload;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading research results...</p>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Person not found</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
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
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Research Results</h1>
                <p className="text-sm text-slate-600">{person.full_name} • {person.company.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Person & Company Overview */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-700">
                    {person.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-2xl">{person.full_name}</CardTitle>
                  <CardDescription className="text-lg">{person.title}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{person.email}</Badge>
                    <Badge variant="secondary">{person.company.name}</Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Research Status</p>
                <Badge variant={snippets.length > 0 ? 'default' : 'secondary'} className="mt-1">
                  {snippets.length > 0 ? 'Completed' : 'Not Started'}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Research Results */}
        {researchData ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200">
              <TabsTrigger value="overview">
                <Eye className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="raw-data">
                <Package className="h-4 w-4 mr-2" />
                Raw Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Value Proposition */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Value Proposition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed">
                      {researchData.company_value_prop || 'Not available'}
                    </p>
                  </CardContent>
                </Card>

                {/* Products */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-600" />
                      Products & Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {researchData.product_names && researchData.product_names.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {researchData.product_names.map((product, index) => (
                          <Badge key={index} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No products identified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Pricing Model */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                      Pricing Model
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">
                      {researchData.pricing_model || 'Not available'}
                    </p>
                  </CardContent>
                </Card>

                {/* Competitors */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-red-600" />
                      Key Competitors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {researchData.key_competitors && researchData.key_competitors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {researchData.key_competitors.map((competitor, index) => (
                          <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {competitor}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No competitors identified</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Company Domain */}
              {researchData.company_domain && (
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-purple-600" />
                      Company Domain
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a 
                      href={`https://${researchData.company_domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {researchData.company_domain}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Source URLs */}
              {latestSnippet?.source_urls && latestSnippet.source_urls.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-slate-600" />
                      Source URLs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {latestSnippet.source_urls.map((url, index) => (
                        <a 
                          key={index}
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-600 hover:text-blue-800 transition-colors truncate"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="raw-data">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader>
                  <CardTitle>Raw Research Data</CardTitle>
                  <CardDescription>
                    Structured JSON output from the research agent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-50 rounded-lg p-4 overflow-auto text-sm">
                    {JSON.stringify(researchData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Research Data Available</h3>
              <p className="text-slate-600 mb-6">
                No research has been conducted for this person yet. Run research from the dashboard to see results here.
              </p>
              <Link to="/">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
