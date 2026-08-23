
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { User, Wallet, History, ShieldAlert, Edit2, Save, X, Loader, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_SUBMITTED'
  mainBalance: number
  bonusBalance: number
  vipLevel: string
  createdAt: string
  totalWagered: number
}

interface UserDetailsModalProps {
  user: AdminUser 
  isOpen: boolean
  onClose: () => void
}

export function UserDetailsModal({ user: initialUser, isOpen, onClose }: UserDetailsModalProps) {
  const [user, setUser] = useState(initialUser)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<AdminUser>({ ...initialUser })
  
  // Manage Funds State
  const [isManagingFunds, setIsManagingFunds] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [fundType, setFundType] = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [fundReason, setFundReason] = useState('')
  const [fundLoading, setFundLoading] = useState(false)

  if (!user) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const submissionData = {
        ...formData,
        // Remove balances from update payload to prevent overwrite
        mainBalance: undefined,
        bonusBalance: undefined
      }

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      })
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
        setIsEditing(false)
      } else {
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
       console.error('Update failed:', error)
       alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFundAdjustment = async () => {
      if (!fundAmount || !fundReason) {
          alert('Please fill in all fields')
          return
      }
      
      setFundLoading(true)
      try {
          const res = await fetch(`/api/admin/users/${user.id}/balance`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  amount: fundAmount,
                  type: fundType,
                  reason: fundReason
              })
          })
          const data = await res.json()
          
          if (data.success) {
              alert('Funds adjusted successfully')
              // Close sub-modal and reset form
              setIsManagingFunds(false)
              setFundAmount('')
              setFundReason('')
              onClose() 
          } else {
              alert(data.error || 'Failed to adjust funds')
          }
      } catch (error) {
          console.error('Fund adjustment failed:', error)
          alert('An error occurred')
      } finally {
          setFundLoading(false)
      }
  }

  const handleCancel = () => {
    setFormData({ ...user })
    setIsEditing(false)
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={() => !isEditing && onClose()}>
      <DialogContent className="max-w-3xl bg-black/95 border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                {isEditing ? 'Edit User' : user.name}
            </DialogTitle>
            <div className="flex gap-2">
                {!isEditing && (
                    <>
                    <Button variant="outline" size="sm" onClick={() => setIsManagingFunds(true)} className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Manage Funds
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Details
                    </Button>
                    </>
                )}
                {isEditing && (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={loading}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>
          </div>
          <DialogDescription className="text-gray-400">
            User ID: {user.id} • Joined {format(new Date(user.createdAt), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="security">Security & Risk</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Label className="text-gray-400">Name</Label>
                  {isEditing ? (
                      <Input name="name" value={formData.name} onChange={handleInputChange} className="bg-black/40 border-white/20" />
                  ) : (
                      <p className="font-medium text-white">{user.name}</p>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Label className="text-gray-400">Email</Label>
                   {isEditing ? (
                      <Input name="email" value={formData.email} onChange={handleInputChange} className="bg-black/40 border-white/20" />
                  ) : (
                      <p className="font-mono text-sm">{user.email}</p>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Label className="text-gray-400">Role</Label>
                  {isEditing ? (
                       <select name="role" value={formData.role} onChange={handleInputChange} className="bg-black/40 border-white/20 rounded-md p-2 text-sm w-full text-white">
                           <option value="USER">USER</option>
                           <option value="ADMIN">ADMIN</option>
                       </select>
                  ) : (
                      <Badge variant="outline" className="w-fit">{user.role}</Badge>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex flex-col gap-2">
                   <Label className="text-gray-400">KYC Status</Label>
                   {isEditing ? (
                       <select name="kycStatus" value={formData.kycStatus} onChange={handleInputChange} className="bg-black/40 border-white/20 rounded-md p-2 text-sm w-full text-white">
                           <option value="PENDING">PENDING</option>
                           <option value="VERIFIED">VERIFIED</option>
                           <option value="REJECTED">REJECTED</option>
                           <option value="NOT_SUBMITTED">NOT SUBMITTED</option>
                       </select>
                   ) : (
                      <Badge variant={user.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}>{user.kycStatus}</Badge>
                   )}
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Label className="text-gray-400">Main Balance</Label>
                  <div className="flex items-end gap-2 text-green-400">
                    <Wallet className="h-5 w-5" />
                    <span className="text-xl font-bold">₹{user.mainBalance.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Label className="text-gray-400">Bonus Balance</Label>
                  <div className="flex items-end gap-2 text-purple-400">
                    <ShieldAlert className="h-5 w-5" />
                    <span className="text-xl font-bold">₹{user.bonusBalance.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Label className="text-gray-400">VIP Level</Label>
                   {isEditing ? (
                       <select name="vipLevel" value={formData.vipLevel} onChange={handleInputChange} className="bg-black/40 border-white/20 rounded-md p-2 text-sm w-full text-white">
                           <option value="BRONZE">BRONZE</option>
                           <option value="SILVER">SILVER</option>
                           <option value="GOLD">GOLD</option>
                           <option value="PLATINUM">PLATINUM</option>
                           <option value="DIAMOND">DIAMOND</option>
                       </select>
                   ) : (
                      <span className="text-xl font-bold text-yellow-400">{user.vipLevel}</span>
                   )}
                </CardContent>
              </Card>
            </div>
            
             <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-sm text-blue-300 mb-1">Total Wagered</p>
                    <p className="text-lg font-bold text-blue-400">₹{user.totalWagered?.toFixed(2) || '0.00'}</p>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-white/5 border-white/10 h-[300px]">
              <CardContent className="p-0 flex items-center justify-center h-full text-gray-500">
                  <History className="h-4 w-4 mr-2" />
                  Transaction history will be loaded here via API
              </CardContent>
            </Card>
          </TabsContent>
          
           <TabsContent value="security">
            <Card className="bg-red-500/5 border-red-500/20 h-[200px]">
              <CardContent className="p-6">
                 <h4 className="text-red-400 font-bold mb-4">Risk Actions</h4>
                 <div className="flex gap-4">
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors">
                        Freeze Account
                    </button>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Manage Funds Modal */}
    <Dialog open={isManagingFunds} onOpenChange={setIsManagingFunds}>
        <DialogContent className="max-w-md bg-black/95 border-white/10 text-white border-yellow-500/20">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-yellow-400">
                    <DollarSign className="w-5 h-5" />
                    Manage User Funds
                </DialogTitle>
                <DialogDescription>
                    Manually adjust balance for {user.name}. This action will be logged.
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div 
                        onClick={() => setFundType('CREDIT')}
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col items-center gap-2 ${
                            fundType === 'CREDIT' 
                            ? 'bg-green-500/20 border-green-500 text-green-400' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                        }`}
                    >
                        <ArrowUpRight className="w-6 h-6" />
                        <span className="font-bold">Credit (Add)</span>
                    </div>
                    <div 
                         onClick={() => setFundType('DEBIT')}
                         className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col items-center gap-2 ${
                            fundType === 'DEBIT' 
                            ? 'bg-red-500/20 border-red-500 text-red-400' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                        }`}
                    >
                        <ArrowDownLeft className="w-6 h-6" />
                        <span className="font-bold">Debit (Deduct)</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input 
                        type="number" 
                        value={fundAmount} 
                        onChange={(e) => setFundAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-black/50 border-white/20 text-lg font-bold"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Reason (Required for Audit)</Label>
                    <Textarea 
                        value={fundReason} 
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFundReason(e.target.value)}
                        placeholder="e.g. Compensation for glitch, Bonus award, Correction..."
                        className="bg-black/50 border-white/20 h-24"
                    />
                </div>
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsManagingFunds(false)} disabled={fundLoading}>Cancel</Button>
                <Button 
                    onClick={handleFundAdjustment} 
                    disabled={fundLoading || !fundReason || !fundAmount}
                    className={fundType === 'CREDIT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                    {fundLoading ? <Loader className="w-4 h-4 animate-spin" /> : (
                        fundType === 'CREDIT' ? 'Add Funds' : 'Deduct Funds'
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  )
}
