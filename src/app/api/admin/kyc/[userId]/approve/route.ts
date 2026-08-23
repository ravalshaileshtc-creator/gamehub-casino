import { NextRequest, NextResponse } from 'next/server'

export async function generateStaticParams() {
  return []
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true })
}
