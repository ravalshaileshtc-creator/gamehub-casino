
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, CheckCircle, Clock, XCircle, FileText } from "lucide-react"

interface KycFormProps {
  currentStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null
  currentDocument?: string | null
}

export default function KycForm({ currentStatus, rejectionReason, currentDocument }: KycFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('document', file)

    try {
      const res = await fetch('/api/user/kyc', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)

      toast({
        title: "Upload Successful",
        description: "Your document is under review.",
      })
      
      // Ideally refresh page or updating state from parent
      window.location.reload()

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'APPROVED') {
    return (
      <Card className="bg-green-500/10 border-green-500/20">
        <CardHeader>
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle className="h-6 w-6" />
            <span className="font-bold">Verified</span>
          </div>
          <CardTitle>KYC Verified</CardTitle>
          <CardDescription>Your account is fully verified. You have access to all features.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification (KYC)</CardTitle>
        <CardDescription>
          Please upload a valid government ID (Passport, Driving License, or National ID) to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {currentStatus === 'PENDING' && (
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500">
            <Clock className="h-5 w-5" />
            <div>
              <p className="font-medium">Verification Pending</p>
              <p className="text-sm opacity-90">Our team is reviewing your document. This usually takes 24 hours.</p>
            </div>
          </div>
        )}

        {currentStatus === 'REJECTED' && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            <XCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Verification Rejected</p>
              <p className="text-sm opacity-90">{rejectionReason || "Please upload a clearer image of your ID."}</p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="document">Document Image (JPG, PNG, PDF)</Label>
            <Input 
              id="document" 
              type="file" 
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading || currentStatus === 'PENDING'}
            />
          </div>

          <Button 
            type="submit" 
            disabled={!file || loading || currentStatus === 'PENDING'}
            className="w-full sm:w-auto"
          >
            {loading ? (
               <>Uploading...</> 
            ) : (
               <><Upload className="mr-2 h-4 w-4" /> Submit Document</>
            )}
          </Button>
        </form>

        {currentDocument && currentStatus === 'PENDING' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <FileText className="h-4 w-4" />
                <span>Submitted Document: <a href={currentDocument} target="_blank" className="underline hover:text-primary">View</a></span>
            </div>
        )}

      </CardContent>
    </Card>
  )
}
