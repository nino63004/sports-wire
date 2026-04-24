import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, Zap, AlertCircle } from 'lucide-react';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const CATEGORIES = [
  {
    id: 'all',
    label: 'The Wire',
    endpoints: [
      'football/nfl',
      'basketball/nba',
      'baseball/mlb',
      'hockey/nhl',
      'soccer/eng.1',
      'football/college-football',
      'basketball/mens-college-basketball',
    ],
  },
  { id: 'NFL', label: 'NFL', endpoints: ['football/nfl'] },
  { id: 'NBA', label: 'NBA', endpoints: ['basketball/nba'] },
  { id: 'MLB', label: 'MLB', endpoints: ['baseball/mlb'] },
  { id: 'NHL', label: 'NHL', endpoints: ['hockey/nhl'] },
  {
    id: 'Soccer',
    label: 'Soccer',
    endpoints: ['soccer/eng.1', 'soccer/usa.1', 'soccer/uefa.champions'],
  },
  {
    id: 'College',
    label: 'College',
    endpoints: ['football/college-football', 'basketball/mens-college-basketball'],
  },
  {
    id: 'Tennis/Golf',
    label: 'Tennis/Golf',
    endpoints: ['tennis/atp', 'golf/pga'],
  },
];

function formatRelative(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function deriveCategory(endpoint) {
  if (endpoint.includes('nfl')) return 'NFL';
  if (endpoint.includes('nba')) return 'NBA';
  if (endpoint.includes('mlb')) return 'MLB';
  if (endpoint.includes('nhl')) return 'NHL';
  if (endpoint.includes('college-football')) return 'CFB';
  if (endpoint.includes('mens-college-basketball')) return 'CBB';
  if (endpoint.includes('soccer')) return 'Soccer';
  if (endpoint.includes('tennis')) return 'Tennis';
  if (endpoint.includes('golf')) return 'Golf';
  return 'Sports';
}

function mapArticle(article, endpoint) {
  const published = article.published || article.lastModified;
  const diffHours = (Date.now() - new Date(published).getTime()) / 3600000;
  return {
    headline: article.headline || article.title || 'Untitled',
    summary: article.description || '',
    category: deriveCategory(endpoint),
    source: 'ESPN',
    url: article.links?.web?.href || article.links?.mobile?.href || '#',
    timestamp: formatRelative(published),
    publishedAt: published,
    urgent: diffHours < 3,
    image: article.images?.[0]?.url || null,
  };
}

async function fetchEndpoint(endpoint) {
  try {
    const res = await fetch(`${ESPN_BASE}/${endpoint}/news`);
    if (!res.ok) throw new Error(`${endpoint}: ${res.status}`);
    const data = await res.json();
    return (data.articles || []).map((a) => mapArticle(a, endpoint));
  } catch (e) {
    console.warn(`Failed ${endpoint}`, e);
    return [];
  }
}

export default function App() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStories = useCallback(async (catId) => {
    setLoading(true);
    setError(null);
    try {
      const cat = CATEGORIES.find((c) => c.id === catId);
      if (!cat) throw new Error('Unknown category');

      const results = await Promise.all(cat.endpoints.map(fetchEndpoint));
      let all = results.flat();

      // De-dupe by headline
      const seen = new Set();
      all = all.filter((s) => {
        if (!s.headline || seen.has(s.headline)) return false;
        seen.add(s.headline);
        return true;
      });

      // Sort by most recent
      all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      all = all.slice(0, 10);

      if (all.length === 0) throw new Error('No stories returned from ESPN');

      setStories(all);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load stories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories(category);
  }, [category, fetchStories]);

  const formatTime = (d) =>
    d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

  const heroStory = stories[0];
  const restStories = stories.slice(1);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 serif-font">
      {/* Top bar */}
      <div className="border-b border-neutral-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 pulse-gold" />
            <span className="mono-font text-[10px] sm:text-xs tracking-[0.2em] text-neutral-400 uppercase">
              Live · Updated {lastUpdated ? formatTime(lastUpdated) : '—'}
            </span>
          </div>
          <button
            onClick={() => fetchStories(category)}
            disabled={loading}
            className="flex items-center gap-2 text-xs mono-font uppercase tracking-wider text-neutral-400 hover:text-amber-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Masthead */}
      <div className="border-b-2 border-amber-400/80 grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="mono-font text-[10px] tracking-[0.3em] text-amber-400/80 uppercase">
              Vol. MMXXVI
            </span>
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="mono-font text-[10px] tracking-[0.3em] text-neutral-500 uppercase hidden sm:inline">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="headline-font text-5xl sm:text-7xl lg:text-8xl font-bold text-neutral-50 leading-[0.9]">
            THE <span className="text-amber-400">WIRE</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 italic max-w-xl">
            Top sports stories, pulled live from ESPN.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-b border-neutral-800 bg-neutral-950 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm mono-font uppercase tracking-wider whitespace-nowrap transition-all border ${
                  category === c.id
                    ? 'bg-amber-400 text-black border-amber-400 font-semibold'
                    : 'border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-neutral-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {error && (
          <div className="border border-red-900 bg-red-950/30 p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="headline-font text-lg uppercase text-red-400">Wire Down</div>
              <div className="text-sm text-neutral-400 mt-1">{error}</div>
              <button
                onClick={() => fetchStories(category)}
                className="mt-3 text-xs mono-font uppercase tracking-wider text-amber-400 hover:text-amber-300"
              >
                Retry →
              </button>
            </div>
          </div>
        )}

        {loading && !stories.length && (
          <div className="space-y-6">
            <div className="h-96 bg-neutral-900 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-neutral-900 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!loading && !error && heroStory && (
          <>
            {/* Hero story */}
            <article
              className="fade-up border-b border-neutral-800 pb-8 mb-10"
              style={{ animationDelay: '0ms' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                {heroStory.image && (
                  <a
                    href={heroStory.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lg:col-span-7 block overflow-hidden bg-neutral-900 aspect-[16/10] relative group"
                  >
                    <img
                      src={heroStory.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </a>
                )}
                <div className={heroStory.image ? 'lg:col-span-5' : 'lg:col-span-12'}>
                  <div className="flex items-start gap-4 mb-3">
                    <span className="headline-font text-5xl lg:text-6xl text-amber-400 leading-none">
                      01
                    </span>
                    <div className="flex-1 flex flex-wrap items-center gap-2 pt-2">
                      <span className="mono-font text-[10px] tracking-[0.2em] uppercase text-amber-400 border border-amber-400/30 px-2 py-0.5">
                        {heroStory.category}
                      </span>
                      {heroStory.urgent && (
                        <span className="mono-font text-[10px] tracking-[0.2em] uppercase bg-red-500 text-white px-2 py-0.5">
                          Breaking
                        </span>
                      )}
                    </div>
                  </div>
                  <a href={heroStory.url} target="_blank" rel="noopener noreferrer" className="group block">
                    <h2 className="headline-font text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.02] text-neutral-50 group-hover:text-amber-400 transition-colors mb-4">
                      {heroStory.headline}
                    </h2>
                  </a>
                  <p className="text-base text-neutral-300 leading-relaxed mb-5">
                    {heroStory.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="mono-font text-[10px] tracking-[0.2em] uppercase text-neutral-500">
                      {heroStory.source} · {heroStory.timestamp}
                    </span>
                    <a
                      href={heroStory.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mono-font text-xs uppercase tracking-wider text-amber-400 hover:text-amber-300 border-b border-amber-400/40 hover:border-amber-300 pb-0.5"
                    >
                      Read <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </article>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
              {restStories.map((story, idx) => {
                const rank = String(idx + 2).padStart(2, '0');
                return (
                  <article
                    key={idx}
                    className="fade-up group"
                    style={{ animationDelay: `${(idx + 1) * 60}ms` }}
                  >
                    <a href={story.url} target="_blank" rel="noopener noreferrer" className="block">
                      {story.image && (
                        <div className="aspect-[16/10] overflow-hidden bg-neutral-900 mb-4">
                          <img
                            src={story.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex items-start gap-4 mb-3">
                        <span className="headline-font text-3xl text-neutral-700 group-hover:text-amber-400 transition-colors leading-none">
                          {rank}
                        </span>
                        <div className="flex-1 flex flex-wrap items-center gap-2 pt-1">
                          <span className="mono-font text-[10px] tracking-[0.2em] uppercase text-amber-400/90">
                            {story.category}
                          </span>
                          {story.urgent && (
                            <span className="flex items-center gap-1 mono-font text-[10px] tracking-[0.15em] uppercase text-red-400">
                              <Zap className="w-2.5 h-2.5 fill-red-400" />
                              Hot
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="headline-font text-xl sm:text-2xl font-medium leading-tight text-neutral-100 group-hover:text-amber-400 transition-colors mb-3">
                        {story.headline}
                      </h3>
                      {story.summary && (
                        <p className="text-sm text-neutral-400 leading-relaxed mb-3 line-clamp-3">
                          {story.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between mono-font text-[10px] tracking-[0.15em] uppercase">
                        <span className="text-neutral-500">
                          {story.source} · {story.timestamp}
                        </span>
                        <ExternalLink className="w-3 h-3 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </a>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {!loading && !error && stories.length === 0 && (
          <div className="text-center py-20 text-neutral-500 italic">
            No stories on the wire right now.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3">
          <span className="mono-font text-[10px] tracking-[0.2em] uppercase text-neutral-600">
            The Wire · Live sports desk
          </span>
          <span className="mono-font text-[10px] tracking-[0.2em] uppercase text-neutral-600">
            Data: ESPN public API
          </span>
        </div>
      </footer>
    </div>
  );
}
