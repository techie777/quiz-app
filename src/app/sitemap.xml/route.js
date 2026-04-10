import { prisma } from '@/lib/prisma';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    // Get all categories for sitemap
    const categories = await prisma.category.findMany({
      where: { hidden: false },
      select: { id: true, updatedAt: true }
    });
    
    // Get all quizzes for sitemap
    const quizzes = await prisma.question.findMany({
      select: { id: true, updatedAt: true },
      distinct: ['categoryId']
    });
    
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
      { url: '/copyright', priority: '0.5', changefreq: 'yearly' },
      { url: '/profile', priority: '0.7', changefreq: 'weekly' },
      { url: '/daily-current-affairs', priority: '0.9', changefreq: 'daily' },
      { url: '/current-affairs', priority: '0.9', changefreq: 'daily' },
      { url: '/daily', priority: '0.9', changefreq: 'daily' },
      { url: '/govt-exams', priority: '0.8', changefreq: 'weekly' },
      { url: '/govt-exams/upsc', priority: '0.8', changefreq: 'weekly' },
      { url: '/govt-exams/ssc', priority: '0.8', changefreq: 'weekly' },
      { url: '/govt-exams/rrb', priority: '0.8', changefreq: 'weekly' },
      { url: '/govt-exams/ibp', priority: '0.8', changefreq: 'weekly' },
      { url: '/govt-jobs-alerts', priority: '0.8', changefreq: 'daily' },
      { url: '/my-favourites', priority: '0.7', changefreq: 'weekly' },
      { url: '/previous-years-papers', priority: '0.7', changefreq: 'monthly' },
    ];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
${categories.map(category => `
  <url>
    <loc>${baseUrl}/category/${category.id}</loc>
    <lastmod>${category.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
${quizzes.map(quiz => `
  <url>
    <loc>${baseUrl}/quiz/${quiz.id}</loc>
    <lastmod>${quiz.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    // Fallback sitemap if database is unavailable
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

    return new Response(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }
}
