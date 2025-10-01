import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const items = await prisma.blackoutDate.findMany({
      where: { adminId: session.user.id },
      orderBy: [{ start: 'asc' }],
    })
    return NextResponse.json({ items })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to load blackouts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const item = await prisma.blackoutDate.create({
      data: {
        adminId: session.user.id,
        start: new Date(String(body.start)),
        end: new Date(String(body.end)),
        reason: body.reason ? String(body.reason) : null,
      },
    })
    return NextResponse.json(item)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create blackout' }, { status: 500 })
  }
}

