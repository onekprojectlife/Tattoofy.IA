import { supabase } from './supabase';

export interface ShowcaseImage {
  id: number;
  image_url: string;
  prompt?: string;
  type?: string;
}

// Busca os exemplos de Tatuagens (Grid)
export const getLandingExamples = async () => {
  const { data, error } = await supabase
    .from('landing_examples')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Erro exemplos:', error);
    return [];
  }
  return data as ShowcaseImage[];
};

// Busca os exemplos do Provador Virtual (Carrossel)
export const getTryOnShowcase = async () => {
  const { data, error } = await supabase
    .from('landing_tryon')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4); // Pegamos apenas os 4 mais recentes

  if (error) {
    console.error('Erro tryon:', error);
    return [];
  }
  return data as ShowcaseImage[];
};

// NOVA FUNÇÃO: Busca imagens do Hero (Flash vs Realistic)
export const getHeroImages = async () => {
  const { data, error } = await supabase
    .from('landing_hero_images')
    .select('*');

  if (error) {
    console.error('Erro hero images:', error);
    return { flash: null, realistic: null };
  }
  // Organiza para fácil uso no frontend
  const flash = data.find(img => img.type === 'flash')?.image_url;
  const realistic = data.find(img => img.type === 'realistic')?.image_url;

  return { flash, realistic };
};