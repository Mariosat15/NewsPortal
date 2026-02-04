import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

// Category configuration
const categories = [
  { 
    key: 'news',
    icon: '📰',
    gradient: 'from-slate-700 to-slate-900',
    image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&h=400&fit=crop',
    labelDe: 'Nachrichten',
    labelEn: 'News',
    descDe: 'Aktuelle Nachrichten aus Deutschland und der Welt',
    descEn: 'Current news from Germany and around the world'
  },
  { 
    key: 'technology',
    icon: '💻',
    gradient: 'from-blue-600 to-indigo-700',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
    labelDe: 'Technologie',
    labelEn: 'Technology',
    descDe: 'Die neuesten Tech-Trends und Innovationen',
    descEn: 'The latest tech trends and innovations'
  },
  { 
    key: 'sports',
    icon: '⚽',
    gradient: 'from-red-600 to-rose-700',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop',
    labelDe: 'Sport',
    labelEn: 'Sports',
    descDe: 'Sportnachrichten und Spielberichte',
    descEn: 'Sports news and match reports'
  },
  { 
    key: 'entertainment',
    icon: '🎬',
    gradient: 'from-pink-600 to-fuchsia-700',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
    labelDe: 'Unterhaltung',
    labelEn: 'Entertainment',
    descDe: 'Unterhaltung, Filme und Musik',
    descEn: 'Entertainment, movies and music'
  },
  { 
    key: 'health',
    icon: '🏥',
    gradient: 'from-emerald-600 to-teal-700',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop',
    labelDe: 'Gesundheit',
    labelEn: 'Health',
    descDe: 'Gesundheitstipps und medizinische Neuigkeiten',
    descEn: 'Health tips and medical news'
  },
  { 
    key: 'finance',
    icon: '💰',
    gradient: 'from-amber-600 to-orange-700',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop',
    labelDe: 'Finanzen',
    labelEn: 'Finance',
    descDe: 'Finanznachrichten und Anlagestrategien',
    descEn: 'Financial news and investment strategies'
  },
  { 
    key: 'lifestyle',
    icon: '✨',
    gradient: 'from-purple-600 to-violet-700',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
    labelDe: 'Lifestyle',
    labelEn: 'Lifestyle',
    descDe: 'Lifestyle, Mode und Trends',
    descEn: 'Lifestyle, fashion and trends'
  },
  { 
    key: 'recipes',
    icon: '🍳',
    gradient: 'from-orange-500 to-red-600',
    image: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&h=400&fit=crop',
    labelDe: 'Rezepte',
    labelEn: 'Recipes',
    descDe: 'Leckere Rezepte und Kochtipps',
    descEn: 'Delicious recipes and cooking tips'
  },
  { 
    key: 'relationships',
    icon: '💕',
    gradient: 'from-rose-500 to-pink-600',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop',
    labelDe: 'Beziehungen',
    labelEn: 'Relationships',
    descDe: 'Dating, Beziehungstipps und Ratgeber',
    descEn: 'Dating, relationship tips and advice'
  },
  { 
    key: 'travel',
    icon: '✈️',
    gradient: 'from-cyan-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop',
    labelDe: 'Reisen',
    labelEn: 'Travel',
    descDe: 'Reiseziele, Tipps und Abenteuer',
    descEn: 'Destinations, tips and adventures'
  },
];

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {locale === 'de' ? 'Alle Kategorien' : 'All Categories'}
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto">
            {locale === 'de' 
              ? 'Entdecken Sie Artikel nach Themengebieten sortiert'
              : 'Discover articles organized by topic'
            }
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/${locale}/categories/${cat.key}`}
              className="group block"
            >
              <div className="relative h-56 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <Image
                  src={cat.image}
                  alt={locale === 'de' ? cat.labelDe : cat.labelEn}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} opacity-85 group-hover:opacity-75 transition-opacity`} />
                
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{cat.icon}</span>
                    <h2 className="text-2xl font-bold text-white">
                      {locale === 'de' ? cat.labelDe : cat.labelEn}
                    </h2>
                  </div>
                  <p className="text-white/70 text-sm mb-3">
                    {locale === 'de' ? cat.descDe : cat.descEn}
                  </p>
                  <div className="flex items-center gap-2 text-white/80 text-sm font-medium group-hover:text-white group-hover:gap-3 transition-all">
                    {locale === 'de' ? 'Artikel ansehen' : 'View articles'}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
