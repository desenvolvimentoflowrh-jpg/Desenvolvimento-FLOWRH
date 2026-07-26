import { Post, UserProfile, UserRole } from "../types";

export interface PublishPostData {
  content: string;
  category: Post["category"];
  imageFile?: File | null;
  currentUser: UserProfile;
  companyId: string;
  poll?: Post["poll"];
  badgeAward?: Post["badge_award"];
}

/**
 * Função de serviço desacoplada para publicação no Mural Corporativo.
 *
 * NOTA DE ARQUITETURA PARA FUTURA INTEGRAÇÃO COM SUPABASE:
 * - Atualmente opera em modo simulado/preview utilizando URL.createObjectURL para imagens locais.
 * - Quando o Supabase for conectado, descomente os blocos marcados com SUPABASE STORAGE / DATABASE.
 */
export const publishPostService = async (data: PublishPostData): Promise<Post> => {
  let imageUrl: string | undefined = undefined;

  if (data.imageFile) {
    // =========================================================================
    // FUTURA INTEGRAÇÃO SUPABASE STORAGE (UPLOADS):
    // const fileExt = data.imageFile.name.split('.').pop();
    // const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    // const filePath = `mural-images/${fileName}`;
    //
    // const { error: uploadError } = await supabase.storage
    //   .from('mural-media')
    //   .upload(filePath, data.imageFile);
    //
    // if (uploadError) {
    //   console.error('Erro ao enviar imagem para o Supabase Storage:', uploadError);
    //   throw uploadError;
    // }
    //
    // const { data: { publicUrl } } = supabase.storage
    //   .from('mural-media')
    //   .getPublicUrl(filePath);
    //
    // imageUrl = publicUrl;
    // =========================================================================

    // Simulação no ambiente de Preview / Mock:
    imageUrl = URL.createObjectURL(data.imageFile);
  }

  const newPost: Post = {
    id: `post-${Date.now()}`,
    user_id: data.currentUser.id,
    user_name: data.currentUser.name,
    user_avatar: data.currentUser.avatar,
    user_role:
      data.currentUser.role === UserRole.HR_MANAGER
        ? "Gestor de RH"
        : data.currentUser.role === UserRole.SUPER_ADMIN
        ? "Super Admin"
        : "Colaborador",
    user_department: data.currentUser.department,
    company_id: data.companyId,
    content: data.content,
    category: data.category,
    media_url: imageUrl,
    media_type: imageUrl ? "image" : "none",
    likes: [],
    comments: [],
    poll: data.poll,
    badge_award: data.badgeAward,
    created_at: new Date().toISOString()
  };

  // =========================================================================
  // FUTURA INTEGRAÇÃO SUPABASE DATABASE (INSERT POST):
  // const { data: insertedPost, error: dbError } = await supabase
  //   .from('posts')
  //   .insert([newPost])
  //   .select()
  //   .single();
  //
  // if (dbError) {
  //   console.error('Erro ao salvar post no Supabase Database:', dbError);
  //   throw dbError;
  // }
  // return insertedPost;
  // =========================================================================

  return newPost;
};
