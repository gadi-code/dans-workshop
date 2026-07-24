import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createProvider } from '@/app/actions/providers'

export default async function NewProviderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Become a provider</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      <form action={createProvider} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1">I am a...</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="providerType" value="individual" defaultChecked required />
            Individual / freelancer
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="providerType" value="company" required />
            Company
          </label>
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          Display name
          <input
            name="displayName"
            required
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea
            name="description"
            rows={3}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Phone
          <input
            name="phone"
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Suburb
          <input
            name="suburb"
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          City
          <input
            name="city"
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Province
          <input
            name="province"
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>

        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1">Services offered</legend>
          {categories?.map((category) => (
            <label key={category.id} className="flex items-center gap-2">
              <input type="checkbox" name="categoryIds" value={category.id} />
              {category.name}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Create listing
        </button>
      </form>
    </div>
  )
}
