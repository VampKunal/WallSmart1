"use client"

import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"

export default function Inventory() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "",
    lastRestocked: "",
    avgRestockTime: "",
  })
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      console.log("Fetching inventory items...")
      setError(null)
      setLoading(true)

      const response = await fetch("/api/inventory", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Fetch response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Fetch error data:", errorData)
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched items:", data)
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching items:", error)
      setError(`Failed to load inventory: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)
    setError(null)

    try {
      console.log("Submitting form data:", formData)

      // Client-side validation
      if (!formData.name.trim()) {
        throw new Error("Item name is required")
      }
      if (!formData.quantity || Number.parseInt(formData.quantity) < 0) {
        throw new Error("Valid quantity is required")
      }
      if (!formData.unit.trim()) {
        throw new Error("Unit is required")
      }

      const url = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory"
      const method = editingItem ? "PUT" : "POST"

      const requestData = {
        name: formData.name.trim(),
        quantity: Number.parseInt(formData.quantity, 10),
        unit: formData.unit.trim(),
        lastRestocked: formData.lastRestocked || null,
        avgRestockTime: formData.avgRestockTime ? Number.parseInt(formData.avgRestockTime, 10) : null,
      }

      console.log(`${method} request to ${url} with data:`, requestData)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log(`${method} response status:`, response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`${method} error data:`, errorData)
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log(`${method} result:`, result)

      // Refresh the items list
      await fetchItems()

      // Close modal and reset form
      setShowModal(false)
      setEditingItem(null)
      resetForm()
    } catch (error) {
      console.error("Error saving item:", error)
      setError(`Failed to save item: ${error.message}`)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (item) => {
    console.log("Editing item:", item)
    setEditingItem(item)
    setFormData({
      name: item.name || "",
      quantity: item.quantity?.toString() || "",
      unit: item.unit || "",
      lastRestocked: item.last_restocked || "",
      avgRestockTime: item.avg_restock_time?.toString() || "",
    })
    setShowModal(true)
    setError(null)
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      console.log("Deleting item with ID:", id)
      setError(null)

      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Delete response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Delete error data:", errorData)
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("Delete result:", result)

      // Refresh the items list
      await fetchItems()
    } catch (error) {
      console.error("Error deleting item:", error)
      setError(`Failed to delete item: ${error.message}`)
    }
  }

  const predictRestock = async (item) => {
    try {
      console.log("Predicting restock for item:", item)
      const response = await fetch("/api/predict/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          currentQuantity: item.quantity,
          avgRestockTime: item.avg_restock_time,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPredictions((prev) => ({
          ...prev,
          [item.id]: data.prediction,
        }))
      }
    } catch (error) {
      console.error("Error predicting restock:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: "",
      unit: "",
      lastRestocked: "",
      avgRestockTime: "",
    })
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    resetForm()
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </div>
    )
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
                <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
                <p className="text-muted-foreground">Manage your inventory items</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Item
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Last Restocked
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Avg Restock Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center">
                            <PlusIcon className="w-12 h-12 mb-4 opacity-50" />
                            <p className="font-medium">No inventory items found</p>
                            <p className="text-sm mt-1">Add your first item to get started</p>
                            <button
                              onClick={fetchItems}
                              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                              Refresh
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.quantity < 5
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : item.quantity < 10
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              }`}
                            >
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {item.last_restocked || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {item.avg_restock_time ? `${item.avg_restock_time} days` : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => predictRestock(item)}
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                              title="Predict Restock"
                            >
                              <ClockIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit Item"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete Item"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Predictions Display */}
              {Object.keys(predictions).length > 0 && (
                <div className="p-4 bg-muted border-t border-border">
                  <h3 className="text-sm font-medium text-foreground mb-2">Restock Predictions:</h3>
                  {Object.entries(predictions).map(([itemId, prediction]) => {
                    const item = items.find((i) => i.id.toString() === itemId)
                    return (
                      <div key={itemId} className="text-sm text-muted-foreground">
                        {item?.name}: {prediction}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold text-foreground mb-4">{editingItem ? "Edit Item" : "Add New Item"}</h2>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., pieces, bottles, packs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Last Restocked</label>
                <input
                  type="date"
                  value={formData.lastRestocked}
                  onChange={(e) => setFormData({ ...formData, lastRestocked: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Avg Restock Time (days)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.avgRestockTime}
                  onChange={(e) => setFormData({ ...formData, avgRestockTime: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter average days between restocks"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitLoading}
                  className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      {editingItem ? "Updating..." : "Adding..."}
                    </div>
                  ) : editingItem ? (
                    "Update"
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
