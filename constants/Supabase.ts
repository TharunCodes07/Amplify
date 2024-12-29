import { createClient } from '@supabase/supabase-js';
import {SUPABASE_KEY } from '@env';
import {SUPABASE_URL} from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);