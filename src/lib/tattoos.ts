import { supabase } from './supabase';

export interface Tattoo {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
  userId?: string;
}

// Função auxiliar para fazer upload da imagem
async function uploadImageToStorage(imageUrl: string, userId: string): Promise<string> {
  try {
    // 1. Baixa a imagem do Replicate (que é temporária)
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // 2. Cria um nome único para o arquivo
    const fileName = `${userId}/${Date.now()}.jpg`;

    // 3. Sobe para o bucket 'tattoos'
    const { error: uploadError } = await supabase.storage
      .from('tattoos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 4. Pega o link público permanente
    const { data } = supabase.storage
      .from('tattoos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw new Error('Falha ao salvar a imagem no servidor.');
  }
}

// Salvar Tatuagem no Banco (agora com Upload)
export const saveTattoo = async (tattoo: Omit<Tattoo, 'id' | 'createdAt'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Usuário não autenticado');

  // PASSO EXTRA: Converter URL temporária em Permanente
  let permanentUrl = tattoo.imageUrl;
  
  // Se a URL vier do Replicate (replicate.delivery), fazemos o upload.
  // Se já for do supabase, não precisa fazer de novo.
  if (tattoo.imageUrl.includes('replicate.delivery')) {
      permanentUrl = await uploadImageToStorage(tattoo.imageUrl, user.id);
  }

  // Insere no banco com a URL PERMANENTE
  const { data, error } = await supabase
    .from('tattoos')
    .insert([
      {
        user_id: user.id,
        prompt: tattoo.prompt,
        image_url: permanentUrl, // <--- Aqui vai o link do Supabase Storage
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro Supabase:', error);
    throw error;
  }

  return data;
};

// Buscar Tatuagens
export const getSavedTattoos = async (): Promise<Tattoo[]> => {
  const { data, error } = await supabase
    .from('tattoos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id.toString(),
    prompt: item.prompt,
    imageUrl: item.image_url,
    createdAt: item.created_at,
    userId: item.user_id
  }));
};

// Deletar Tatuagem (Remove do banco e do Storage para não ocupar espaço)
export const deleteTattoo = async (id: string, imageUrl: string) => {
  // 1. Tenta deletar a imagem do Storage se for nossa
  if (imageUrl.includes('supabase.co')) {
      try {
        // Extrai o caminho do arquivo da URL (ex: user_id/123123.jpg)
        const path = imageUrl.split('/tattoos/')[1];
        if (path) {
            await supabase.storage.from('tattoos').remove([path]);
        }
      } catch (e) {
          console.error("Erro ao deletar arquivo:", e);
      }
  }

  // 2. Deleta do Banco de Dados
  const { error } = await supabase
    .from('tattoos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar registro:', error);
    throw error;
  }
};