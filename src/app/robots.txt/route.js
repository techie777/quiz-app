export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const robotsTxt = `User-agent: *
Allow: /
Allow: /category/*
Allow: /quiz/*
Allow: /daily-current-affairs
Allow: /current-affairs
Allow: /daily/*
Allow: /govt-exams/*
Allow: /govt-jobs-alerts
Allow: /notes
Allow: /previous-years-papers
Allow: /about
Allow: /privacy
Allow: /copyright

# Block admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /profile
Disallow: /upload
Disallow: /_next/
Disallow: /static/

# Block temporary and development files
Disallow: /temp/
Disallow: /test/
Disallow: /*.json$
Disallow: /*?*$
Disallow: /*.pdf$

# Allow specific query parameters for filtering
Allow: /daily-current-affairs?date=*
Allow: /daily-current-affairs?month=*
Allow: /daily-current-affairs?category=*
Allow: /category/*?difficulty=*
Allow: /category/*?page=*

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1

# Additional rules for specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
