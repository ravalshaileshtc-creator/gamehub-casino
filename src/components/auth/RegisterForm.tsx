"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import { AuthLayout } from "./AuthLayout"

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        router.push("/login")
      } else {
        const data = await response.json()
        setError(data.message || "Registration failed")
      }
    } catch {
      setError("An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
        title="Join the Elite"
        description="Create your account to start winning"
        linkText="Already have an account?"
        linkHref="/login"
        linkLabel="Sign in"
    >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300 ml-1">Full Name</Label>
                <div className="relative group">
                    <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-black/40 border-white/10 h-12 px-4 transition-all duration-300 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 focus:bg-black/60 text-white placeholder:text-gray-600 rounded-xl"
                    />
                     <div className="absolute inset-0 rounded-xl bg-secondary/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 ml-1">Email</Label>
                 <div className="relative group">
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-black/40 border-white/10 h-12 px-4 transition-all duration-300 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 focus:bg-black/60 text-white placeholder:text-gray-600 rounded-xl"
                    />
                    <div className="absolute inset-0 rounded-xl bg-secondary/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 ml-1">Password</Label>
                   <div className="relative group">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                         minLength={6}
                        className="bg-black/40 border-white/10 h-12 pl-4 pr-12 transition-all duration-300 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 focus:bg-black/60 text-white rounded-xl"
                    />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                     >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                    <div className="absolute inset-0 rounded-xl bg-secondary/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                  </div>
                  <p className="text-xs text-gray-500 ml-1">Must be at least 6 characters long</p>
              </div>
              
              {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium"
                  >
                      {error}
                  </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg shadow-lg shadow-secondary/20 hover:shadow-secondary/40 transition-all duration-300 rounded-xl mt-2" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "CREATE ACCOUNT"}
              </Button>
            </form>
    </AuthLayout>
  )
}
