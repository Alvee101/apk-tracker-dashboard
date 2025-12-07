'use client'

import { useState, useEffect } from 'react'
import { supabase, type App, type AppInstall, type AppOpen } from '@/lib/supabase'

export default function Dashboard() {
  const [apps, setApps] = useState<App[]>([])
  const [installs, setInstalls] = useState<AppInstall[]>([])
  const [opens, setOpens] = useState<AppOpen[]>([])
  const [loading, setLoading] = useState(true)

  const [appName, setAppName] = useState('')
  const [packageName, setPackageName] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    const { data: appsData } = await supabase
      .from('apps')
      .select('*')
      .order('created_at', { ascending: false })
    
    const { data: installsData } = await supabase
      .from('app_installs')
      .select('*')
      .order('installed_at', { ascending: false })
    
    const { data: opensData } = await supabase
      .from('app_opens')
      .select('*')
      .order('opened_at', { ascending: false })

    if (appsData) setApps(appsData)
    if (installsData) setInstalls(installsData)
    if (opensData) setOpens(opensData)
    
    setLoading(false)
  }

  async function registerApp(e: React.FormEvent) {
    e.preventDefault()
    
    const appKey = `apk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { error } = await supabase
      .from('apps')
      .insert([{ 
        app_key: appKey,
        app_name: appName,
        package_name: packageName 
      }])

    if (!error) {
      alert(`✅ App registered successfully!\n\n🔑 App Key: ${appKey}\n\nSave this key!`)
      setAppName('')
      setPackageName('')
      fetchData()
    } else {
      alert('❌ Error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-xl font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">APK Tracker Dashboard</h1>
              <p className="text-blue-100 mt-1">Track your app installs and engagement in real-time</p>
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
                <p className="text-4xl font-bold text-gray-900 mt-2">{apps.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
            <div className="flex items-center text-blue-600 text-sm font-semibold">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              Registered apps
            </div>
          </div>

          {/* Total Installs */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Installs</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{installs.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </div>
            </div>
            <div className="flex items-center text-green-600 text-sm font-semibold">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              Total downloads
            </div>
          </div>

          {/* Total Opens */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Opens</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{opens.length}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 12C3.8 7.5 7.5 5 12 5s8.2 2.5 9.5 7c-1.3 4.5-5 7-9.5 7s-8.2-2.5-9.5-7z"/>
                </svg>
              </div>
            </div>
            <div className="flex items-center text-purple-600 text-sm font-semibold">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              App engagements
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Register New App Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-2 mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Register New App</h2>
              </div>
              
              <form onSubmit={registerApp} className="space-y-4">
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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  🚀 Register App
                </button>
              </form>
            </div>
          </div>

          {/* Apps Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📱 Your Apps</h2>
              
              {apps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-gray-500 text-lg">No apps registered yet. Register your first app!</p>
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
                      </tr>
                    </thead>
                    <tbody>
                      {apps.map((app) => (
                        <tr key={app.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="py-4 px-4 font-semibold text-gray-900">{app.app_name}</td>
                          <td className="py-4 px-4 text-gray-600 font-mono text-sm">{app.package_name}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-sm">
                              {installs.filter(i => i.app_key === app.app_key).length}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold text-sm">
                              {opens.filter(o => o.app_key === app.app_key).length}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Recent Activity</h2>
              
              {installs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📥</div>
                  <p className="text-gray-500 text-lg">No activity yet. Waiting for installs!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {installs.slice(0, 5).map((install) => (
                    <div key={install.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-500 rounded-full p-2">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">New Install: {install.package_name}</p>
                          <p className="text-sm text-gray-600">
                            Device: {install.device_id.substring(0, 20)}...  • {new Date(install.installed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">© 2025 APK Tracker Dashboard • Built with ❤️ using Next.js & Supabase</p>
        </div>
      </footer>

    </div>
  )
}
