import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lsdbuodcejcfhpqrjelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZGJ1b2RjZWpjZmhwcXJqZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODUzMDUsImV4cCI6MjA0NzQ2MTMwNX0.bJgeQ-kmOUHM6FplFFaQQtrSuH4K17LRFlsdDAsuB4c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  // Check spots table
  console.log('Checking spots table...')
  const { data: spot, error: spotError } = await supabase
    .from('spots')
    .select('*')
    .eq('id', 7)
    .single()
  
  if (spotError) {
    console.error('Error with spots:', spotError)
  } else {
    console.log('Spot #7:', spot)
  }

  // Check spot_history table
  console.log('\nChecking spot_history table...')
  const { data: history, error: historyError } = await supabase
    .from('spot_history')
    .select('*')
    .eq('spot_id', 7)
    .order('timestamp', 'asc')
  
  if (historyError) {
    console.error('Error with spot_history:', historyError)
  } else {
    console.log('History entries for spot #7:', history)
  }
}

checkData()
