import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createQuoteRequest } from '@/app/actions/quotes'
import Card from '@/components/ui/Card'
import Field, { inputClasses } from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import { ErrorAlert } from '@/components/ui/Alert'

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
      <h1 className="text-2xl font-bold text-navy">Describe the job</h1>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <Card>
        <form action={createQuoteRequest} className="flex flex-col gap-4">
          {provider && <input type="hidden" name="provider" value={provider} />}

          <Field label="Category">
            <select name="categoryId" required defaultValue="" className={inputClasses}>
              <option value="" disabled>
                Select a category
              </option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Describe the problem">
            <textarea name="description" required rows={4} className={inputClasses} />
          </Field>

          <Field label="Address">
            <input name="addressLine" className={inputClasses} />
          </Field>
          <Field label="Suburb">
            <input name="suburb" className={inputClasses} />
          </Field>
          <Field label="City">
            <input name="city" className={inputClasses} />
          </Field>
          <Field label="Province">
            <input name="province" className={inputClasses} />
          </Field>

          <Button type="submit">Next: choose providers</Button>
        </form>
      </Card>
    </div>
  )
}
