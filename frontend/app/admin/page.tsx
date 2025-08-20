"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"

// Conversation Viewer Component
const ConversationViewer = ({ sessionId, onClose }: { sessionId: string; onClose: () => void }) => {
  const [conversation, setConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConversationDetails()
  }, [sessionId])

  const fetchConversationDetails = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`http://localhost:8000/api/admin/leads/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch conversation details")
      }

      const data = await response.json()
      setConversation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "#ff4444"
      case "high":
        return "#ff8800"
      case "medium":
        return "#ffaa00"
      case "low":
        return "#00aa00"
      default:
        return "#666666"
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading conversation details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6" />
            <h2 className="text-xl font-bold">Conversation Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Lead Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lead Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {conversation?.user_data?.user_name || "Not provided"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {conversation?.user_data?.user_email || "Not provided"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {conversation?.user_data?.user_phone_number || "Not provided"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Intent</label>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    conversation?.user_data?.user_buying_or_selling === "buying"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : conversation?.user_data?.user_buying_or_selling === "selling"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                  }`}
                >
                  {conversation?.user_data?.user_buying_or_selling || "Unknown"}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Property Type</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {conversation?.user_data?.user_property_type || "Not specified"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Timeline</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {conversation?.user_data?.user_timeline || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Conversation Metrics */}
          {conversation?.conversation_metrics && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversation Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {conversation.conversation_metrics.total_messages || 0}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Messages</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(conversation.conversation_metrics.completeness_percentage || 0)}%
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">Completion</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {conversation.conversation_metrics.engagement_score || 0}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Engagement</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      conversation.conversation_complete
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    }`}
                  >
                    {conversation.conversation_complete ? "Complete" : "In Progress"}
                  </span>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">Status</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {conversation?.recommended_actions && conversation.recommended_actions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommended Actions</h3>
              <div className="space-y-3">
                {conversation.recommended_actions.map((action: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4"
                    style={{ borderLeftColor: getPriorityColor(action.priority) }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{action.title}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {action.due_date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{action.description}</p>
                    {action.contact_info && (
                      <div className="flex space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>📧 {action.contact_info.email}</span>
                        <span>📞 {action.contact_info.phone}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversation History</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              {conversation?.detailed_history?.map((message: any, index: number) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white dark:bg-gray-600 text-gray-900 dark:text-white border"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium">{message.role === "user" ? "👤 User" : "🤖 AIREA"}</span>
                      <span className="text-xs opacity-75">{formatTimestamp(message.timestamp)}</span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              )) || <p className="text-center text-gray-500 dark:text-gray-400">No conversation history available</p>}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

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

interface SystemHealth {
  api_status: "online" | "offline" | "degraded"
  database_status: "connected" | "disconnected" | "error"
  ai_service_status: "active" | "inactive" | "error"
  last_checked: string
}

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    api_status: "offline",
    database_status: "disconnected",
    ai_service_status: "inactive",
    last_checked: new Date().toISOString(),
  })

  const [previousAnalytics, setPreviousAnalytics] = useState<Analytics | null>(null)

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [scoreFilter, setScoreFilter] = useState("all")

  // Notifications
  const [notifications, setNotifications] = useState<
    Array<{
      id: string
      type: "success" | "error" | "info" | "warning"
      title: string
      message: string
      timestamp: Date
      read: boolean
    }>
  >([])
  const [showNotifications, setShowNotifications] = useState(false)

  // User creation
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
    permissions: ["view_conversations", "view_leads", "view_analytics"],
  })

  const API_BASE = "http://localhost:8000/api"

  const checkSystemHealth = async () => {
    const newHealth: SystemHealth = {
      api_status: "offline",
      database_status: "disconnected",
      ai_service_status: "inactive",
      last_checked: new Date().toISOString(),
    }

    try {
      // Check API status
      const apiResponse = await fetch(`${API_BASE}/health`, {
        method: "GET",
        timeout: 5000,
      } as any)
      newHealth.api_status = apiResponse.ok ? "online" : "degraded"
    } catch {
      newHealth.api_status = "offline"
    }

    try {
      // Check database status
      const dbResponse = await fetch(`${API_BASE}/health/database`, {
        method: "GET",
        timeout: 5000,
      } as any)
      newHealth.database_status = dbResponse.ok ? "connected" : "error"
    } catch {
      newHealth.database_status = "disconnected"
    }

    try {
      // Check AI service status
      const aiResponse = await fetch(`${API_BASE}/health/ai`, {
        method: "GET",
        timeout: 5000,
      } as any)
      newHealth.ai_service_status = aiResponse.ok ? "active" : "error"
    } catch {
      newHealth.ai_service_status = "inactive"
    }

    setSystemHealth(newHealth)
  }

  const calculateGrowthPercentage = (current: number, previous: number): string => {
    if (!previous || previous === 0) return "+0%"
    const growth = ((current - previous) / previous) * 100
    const sign = growth >= 0 ? "+" : ""
    return `${sign}${Math.round(growth)}%`
  }

  const calculatePerformanceMetrics = () => {
    if (!leads.length) {
      return {
        leadQualityScore: 0,
        responseRate: 0,
        conversionRate: 0,
      }
    }

    // Calculate lead quality score based on completed conversations and scores
    const scoredLeads = leads.filter((l) => l.lead_score?.total_score)
    const avgScore =
      scoredLeads.length > 0
        ? scoredLeads.reduce((sum, l) => sum + (l.lead_score?.total_score || 0), 0) / scoredLeads.length
        : 0
    const leadQualityScore = Math.min(100, (avgScore / 100) * 100) // Normalize to percentage

    // Calculate response rate (leads with contact info vs total)
    const leadsWithContact = leads.filter((l) => l.user_data.user_email || l.user_data.user_phone_number)
    const responseRate = leads.length > 0 ? (leadsWithContact.length / leads.length) * 100 : 0

    // Calculate conversion rate from analytics
    const conversionRate = analytics?.conversation_metrics.completion_rate || 0

    return {
      leadQualityScore: Math.round(leadQualityScore),
      responseRate: Math.round(responseRate),
      conversionRate: Math.round(conversionRate),
    }
  }

  // Notification functions
  const addNotification = (type: "success" | "error" | "info" | "warning", title: string, message: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
    }
    setNotifications((prev) => [notification, ...prev.slice(0, 9)]) // Keep only 10 notifications
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid username or password")
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.")
        } else {
          throw new Error("Login failed. Please check your credentials.")
        }
      }

      const data = await response.json()
      setToken(data.access_token)
      setUser(data.user_info)
      setIsLoggedIn(true)
      localStorage.setItem("admin_token", data.access_token)
      localStorage.setItem("admin_user", JSON.stringify(data.user_info))

      await loadDashboardData(data.access_token)
      addNotification("success", "Login Successful", `Welcome back, ${data.user_info.username}!`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      addNotification("error", "Login Failed", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/admin/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setToken(null)
      setUser(null)
      setIsLoggedIn(false)
      localStorage.removeItem("admin_token")
      localStorage.removeItem("admin_user")
    }
  }

  const loadDashboardData = async (authToken?: string) => {
    const currentToken = authToken || token
    if (!currentToken) return

    try {
      setLoading(true)
      setError(null)

      const headers = { Authorization: `Bearer ${currentToken}` }

      // Store previous analytics before loading new ones
      if (analytics) {
        setPreviousAnalytics(analytics)
      }

      // Load leads and analytics separately with proper error handling
      try {
        const leadsResponse = await fetch(`${API_BASE}/admin/leads`, { headers })
        if (leadsResponse.ok) {
          const leadsData = await leadsResponse.json()
          console.log("[v0] Leads data loaded:", leadsData)
          setLeads(leadsData.leads || [])
        } else if (leadsResponse.status === 401) {
          console.error("[v0] Authentication failed for leads endpoint")
          addNotification("error", "Session Expired", "Please log in again.")
          logout()
          return
        } else {
          console.error("[v0] Failed to load leads:", leadsResponse.status)
          addNotification("warning", "Data Loading Issue", "Some lead data may not be current.")
        }
      } catch (leadsError) {
        console.error("[v0] Leads fetch error:", leadsError)
        addNotification("warning", "Connection Issue", "Unable to load latest leads data.")
      }

      // Analytics endpoint
      try {
        const analyticsResponse = await fetch(`${API_BASE}/admin/analytics`)
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          console.log("[v0] Analytics data loaded:", analyticsData)
          setAnalytics(analyticsData)
        } else {
          console.error("[v0] Failed to load analytics:", analyticsResponse.status)
          addNotification("warning", "Analytics Unavailable", "Analytics data could not be loaded.")
        }
      } catch (analyticsError) {
        console.error("[v0] Analytics fetch error:", analyticsError)
        addNotification("warning", "Analytics Error", "Analytics service is currently unavailable.")
      }

      // Check system health
      await checkSystemHealth()
    } catch (err) {
      console.error("[v0] Dashboard data error:", err)
      setError("Failed to load dashboard data")
      addNotification("error", "Dashboard Error", "Unable to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!token) {
      addNotification("error", "Authentication Required", "Please log in again.")
      return
    }

    // Validate required fields
    if (!newUser.username || !newUser.email || !newUser.password) {
      addNotification("error", "Validation Error", "Please fill in all required fields.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        setShowCreateUser(false)
        setNewUser({
          username: "",
          email: "",
          password: "",
          role: "admin",
          permissions: ["view_conversations", "view_leads", "view_analytics"],
        })
        addNotification("success", "User Created", `Admin user "${newUser.username}" created successfully!`)
      } else if (response.status === 401) {
        addNotification("error", "Authentication Failed", "Please log in again.")
        logout()
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
        addNotification("error", "User Creation Failed", errorData.detail || "Unknown error")
      }
    } catch (err) {
      console.error("[v0] Create user error:", err)
      addNotification("error", "User Creation Failed", err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  const exportLeads = () => {
    try {
      const csvContent = [
        ["Name", "Email", "Phone", "Type", "Score", "Category", "Status", "Created"],
        ...filteredLeads.map((lead) => [
          lead.user_data.user_name || "Unknown",
          lead.user_data.user_email || "No email",
          lead.user_data.user_phone_number || "No phone",
          lead.user_data.user_buying_or_selling || "Unknown",
          lead.lead_score?.total_score || 0,
          lead.lead_score?.category || "Unscored",
          lead.conversation_complete ? "Complete" : "Incomplete",
          new Date(lead.created_at).toLocaleDateString(),
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      addNotification("success", "Export Complete", `${filteredLeads.length} leads exported successfully.`)
    } catch (err) {
      console.error("[v0] Export error:", err)
      addNotification("error", "Export Failed", "Unable to export leads data.")
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token")
    const savedUser = localStorage.getItem("admin_user")

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        setIsLoggedIn(true)
        loadDashboardData(savedToken)
      } catch (err) {
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_user")
      }
    }
  }, [])

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest(".notifications-dropdown")) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showNotifications])

  useEffect(() => {
    if (!isLoggedIn || !token) return

    const interval = setInterval(() => {
      loadDashboardData()
      checkSystemHealth()
    }, 30000) // 30 seconds for better performance

    return () => clearInterval(interval)
  }, [isLoggedIn, token])

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchTerm ||
      lead.user_data.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.user_data.user_email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "complete" && lead.conversation_complete) ||
      (statusFilter === "incomplete" && !lead.conversation_complete)

    const matchesScore = scoreFilter === "all" || lead.lead_score?.category?.toLowerCase() === scoreFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesScore
  })

  const getScoreBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "hot":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white"
      case "warm":
        return "bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
      case "qualified":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
      case "cold":
        return "bg-gradient-to-r from-gray-500 to-slate-500 text-white"
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "online":
      case "connected":
      case "active":
        return { color: "#22C55E", icon: CheckCircle, text: status.charAt(0).toUpperCase() + status.slice(1) }
      case "degraded":
      case "error":
        return { color: "#F59E0B", icon: AlertCircle, text: status.charAt(0).toUpperCase() + status.slice(1) }
      case "offline":
      case "disconnected":
      case "inactive":
      default:
        return { color: "#EF4444", icon: XCircle, text: status.charAt(0).toUpperCase() + status.slice(1) }
    }
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "leads", label: "Leads", icon: Users },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))" }}
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
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                borderColor: "rgba(59, 130, 246, 0.3)",
              }}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: "linear-gradient(to right, #3B82F6, #9333EA)" }}
                >
                  <Home className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold text-white mb-2 font-airnt-quantum tracking-wider">AIREA Admin</h1>
                <p style={{ color: "#94A3B8" }}>Real Estate Intelligence Platform</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  login(loginForm.username, loginForm.password)
                }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                      style={{
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                        border: "1px solid",
                      }}
                      onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "#3B82F6")}
                      onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(59, 130, 246, 0.3)")}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                      style={{
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                        border: "1px solid",
                      }}
                      onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "#3B82F6")}
                      onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(59, 130, 246, 0.3)")}
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
                      borderColor: "rgba(239, 68, 68, 0.3)",
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
                  style={{ background: "linear-gradient(to right, #3B82F6, #9333EA)" }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const performanceMetrics = calculatePerformanceMetrics()

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F172A" }}>
      {/* Background */}
      <div className="fixed inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))" }}
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
              backgroundColor: "rgba(30, 41, 59, 0.95)",
              borderColor: "rgba(59, 130, 246, 0.3)",
            }}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div
                className="flex items-center justify-between p-6 border-b"
                style={{ borderColor: "rgba(59, 130, 246, 0.3)" }}
              >
                <div className="flex items-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
                    style={{ background: "linear-gradient(to right, #3B82F6, #9333EA)" }}
                  >
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white font-airnt-quantum tracking-wider">AIREA</h1>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>
                      Admin Portal
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg transition-colors"
                  style={{ color: "#94A3B8" }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor = "rgba(59, 130, 246, 0.1)")
                  }
                  onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = "transparent")}
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
                        activeTab === item.id ? "text-white shadow-lg" : "hover:bg-opacity-10"
                      }`}
                      style={
                        activeTab === item.id
                          ? { background: "linear-gradient(to right, #3B82F6, #9333EA)" }
                          : { color: "#94A3B8" }
                      }
                      onMouseEnter={(e) => {
                        if (activeTab !== item.id) {
                          ;(e.target as HTMLButtonElement).style.backgroundColor = "rgba(59, 130, 246, 0.1)"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== item.id) {
                          ;(e.target as HTMLButtonElement).style.backgroundColor = "transparent"
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
              <div className="p-4 border-t" style={{ borderColor: "rgba(59, 130, 246, 0.3)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ background: "linear-gradient(to right, #3B82F6, #9333EA)" }}
                    >
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user?.username}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>
                        {user?.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "#94A3B8" }}
                    onMouseEnter={(e) => {
                      ;(e.target as HTMLButtonElement).style.backgroundColor = "rgba(59, 130, 246, 0.1)"
                      ;(e.target as HTMLButtonElement).style.color = "#9333EA"
                    }}
                    onMouseLeave={(e) => {
                      ;(e.target as HTMLButtonElement).style.backgroundColor = "transparent"
                      ;(e.target as HTMLButtonElement).style.color = "#94A3B8"
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
      <div className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "ml-0"}`}>
        {/* Top Bar */}
        <header
          className="shadow-sm border-b sticky top-0 z-40 backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(30, 41, 59, 0.95)",
            borderColor: "rgba(59, 130, 246, 0.3)",
          }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg mr-4 transition-colors"
                style={{ color: "#94A3B8" }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLButtonElement).style.backgroundColor = "rgba(59, 130, 246, 0.1)")
                }
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = "transparent")}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-white capitalize font-airnt-quantum tracking-wider">
                {activeTab}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg relative transition-colors"
                  style={{ color: "#94A3B8" }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor = "rgba(59, 130, 246, 0.1)")
                  }
                  onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = "transparent")}
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
                      style={{ backgroundColor: "#9333EA" }}
                    >
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-50 notifications-dropdown"
                      style={{
                        backgroundColor: "rgba(30, 41, 59, 0.95)",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      <div className="p-4 border-b" style={{ borderColor: "rgba(59, 130, 246, 0.3)" }}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">Notifications</h3>
                          {notifications.length > 0 && (
                            <button
                              onClick={clearAllNotifications}
                              className="text-sm px-3 py-1 rounded-lg transition-colors"
                              style={{ color: "#94A3B8" }}
                              onMouseEnter={(e) =>
                                ((e.target as HTMLButtonElement).style.backgroundColor = "rgba(59, 130, 246, 0.1)")
                              }
                              onMouseLeave={(e) =>
                                ((e.target as HTMLButtonElement).style.backgroundColor = "transparent")
                              }
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center" style={{ color: "#94A3B8" }}>
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-4 border-b cursor-pointer transition-colors ${
                                !notification.read ? "bg-opacity-10" : ""
                              }`}
                              style={{
                                borderColor: "rgba(59, 130, 246, 0.3)",
                                backgroundColor: !notification.read ? "rgba(59, 130, 246, 0.1)" : "transparent",
                              }}
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 ${
                                    notification.type === "success"
                                      ? "bg-green-500"
                                      : notification.type === "error"
                                        ? "bg-red-500"
                                        : notification.type === "warning"
                                          ? "bg-yellow-500"
                                          : "bg-blue-500"
                                  }`}
                                />
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
                                  <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                                    {notification.message}
                                  </p>
                                  <p className="text-xs mt-2 opacity-75" style={{ color: "#94A3B8" }}>
                                    {notification.timestamp.toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div
                className="w-8 h-8 rounded-full"
                style={{ background: "linear-gradient(to right, #3B82F6, #9333EA)" }}
              ></div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
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
                        <p className="text-3xl font-bold">{analytics?.conversation_metrics.total_conversations || 0}</p>
                        <p className="text-blue-100 text-sm mt-1">
                          {previousAnalytics
                            ? calculateGrowthPercentage(
                                analytics?.conversation_metrics.total_conversations || 0,
                                previousAnalytics.conversation_metrics.total_conversations || 0,
                              ) + " from last update"
                            : "No previous data"}
                        </p>
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
                          {leads.filter((l) => l.lead_score?.category === "Hot").length}
                        </p>
                        <p className="text-red-100 text-sm mt-1">
                          {leads.length > 0
                            ? `${Math.round((leads.filter((l) => l.lead_score?.category === "Hot").length / leads.length) * 100)}% of total`
                            : "No leads yet"}
                        </p>
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
                        <p className="text-green-100 text-sm mt-1">
                          {previousAnalytics
                            ? calculateGrowthPercentage(
                                analytics?.conversation_metrics.completed_conversations || 0,
                                previousAnalytics.conversation_metrics.completed_conversations || 0,
                              ) + " completion rate"
                            : "No previous data"}
                        </p>
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
                        <p className="text-purple-100 text-sm mt-1">
                          {analytics?.conversation_metrics.completion_rate &&
                          analytics.conversation_metrics.completion_rate > 50
                            ? "Above average"
                            : analytics?.conversation_metrics.completion_rate
                              ? "Below average"
                              : "No data available"}
                        </p>
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
                              {lead.user_data.user_name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {lead.user_data.user_name || "Unknown"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {lead.user_data.user_email || "No email"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${getScoreBadgeColor(lead.lead_score?.category || "")}`}
                            >
                              {lead.lead_score?.category || "New"}
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
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Real-time metrics</p>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Lead Quality Score
                          </span>
                          <span className="text-sm font-semibold text-green-600">
                            {performanceMetrics.leadQualityScore}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${performanceMetrics.leadQualityScore}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Response Rate</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {performanceMetrics.responseRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${performanceMetrics.responseRate}%` }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversion Rate</span>
                          <span className="text-sm font-semibold text-purple-600">
                            {performanceMetrics.conversionRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${performanceMetrics.conversionRate}%` }}
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
            {activeTab === "leads" && (
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
                      onClick={exportLeads}
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
                                  {lead.user_data.user_name?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {lead.user_data.user_name || "Unknown"}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {lead.user_data.user_email || "No email"}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {lead.user_data.user_phone_number || "No phone"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                {lead.user_data.user_buying_or_selling || "Unknown"}
                              </span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {lead.lead_score?.total_score || 0}
                                </span>
                                <span
                                  className={`px-3 py-1 text-xs font-semibold rounded-full ${getScoreBadgeColor(lead.lead_score?.category || "")}`}
                                >
                                  {lead.lead_score?.category || "Unscored"}
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
                                  onClick={() => setSelectedConversation(lead.session_id)}
                                  className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                  title="View Conversation"
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
            {activeTab === "analytics" && (
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
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      borderColor: "rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Lead Type Distribution</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Buyers</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 rounded-full h-2" style={{ backgroundColor: "rgba(59, 130, 246, 0.3)" }}>
                            <div
                              className="h-2 rounded-full"
                              style={{
                                background: "linear-gradient(to right, #3B82F6, #9333EA)",
                                width: `${((analytics?.lead_type_distribution.buying || 0) / Math.max(1, analytics?.conversation_metrics.total_conversations || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-white">
                            {analytics?.lead_type_distribution.buying || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">Sellers</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 rounded-full h-2" style={{ backgroundColor: "rgba(59, 130, 246, 0.3)" }}>
                            <div
                              className="h-2 rounded-full"
                              style={{
                                background: "linear-gradient(to right, #3B82F6, #9333EA)",
                                width: `${((analytics?.lead_type_distribution.selling || 0) / Math.max(1, analytics?.conversation_metrics.total_conversations || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-white">
                            {analytics?.lead_type_distribution.selling || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Distribution */}
                  <div
                    className="rounded-2xl shadow-lg border p-6"
                    style={{
                      backgroundColor: "rgba(30, 41, 59, 0.8)",
                      borderColor: "rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Lead Score Distribution</h3>
                    <div className="space-y-4">
                      {["Hot", "Warm", "Qualified", "Cold"].map((category) => {
                        const count = leads.filter((l) => l.lead_score?.category === category).length
                        const percentage = (count / Math.max(1, leads.length)) * 100
                        return (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-white">{category}</span>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-32 rounded-full h-2"
                                style={{ backgroundColor: "rgba(59, 130, 246, 0.3)" }}
                              >
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    background: "linear-gradient(to right, #3B82F6, #9333EA)",
                                    width: `${percentage}%`,
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
                    backgroundColor: "rgba(30, 41, 59, 0.8)",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        {analytics?.conversation_metrics.total_conversations || 0}
                      </div>
                      <div style={{ color: "#94A3B8" }}>Total Conversations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        {analytics?.conversation_metrics.completed_conversations || 0}
                      </div>
                      <div style={{ color: "#94A3B8" }}>Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        {Math.round(analytics?.conversation_metrics.completion_rate || 0)}%
                      </div>
                      <div style={{ color: "#94A3B8" }}>Completion Rate</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
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
                    backgroundColor: "rgba(30, 41, 59, 0.8)",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4">User Management</h3>
                  <p className="mb-6" style={{ color: "#94A3B8" }}>
                    Create and manage admin users
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateUser(true)}
                    className="text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center"
                    style={{ background: "linear-gradient(to right, #3B82F6, #9333EA)" }}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create New Admin User
                  </motion.button>
                </div>

                <div
                  className="rounded-2xl shadow-lg border p-6"
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.8)",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">System Status</h3>
                    <button
                      onClick={checkSystemHealth}
                      className="text-sm px-3 py-1 rounded-lg transition-colors"
                      style={{ color: "#94A3B8" }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLButtonElement).style.backgroundColor = "rgba(59, 130, 246, 0.1)")
                      }
                      onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = "transparent")}
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "API Status", status: systemHealth.api_status },
                      { label: "Database", status: systemHealth.database_status },
                      { label: "AI Service", status: systemHealth.ai_service_status },
                    ].map(({ label, status }) => {
                      const statusDisplay = getStatusDisplay(status)
                      const StatusIcon = statusDisplay.icon
                      return (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-white">{label}</span>
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="w-4 h-4" style={{ color: statusDisplay.color }} />
                            <span
                              className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                              style={{ backgroundColor: statusDisplay.color }}
                            >
                              {statusDisplay.text}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 text-xs" style={{ color: "#94A3B8" }}>
                    Last checked: {new Date(systemHealth.last_checked).toLocaleString()}
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
                  borderColor: "rgba(166, 110, 78, 0.3)",
                }}
              >
                <h3 className="text-xl font-bold text-white mb-6">Create New Admin User</h3>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid",
                    }}
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid",
                    }}
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid",
                    }}
                  />

                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      backgroundColor: "rgba(166, 110, 78, 0.1)",
                      borderColor: "rgba(166, 110, 78, 0.3)",
                      border: "1px solid",
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
                    {loading ? "Creating..." : "Create User"}
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

      {/* Conversation Viewer Modal */}
      <AnimatePresence>
        {selectedConversation && (
          <ConversationViewer sessionId={selectedConversation} onClose={() => setSelectedConversation(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
