import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { J2VProvider } from '@/lib/video/j2v-provider';

export const dynamic = 'force-dynamic';

function mapStatus(s?: string): 'QUEUED' | 'RENDERING' | 'COMPLETE' | 'FAILED' {
  const v = (s || '').toLowerCase();
  if (v.includes('error') || v.includes('fail')) return 'FAILED';
  if (v.includes('done') || v.includes('success') || v.includes('complete')) return 'COMPLETE';
  if (v.includes('running') || v.includes('render')) return 'RENDERING';
  return 'QUEUED';
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let lead = await prisma.freeSlideshowLead.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        slideshows: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If webhook cannot reach dev, proactively sync any in-progress slideshows
    const inProgress = (lead.slideshows || []).filter((r) => r.status === 'QUEUED' || r.status === 'RENDERING');
    if (inProgress.length > 0) {
      const provider = new J2VProvider();
      await Promise.all(
        inProgress.map(async (r) => {
          try {
            const st = await provider.getStatus(r.renderId);
            const status = st.status ? mapStatus(st.status) : r.status;
            const data: any = { status };
            if (st.url) data.url = st.url;
            if (st.width) data.width = st.width as number;
            if (st.height) data.height = st.height as number;
            if (status === 'FAILED') data.error = 'Render failed';
            await prisma.freeSlideshow.update({ where: { id: r.id }, data });
          } catch (e) {
            // ignore single slideshow sync failures
          }
        })
      );

      // If all slideshows are no longer in progress, mark lead complete
      const remaining = await prisma.freeSlideshow.count({ where: { leadId: id, status: { in: ['QUEUED', 'RENDERING'] } } });
      if (remaining === 0) {
        await prisma.freeSlideshowLead.update({ where: { id }, data: { status: 'COMPLETE' } });
      }

      // Re-fetch with updated values
      lead = await prisma.freeSlideshowLead.findUnique({
        where: { id },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          slideshows: { orderBy: { createdAt: 'asc' } },
        },
      });
    }

    return NextResponse.json({ lead });
  } catch (e) {
    console.error('free-slideshow GET failed', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

