"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { AuthLayout } from "./AuthLayout"

import { db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const syncUserToFirebase = (userEmail: string) => {
    try {
      const docId = userEmail.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, "_")
      const userRef = doc(db, "users", docId)
      Promise.race([
        setDoc(userRef, {
          email: userEmail,
          lastLoginAt: new Date().toISOString(),
          platform: "GameHub Android/Web APK",
          status: "ACTIVE",
          role: "PLAYER"
        }, { merge: true }),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]).catch(() => {})
    } catch (err) {
      console.warn("Firebase Firestore Sync Note:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      syncUserToFirebase(email)

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        if (typeof window !== 'undefined') {
          const formattedName = email.split('@')[0]
          localStorage.setItem('user_email', email)
          localStorage.setItem('user_name', formattedName.charAt(0).toUpperCase() + formattedName.slice(1))
          document.cookie = "auth_session=true; path=/; max-age=864000"
        }
        router.push("/dashboard")
      }
    } catch {
      setError("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsLoading(true)
    setError("")
    const demoEmail = "demo@gambling.com"
    setEmail(demoEmail)
    setPassword("Demo123!")

    try {
      await syncUserToFirebase(demoEmail)

      const result = await signIn("credentials", {
        redirect: false,
        email: demoEmail,
        password: "Demo123!",
      })

      if (result?.error) {
        setError("Demo login failed")
      } else {
        window.location.href = "/dashboard"
      }
    } catch {
      setError("An error occurred during demo login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      description="Enter your credentials to access your empire"
      linkText="Don't have an account?"
      linkHref="/register"
      linkLabel="Sign up"
    >

      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="bg-black/40 border-white/10 h-12 px-4 transition-all duration-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:bg-black/60 text-white placeholder:text-gray-600 rounded-xl"
            />
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-gray-300 ml-1">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/40 border-white/10 h-12 pl-4 pr-12 transition-all duration-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:bg-black/60 text-white rounded-xl"
            />
            <button
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
               {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
          </div>
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
          className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 rounded-xl" 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "SIGN IN"}
        </Button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#141420] px-4 text-gray-500 font-medium tracking-widest">Or continue with</span>
        </div>
      </div>

      <Button 
        variant="outline" 
        type="button" 
        className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300 rounded-xl relative overflow-hidden group"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <svg className="mr-2 h-5 w-5 relative z-10" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
          <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
        </svg>
        <span className="relative z-10">Google</span>
      </Button>
    </AuthLayout>
  )
}
