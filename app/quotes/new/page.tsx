import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createQuoteRequest } from '@/app/actions/quotes'

export default async function NewQuoteRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; provider?: string }>
}) {
  const { error, provider } = await searchParams
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
      <h1 className="text-2xl font-semibold">Describe the job</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      <form action={createQuoteRequest} className="flex flex-col gap-4">
        {provider && <input type="hidden" name="provider" value={provider} />}

        <label className="flex flex-col gap-1 text-sm">
          Category
          <select
            name="categoryId"
            required
            defaultValue=""
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Describe the problem
          <textarea
            name="description"
            required
            rows={4}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Address
          <input
            name="addressLine"
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

        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Next: choose providers
        </button>
      </form>
    </div>
  )
}
