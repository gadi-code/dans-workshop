import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createProvider } from '@/app/actions/providers'
import Card from '@/components/ui/Card'
import Field, { inputClasses } from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import { ErrorAlert } from '@/components/ui/Alert'

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
      <h1 className="text-2xl font-bold text-navy">Become a provider</h1>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <Card>
        <form action={createProvider} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-1 text-sm">
            <legend className="mb-1 font-medium text-navy">I am a...</legend>
            <label className="flex items-center gap-2 text-slate">
              <input type="radio" name="providerType" value="individual" defaultChecked required />
              Individual / freelancer
            </label>
            <label className="flex items-center gap-2 text-slate">
              <input type="radio" name="providerType" value="company" required />
              Company
            </label>
          </fieldset>

          <Field label="Display name">
            <input name="displayName" required className={inputClasses} />
          </Field>

          <Field label="Description">
            <textarea name="description" rows={3} className={inputClasses} />
          </Field>

          <Field label="Phone">
            <input name="phone" className={inputClasses} />
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

          <fieldset className="flex flex-col gap-1 text-sm">
            <legend className="mb-1 font-medium text-navy">Services offered</legend>
            {categories?.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-slate">
                <input type="checkbox" name="categoryIds" value={category.id} />
                {category.name}
              </label>
            ))}
          </fieldset>

          <Button type="submit">Create listing</Button>
        </form>
      </Card>
    </div>
  )
}
