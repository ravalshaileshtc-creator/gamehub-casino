'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Shield } from 'lucide-react'
// We should use a library or Web Crypto API.
// Since we are in Next.js, we can make an API route to verify, OR use a library like 'crypto-js' if available. 
// But wait, the standard usually allows client-side verification to handle trust.
// Standard Practice: Use a simple JS implementation of HMAC-SHA256.

// Let's use a simple snippet for HMAC SHA256 using Web Crypto API
async function hmacSha256(key: string, data: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const msgData = encoder.encode(data);

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
    
    // Convert buffer to hex string
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

interface FairnessResult {
    hash: string;
    calculatedResult: number | { path: number[], index: number } | { mines: number[] } | null;
}

export default function FairnessPage() {
    const [serverSeed, setServerSeed] = useState('')
    const [clientSeed, setClientSeed] = useState('')
    const [nonce, setNonce] = useState(0)
    const [game, setGame] = useState<'CRASH' | 'PLINKO' | 'MINES' | 'ROULETTE'>('CRASH')
    const [result, setResult] = useState<FairnessResult | null>(null)
    const [activeTab, setActiveTab] = useState('verify')

    const verify = async () => {
        if (!serverSeed || !clientSeed) return

        try {
            const hash = await hmacSha256(serverSeed, `${clientSeed}:${nonce}`)
            
            let calculatedResult = null
            
            if (game === 'CRASH') {
                const h = parseInt(hash.slice(0, 13), 16)
                const e = Math.pow(2, 52)
                if (h % 33 === 0) calculatedResult = 1.00
                else {
                    const r = Math.floor((100 * e - h) / (e - h)) / 100
                    calculatedResult = Math.max(1.00, r)
                }
            } else if (game === 'PLINKO') {
                const rows = 16
                const path = []
                for (let i = 0; i < rows; i++) {
                    const sub = hash.substr(i * 2, 2)
                    const val = parseInt(sub, 16)
                    path.push(val % 2)
                }
                const index = path.reduce((a, b) => a + b, 0)
                calculatedResult = { path, index }
            } else if (game === 'MINES') {
                // Mines outcome: generate a shuffled array of 25 positions
                const allPositions = Array.from({ length: 25 }, (_, i) => i)
                const shuffled = []
                let currentHash = hash
                
                // Fisher-Yates with salt for true fairness
                while (allPositions.length > 0) {
                    currentHash = await hmacSha256(serverSeed, currentHash)
                    const val = parseInt(currentHash.slice(0, 8), 16)
                    const index = val % allPositions.length
                    shuffled.push(allPositions.splice(index, 1)[0])
                }
                calculatedResult = { mines: shuffled }
            } else if (game === 'ROULETTE') {
                const val = parseInt(hash.slice(0, 8), 16)
                calculatedResult = val % 37 // 0-36
            }

            setResult({ hash, calculatedResult })
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Verification failed:", error.message);
            } else {
                console.error("Verification failed:", error);
            }
            // Assuming 'toast' is available from a UI library like shadcn/ui
            // If not, this part needs to be adapted or removed.
            // For this context, I'll assume it's available or a placeholder for error handling.
            // If 'toast' is not defined, you'd get a runtime error.
            // To make this syntactically correct without external dependencies,
            // I'll comment out the toast call and use console.error.
            /*
            toast({
                title: "Verification Failed",
                description: error instanceof Error ? error.message : "Something went wrong during verification",
                variant: "destructive",
            })
            */
        }
    }

    return (
        <div className="container mx-auto p-8 max-w-4xl space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
                    <Shield className="w-12 h-12 text-green-500" />
                    Provably Fair Verification
                </h1>
                <p className="text-gray-400">
                    Verify the fairness of every game outcome. We use HMAC-SHA256 cryptography
                    to ensure results are immutable and predetermined.
                </p>
            </div>

            <Card className="bg-black/40 border-white/10 glass-card">
                <CardHeader>
                    <div className="flex gap-4 border-b border-white/10 pb-4">
                        <Button 
                            variant={activeTab === 'verify' ? "default" : "ghost"} 
                            onClick={() => setActiveTab('verify')}
                            className={activeTab === 'verify' ? "bg-green-600 hover:bg-green-700" : "text-gray-400"}
                        >
                            Verify Result
                        </Button>
                        <Button 
                            variant={activeTab === 'info' ? "default" : "ghost"} 
                            onClick={() => setActiveTab('info')}
                            className={activeTab === 'info' ? "bg-blue-600 hover:bg-blue-700" : "text-gray-400"}
                        >
                            How it Works
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {activeTab === 'verify' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 font-bold">Game Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(['CRASH', 'PLINKO', 'MINES', 'ROULETTE'] as const).map(g => (
                                            <Button 
                                                key={g}
                                                size="sm"
                                                variant={game === g ? "default" : "outline"}
                                                onClick={() => setGame(g)}
                                                className={game === g 
                                                    ? "bg-primary border-primary" 
                                                    : "border-white/10 hover:border-white/30"}
                                            >
                                                {g.charAt(0) + g.slice(1).toLowerCase()}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Server Seed (Revealed)</label>
                                    <Input 
                                        value={serverSeed}
                                        onChange={e => setServerSeed(e.target.value)}
                                        placeholder="Enter the revealed server seed"
                                        className="bg-black/50 border-white/10 font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Client Seed</label>
                                        <Input 
                                            value={clientSeed}
                                            onChange={e => setClientSeed(e.target.value)}
                                            placeholder="Your client seed"
                                            className="bg-black/50 border-white/10 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Nonce</label>
                                        <Input 
                                            type="number"
                                            value={nonce}
                                            onChange={e => setNonce(Number(e.target.value))}
                                            className="bg-black/50 border-white/10 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={verify} className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700">
                                Verify Result
                            </Button>

                            {result && (
                                <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Final Hash (HMAC-SHA256)</label>
                                        <div className="p-3 bg-black/60 rounded-lg font-mono text-xs break-all text-yellow-500 border border-white/5">
                                            {result.hash}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Outcome</label>
                                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                            {game === 'CRASH' && typeof result.calculatedResult === 'number' && (
                                                <div className="text-3xl font-bold text-orange-500">
                                                    {(result.calculatedResult as number)}x
                                                </div>
                                            )}
                                            {game === 'PLINKO' && typeof result.calculatedResult === 'object' && result.calculatedResult !== null && 'path' in result.calculatedResult && (
                                                <div className="space-y-2">
                                                    <div className="text-2xl font-bold text-pink-500">
                                                        Bucket Index: {(result.calculatedResult as { index: number }).index}
                                                    </div>
                                                    <div className="text-xs font-mono text-gray-400 opacity-60">
                                                        Path: {(result.calculatedResult as { path: number[] }).path.join('')}
                                                    </div>
                                                </div>
                                            )}
                                            {game === 'MINES' && typeof result.calculatedResult === 'object' && result.calculatedResult !== null && 'mines' in result.calculatedResult && (
                                                <div className="grid grid-cols-5 gap-1 w-fit">
                                                    {(() => {
                                                        const mines = (result.calculatedResult as { mines: number[] }).mines;
                                                        return Array.from({ length: 25 }).map((_, i) => (
                                                            <div 
                                                                key={i}
                                                                className={`w-4 h-4 rounded-sm ${mines.includes(i) ? 'bg-red-500' : 'bg-gray-700 opacity-30'}`}
                                                                title={mines.includes(i) ? `Mine at ${i}` : 'Safe'}
                                                            />
                                                        ));
                                                    })()}
                                                </div>
                                            )}
                                            {game === 'ROULETTE' && typeof result.calculatedResult === 'number' && (
                                                <div className="text-3xl font-bold text-green-500">
                                                    Number: {(result.calculatedResult as number)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 text-gray-300">
                             <p>
                                <strong>Fairness</strong> is not just a buzzword. We use state-of-the-art cryptography 
                                to ensure that every game outcome is completely random and determined before you even 
                                place your bet.
                             </p>
                             <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white">How it works</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Server Seed:</strong> A random 32-byte string generated by our server. 
                                        Before you bet, we show you the <em>hash</em> of this seed. This guarantees we cannot change it later.
                                    </li>
                                    <li>
                                        <strong>Client Seed:</strong> A random string that you can control. 
                                        This ensures we cannot know the outcome in advance because we don&apos;t know your seed.
                                    </li>
                                    <li>
                                        <strong>Nonce:</strong> A number that increments with every bet you make. 
                                        This ensures every game gives a different result.
                                    </li>
                                </ul>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 font-mono text-sm mt-4">
                                    Result = HMAC_SHA256(ServerSeed, ClientSeed + &quot;:&quot; + Nonce)
                                </div>
                             </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
