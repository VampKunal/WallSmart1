"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import {
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline"

export default function Reports() {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    avgRestockTime: 0,
  })
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [smartReport, setSmartReport] = useState("")
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/inventory/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error("Failed to fetch stats")
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const generateSmartReport = async () => {
    setReportLoading(true)
    setReportError(null)

    try {
      const response = await fetch("/api/reports/smart-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setSmartReport(data.report || "No report generated")
    } catch (error) {
      console.error("Error generating smart report:", error)
      setReportError("Failed to generate smart report. Please try again later.")
    } finally {
      setReportLoading(false)
    }
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = { role: "user", content: chatInput.trim() }
    setChatMessages((prev) => [...prev, userMessage])
    const currentInput = chatInput.trim()
    setChatInput("")
    setIsLoading(true)
    setChatError(null)

    try {
      const response = await fetch("/api/reports/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const aiMessage = {
        role: "assistant",
        content: data.response || "I apologize, but I couldn't generate a response. Please try again.",
      }
      setChatMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error in chat:", error)
      const errorMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
      }
      setChatMessages((prev) => [...prev, errorMessage])
      setChatError("Failed to get AI response. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setChatMessages([])
    setChatError(null)
  }

  const downloadReport = () => {
    if (!smartReport) return

    const blob = new Blob([smartReport], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const printReport = () => {
    if (!smartReport) return

    const printWindow = window.open("", "_blank")
    printWindow.document.write(`
      <html>
        <head>
          <title>GreenStock AI Inventory Report</title>
          <style>
            body { font-family: monospace; white-space: pre-wrap; margin: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${smartReport}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground">Analyze your inventory data and get AI insights</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Stats Summary */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Inventory Summary
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <span className="text-foreground">Total Items</span>
                    <span className="font-semibold text-foreground">{stats.totalItems}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <span className="text-foreground">Low Stock Items</span>
                    <span className="font-semibold text-red-600">{stats.lowStockItems}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <span className="text-foreground">Average Restock Time</span>
                    <span className="font-semibold text-foreground">{Math.round(stats.avgRestockTime)} days</span>
                  </div>
                </div>
              </div>

              {/* AI Chat Interface */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                    AI Assistant
                  </h2>
                  {chatMessages.length > 0 && (
                    <button onClick={clearChat} className="text-sm text-muted-foreground hover:text-foreground">
                      Clear Chat
                    </button>
                  )}
                </div>

                {chatError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    {chatError}
                  </div>
                )}

                <div className="h-80 flex flex-col">
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="text-muted-foreground text-center py-8">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Ask me anything about your inventory!</p>
                        <p className="text-sm mt-2">
                          Try asking about low stock items, restock recommendations, or inventory trends.
                        </p>
                      </div>
                    )}

                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md max-w-[85%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted text-foreground mr-auto"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="bg-muted text-foreground p-3 rounded-md mr-auto max-w-[85%]">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleChatSubmit} className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about your inventory..."
                      className="flex-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      disabled={isLoading}
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !chatInput.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send message"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Smart Report Section */}
            <div className="bg-card p-6 rounded-lg border border-border mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  AI Smart Report
                </h2>
                <div className="flex space-x-2">
                  {smartReport && (
                    <>
                      <button
                        onClick={downloadReport}
                        className="flex items-center px-3 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors"
                        title="Download Report"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        Download
                      </button>
                      <button
                        onClick={printReport}
                        className="flex items-center px-3 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors"
                        title="Print Report"
                      >
                        <PrinterIcon className="w-4 h-4 mr-1" />
                        Print
                      </button>
                    </>
                  )}
                  <button
                    onClick={generateSmartReport}
                    disabled={reportLoading}
                    className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>

              {reportError && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    {reportError}
                  </div>
                </div>
              )}

              {smartReport ? (
                <div className="bg-muted p-6 rounded-md">
                  <div className="prose prose-sm max-w-none">
                    <pre className="text-foreground whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {smartReport}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <SparklesIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2 font-medium">
                    Generate comprehensive AI-powered inventory insights
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Get detailed analysis, recommendations, and actionable insights about your inventory performance.
                  </p>
                </div>
              )}
            </div>

            {/* Additional Reports Section */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Quick Reports
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => generateSmartReport()}
                  className="p-4 text-left border border-border rounded-md hover:bg-muted transition-colors"
                >
                  <h3 className="font-medium text-foreground">Stock Levels Analysis</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comprehensive stock level analysis with AI insights
                  </p>
                </button>

                <button
                  onClick={() => generateSmartReport()}
                  className="p-4 text-left border border-border rounded-md hover:bg-muted transition-colors"
                >
                  <h3 className="font-medium text-foreground">Restock Recommendations</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered restock timing and quantity suggestions
                  </p>
                </button>

                <button
                  onClick={() => generateSmartReport()}
                  className="p-4 text-left border border-border rounded-md hover:bg-muted transition-colors"
                >
                  <h3 className="font-medium text-foreground">Performance Metrics</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Key performance indicators and efficiency analysis
                  </p>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
