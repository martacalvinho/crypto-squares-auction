import { supabase } from '../integrations/supabase/client'

async function checkDatabase() {
  // Check spots table
  const spotsResult = await supabase
    .from('spots')
    .select('*')
    .limit(1);
  
  console.log('Spots table columns:', spotsResult.data ? Object.keys(spotsResult.data[0]) : 'No data');

  // Check spots_history table
  const historyResult = await supabase
    .from('spots_history')
    .select('*')
    .limit(1);
  
  console.log('Spots history table columns:', historyResult.data ? Object.keys(historyResult.data[0]) : 'No data');

  if (spotsResult.error) console.error('Spots error:', spotsResult.error);
  if (historyResult.error) console.error('History error:', historyResult.error);
}

checkDatabase();
