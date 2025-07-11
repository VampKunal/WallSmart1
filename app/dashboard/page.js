"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import {
  CubeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline"

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    avgRestockTime: 0,
    recentActivity: [],
  })
  const [aiReport, setAiReport] = useState("")
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportError, setReportError] = useState(null)
  const [lastReportTime, setLastReportTime] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/inventory/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const generateSmartReport = async () => {
    setLoadingReport(true)
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

      setAiReport(data.report || "No report generated")
      setLastReportTime(new Date().toLocaleString())
    } catch (error) {
      console.error("Error generating report:", error)
      setReportError("Failed to generate AI report. Please try again later.")
    } finally {
      setLoadingReport(false)
    }
  }

  const refreshStats = async () => {
    await fetchStats()
    if (aiReport) {
      generateSmartReport() // Regenerate report with new data
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
                <p className="text-muted-foreground">Monitor your inventory performance and insights</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center">
                  <CubeIcon className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                    <p className="text-2xl font-bold text-foreground">{stats.lowStockItems}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Restock Time</p>
                    <p className="text-2xl font-bold text-foreground">{Math.round(stats.avgRestockTime)} days</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Efficiency</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.lowStockItems === 0 ? "100%" : `${Math.max(0, 100 - stats.lowStockItems * 10)}%`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Report Section */}
            <div className="bg-card p-6 rounded-lg border border-border mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <SparklesIcon className="w-5 h-5 text-primary mr-2" />
                  <h2 className="text-lg font-semibold text-foreground">AI Smart Report</h2>
                  {lastReportTime && (
                    <span className="ml-4 text-sm text-muted-foreground">Last updated: {lastReportTime}</span>
                  )}
                </div>
                <button
                  onClick={generateSmartReport}
                  disabled={loadingReport}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingReport ? (
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

              {reportError && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    {reportError}
                  </div>
                </div>
              )}

              {aiReport ? (
                <div className="bg-muted p-6 rounded-md">
                  <div className="flex items-center mb-3">
                    <DocumentTextIcon className="w-5 h-5 text-primary mr-2" />
                    <h3 className="font-medium text-foreground">Inventory Analysis Report</h3>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="text-foreground whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {aiReport}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <SparklesIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">Get AI-powered insights about your inventory performance</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Generate Report" to analyze your current inventory data and receive actionable
                    recommendations.
                  </p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-3 px-4 bg-muted rounded-md">
                      <span className="text-foreground">{activity.action}</span>
                      <span className="text-muted-foreground text-sm">{activity.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Activity will appear here as you manage your inventory
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
