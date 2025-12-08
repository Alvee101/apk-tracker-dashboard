'use client'

import { useEffect, useState } from 'react'
import { supabase, type App } from '@/lib/supabase'

interface AppWithStats extends App {
  installs: number
  opens: number
}

export default function Dashboard() {
  const [apps, setApps] = useState<AppWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalApps, setTotalApps] = useState(0)
  const [totalInstalls, setTotalInstalls] = useState(0)
  const [totalOpens, setTotalOpens] = useState(0)

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Form state
  const [appName, setAppName] = useState('')
  const [packageName, setPackageName] = useState('')
  const [generatedAppKey, setGeneratedAppKey] = useState('')
  const [copyStatus, setCopyStatus] = useState('Click copy button to copy the key')

  // Edit state
  const [currentEditId, setCurrentEditId] = useState<number | null>(null)
  const [editAppName, setEditAppName] = useState('')
  const [editPackageName, setEditPackageName] = useState('')

  // Delete state
  const [deleteAppId, setDeleteAppId] = useState<number | null>(null)
  const [deleteAppName, setDeleteAppName] = useState('')

  // Fetch apps and their stats
  const fetchApps = async () => {
    try {
      setLoading(true)

      // Fetch all apps from 'apps' table
      const { data: appsData, error: appsError } = await supabase
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false })

      if (appsError) throw appsError

      if (!appsData) {
        setApps([])
        return
      }

      // Fetch stats for each app
      const appsWithStats = await Promise.all(
        appsData.map(async (app) => {
          // Count installs
          const { count: installCount } = await supabase
            .from('app_installs')
            .select('*', { count: 'exact', head: true })
            .eq('app_key', app.app_key)

          // Count opens
          const { count: openCount } = await supabase
            .from('app_opens')
            .select('*', { count: 'exact', head: true })
            .eq('app_key', app.app_key)

          return {
            ...app,
            installs: installCount || 0,
            opens: openCount || 0
          }
        })
      )

      setApps(appsWithStats)

      // Calculate totals
      const totalAppsCount = appsWithStats.length
      const totalInstallsCount = appsWithStats.reduce((sum, app) => sum + app.installs, 0)
      const totalOpensCount = appsWithStats.reduce((sum, app) => sum + app.opens, 0)

      setTotalApps(totalAppsCount)
      setTotalInstalls(totalInstallsCount)
      setTotalOpens(totalOpensCount)

    } catch (error) {
      console.error('Error fetching apps:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
  }, [])

  // Generate unique app key
  const generateAppKey = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 12)
    return `apk_${timestamp}_${random}`
  }

  // Handle register form submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!appName.trim() || !packageName.trim()) {
      alert('Please fill in all fields')
      return
    }
    setShowConfirmModal(true)
  }

  // Confirm registration
  const confirmRegistration = async () => {
    setShowConfirmModal(false)
    setShowProcessingModal(true)

    try {
      const appKey = generateAppKey()

      // Insert into 'apps' table
      const { error } = await supabase
        .from('apps')
        .insert([
          {
            app_key: appKey,
            app_name: appName,
            package_name: packageName
          }
        ])

      if (error) throw error

      // Success
      setTimeout(() => {
        setShowProcessingModal(false)
        setGeneratedAppKey(appKey)
        setShowSuccessModal(true)
        setAppName('')
        setPackageName('')
      }, 1500)

    } catch (error) {
      console.error('Error registering app:', error)
      setShowProcessingModal(false)
      alert('Failed to register app. Please try again.')
    }
  }

  // Copy app key
  const copyAppKey = () => {
    navigator.clipboard.writeText(generatedAppKey)
    setCopyStatus('✅ Copied to clipboard!')
    setTimeout(() => {
      setCopyStatus('Click copy button to copy the key')
    }, 2000)
  }

  // Close success modal and refresh
  const closeSuccessModal = () => {
    setShowSuccessModal(false)
    fetchApps()
  }

  // Show edit modal
  const handleShowEditModal = (app: AppWithStats) => {
    setCurrentEditId(app.id)
    setEditAppName(app.app_name)
    setEditPackageName(app.package_name)
    setShowEditModal(true)
  }

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentEditId) return

    try {
      const { error } = await supabase
        .from('apps')
        .update({
          app_name: editAppName,
          package_name: editPackageName
        })
        .eq('id', currentEditId)

      if (error) throw error

      setShowEditModal(false)
      fetchApps()
      alert('✅ App updated successfully!')

    } catch (error) {
      console.error('Error updating app:', error)
      alert('Failed to update app. Please try again.')
    }
  }

  // Show delete confirmation
  const handleShowDeleteModal = (app: AppWithStats) => {
    setDeleteAppId(app.id)
    setDeleteAppName(app.app_name)
    setShowDeleteModal(true)
  }

  // Delete app
  const handleDeleteApp = async () => {
    if (!deleteAppId) return

    try {
      // Get app key first
      const { data: appData } = await supabase
        .from('apps')
        .select('app_key')
        .eq('id', deleteAppId)
        .single()

      if (!appData) throw new Error('App not found')

      // Delete related installs
      await supabase
        .from('app_installs')
        .delete()
        .eq('app_key', appData.app_key)

      // Delete related opens
      await supabase
        .from('app_opens')
        .delete()
        .eq('app_key', appData.app_key)

      // Delete the app
      const { error } = await supabase
        .from('apps')
        .delete()
        .eq('id', deleteAppId)

      if (error) throw error

      setShowDeleteModal(false)
      fetchApps()
      alert('✅ App deleted successfully!')

    } catch (error) {
      console.error('Error deleting app:', error)
      alert('Failed to delete app. Please try again.')
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">APK Tracker Dashboard</h1>
              <p className="text-blue-100 mt-1">🔥 Joss Version - Track your app installs and engagement</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Apps */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Apps</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{totalApps}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Total Installs */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Installs</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{totalInstalls}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Total Opens */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Opens</p>
                </div>
                <p className="text-4xl font-bold text-gray-900 mt-2">{totalOpens}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Register New App Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-2 mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Register New App</h2>
              </div>
              
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">App Name</label>
                  <input 
                    type="text" 
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="My Awesome App"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Package Name</label>
                  <input 
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="com.example.app"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                    required
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                  Register App
                </button>
              </form>
            </div>
          </div>

          {/* Apps Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📱 Your Apps</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading apps...</p>
                </div>
              ) : apps.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                  </svg>
                  <p className="text-gray-600">No apps registered yet</p>
                  <p className="text-gray-500 text-sm mt-1">Register your first app to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">App Name</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Package</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700">Installs</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700">Opens</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps.map((app) => (
                        <tr key={app.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="py-4 px-4 font-semibold text-gray-900">{app.app_name}</td>
                          <td className="py-4 px-4 text-gray-600 font-mono text-sm">{app.package_name}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-sm">{app.installs}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold text-sm">{app.opens}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleShowEditModal(app)}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-11 h-11 rounded-xl transition-all shadow-md hover:shadow-xl flex items-center justify-center transform hover:scale-110"
                                title="Edit app"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleShowDeleteModal(app)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-11 h-11 rounded-xl transition-all shadow-md hover:shadow-xl flex items-center justify-center transform hover:scale-110"
                                title="Delete app"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* All Modals */}
      
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Registration</h3>
              <p className="text-gray-600">Are you sure you want to register this app?</p>
              <div className="bg-gray-50 rounded-xl p-4 mt-4 text-left">
                <p className="font-semibold text-gray-700">App Details:</p>
                <p className="text-gray-600 mt-1"><span className="font-medium">Name:</span> {appName}</p>
                <p className="text-gray-600"><span className="font-medium">Package:</span> <span className="font-mono text-sm">{packageName}</span></p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Cancel
              </button>
              <button 
                onClick={confirmRegistration}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 animate-spin">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Registration</h3>
              <p className="text-gray-600">Please wait while we register your app...</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">App Registered Successfully!</h3>
              <p className="text-gray-600">Save this key - you'll need it for tracking</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border-2 border-blue-300">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                Your App Key:
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={generatedAppKey}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 rounded-lg font-mono text-sm text-gray-900"
                />
                <button 
                  onClick={copyAppKey}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-all whitespace-nowrap shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                  </svg>
                  Copy Key
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-2 font-semibold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {copyStatus}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={closeSuccessModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Close
              </button>
              <button 
                onClick={closeSuccessModal}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Edit App</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl p-2 hover:bg-gray-100 rounded-full transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  App Name
                </label>
                <input 
                  type="text" 
                  value={editAppName}
                  onChange={(e) => setEditAppName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all text-gray-900"
                  required
                />
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  You can update the app name
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                  </svg>
                  Package Name
                </label>
                <input 
                  type="text" 
                  value={editPackageName}
                  onChange={(e) => setEditPackageName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                  required
                />
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  You can update the package name
                </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                  </svg>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete App?</h3>
              <p className="text-gray-600">Are you sure you want to delete</p>
              <p className="text-xl font-bold text-red-600 mt-2">{deleteAppName}</p>
            </div>
            
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2 mb-2">
                <svg className="w-5 h-5 text-red-800 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <p className="text-sm text-red-800 font-semibold">Warning:</p>
              </div>
              <p className="text-sm text-red-700 mb-2">This will permanently delete:</p>
              <ul className="text-sm text-red-700 space-y-1 ml-4">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  The app registration
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  All install records
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  All open records
                </li>
              </ul>
              <p className="text-sm text-red-800 font-semibold mt-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                This action cannot be undone!
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Cancel
              </button>
              <button 
                onClick={handleDeleteApp}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">© 2025 APK Tracker Dashboard • 🔥 Joss Version • Built with ❤️</p>
        </div>
      </footer>
    </div>
  )
}
