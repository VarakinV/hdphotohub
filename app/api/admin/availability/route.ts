import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rules = await prisma.adminAvailabilityRule.findMany({
      where: { adminId: session.user.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinutes: 'asc' }],
    })
    return NextResponse.json({ rules })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to load availability' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const rule = await prisma.adminAvailabilityRule.create({
      data: {
        adminId: session.user.id,
        dayOfWeek: Number(body.dayOfWeek),
        startMinutes: Number(body.startMinutes),
        endMinutes: Number(body.endMinutes),
        timeZone: String(body.timeZone || 'UTC'),
        active: body.active === false ? false : true,
      },
    })
    return NextResponse.json(rule)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }
}

