import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'

async function Notes() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('notes').select()
  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}

export default function Page() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Notes />
    </Suspense>
  )
}