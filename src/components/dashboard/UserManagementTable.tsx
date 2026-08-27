'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader, MoreHorizontal, Shield, Ban, CheckCircle, RefreshCw } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { UserDetailsModal } from './UserDetailsModal'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'

interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  mainBalance: number
  bonusBalance: number
  vipLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_SUBMITTED'
  isBanned: boolean
  createdAt: string
  lastLogin: string
  totalWagered: number
  platform?: string
}

export function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Live Firebase Firestore Real-Time Listener (`onSnapshot`)
  useEffect(() => {
    setLoading(true)
    const usersRef = collection(db, 'users')

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const liveUsers: User[] = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        const userEmail = data.email || docSnap.id.replace(/_/g, '@')
        const userName = data.name || userEmail.split('@')[0] || 'Member'
        
        liveUsers.push({
          id: docSnap.id,
          name: userName.charAt(0).toUpperCase() + userName.slice(1),
          email: userEmail,
          role: data.role === 'ADMIN' ? 'ADMIN' : 'USER',
          mainBalance: typeof data.mainBalance === 'number' ? data.mainBalance : 0.0,
          bonusBalance: typeof data.bonusBalance === 'number' ? data.bonusBalance : 0.0,
          vipLevel: data.vipLevel || 'GOLD',
          kycStatus: data.kycStatus || 'VERIFIED',
          isBanned: Boolean(data.isBanned),
          createdAt: data.createdAt || new Date().toISOString(),
          lastLogin: data.lastLoginAt || new Date().toISOString(),
          totalWagered: typeof data.totalWagered === 'number' ? data.totalWagered : 0,
          platform: data.platform || 'GameHub Android/Web'
        })
      })

      // Sort newest users first
      liveUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setUsers(liveUsers)
      setLoading(false)
    }, (error) => {
      console.warn('Firebase User Snapshot Error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleBanUser = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { isBanned: !currentStatus })
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !currentStatus } : u))
    } catch (error) {
      console.error('Failed to update ban status:', error)
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card className="bg-[#111319] border border-[#ffd700]/30 backdrop-blur shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
            👑 Registered Accounts ({filteredUsers.length})
          </CardTitle>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-400 font-mono font-semibold">REAL-TIME SYNC</span>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search email or name..." 
            className="pl-9 bg-black/50 border-white/10 text-white rounded-xl focus:border-[#ffd700]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-gray-400">
            <Loader className="h-8 w-8 animate-spin text-[#ffd700]" />
            <p className="text-xs font-mono">Listening for live registered accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 space-y-2">
            <p className="text-sm font-semibold">No registered accounts found.</p>
            <p className="text-xs text-gray-500">Users will appear here instantly when they sign up or log in.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-bold uppercase text-[11px]">User</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase text-[11px]">Balance</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase text-[11px]">VIP Level</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase text-[11px]">KYC</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase text-[11px]">Status</TableHead>
                  <TableHead className="text-right text-gray-400 font-bold uppercase text-[11px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-white text-sm">{user.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{user.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col font-mono">
                        <span className="text-emerald-400 font-bold text-sm">₹{user.mainBalance.toFixed(2)}</span>
                        <span className="text-[10px] text-purple-400">Bonus: ₹{user.bonusBalance.toFixed(2)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="border-amber-500/50 text-amber-400 font-black text-[10px] bg-amber-500/10">
                        🏆 {user.vipLevel}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant={user.kycStatus === 'VERIFIED' ? 'default' : 'secondary'} 
                             className={user.kycStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400'}>
                        {user.kycStatus}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {user.isBanned ? (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-400 border border-red-500/30">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 font-bold">Active</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-white/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#121622] border-white/10 text-white">
                          <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedUser(user)} className="cursor-pointer hover:bg-white/10 text-xs">
                            <Shield className="mr-2 h-4 w-4 text-emerald-400" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem 
                            onClick={() => handleBanUser(user.id, user.isBanned)}
                            className={`cursor-pointer hover:bg-white/10 text-xs ${user.isBanned ? 'text-emerald-400' : 'text-red-400'}`}
                          >
                            {user.isBanned ? (
                              <><CheckCircle className="mr-2 h-4 w-4" /> Unban Account</>
                            ) : (
                              <><Ban className="mr-2 h-4 w-4" /> Ban Account</>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          isOpen={!!selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </Card>
  )
}
