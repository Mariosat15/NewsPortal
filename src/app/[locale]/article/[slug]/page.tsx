import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Paywall } from '@/components/article/paywall';
import { ShareButtons } from '@/components/article/share-buttons';
import { Badge } from '@/components/ui/badge';
import { getArticleRepository, getUnlockRepository } from '@/lib/db';
import { getBrandId, getServerBrandConfig } from '@/lib/brand';
import { formatDate } from '@/lib/utils';
import { cookies } from 'next/headers';
import Image from 'next/image';

// Sample article for demo
const sampleArticle: {
  _id: string;
  slug: string;
  title: string;
  teaser: string;
  content: string;
  thumbnail: string;
  category: string;
  tags: string[];
  publishDate: Date;
  language: 'de' | 'en';
  viewCount: number;
  isUnlocked: boolean;
} = {
  _id: 'demo-id',
  slug: 'example-article-1',
  title: 'Die neuesten Entwicklungen in der Technologiebranche',
  teaser: 'Erfahren Sie mehr über die bahnbrechenden Innovationen, die unsere digitale Zukunft prägen werden. Von künstlicher Intelligenz bis hin zu Quantencomputing.',
  content: `
    <p>Die Technologiebranche steht vor einem Wendepunkt. Mit dem rasanten Fortschritt in der künstlichen Intelligenz und dem aufkommenden Quantencomputing erleben wir eine Revolution, die alle Aspekte unseres Lebens verändern wird.</p>
    
    <h2>Künstliche Intelligenz: Der neue Standard</h2>
    <p>KI-Systeme sind heute in der Lage, komplexe Aufgaben zu bewältigen, die noch vor wenigen Jahren als unmöglich galten. Von der medizinischen Diagnose bis zur Finanzanalyse – die Anwendungsmöglichkeiten sind nahezu unbegrenzt.</p>
    
    <h2>Quantencomputing: Die nächste Grenze</h2>
    <p>Während klassische Computer an ihre physikalischen Grenzen stoßen, eröffnen Quantencomputer völlig neue Möglichkeiten. Forscher arbeiten daran, diese Technologie aus dem Labor in praktische Anwendungen zu überführen.</p>
    
    <h2>Was bedeutet das für Sie?</h2>
    <p>Diese Entwicklungen werden nicht nur die Wirtschaft, sondern auch den Alltag jedes Einzelnen beeinflussen. Es ist wichtiger denn je, informiert zu bleiben und die Chancen zu nutzen, die sich bieten.</p>
    
    <p>Bleiben Sie mit uns auf dem Laufenden über die neuesten Trends und Entwicklungen in der Technologiewelt.</p>
  `,
  thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop',
  category: 'technology',
  tags: ['KI', 'Technologie', 'Innovation', 'Quantencomputing'],
  publishDate: new Date(),
  language: 'de',
  viewCount: 1247,
  isUnlocked: false,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const brand = await getServerBrandConfig();
  
  // Try to fetch real article
  let article = sampleArticle;
  try {
    const brandId = await getBrandId();
    const repo = getArticleRepository(brandId);
    const found = await repo.findBySlug(slug);
    if (found) {
      article = {
        ...sampleArticle,
        _id: found._id?.toString() || 'demo-id',
        slug: found.slug,
        title: found.title,
        teaser: found.teaser,
        content: found.content,
        thumbnail: found.thumbnail,
        category: found.category,
        tags: found.tags,
        publishDate: found.publishDate,
        language: found.language,
        viewCount: found.viewCount,
      };
    }
  } catch {
    // Use sample article
  }

  return {
    title: article.title,
    description: article.teaser,
    openGraph: {
      title: article.title,
      description: article.teaser,
      images: [article.thumbnail],
      type: 'article',
      siteName: brand.name,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations();
  const brand = await getServerBrandConfig();
  
  // Try to fetch real article
  let article = { ...sampleArticle };
  let isUnlocked = false;
  
  try {
    const brandId = await getBrandId();
    const articleRepo = getArticleRepository(brandId);
    const unlockRepo = getUnlockRepository(brandId);
    
    const found = await articleRepo.findBySlug(slug);
    if (found) {
      article = {
        ...sampleArticle,
        _id: found._id?.toString() || 'demo-id',
        slug: found.slug,
        title: found.title,
        teaser: found.teaser,
        content: found.content,
        thumbnail: found.thumbnail,
        category: found.category,
        tags: found.tags,
        publishDate: found.publishDate,
        language: found.language,
        viewCount: found.viewCount,
      };
      
      // Check if unlocked
      const cookieStore = await cookies();
      const msisdn = cookieStore.get('user_msisdn')?.value;
      if (msisdn) {
        isUnlocked = await unlockRepo.hasUnlocked(msisdn, found._id!);
      }
    }
  } catch (error) {
    console.log('Using sample article for demo:', error);
  }

  // For demo, show as unlocked if the slug is in the sample
  if (slug === 'example-article-1') {
    isUnlocked = false; // Keep locked to demo paywall
  }

  const articleUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/article/${slug}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <article className="container px-4 py-6 max-w-3xl mx-auto">
          {/* Hero image */}
          <div className="relative aspect-[16/9] w-full mb-6 rounded-lg overflow-hidden">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>

          {/* Article header */}
          <header className="mb-6">
            <Badge variant="outline" className="mb-3">
              {t(`categories.${article.category}`)}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{article.title}</h1>
            <p className="text-muted-foreground mb-4">{article.teaser}</p>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-muted-foreground">
                {t('article.publishedOn', { date: formatDate(article.publishDate, locale) })}
              </p>
              <ShareButtons url={articleUrl} title={article.title} />
            </div>
          </header>

          {/* Article content or paywall */}
          <div className="relative">
            {isUnlocked ? (
              <div 
                className="article-content prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <>
                {/* Preview content (blurred) */}
                <div className="relative">
                  <div 
                    className="article-content prose prose-lg max-w-none paywall-blur"
                    dangerouslySetInnerHTML={{ 
                      __html: article.content.substring(0, 500) + '...' 
                    }}
                  />
                </div>
                
                {/* Paywall overlay */}
                <div className="mt-[-150px] relative z-10">
                  <Paywall 
                    articleId={article._id}
                    articleSlug={article.slug}
                  />
                </div>
              </>
            )}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-medium mb-2">{t('article.tags')}</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
