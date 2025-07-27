import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw,
  TrendingUp,
  Building2,
  Calendar,
  CheckCircle,
  ExternalLink,
  Target,
  Package,
  DollarSign,
  Eye
} from 'lucide-react';
import { ContextSnippet, Person, Company } from '@shared/api';
import Layout from '@/components/Layout';

interface PersonWithCompany extends Person {
  company: Company;
}

export default function ResearchResultsPage() {
  const [people, setPeople] = useState<PersonWithCompany[]>([]);
  const [snippets, setSnippets] = useState<ContextSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [peopleRes] = await Promise.all([
        fetch('/api/people')
      ]);

      const peopleData = await peopleRes.json();
      setPeople(peopleData.people || []);

      // Load snippets for all companies
      const allSnippets: ContextSnippet[] = [];
      for (const person of peopleData.people || []) {
        try {
          const snippetsRes = await fetch(`/api/snippets/company/${person.company.id}`);
          if (snippetsRes.ok) {
            const snippetsData = await snippetsRes.json();
            allSnippets.push(...(snippetsData.snippets || []));
          }
        } catch (error) {
          console.error('Failed to load snippets for company:', person.company.id);
        }
      }
      setSnippets(allSnippets);

      // Set first company as selected by default
      if (peopleData.people && peopleData.people.length > 0) {
        setSelectedCompany(peopleData.people[0].company.id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const companies = people.reduce((acc: Company[], person) => {
    if (!acc.find(c => c.id === person.company.id)) {
      acc.push(person.company);
    }
    return acc;
  }, []);

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);
  const selectedCompanySnippets = snippets.filter(s => s.entity_id === selectedCompany);
  const latestSnippet = selectedCompanySnippets.length > 0 ? selectedCompanySnippets[selectedCompanySnippets.length - 1] : null;

  const getCompanyIcon = (company: string) => {
    const firstLetter = company.charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
        <span className="text-sm font-semibold text-blue-700">{firstLetter}</span>
      </div>
    );
  };

  const mockCompanies = [
    {
      id: 'alpha',
      name: 'Alpha',
      url: 'alpha.com',
      icon: 'A',
      valueProposition: 'Alpha Pro Tech. Ltd. specializes in providing high-quality personal protective equipment (PPE) and infection control solutions tailored for medical and industrial sectors.',
      products: ['Disposable Protective Masks', 'Surgical Gowns', 'Coveralls'],
      pricingModel: 'Alpha Pro Tech employs competitive pricing strategies, offering products at prices aligned with or slightly below industry averages. They provide volume discounts and tiered pricing for bulk purchases, along with seasonal promotions and contract pricing for long-term clients.',
      competitors: ['3M Company', 'Kimberly-Clark', 'Cardinal Health']
    },
    {
      id: 'growthschool',
      name: 'GrowthSchool',
      url: 'growthschool.io/in',
      icon: 'G',
      valueProposition: 'GrowthSchool offers Generative AI-led upskilling programs designed to equip professionals with real-world skills, enabling them to advance their careers.',
      products: ['Masterclass', 'Crash Courses', 'Intensive Programs'],
      pricingModel: 'GrowthSchool employs a subscription-based model, charging students for access to programs. They have used on Credia height and specialization. with memberships ranging from $499 to ₹6,999, crash courses from $499 to ₹3,999, and intensive programs having varying costs depending on duration and content.',
      competitors: ['Scrigga', 'MusicSp', 'Bridge UX']
    },
    {
      id: 'google',
      name: 'Google',
      url: 'www.google.com',
      icon: 'G',
      valueProposition: "Google's mission is to organize the world's information and make it universally accessible and useful. They achieve this by offering comprehensive search capabilities.",
      products: ['Google Search', 'YouTube', 'Google Maps'],
      pricingModel: 'Google employs a diverse pricing strategy, including freemium models for services like Google Drive and Google Workspace, pay-per-click advertising for Google Ads, subscription-based pricing for YouTube Premium, and pay-per-use pricing for Google Cloud Platform services.',
      competitors: ['Microsoft', 'Amazon', 'Meta Platforms (Facebook)']
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading research results...</p>
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
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Research Results</h1>
              <p className="text-sm sm:text-base text-gray-600">Explore AI-generated competitive intelligence and insights</p>
            </div>
            <Button variant="outline" className="self-start sm:self-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Refresh Results</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Research Complete</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-xs text-gray-500">Completed investigations</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Companies Analyzed</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-xs text-gray-500">Unique organizations</p>
                  </div>
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Points Extracted</p>
                    <p className="text-2xl font-bold text-gray-900">15</p>
                    <p className="text-xs text-gray-500">Insights gathered</p>
                  </div>
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">98%</p>
                    <p className="text-xs text-gray-500">Research accuracy</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Company Intelligence */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <Building2 className="w-5 h-5" />
                      Company Intelligence
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">All Companies</span>
                      <span className="text-sm text-gray-500">Detailed View - Alpha</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {mockCompanies.map((company) => (
                    <div key={company.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-blue-700">{company.icon}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{company.name}</h3>
                            <a 
                              href={`https://${company.url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              {company.url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Value Proposition */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Value Proposition</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed pl-6">
                            {company.valueProposition}
                          </p>
                        </div>

                        {/* Products */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Products</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pl-6">
                            {company.products.map((product, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                            {company.products.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{company.products.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Pricing Model */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Pricing Model</span>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded p-3 ml-6">
                            <p className="text-sm text-gray-700">{company.pricingModel}</p>
                          </div>
                        </div>

                        {/* Competitors */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Competitors</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pl-6">
                            {company.competitors.map((competitor, index) => (
                              <Badge key={index} variant="outline" className="text-xs text-red-700 border-red-200">
                                {competitor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Research Timeline */}
            <div className="space-y-6">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Calendar className="w-5 h-5" />
                    Research Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockCompanies.map((company, index) => (
                    <div key={company.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{company.name}</p>
                        <p className="text-xs text-gray-500">Research completed successfully</p>
                        <p className="text-xs text-gray-400">Jul 25, 7:55 AM</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        Complete
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
