import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lsdbuodcejcfhpqrjelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZGJ1b2RjZWpjZmhwcXJqZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODUzMDUsImV4cCI6MjA0NzQ2MTMwNX0.bJgeQ-kmOUHM6FplFFaQQtrSuH4K17LRFlsdDAsuB4c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  // Check spots table
  const { data: spotsData, error: spotsError } = await supabase
    .from('spots')
    .select('*')
    .limit(1)
  
  if (spotsError) {
    console.error('Error fetching spots:', spotsError)
  } else {
    console.log('Spots table columns:', Object.keys(spotsData[0]))
  }

  // Check spots_history table
  const { data: historyData, error: historyError } = await supabase
    .from('spots_history')
    .select('*')
    .limit(1)
  
  if (historyError) {
    console.error('Error fetching spots_history:', historyError)
  } else {
    console.log('Spots history table columns:', Object.keys(historyData[0]))
  }
}

checkSchema()
