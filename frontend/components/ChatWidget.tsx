"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Send, MessageCircle, User, Bot, Minimize2, Maximize2 } from "lucide-react"
import axios from "axios"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

interface UserData {
  user_name?: string
  user_email?: string
  user_phone_number?: string
  user_buying_or_selling?: string
  user_property_address?: string
  user_property_type?: string
  user_number_of_bedrooms?: string
  user_number_of_bathrooms?: string
  [key: string]: any
}

interface ChatWidgetProps {
  isOpen: boolean
  onClose: () => void
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversationComplete, setConversationComplete] = useState(false)

  // Enhanced UI state
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [leadScore, setLeadScore] = useState<any>(null)
  const [conversationProgress, setConversationProgress] = useState<any>(null)
  const [quickReplies, setQuickReplies] = useState<string[]>([])

  // Smart suggestions based on conversation state
  const getSmartSuggestions = () => {
    if (!userData?.user_name) {
      return ["I'm looking to sell my house", "I want to buy a home", "What's my property worth?"]
    }
    if (!userData?.user_email) {
      return ["john@example.com", "jane.smith@email.com", "Let me provide my email"]
    }
    if (!userData?.user_buying_or_selling) {
      return ["I'm selling", "I'm buying", "Just exploring options"]
    }
    return []
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send initial greeting
      const initialMessage: Message = {
        id: Date.now().toString(),
        content: "Hi! I'm AIREA, your AI Real Estate Assistant. 👋 To get started, what's your name?",
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages([initialMessage])
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await axios.post("http://localhost:8000/api/chat", {
        message: inputValue,
        session_id: sessionId,
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.response,
        sender: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setSessionId(response.data.session_id)

      if (response.data.user_data) {
        setUserData(response.data.user_data)
      }

      setConversationComplete(response.data.conversation_complete)

      // Update enhanced UI state
      if (response.data.lead_score) {
        setLeadScore(response.data.lead_score)
      }

      if (response.data.progress) {
        setConversationProgress(response.data.progress)
      }

      // Update quick replies based on conversation state
      setQuickReplies(getSmartSuggestions())
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetConversation = () => {
    setMessages([])
    setUserData(null)
    setSessionId(null)
    setConversationComplete(false)

    // Send initial greeting again
    const initialMessage: Message = {
      id: Date.now().toString(),
      content: "Hi! I'm AIREA, your AI Real Estate Assistant. 👋 To get started, what's your name?",
      sender: "assistant",
      timestamp: new Date(),
    }
    setMessages([initialMessage])
  }

  const formatUserData = (data: UserData) => {
    const fields = [
      { key: "user_name", label: "Name" },
      { key: "user_email", label: "Email" },
      { key: "user_phone_number", label: "Phone" },
      { key: "user_buying_or_selling", label: "Type" },
      { key: "user_property_address", label: "Property Address" },
      { key: "user_property_type", label: "Property Type" },
      { key: "user_number_of_bedrooms", label: "Bedrooms" },
      { key: "user_number_of_bathrooms", label: "Bathrooms" },
    ]

    return fields
      .filter((field) => data[field.key] && data[field.key].trim())
      .map((field) => (
        <div key={field.key} className="flex justify-between py-1">
          <span className="text-white/70 text-sm font-sans">{field.label}:</span>
          <span className="text-white text-sm font-medium font-sans">{data[field.key]}</span>
        </div>
      ))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div
        className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl pointer-events-auto transition-all duration-300 ${
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
        }`}
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-white/20 to-white/10 text-white rounded-t-2xl backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold font-sans text-white">AIREA Assistant</h3>
              {!isMinimized && (
                <p className="text-xs opacity-90 font-sans text-white/80">
                  {conversationComplete ? "Lead captured!" : "Here to help with your real estate needs"}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors text-white"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96 custom-scrollbar">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} chat-bubble`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm ${
                        message.sender === "user"
                          ? "bg-white/30 text-white"
                          : "bg-white/20 text-white/80"
                      }`}
                    >
                      {message.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`px-4 py-2 rounded-2xl backdrop-blur-sm ${
                        message.sender === "user"
                          ? "bg-white/25 text-white rounded-br-md border border-white/20"
                          : "bg-white/15 text-white/90 rounded-bl-md border border-white/10"
                      }`}
                    >
                      <p className="text-sm leading-relaxed font-sans">{message.content}</p>
                      <p className="text-xs mt-1 text-white/60">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Bot className="w-4 h-4 text-white/80" />
                    </div>
                    <div className="bg-white/15 px-4 py-2 rounded-2xl rounded-bl-md backdrop-blur-sm border border-white/10">
                      <div className="typing-indicator">
                        <div className="typing-dot bg-white/60"></div>
                        <div className="typing-dot bg-white/60"></div>
                        <div className="typing-dot bg-white/60"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {userData && (
              <div className="border-t border-white/20 p-4 bg-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white text-sm font-sans">Lead Information</h4>
                  {conversationComplete && (
                    <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full border border-white/30 font-sans backdrop-blur-sm">
                      Complete
                    </span>
                  )}
                </div>
                <div className="space-y-1">{formatUserData(userData)}</div>
              </div>
            )}

            <div className="border-t border-white/20 p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-white/30 rounded-full focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 bg-white/20 text-white placeholder-white/60 font-sans backdrop-blur-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="p-2 bg-white/25 text-white rounded-full hover:bg-white/35 transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-white/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {conversationComplete && (
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={resetConversation}
                    className="text-sm text-white/80 hover:text-white transition-colors font-sans"
                  >
                    Start New Conversation
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ChatWidget