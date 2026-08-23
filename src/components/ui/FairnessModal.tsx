"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Copy, RefreshCw } from "lucide-react"

export function FairnessModal() {
  // Use lazy initializers to avoid the setState-in-effect anti-pattern
  const [serverSeed] = useState(
    // Hashed seed shown to user before the game so they can verify fairness afterward
    "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
  )
  const [clientSeed, setClientSeed] = useState(
    () => Math.random().toString(36).substring(7)
  )
  const [nonce, setNonce] = useState(0)


  const rotateSeed = () => {
     setClientSeed(Math.random().toString(36).substring(7))
     setNonce(0)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-400 gap-2">
           <ShieldCheck className="h-4 w-4" /> Fairness
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black/95 border-green-900/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-400">
             <ShieldCheck className="h-5 w-5" /> Provably Fair
          </DialogTitle>
          <DialogDescription className="text-gray-400">
             Verify the randomness of your games. We use a standard HMAC_SHA256 algorithm.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
             <div className="space-y-2">
                 <Label>Server Seed (Hashed)</Label>
                 <div className="flex gap-2">
                     <Input readOnly value={serverSeed} className="font-mono text-xs bg-white/5 border-white/10" />
                     <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(serverSeed)}>
                         <Copy className="h-4 w-4" />
                     </Button>
                 </div>
             </div>
             
             <div className="space-y-2">
                 <Label>Client Seed</Label>
                 <div className="flex gap-2">
                     <Input 
                        value={clientSeed} 
                        onChange={(e) => setClientSeed(e.target.value)}
                        className="font-mono bg-white/5 border-white/10" 
                     />
                     <Button size="icon" variant="outline" onClick={rotateSeed}>
                         <RefreshCw className="h-4 w-4" />
                     </Button>
                 </div>
             </div>

             <div className="space-y-2">
                 <Label>Nonce</Label>
                 <Input readOnly value={nonce} className="font-mono bg-white/5 border-white/10 w-24" />
             </div>
        </div>

        <div className="text-xs text-muted-foreground">
             <p>This pair is currently active. Changing the client seed resets the nonce.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
