'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PageHead } from '@/components/admin/ui/page-head';

const reviews = [
  {
    label: 'Google',
    url: 'https://g.page/r/CfdYTRLO_KYdEAE/review',
    logo: 'https://wwd-videos.s3.ca-central-1.amazonaws.com/Google-Review-Logo.png',
  },
  {
    label: 'Facebook',
    url: 'https://www.facebook.com/photos4re/reviews',
    logo: 'https://wwd-videos.s3.ca-central-1.amazonaws.com/Facebook-Reviews-Logo.png',
  },
  {
    label: 'Yelp',
    url: 'https://www.yelp.com/biz/photos-4-real-estate-calgary',
    logo: 'https://wwd-videos.s3.ca-central-1.amazonaws.com/yelp_logo.svg',
  },
] as const;

export default function PortalReviewPage() {
  return (
    <div className="w-full space-y-6">
      <PageHead
        title="Write a Review"
        subtitle="We appreciate your reviews!"
        actions={
          <Button asChild className="gap-2">
            <Link href="https://photos4realestate.ca/book-online/" target="_blank">
              + Book Online
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Leave a review</CardTitle>
          <CardDescription>Select a platform below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Thank you for supporting Photos 4 Real Estate. Your feedback
              helps other clients discover us.
            </p>
            <p className="text-sm text-muted-foreground">
              Please consider leaving a 5‑star review. Every submitted review
              earns <strong>3,500 points</strong> as a thank‑you.
            </p>
            <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-3">
              {reviews.map((r) => (
                <a
                  key={r.label}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex flex-col items-center"
                  aria-label={`Open ${r.label} reviews`}
                >
                  <img
                    src={r.logo}
                    alt={`${r.label} reviews`}
                    className="h-12 w-auto transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
