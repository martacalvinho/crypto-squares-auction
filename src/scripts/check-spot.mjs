import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lsdbuodcejcfhpqrjelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZGJ1b2RjZWpjZmhwcXJqZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODUzMDUsImV4cCI6MjA0NzQ2MTMwNX0.bJgeQ-kmOUHM6FplFFaQQtrSuH4K17LRFlsdDAsuB4c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSpot() {
  // Check a specific spot
  const { data: spotData, error: spotError } = await supabase
    .from('spots')
    .select('*')
    .eq('id', 7)  // Using spot ID 7 as an example
    .single()
  
  if (spotError) {
    console.error('Error with spot:', spotError)
  } else {
    console.log('Spot data:', spotData)
  }
}

checkSpot()
