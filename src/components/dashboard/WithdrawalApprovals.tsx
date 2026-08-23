'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

interface Withdrawal {
  id: string
  amount: number
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export function WithdrawalApprovals() {
  const [requests, setRequests] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('PENDING')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true)
    try {
        let url = '/api/admin/withdrawals'
        if (activeTab !== 'ALL') {
            url += `?status=${activeTab}`
        }
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setRequests(data.withdrawals)
        setSelectedIds(new Set()) // Clear selection on refresh
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchWithdrawals()
    // Poll for new requests every 30 seconds only if on PENDING
    if (activeTab === 'PENDING') {
        const interval = setInterval(fetchWithdrawals, 30000)
        return () => clearInterval(interval)
    }
  }, [fetchWithdrawals, activeTab])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this withdrawal?`)) return

    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (res.ok) {
        setRequests(requests.filter(req => req.id !== id))
        alert(`Withdrawal ${action}d successfully`)
      } else {
        const error = await res.json()
        alert(`Failed to ${action} withdrawal: ${error.message}`)
      }
    } catch (error) {
      console.error(`Failed to ${action} withdrawal:`, error)
      alert(`An error occurred while processing the request`)
    } finally {
      setProcessingId(null)
    }
  }

  const toggleSelect = (id: string) => {
      const newSelected = new Set(selectedIds)
      if (newSelected.has(id)) {
          newSelected.delete(id)
      } else {
          newSelected.add(id)
      }
      setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
      if (selectedIds.size === requests.length) {
          setSelectedIds(new Set())
      } else {
          setSelectedIds(new Set(requests.map(r => r.id)))
      }
  }

  const handleBulkAction = async (action: 'APPROVE' | 'REJECT') => {
      if (selectedIds.size === 0) return
      if (!confirm(`Are you sure you want to ${action} ${selectedIds.size} withdrawals?`)) return

      setBulkProcessing(true)
      try {
          const res = await fetch('/api/admin/withdrawals/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  ids: Array.from(selectedIds),
                  action
              })
          })
          const data = await res.json()
          
          if (data.success) {
              alert(`Processed: ${data.results.success} success, ${data.results.failed} failed`)
              fetchWithdrawals()
          } else {
              alert(data.error || 'Bulk action failed')
          }
      } catch (error) {
          console.error('Bulk action error:', error)
          alert('An error occurred')
      } finally {
          setBulkProcessing(false)
      }
  }

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-white flex items-center justify-between gap-4">
                <span>Manage Withdrawals</span>
                {selectedIds.size > 0 && activeTab === 'PENDING' && (
                    <div className="flex gap-2">
                         <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={bulkProcessing}
                            onClick={() => handleBulkAction('REJECT')}
                        >
                           {bulkProcessing ? <Loader className="h-4 w-4 animate-spin mr-2"/> : null}
                           Reject ({selectedIds.size})
                        </Button>
                        <Button 
                            className="bg-green-600 hover:bg-green-700" 
                            size="sm"
                            disabled={bulkProcessing}
                            onClick={() => handleBulkAction('APPROVE')}
                        >
                           {bulkProcessing ? <Loader className="h-4 w-4 animate-spin mr-2"/> : null}
                           Approve ({selectedIds.size})
                        </Button>
                    </div>
                )}
            </CardTitle>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        {loading ? (
             <div className="text-center py-8"><Loader className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : requests.length === 0 ? (
            <div className="text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-lg">
                No withdrawals found for this status.
            </div>
        ) : (
            <div className="space-y-4">
                {activeTab === 'PENDING' && (
                    <div className="flex items-center gap-2 mb-2 px-4">
                        <Checkbox 
                            checked={selectedIds.size === requests.length && requests.length > 0}
                            onCheckedChange={toggleSelectAll}
                            id="select-all"
                            className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <label htmlFor="select-all" className="text-sm text-gray-400 cursor-pointer select-none">Select All</label>
                    </div>
                )}
                
            {requests.map((req) => (
                <div key={req.id} className={`flex flex-col md:flex-row items-center justify-between p-4 bg-white/5 border ${selectedIds.has(req.id) ? 'border-primary/50 bg-primary/5' : 'border-white/10'} rounded-lg gap-4 transition-colors`}>
                    <div className="flex items-center gap-4 flex-1">
                        {activeTab === 'PENDING' && (
                             <Checkbox 
                                checked={selectedIds.has(req.id)}
                                onCheckedChange={() => toggleSelect(req.id)}
                                className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                        )}
                        
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-white text-lg">₹{req.amount.toFixed(2)}</span>
                                <Badge variant="secondary" className={`
                                    ${req.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                    ${req.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : ''}
                                    ${req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : ''}
                                `}>
                                    {req.status}
                                </Badge>
                            </div>
                            <div className="text-sm text-gray-400">
                                Requested by <span className="text-white font-medium">{req.user.name}</span> ({req.user.email})
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {format(new Date(req.createdAt), 'PPpp')}
                            </div>
                        </div>
                    </div>
                    
                    {activeTab === 'PENDING' && (
                    <div className="flex items-center gap-3 w-full md:w-auto pl-8 md:pl-0">
                        <Button 
                            variant="destructive" 
                            size="sm"
                            className="flex-1 md:flex-none gap-2"
                            disabled={processingId === req.id || bulkProcessing}
                            onClick={() => handleAction(req.id, 'reject')}
                        >
                           {processingId === req.id ? <Loader className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4" />}
                           Reject
                        </Button>
                        <Button 
                            variant="default" 
                            size="sm"
                            className="flex-1 md:flex-none gap-2 bg-green-600 hover:bg-green-700"
                            disabled={processingId === req.id || bulkProcessing}
                            onClick={() => handleAction(req.id, 'approve')}
                        >
                           {processingId === req.id ? <Loader className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4" />}
                           Approve
                        </Button>
                    </div>
                    )}
                </div>
            ))}
            </div>
        )}
      </CardContent>
    </Card>
  )
}
