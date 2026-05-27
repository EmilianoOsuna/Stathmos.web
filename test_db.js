import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptpkqlucyhiumyswcids.supabase.co';
const supabaseKey = 'sb_publishable_kU1shIqxYhiThQHfkvf4kQ_wHCGSod6';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching latest notifications...");
  const { data: notifs, error: err1 } = await supabase
    .from('notificaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (err1) {
    console.error("Error fetching notifications:", err1);
  } else {
    console.log("Latest Notifications:", JSON.stringify(notifs, null, 2));
  }

  console.log("\nFetching push subscriptions count...");
  const { data: subs, error: err2 } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (err2) {
    console.error("Error fetching subscriptions:", err2);
  } else {
    console.log("Subscriptions:", JSON.stringify(subs, null, 2));
  }
}

test();
