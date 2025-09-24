import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    console.log('Starting daily limits reset...');
    
    // Reset daily tasks para todos os usuários
    const { data, error } = await supabase
      .from('user_levels')
      .update({ 
        daily_tasks_completed: 0,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records
    
    if (error) {
      console.error('Error resetting daily limits:', error);
      throw error;
    }
    
    // Log da operação no admin audit log
    const { error: logError } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id || null,
        action: 'reset_daily_limits_cron',
        details: {
          reset_at: new Date().toISOString(),
          method: 'cron_job'
        }
      });
      
    if (logError) {
      console.error('Error logging reset operation:', logError);
    }
    
    console.log('Daily limits reset completed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily limits reset successfully',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in reset-daily-limits function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});