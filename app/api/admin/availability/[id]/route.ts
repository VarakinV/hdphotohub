import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const { id } = await params

    const updated = await prisma.adminAvailabilityRule.update({
      where: { id },
      data: {
        dayOfWeek: body.dayOfWeek != null ? Number(body.dayOfWeek) : undefined,
        startMinutes: body.startMinutes != null ? Number(body.startMinutes) : undefined,
        endMinutes: body.endMinutes != null ? Number(body.endMinutes) : undefined,
        timeZone: body.timeZone != null ? String(body.timeZone) : undefined,
        active: typeof body.active === 'boolean' ? body.active : undefined,
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await prisma.adminAvailabilityRule.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 })
  }
}

