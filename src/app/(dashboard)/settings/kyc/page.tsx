
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import KycForm from "@/components/user/KycForm"

export default async function KycPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycStatus: true, kycRejectionReason: true, kycDocument: true }
  })

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Verification</h1>
      <KycForm 
         currentStatus={user.kycStatus}
         rejectionReason={user.kycRejectionReason}
         currentDocument={user.kycDocument}
      />
    </div>
  )
}
