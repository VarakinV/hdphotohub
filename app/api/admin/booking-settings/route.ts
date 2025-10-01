import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = await prisma.adminBookingSettings.findUnique({
      where: { adminId: session.user.id },
    })

    // Return defaults if not set yet
    return NextResponse.json(
      settings ?? {
        adminId: session.user.id,
        timeZone: 'UTC',
        leadTimeMin: 0,
        maxAdvanceDays: 60,
        defaultBufferMin: 0,
      }
    )
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const timeZone = String(body.timeZone || 'UTC')
    const leadTimeMin = Number(body.leadTimeMin ?? 0)
    const maxAdvanceDays = Number(body.maxAdvanceDays ?? 60)
    const defaultBufferMin = Number(body.defaultBufferMin ?? 0)

    const saved = await prisma.adminBookingSettings.upsert({
      where: { adminId: session.user.id },
      update: { timeZone, leadTimeMin, maxAdvanceDays, defaultBufferMin },
      create: {
        adminId: session.user.id,
        timeZone,
        leadTimeMin,
        maxAdvanceDays,
        defaultBufferMin,
      },
    })

    return NextResponse.json(saved)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

