import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lsdbuodcejcfhpqrjelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZGJ1b2RjZWpjZmhwcXJqZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODUzMDUsImV4cCI6MjA0NzQ2MTMwNX0.bJgeQ-kmOUHM6FplFFaQQtrSuH4K17LRFlsdDAsuB4c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
  const { data, error } = await supabase
    .rpc('list_tables')
    
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Tables:', data)
  }
}

listTables()
