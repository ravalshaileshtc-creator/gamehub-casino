'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Search, Loader, MoreHorizontal, Shield, Ban, CheckCircle } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { UserDetailsModal } from './UserDetailsModal'

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
}

export function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [page] = useState(1)


  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?limit=20&page=${page}&search=${search}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 500)
    return () => clearTimeout(debounce)
  }, [fetchUsers])

  const handleBanUser = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return

    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !currentStatus })
      })
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !currentStatus } : u))
      }
    } catch (error) {
      console.error('Failed to update ban status:', error)
    }
  }

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">User Management</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search users..." 
            className="pl-8 bg-black/50 border-white/10 text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Balance</TableHead>
                  <TableHead className="text-gray-400">VIP</TableHead>
                  <TableHead className="text-gray-400">KYC</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-green-400">₹{user.mainBalance.toFixed(2)}</span>
                        <span className="text-xs text-purple-400">Bonus: ₹{user.bonusBalance.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                        {user.vipLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.kycStatus === 'VERIFIED' ? 'default' : 'secondary'} 
                             className={user.kycStatus === 'VERIFIED' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {user.kycStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isBanned ? (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-400">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500/50 text-green-500">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedUser(user)} className="cursor-pointer hover:bg-white/10">
                            <Shield className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem 
                            onClick={() => handleBanUser(user.id, user.isBanned)}
                            className={`cursor-pointer hover:bg-white/10 ${user.isBanned ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {user.isBanned ? (
                              <><CheckCircle className="mr-2 h-4 w-4" /> Unban User</>
                            ) : (
                              <><Ban className="mr-2 h-4 w-4" /> Ban User</>
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
