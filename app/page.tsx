'use client'

import { useState, useEffect } from 'react'
import { supabase, type App, type AppInstall, type AppOpen } from '@/lib/supabase'

export default function Dashboard() {
  const [apps, setApps] = useState<App[]>([])
  const [installs, setInstalls] = useState<AppInstall[]>([])
  const [opens, setOpens] = useState<AppOpen[]>([])
  const [loading, setLoading] = useState(true)

  // New App Form
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
      alert(`App registered! App Key: ${appKey}`)
      setAppName('')
      setPackageName('')
      fetchData()
    } else {
      alert('Error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">APK Tracker Dashboard</h1>

      {/* Register New App */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Register New App</h2>
        <form onSubmit={registerApp} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">App Name</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Package Name</label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="com.example.app"
              required
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Register App
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Total Apps</h3>
          <p className="text-4xl font-bold">{apps.length}</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Total Installs</h3>
          <p className="text-4xl font-bold">{installs.length}</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Total Opens</h3>
          <p className="text-4xl font-bold">{opens.length}</p>
        </div>
      </div>

      {/* Apps List */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Registered Apps</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">App Name</th>
                <th className="p-3 text-left">Package Name</th>
                <th className="p-3 text-left">App Key</th>
                <th className="p-3 text-left">Installs</th>
                <th className="p-3 text-left">Opens</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id} className="border-b">
                  <td className="p-3">{app.app_name}</td>
                  <td className="p-3">{app.package_name}</td>
                  <td className="p-3 font-mono text-sm">{app.app_key}</td>
                  <td className="p-3">
                    {installs.filter((i) => i.app_key === app.app_key).length}
                  </td>
                  <td className="p-3">
                    {opens.filter((o) => o.app_key === app.app_key).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Installs */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Recent Installs</h2>
        <div className="space-y-2">
          {installs.slice(0, 10).map((install) => (
            <div key={install.id} className="p-3 bg-gray-50 rounded">
              <p className="font-medium">{install.package_name}</p>
              <p className="text-sm text-gray-600">
                Device: {install.device_id} | {new Date(install.installed_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
