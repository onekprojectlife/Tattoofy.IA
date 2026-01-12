import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Mantive a chave nova que o Supabase te passou, pois ela deve bater com seu .env
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// AQUI ESTÁ A CORREÇÃO: usamos "export const" para poder importar com chaves { supabase } nos outros arquivos
export const supabase = createClient(supabaseUrl, supabaseKey);