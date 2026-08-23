'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, Shield, AlertTriangle, User, Settings as SettingsIcon } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  details: string
  ipAddress: string
  admin: {
    name: string
    email: string
  }
  createdAt: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs')
      const data = await res.json()
      if (data.success) setLogs(data.logs)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (action: string) => {
    if (action.includes('LOGIN')) return <User className="w-4 h-4" />
    if (action.includes('SETTINGS')) return <SettingsIcon className="w-4 h-4" />
    if (action.includes('BAN')) return <AlertTriangle className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Admin Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                placeholder="Search logs..." 
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white"
              />
            </div>
            <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-start gap-3">
                <div className={`mt-1 p-1.5 rounded-full ${
                  log.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                  log.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {getIcon(log.action)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-white text-sm">{log.action}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{log.details}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>Admin: {log.admin.name}</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                </div>
              </div>
            ))}
            {logs.length === 0 && !loading && (
              <p className="text-center text-gray-500 py-8">No audit logs found</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
