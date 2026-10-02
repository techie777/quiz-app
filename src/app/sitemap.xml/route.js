import { prisma } from '@/lib/prisma';
import { getDb } from '@/lib/mongoDb';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quizweb.in';
  
  try {
    const db = await getDb();

    // 1. Get all taxonomy topics with >= 15 questions
    const topics = await db.collection('TaxonomyTopic')
      .find({ questionCount: { $gte: 15 } }, { projection: { slug: 1, updatedAt: 1 } })
      .toArray();

    // 2. Get all exams with sets
    const examSets = await db.collection('QuizSet').distinct('examSlug', {
      examSlug: { $ne: null }
    });

    // 3. Get all states with sets
    const stateSets = await db.collection('QuizSet').distinct('stateSlug', {
      stateSlug: { $ne: null }
    });

    // 4. Get categories for sitemap
    const categories = await prisma.category.findMany({
      where: { hidden: false },
      select: { id: true, updatedAt: true }
    });
    
    // 5. Get quizzes for sitemap
    const quizzes = await prisma.question.findMany({
      select: { id: true, updatedAt: true },
      distinct: ['categoryId']
    });
    
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/gk', priority: '1.0', changefreq: 'daily' },
      { url: '/arena', priority: '0.9', changefreq: 'daily' },
      { url: '/daily-current-affairs', priority: '0.9', changefreq: 'daily' },
      { url: '/current-affairs', priority: '0.9', changefreq: 'daily' },
      { url: '/fun-facts', priority: '0.8', changefreq: 'daily' },
      { url: '/true-false', priority: '0.8', changefreq: 'daily' },
      { url: '/pro', priority: '0.8', changefreq: 'weekly' },
      { url: '/support', priority: '0.6', changefreq: 'monthly' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
      { url: '/copyright', priority: '0.5', changefreq: 'yearly' },
      { url: '/profile', priority: '0.7', changefreq: 'weekly' },
      { url: '/govt-exams', priority: '0.8', changefreq: 'weekly' },
      { url: '/govt-jobs-alerts', priority: '0.8', changefreq: 'daily' },
      { url: '/my-favourites', priority: '0.7', changefreq: 'weekly' },
      { url: '/previous-years-papers', priority: '0.7', changefreq: 'monthly' },
      { url: '/donate', priority: '0.6', changefreq: 'monthly' },
    ];

    const now = new Date().toISOString();
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
${topics.map(t => `
  <url>
    <loc>${baseUrl}/hub/topic/${t.slug}</loc>
    <lastmod>${(t.updatedAt ? new Date(t.updatedAt) : new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')}
${examSets.map(slug => `
  <url>
    <loc>${baseUrl}/hub/exam/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')}
${stateSets.map(slug => `
  <url>
    <loc>${baseUrl}/hub/state/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
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
    console.error('Sitemap generation error:', error);
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
