import { supabase } from './supabase';

// --- AQUI ESTAVA O ERRO: Adicionamos 'export' ---
export interface Profile {
  id: string;
  full_name: string | null;
  credits: number;
  plan_type: string;
  quiz_completed?: boolean;
  created_at?: string;
  avatar_url?: string;
}

export const getProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
};

export const updateCredits = async (userId: string, newCredits: number) => {
  const { error } = await supabase
    .from('profiles')
    .update({ credits: newCredits })
    .eq('id', userId);

  if (error) throw error;
};