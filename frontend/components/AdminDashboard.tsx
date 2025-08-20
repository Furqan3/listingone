'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Star, 
  Phone, 
  Mail, 
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  UserPlus,
  Filter,
  Download,
  Search
} from 'lucide-react'

interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  permissions: string[]
  created_at: string
  last_login: string | null
  active: boolean
}

interface Lead {
  session_id: string
  created_at: string
  user_data: {
    user_name?: string
    user_email?: string
    user_phone_number?: string
    user_buying_or_selling?: string
    user_property_address?: string
  }
  lead_score?: {
    total_score: number
    category: string
    priority: string
  }
  conversation_complete: boolean
  progress?: {
    completion_rate: number
  }
}

interface Analytics {
  conversation_metrics: {
    total_conversations: number
    completed_conversations: number
    completion_rate: number
  }
  lead_type_distribution: {
    buying: number
    selling: number
    unknown: number
  }
}

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')

  const API_BASE = 'http://localhost:8000/api'

  // Authentication functions
  const login = async (username: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      const data = await response.json()
      setToken(data.access_token)
      setUser(data.user_info)
      setIsLoggedIn(true)
      localStorage.setItem('admin_token', data.access_token)
      localStorage.setItem('admin_user', JSON.stringify(data.user_info))
      
      // Load dashboard data
      await loadDashboardData(data.access_token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/admin/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setToken(null)
      setUser(null)
      setIsLoggedIn(false)
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
  }

  // Data loading functions
  const loadDashboardData = async (authToken?: string) => {
    const currentToken = authToken || token
    if (!currentToken) return

    try {
      setLoading(true)
      
      const headers = { 'Authorization': `Bearer ${currentToken}` }
      
      // Load leads and analytics in parallel
      const [leadsResponse, analyticsResponse] = await Promise.all([
        fetch(`${API_BASE}/admin/leads`, { headers }),
        fetch(`${API_BASE}/admin/analytics`, { headers })
      ])

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        setLeads(leadsData.leads || [])
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData)
      }
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token')
    const savedUser = localStorage.getItem('admin_user')
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        setIsLoggedIn(true)
        loadDashboardData(savedToken)
      } catch (err) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
      }
    }
  }, [])

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.user_data.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.user_data.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'complete' && lead.conversation_complete) ||
      (statusFilter === 'incomplete' && !lead.conversation_complete)
    
    const matchesScore = scoreFilter === 'all' || 
      lead.lead_score?.category?.toLowerCase() === scoreFilter.toLowerCase()
    
    return matchesSearch && matchesStatus && matchesScore
  })

  // Get score badge color
  const getScoreBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200'
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'qualified': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cold': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">AIREA Admin Portal</CardTitle>
            <CardDescription>Sign in to manage your real estate leads</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault()
              login(loginForm.username, loginForm.password)
            }} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="text-center text-sm text-gray-600">
                Default: <strong>admin</strong> / <strong>admin123</strong>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">AIREA Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.username}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Leads</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.conversation_metrics.total_conversations || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Star className="w-8 h-8 text-red-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Hot Leads</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {leads.filter(l => l.lead_score?.category === 'Hot').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <MessageSquare className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.conversation_metrics.completed_conversations || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(analytics?.conversation_metrics.completion_rate || 0)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Leads */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Latest lead submissions and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.session_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{lead.user_data.user_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{lead.user_data.user_email || 'No email'}</p>
                        </div>
                        <Badge className={getScoreBadgeColor(lead.lead_score?.category || '')}>
                          {lead.lead_score?.category || 'Unscored'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium">
                          {Math.round(lead.progress?.completion_rate || 0)}% complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="complete">Complete</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Scores</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="qualified">Qualified</option>
                    <option value="cold">Cold</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
                <CardDescription>Manage and track all your leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Contact</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Score</th>
                        <th className="text-left p-4 font-medium">Progress</th>
                        <th className="text-left p-4 font-medium">Created</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead.session_id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{lead.user_data.user_name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{lead.user_data.user_email || 'No email'}</p>
                              <p className="text-sm text-gray-600">{lead.user_data.user_phone_number || 'No phone'}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {lead.user_data.user_buying_or_selling || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{lead.lead_score?.total_score || 0}</span>
                              <Badge className={getScoreBadgeColor(lead.lead_score?.category || '')}>
                                {lead.lead_score?.category || 'Unscored'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${lead.progress?.completion_rate || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{Math.round(lead.progress?.completion_rate || 0)}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLeads.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No leads found matching your criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Buyers</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(analytics?.lead_type_distribution.buying || 0) / Math.max(1, (analytics?.conversation_metrics.total_conversations || 1)) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analytics?.lead_type_distribution.buying || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sellers</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(analytics?.lead_type_distribution.selling || 0) / Math.max(1, (analytics?.conversation_metrics.total_conversations || 1)) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analytics?.lead_type_distribution.selling || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Hot', 'Warm', 'Qualified', 'Cold'].map((category) => {
                      const count = leads.filter(l => l.lead_score?.category === category).length
                      const percentage = (count / Math.max(1, leads.length)) * 100
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <span>{category}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  category === 'Hot' ? 'bg-red-600' :
                                  category === 'Warm' ? 'bg-orange-600' :
                                  category === 'Qualified' ? 'bg-yellow-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure your AIREA admin settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">User Management</h3>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add New Admin User
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Data Management</h3>
                    <div className="space-y-2">
                      <Button variant="outline">Export All Data</Button>
                      <Button variant="outline">Import Leads</Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">System Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>API Status</span>
                        <Badge className="bg-green-100 text-green-800">Online</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Database</span>
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>AI Service</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
