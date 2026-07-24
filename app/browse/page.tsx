import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Card from '@/components/ui/Card'
import { SuccessAlert } from '@/components/ui/Alert'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string }>
}) {
  const { category: categorySlug, city } = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('sort_order')

  const selectedCategory = categories?.find((c) => c.slug === categorySlug)

  let query = supabase
    .from('providers')
    .select(
      'id, display_name, description, provider_type, city, suburb, provider_categories(category_id, service_categories(slug, name))',
    )
    .eq('is_active', true)

  if (selectedCategory) {
    query = supabase
      .from('providers')
      .select(
        'id, display_name, description, provider_type, city, suburb, provider_categories!inner(category_id, service_categories(slug, name))',
      )
      .eq('is_active', true)
      .eq('provider_categories.category_id', selectedCategory.id)
  }

  if (city) {
    query = query.ilike('city', `%${city}%`)
  }

  const { data: providers } = await query

  const friendHistoryByProvider = new Map<string, number>()
  if (user && providers && providers.length > 0) {
    const results = await Promise.all(
      providers.map((p) => supabase.rpc('friend_provider_history', { target_provider_id: p.id })),
    )
    providers.forEach((p, i) => {
      friendHistoryByProvider.set(p.id, results[i].data?.length ?? 0)
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold text-navy">Browse providers</h1>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/browse"
          className={`rounded-full border px-3 py-1 font-medium transition-colors ${!selectedCategory ? 'border-brand-500 bg-brand-500 text-white' : 'border-border text-slate hover:bg-surface-tint'}`}
        >
          All
        </Link>
        {categories?.map((c) => (
          <Link
            key={c.id}
            href={`/browse?category=${c.slug}`}
            className={`rounded-full border px-3 py-1 font-medium transition-colors ${selectedCategory?.id === c.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-border text-slate hover:bg-surface-tint'}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {providers && providers.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {providers.map((p) => (
            <Card as="li" key={p.id}>
              <Link href={`/providers/${p.id}`} className="font-semibold text-navy hover:text-brand-500">
                {p.display_name}
              </Link>
              <p className="text-sm text-slate">
                {p.provider_type === 'company' ? 'Company' : 'Individual'}
                {p.city ? ` · ${p.city}` : ''}
              </p>
              {p.description && <p className="mt-1 text-sm text-slate">{p.description}</p>}
              {(friendHistoryByProvider.get(p.id) ?? 0) > 0 && (
                <div className="mt-3">
                  <SuccessAlert>A friend has used this provider</SuccessAlert>
                </div>
              )}
            </Card>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate">
          No providers found{selectedCategory ? ` for ${selectedCategory.name}` : ''} yet.
        </p>
      )}
    </div>
  )
}
