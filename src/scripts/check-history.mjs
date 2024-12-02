import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lsdbuodcejcfhpqrjelr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZGJ1b2RjZWpjZmhwcXJqZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODUzMDUsImV4cCI6MjA0NzQ2MTMwNX0.bJgeQ-kmOUHM6FplFFaQQtrSuH4K17LRFlsdDAsuB4c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkHistory() {
  try {
    // Get spot 7 details
    console.log('Checking spot #7 details...')
    const { data: spot, error: spotError } = await supabase
      .from('spots')
      .select('*')
      .eq('id', 7)
      .single()
    
    if (spotError) throw spotError
    console.log('Spot #7:', spot)

    // Get history for spot 7
    console.log('\nChecking spot #7 history...')
    const { data: history, error: historyError } = await supabase
      .from('spot_history')
      .select('*')
      .eq('spot_id', 7)
      .order('timestamp', { ascending: true })
    
    if (historyError) throw historyError
    console.log('History entries:', history)

    // Test updating spot 7
    console.log('\nTesting spot update...')
    const { error: updateError } = await supabase
      .from('spots')
      .update({
        project_name: 'Test Project',
        current_bidder: 'DeCW4dUbZfmgXCPmQHeN8QTh2CF83R42macWwS9kDBi4',
        current_bid: 0.02
      })
      .eq('id', 7)
    
    if (updateError) throw updateError
    console.log('Spot updated successfully')

    // Check history again
    console.log('\nChecking updated history...')
    const { data: newHistory, error: newHistoryError } = await supabase
      .from('spot_history')
      .select('*')
      .eq('spot_id', 7)
      .order('timestamp', { ascending: true })
    
    if (newHistoryError) throw newHistoryError
    console.log('Updated history entries:', newHistory)

  } catch (err) {
    console.error('Error:', err)
  }
}

checkHistory()
