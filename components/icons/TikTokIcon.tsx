import * as React from 'react';

export function TikTokIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {/* Simplified TikTok glyph */}
      <path d="M17.5 6.5c-.9-.6-1.6-1.5-1.9-2.6h-2.6v11.1c0 1.9-1.6 3.4-3.6 3.4s-3.6-1.5-3.6-3.4 1.6-3.4 3.6-3.4c.3 0 .7 0 1 .1V9.1c-.3 0-.7-.1-1-.1-3 0-5.4 2.3-5.4 5.1s2.4 5.1 5.4 5.1 5.4-2.3 5.4-5.1V9.1c1 .9 2.3 1.5 3.7 1.6V8.1c-.4 0-.7-.1-1-.2z" />
    </svg>
  );
}

export default TikTokIcon;

