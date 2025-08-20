'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  UserPlus,
  Download,
  Search,
  Home,
  Shield,
  Zap,
  Target,
  Award,
  Bell,
  Menu,
  X
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

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')

  // User creation
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: ['view_conversations', 'view_leads', 'view_analytics']
  })

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

  const loadDashboardData = async (authToken?: string) => {
    const currentToken = authToken || token
    if (!currentToken) return

    try {
      setLoading(true)

      const headers = { 'Authorization': `Bearer ${currentToken}` }

      const [leadsResponse, analyticsResponse] = await Promise.all([
        fetch(`${API_BASE}/admin/leads`, { headers }),
        fetch(`${API_BASE}/admin/analytics`, { headers })
      ])

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        console.log('Leads data:', leadsData) // Debug log
        setLeads(leadsData.leads || [])
      } else {
        console.error('Failed to load leads:', leadsResponse.status)
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        console.log('Analytics data:', analyticsData) // Debug log
        setAnalytics(analyticsData)
      } else {
        console.error('Failed to load analytics:', analyticsResponse.status)
      }
    } catch (err) {
      console.error('Dashboard data error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        setShowCreateUser(false)
        setNewUser({
          username: '',
          email: '',
          password: '',
          role: 'admin',
          permissions: ['view_conversations', 'view_leads', 'view_analytics']
        })
        // Show success message
        alert('User created successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to create user: ${errorData.detail}`)
      }
    } catch (err) {
      console.error('Create user error:', err)
      alert('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

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

  const getScoreBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'hot': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
      case 'warm': return 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
      case 'qualified': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
      case 'cold': return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
    }
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // Login screen with landing page theme
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#201B26" }}>
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(242, 169, 34, 0.05), rgba(242, 93, 7, 0.05))" }}
          ></div>
        </div>

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div
              className="backdrop-blur-xl rounded-2xl shadow-2xl border p-8"
              style={{
                backgroundColor: "rgba(42, 37, 48, 0.8)",
                borderColor: "rgba(166, 110, 78, 0.3)"
              }}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: "linear-gradient(to right, #F2A922, #F25D07)" }}
                >
                  <Home className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold text-white mb-2 font-airnt-quantum tracking-wider">AIREA Admin</h1>
                <p style={{ color: "#A66E4E" }}>Real Estate Intelligence Platform</p>
              </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              login(loginForm.username, loginForm.password)
            }} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid"
                    }}
                    onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = "#F2A922"}
                    onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(166, 110, 78, 0.3)"}
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid"
                    }}
                    onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = "#F2A922"}
                    onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(166, 110, 78, 0.3)"}
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm p-3 rounded-xl border"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.3)"
                  }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 px-6 rounded-xl font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ background: "linear-gradient(to right, #F2A922, #F25D07)" }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>

              <div className="text-center text-sm" style={{ color: "#A66E4E" }}>
                Default: <span style={{ color: "#F2A922" }} className="font-semibold">admin</span> / <span style={{ color: "#F2A922" }} className="font-semibold">admin123</span>
              </div>
            </form>
          </div>
        </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#201B26" }}>
      {/* Background */}
      <div className="fixed inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(242, 169, 34, 0.05), rgba(242, 93, 7, 0.05))" }}
        ></div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl border-r backdrop-blur-xl"
            style={{
              backgroundColor: "rgba(42, 37, 48, 0.95)",
              borderColor: "rgba(166, 110, 78, 0.3)"
            }}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "rgba(166, 110, 78, 0.3)" }}>
                <div className="flex items-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
                    style={{ background: "linear-gradient(to right, #F2A922, #F25D07)" }}
                  >
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white font-airnt-quantum tracking-wider">AIREA</h1>
                    <p className="text-xs" style={{ color: "#A66E4E" }}>Admin Portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg transition-colors"
                  style={{ color: "#A66E4E" }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "rgba(166, 110, 78, 0.1)"}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "transparent"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: 4 }}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === item.id
                          ? 'text-white shadow-lg'
                          : 'hover:bg-opacity-10'
                      }`}
                      style={activeTab === item.id
                        ? { background: "linear-gradient(to right, #F2A922, #F25D07)" }
                        : { color: "#A66E4E" }
                      }
                      onMouseEnter={(e) => {
                        if (activeTab !== item.id) {
                          (e.target as HTMLButtonElement).style.backgroundColor = "rgba(166, 110, 78, 0.1)"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== item.id) {
                          (e.target as HTMLButtonElement).style.backgroundColor = "transparent"
                        }
                      }}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </motion.button>
                  )
                })}
              </nav>

              {/* User Info */}
              <div className="p-4 border-t" style={{ borderColor: "rgba(166, 110, 78, 0.3)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ background: "linear-gradient(to right, #F2A922, #F25D07)" }}
                    >
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user?.username}</p>
                      <p className="text-xs" style={{ color: "#A66E4E" }}>{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "#A66E4E" }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = "rgba(166, 110, 78, 0.1)";
                      (e.target as HTMLButtonElement).style.color = "#F25D07"
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = "transparent";
                      (e.target as HTMLButtonElement).style.color = "#A66E4E"
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header
          className="shadow-sm border-b sticky top-0 z-40 backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(42, 37, 48, 0.95)",
            borderColor: "rgba(166, 110, 78, 0.3)"
          }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg mr-4 transition-colors"
                style={{ color: "#A66E4E" }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "rgba(166, 110, 78, 0.1)"}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "transparent"}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-white capitalize font-airnt-quantum tracking-wider">
                {activeTab}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="p-2 rounded-lg relative transition-colors"
                style={{ color: "#A66E4E" }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "rgba(166, 110, 78, 0.1)"}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "transparent"}
              >
                <Bell className="w-5 h-5" />
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#F25D07" }}
                ></span>
              </button>
              <div
                className="w-8 h-8 rounded-full"
                style={{ background: "linear-gradient(to right, #F2A922, #F25D07)" }}
              ></div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Leads</p>
                        <p className="text-3xl font-bold">
                          {analytics?.conversation_metrics.total_conversations || 0}
                        </p>
                        <p className="text-blue-100 text-sm mt-1">+12% from last month</p>
                      </div>
                      <div className="bg-white/20 rounded-xl p-3">
                        <Users className="w-8 h-8" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-sm font-medium">Hot Leads</p>
                        <p className="text-3xl font-bold">
                          {leads.filter(l => l.lead_score?.category === 'Hot').length}
                        </p>
                        <p className="text-red-100 text-sm mt-1">+8% from last week</p>
                      </div>
                      <div className="bg-white/20 rounded-xl p-3">
                        <Zap className="w-8 h-8" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Completed</p>
                        <p className="text-3xl font-bold">
                          {analytics?.conversation_metrics.completed_conversations || 0}
                        </p>
                        <p className="text-green-100 text-sm mt-1">+15% conversion</p>
                      </div>
                      <div className="bg-white/20 rounded-xl p-3">
                        <Target className="w-8 h-8" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Conversion Rate</p>
                        <p className="text-3xl font-bold">
                          {Math.round(analytics?.conversation_metrics.completion_rate || 0)}%
                        </p>
                        <p className="text-purple-100 text-sm mt-1">Above industry avg</p>
                      </div>
                      <div className="bg-white/20 rounded-xl p-3">
                        <Award className="w-8 h-8" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Leads</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Latest submissions</p>
                    </div>
                    <div className="p-6 space-y-4">
                      {leads.slice(0, 5).map((lead, index) => (
                        <motion.div
                          key={lead.session_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {lead.user_data.user_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {lead.user_data.user_name || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {lead.user_data.user_email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getScoreBadgeColor(lead.lead_score?.category || '')}`}>
                              {lead.lead_score?.category || 'New'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Overview</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Key metrics</p>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Quality Score</span>
                          <span className="text-sm font-semibold text-green-600">85%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '85%' }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Response Rate</span>
                          <span className="text-sm font-semibold text-blue-600">92%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '92%' }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversion Rate</span>
                          <span className="text-sm font-semibold text-purple-600">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '78%' }}
                            transition={{ duration: 1, delay: 0.9 }}
                            className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
                          ></motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
              <motion.div
                key="leads"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search leads..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="complete">Complete</option>
                      <option value="incomplete">Incomplete</option>
                    </select>
                    <select
                      value={scoreFilter}
                      onChange={(e) => setScoreFilter(e.target.value)}
                      className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Scores</option>
                      <option value="hot">Hot</option>
                      <option value="warm">Warm</option>
                      <option value="qualified">Qualified</option>
                      <option value="cold">Cold</option>
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </motion.button>
                  </div>
                </div>

                {/* Leads Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      All Leads ({filteredLeads.length})
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Manage and track all your leads</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="text-left p-6 font-semibold text-gray-900 dark:text-white">Contact</th>
                          <th className="text-left p-6 font-semibold text-gray-900 dark:text-white">Type</th>
                          <th className="text-left p-6 font-semibold text-gray-900 dark:text-white">Score</th>
                          <th className="text-left p-6 font-semibold text-gray-900 dark:text-white">Progress</th>
                          <th className="text-left p-6 font-semibold text-gray-900 dark:text-white">Created</th>
                          <th className="text-left p-6 font-semibold text-gray-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((lead, index) => (
                          <motion.tr
                            key={lead.session_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="p-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {lead.user_data.user_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {lead.user_data.user_name || 'Unknown'}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {lead.user_data.user_email || 'No email'}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {lead.user_data.user_phone_number || 'No phone'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                {lead.user_data.user_buying_or_selling || 'Unknown'}
                              </span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {lead.lead_score?.total_score || 0}
                                </span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getScoreBadgeColor(lead.lead_score?.category || '')}`}>
                                  {lead.lead_score?.category || 'Unscored'}
                                </span>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${lead.progress?.completion_rate || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {Math.round(lead.progress?.completion_rate || 0)}%
                                </span>
                              </div>
                            </td>
                            <td className="p-6 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-6">
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredLeads.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No leads found matching your criteria</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Lead Distribution */}
                  <div
                    className="rounded-2xl shadow-lg border p-6"
                    style={{
                      backgroundColor: "rgba(42, 37, 48, 0.8)",
                      borderColor: "rgba(166, 110, 78, 0.3)"
                    }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Lead Type Distribution</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Buyers</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 rounded-full h-2" style={{ backgroundColor: "rgba(166, 110, 78, 0.3)" }}>
                            <div
                              className="h-2 rounded-full"
                              style={{
                                background: "linear-gradient(to right, #F2A922, #F25D07)",
                                width: `${(analytics?.lead_type_distribution.buying || 0) / Math.max(1, (analytics?.conversation_metrics.total_conversations || 1)) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-white">{analytics?.lead_type_distribution.buying || 0}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">Sellers</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 rounded-full h-2" style={{ backgroundColor: "rgba(166, 110, 78, 0.3)" }}>
                            <div
                              className="h-2 rounded-full"
                              style={{
                                background: "linear-gradient(to right, #F2A922, #F25D07)",
                                width: `${(analytics?.lead_type_distribution.selling || 0) / Math.max(1, (analytics?.conversation_metrics.total_conversations || 1)) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-white">{analytics?.lead_type_distribution.selling || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Distribution */}
                  <div
                    className="rounded-2xl shadow-lg border p-6"
                    style={{
                      backgroundColor: "rgba(42, 37, 48, 0.8)",
                      borderColor: "rgba(166, 110, 78, 0.3)"
                    }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Lead Score Distribution</h3>
                    <div className="space-y-4">
                      {['Hot', 'Warm', 'Qualified', 'Cold'].map((category) => {
                        const count = leads.filter(l => l.lead_score?.category === category).length
                        const percentage = (count / Math.max(1, leads.length)) * 100
                        return (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-white">{category}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 rounded-full h-2" style={{ backgroundColor: "rgba(166, 110, 78, 0.3)" }}>
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    background: "linear-gradient(to right, #F2A922, #F25D07)",
                                    width: `${percentage}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-white">{count}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Analytics Summary */}
                <div
                  className="rounded-2xl shadow-lg border p-6"
                  style={{
                    backgroundColor: "rgba(42, 37, 48, 0.8)",
                    borderColor: "rgba(166, 110, 78, 0.3)"
                  }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        {analytics?.conversation_metrics.total_conversations || 0}
                      </div>
                      <div style={{ color: "#A66E4E" }}>Total Conversations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        {analytics?.conversation_metrics.completed_conversations || 0}
                      </div>
                      <div style={{ color: "#A66E4E" }}>Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        {Math.round(analytics?.conversation_metrics.completion_rate || 0)}%
                      </div>
                      <div style={{ color: "#A66E4E" }}>Completion Rate</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div
                  className="rounded-2xl shadow-lg border p-6"
                  style={{
                    backgroundColor: "rgba(42, 37, 48, 0.8)",
                    borderColor: "rgba(166, 110, 78, 0.3)"
                  }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4">User Management</h3>
                  <p className="mb-6" style={{ color: "#A66E4E" }}>Create and manage admin users</p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateUser(true)}
                    className="text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center"
                    style={{ background: "linear-gradient(to right, #F2A922, #F25D07)" }}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create New Admin User
                  </motion.button>
                </div>

                <div
                  className="rounded-2xl shadow-lg border p-6"
                  style={{
                    backgroundColor: "rgba(42, 37, 48, 0.8)",
                    borderColor: "rgba(166, 110, 78, 0.3)"
                  }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white">API Status</span>
                      <span
                        className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: "#22C55E" }}
                      >
                        Online
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">Database</span>
                      <span
                        className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: "#22C55E" }}
                      >
                        Connected
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">AI Service</span>
                      <span
                        className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: "#22C55E" }}
                      >
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create User Modal */}
          {showCreateUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-2xl shadow-2xl border p-6"
                style={{
                  backgroundColor: "rgba(42, 37, 48, 0.95)",
                  borderColor: "rgba(166, 110, 78, 0.3)"
                }}
              >
                <h3 className="text-xl font-bold text-white mb-6">Create New Admin User</h3>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid"
                    }}
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid"
                    }}
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid"
                    }}
                  />

                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid"
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                  </select>
                </div>

                <div className="flex space-x-4 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={createUser}
                    disabled={loading}
                    className="flex-1 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200"
                    style={{ background: "linear-gradient(to right, #F2A922, #F25D07)" }}
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateUser(false)}
                    className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 border text-white"
                    style={{ borderColor: "rgba(166, 110, 78, 0.3)" }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
