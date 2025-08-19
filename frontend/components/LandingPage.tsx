"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import {
  MessageCircle,
  TrendingUp,
  Users,
  Phone,
  Mail,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Clock,
  Brain,
  Building2,
} from "lucide-react"

interface ContactFormData {
  name: string
  email: string
  phone: string
  message: string
  lead_type: "buyer" | "seller"
}

interface LandingPageProps {
  onOpenChat: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onOpenChat }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>()

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      setSubmitSuccess(true)
      reset()
      setTimeout(() => setSubmitSuccess(false), 5000)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#201B26' }}>
      <nav className="backdrop-blur-md border-b sticky top-0 z-40" style={{ backgroundColor: 'rgba(32, 27, 38, 0.95)', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-4xl font-bold font-airnt-quantum tracking-widest" style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AIREA
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="hover:text-white transition-colors font-medium" style={{ color: '#A66E4E' }}>
                Features
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors font-medium" style={{ color: '#A66E4E' }}>
                How It Works
              </a>
              <a href="#contact" className="hover:text-white transition-colors font-medium" style={{ color: '#A66E4E' }}>
                Contact
              </a>
              <button
                onClick={onOpenChat}
                className="text-white px-8 py-3 rounded-full transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)' }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Start Chat</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="hover:text-white" style={{ color: '#A66E4E' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 lg:py-40" style={{ background: 'linear-gradient(135deg, #201B26 0%, rgba(242, 169, 34, 0.1) 50%, #201B26 100%)' }}>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(242, 169, 34, 0.05), rgba(242, 93, 7, 0.05))' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="mb-8">
              <span className="text-8xl lg:text-9xl font-bold font-airnt-quantum tracking-widest block leading-none" style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AIREA
              </span>
              <p className="text-xl mt-4 tracking-widest font-light" style={{ color: '#A66E4E' }}>
                AI REAL ESTATE ASSISTANT
              </p>
            </div>

            <div className="inline-flex items-center px-6 py-3 rounded-full border mb-8 backdrop-blur-sm" style={{ backgroundColor: 'rgba(42, 37, 48, 0.5)', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
              <Shield className="w-5 h-5 mr-3" style={{ color: '#F2A922' }} />
              <span className="font-medium" style={{ color: '#A66E4E' }}>Trusted by 15,000+ clients worldwide</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto mb-8">
              The Future of Real Estate is
              <span className="block mt-2" style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Powered by AI
              </span>
            </h1>

            <p className="text-xl max-w-3xl mx-auto mb-12 leading-relaxed" style={{ color: '#A66E4E' }}>
              Experience intelligent property valuations, market insights, and seamless connections with top agents.
              AIREA transforms how you buy, sell, and manage real estate.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={onOpenChat}
                className="text-white px-10 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center space-x-3 shadow-2xl transform hover:scale-105"
                style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)', boxShadow: '0 25px 50px -12px rgba(242, 169, 34, 0.25)' }}
              >
                <MessageCircle className="w-6 h-6" />
                <span>Start AI Conversation</span>
              </button>
              <a
                href="#how-it-works"
                className="border-2 px-10 py-4 rounded-full font-semibold text-lg hover:text-white transition-all duration-300 backdrop-blur-sm"
                style={{ borderColor: '#A66E4E', color: '#A66E4E' }}
              >
                Discover How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24" style={{ backgroundColor: '#2a2530' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose AIREA?</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#A66E4E' }}>
              Our AI-powered platform combines cutting-edge technology with real estate expertise to deliver unmatched
              results for buyers and sellers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl border transition-all duration-300 group" style={{ backgroundColor: '#3a3540', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)' }}>
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Instant Valuations</h3>
              <p className="leading-relaxed" style={{ color: '#A66E4E' }}>
                Get accurate property valuations in seconds using our advanced AI algorithms and real-time market data
                analysis.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl border transition-all duration-300 group" style={{ backgroundColor: '#3a3540', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to right, #F25D07, #8C1D04)' }}>
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">24/7 AI Assistant</h3>
              <p className="leading-relaxed" style={{ color: '#A66E4E' }}>
                Our intelligent chatbot is available around the clock to answer questions, schedule appointments, and
                guide you through the process.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl border transition-all duration-300 group" style={{ backgroundColor: '#3a3540', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(to right, #A66E4E, #F2A922)' }}>
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Expert Agents</h3>
              <p className="leading-relaxed" style={{ color: '#A66E4E' }}>
                Connect with our network of top-rated real estate professionals who specialize in your local market for
                personalized service.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24" style={{ backgroundColor: '#201B26' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#A66E4E' }}>
              Our streamlined process makes buying or selling real estate simple, fast, and efficient.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl shadow-lg" style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)' }}>
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Start Chat</h3>
              <p style={{ color: '#A66E4E' }}>
                Begin a conversation with our AI assistant. Tell us whether you're buying or selling.
              </p>
              <ArrowRight className="w-6 h-6 mx-auto mt-4 hidden md:block" style={{ color: '#F2A922' }} />
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl shadow-lg" style={{ background: 'linear-gradient(to right, #F25D07, #8C1D04)' }}>
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Share Details</h3>
              <p style={{ color: '#A66E4E' }}>
                Provide property details and preferences. Get instant valuations and market insights.
              </p>
              <ArrowRight className="w-6 h-6 mx-auto mt-4 hidden md:block" style={{ color: '#F25D07' }} />
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl shadow-lg" style={{ background: 'linear-gradient(to right, #8C1D04, #A66E4E)' }}>
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Connect</h3>
              <p style={{ color: '#A66E4E' }}>
                Get matched with a specialist agent in your area for personalized service.
              </p>
              <ArrowRight className="w-6 h-6 mx-auto mt-4 hidden md:block" style={{ color: '#8C1D04' }} />
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl shadow-lg" style={{ background: 'linear-gradient(to right, #A66E4E, #F2A922)' }}>
                4
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Close Deal</h3>
              <p style={{ color: '#A66E4E' }}>
                Complete your transaction with confidence, backed by our AI-powered insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20" style={{ backgroundColor: '#2a2530' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2" style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>50K+</div>
              <div style={{ color: '#A66E4E' }}>Properties Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ background: 'linear-gradient(to right, #F25D07, #8C1D04)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>98%</div>
              <div style={{ color: '#A66E4E' }}>Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ background: 'linear-gradient(to right, #8C1D04, #A66E4E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>24/7</div>
              <div style={{ color: '#A66E4E' }}>AI Availability</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ background: 'linear-gradient(to right, #A66E4E, #F2A922)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>15K+</div>
              <div style={{ color: '#A66E4E' }}>Happy Clients</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20" style={{ backgroundColor: '#201B26' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What Our Clients Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl shadow-lg border" style={{ backgroundColor: '#2a2530', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" style={{ color: '#F2A922' }} />
                ))}
              </div>
              <p className="mb-6" style={{ color: '#A66E4E' }}>
                "The AI assistant helped me get an accurate valuation instantly. Sold my house 20% above my expected
                price!"
              </p>
              <div>
                <div className="font-semibold text-white">Sarah Johnson</div>
                <div style={{ color: '#A66E4E' }}>Salt Lake City</div>
              </div>
            </div>

            <div className="p-8 rounded-2xl shadow-lg border" style={{ backgroundColor: '#2a2530', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" style={{ color: '#F2A922' }} />
                ))}
              </div>
              <p className="mb-6" style={{ color: '#A66E4E' }}>
                "Found my dream home in just 2 weeks! The AI understood exactly what I was looking for and connected me
                with the perfect agent."
              </p>
              <div>
                <div className="font-semibold text-white">Mike Rodriguez</div>
                <div style={{ color: '#A66E4E' }}>Provo</div>
              </div>
            </div>

            <div className="p-8 rounded-2xl shadow-lg border" style={{ backgroundColor: '#2a2530', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" style={{ color: '#F2A922' }} />
                ))}
              </div>
              <p className="mb-6" style={{ color: '#A66E4E' }}>
                "The 24/7 availability was a game-changer. Got answers to all my questions at midnight and scheduled a
                showing for the next day."
              </p>
              <div>
                <div className="font-semibold text-white">Emily Chen</div>
                <div style={{ color: '#A66E4E' }}>Ogden</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24" style={{ backgroundColor: '#2a2530' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
              <p className="text-xl mb-8" style={{ color: '#A66E4E' }}>
                Whether you're buying or selling, our AI assistant is here to help you every step of the way. Start your
                journey today and experience the future of real estate.
              </p>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ backgroundColor: 'rgba(242, 169, 34, 0.2)', borderColor: 'rgba(242, 169, 34, 0.3)' }}>
                    <Phone className="w-6 h-6" style={{ color: '#F2A922' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">(555) 123-4567</div>
                    <div style={{ color: '#A66E4E' }}>Available 24/7</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ backgroundColor: 'rgba(242, 93, 7, 0.2)', borderColor: 'rgba(242, 93, 7, 0.3)' }}>
                    <Mail className="w-6 h-6" style={{ color: '#F25D07' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">hello@airea.ai</div>
                    <div style={{ color: '#A66E4E' }}>Quick response guaranteed</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ backgroundColor: 'rgba(140, 29, 4, 0.2)', borderColor: 'rgba(140, 29, 4, 0.3)' }}>
                    <MapPin className="w-6 h-6" style={{ color: '#8C1D04' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Salt Lake City, UT</div>
                    <div style={{ color: '#A66E4E' }}>Serving all of Utah</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl border shadow-lg" style={{ backgroundColor: '#3a3540', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
              <h3 className="text-2xl font-bold text-white mb-6">Contact Us</h3>

              {submitSuccess && (
                <div className="border rounded-lg p-4 mb-6" style={{ backgroundColor: 'rgba(242, 169, 34, 0.1)', borderColor: 'rgba(242, 169, 34, 0.2)' }}>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" style={{ color: '#F2A922' }} />
                    <span className="font-medium" style={{ color: '#F2A922' }}>Message sent successfully!</span>
                  </div>
                  <p className="mt-1" style={{ color: '#A66E4E' }}>We'll contact you within 24 hours.</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Name</label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 text-white placeholder-gray-400"
                    style={{
                      borderColor: 'rgba(166, 110, 78, 0.3)',
                      backgroundColor: '#2a2530'
                    }}
                    placeholder="Your full name"
                  />
                  {errors.name && <p className="text-sm mt-1" style={{ color: '#F25D07' }}>{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    type="email"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 text-white placeholder-gray-400"
                    style={{
                      borderColor: 'rgba(166, 110, 78, 0.3)',
                      backgroundColor: '#2a2530'
                    }}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-sm mt-1" style={{ color: '#F25D07' }}>{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Phone</label>
                  <input
                    {...register("phone", { required: "Phone is required" })}
                    type="tel"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 text-white placeholder-gray-400"
                    style={{
                      borderColor: 'rgba(166, 110, 78, 0.3)',
                      backgroundColor: '#2a2530'
                    }}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && <p className="text-sm mt-1" style={{ color: '#F25D07' }}>{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">I'm interested in</label>
                  <select
                    {...register("lead_type", { required: "Please select an option" })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 text-white"
                    style={{
                      borderColor: 'rgba(166, 110, 78, 0.3)',
                      backgroundColor: '#2a2530'
                    }}
                  >
                    <option value="">Select...</option>
                    <option value="buyer">Buying a property</option>
                    <option value="seller">Selling a property</option>
                  </select>
                  {errors.lead_type && <p className="text-sm mt-1" style={{ color: '#F25D07' }}>{errors.lead_type.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Message</label>
                  <textarea
                    {...register("message", { required: "Message is required" })}
                    rows={4}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 text-white placeholder-gray-400"
                    style={{
                      borderColor: 'rgba(166, 110, 78, 0.3)',
                      backgroundColor: '#2a2530'
                    }}
                    placeholder="Tell us about your real estate needs..."
                  />
                  {errors.message && <p className="text-sm mt-1" style={{ color: '#F25D07' }}>{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 transform hover:scale-105"
                  style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)' }}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24" style={{ background: 'linear-gradient(135deg, #201B26 0%, rgba(242, 169, 34, 0.2) 50%, #8C1D04 100%)' }}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6 text-white">Experience the Future of Real Estate Today</h2>
          <p className="text-xl mb-8" style={{ color: '#A66E4E' }}>
            Join thousands of satisfied customers who have transformed their real estate experience with AI.
          </p>
          <button
            onClick={onOpenChat}
            className="bg-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-200 inline-flex items-center space-x-2 transform hover:scale-105 shadow-lg"
            style={{ color: '#201B26' }}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Start Your AI-Powered Journey</span>
          </button>
        </div>
      </section>

      <footer className="py-16 border-t" style={{ backgroundColor: '#2a2530', borderColor: 'rgba(166, 110, 78, 0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-6">
                <span className="text-3xl font-bold font-airnt-quantum tracking-widest" style={{ background: 'linear-gradient(to right, #F2A922, #F25D07)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  AIREA
                </span>
                <p className="text-xs font-medium tracking-widest mt-1" style={{ color: '#A66E4E' }}>AI REAL ESTATE</p>
              </div>
              <p className="leading-relaxed" style={{ color: '#A66E4E' }}>
                Revolutionizing real estate with AI-powered solutions for buyers, sellers, and agents.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Services</h3>
              <ul className="space-y-2" style={{ color: '#A66E4E' }}>
                <li>Property Valuations</li>
                <li>AI Assistant</li>
                <li>Agent Matching</li>
                <li>Market Analysis</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-2" style={{ color: '#A66E4E' }}>
                <li>About Us</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-2" style={{ color: '#A66E4E' }}>
                <li>Help Center</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center" style={{ borderColor: 'rgba(166, 110, 78, 0.3)', color: '#A66E4E' }}>
            <p>&copy; 2024 AIREA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
