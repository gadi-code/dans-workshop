// Supabase/PostgREST embeds a to-one relation as a single object or as a
// one-element array depending on how it infers cardinality, regardless of
// what the generated TypeScript types claim. Normalize either shape here
// instead of repeating the same Array.isArray check at every call site.
export function one<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}
