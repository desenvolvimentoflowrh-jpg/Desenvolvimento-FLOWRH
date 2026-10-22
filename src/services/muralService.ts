import { Post, UserProfile, UserRole } from "../types";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface PublishPostData {
  content: string;
  category: Post["category"];
  imageFile?: File | null;
  currentUser: UserProfile;
  companyId: string;
  poll?: Post["poll"];
  badgeAward?: Post["badge_award"];
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function normalizePostFromDB(row: any): Post {
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: row.user_name || "Colaborador",
    user_avatar:
      row.user_avatar ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    user_role: row.user_role || "Colaborador",
    user_department: row.user_department || "Geral",
    company_id: row.company_id || "company-1",
    content: row.content || "",
    category: row.category || "aviso",
    media_url: row.media_url || undefined,
    media_type: row.media_type || (row.media_url ? "image" : "none"),
    likes: Array.isArray(row.likes) ? row.likes : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    poll: row.poll || undefined,
    badge_award: row.badge_award || undefined,
    is_pinned: Boolean(row.is_pinned),
    is_edited: Boolean(row.is_edited),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || undefined
  };
}

/**
 * Busca todas as publicações do Mural a partir do Banco de Dados (Supabase + Backend DB).
 */
export const fetchPostsService = async (companyId?: string): Promise<Post[] | null> => {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from("posts")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(normalizePostFromDB);
      }
    } catch (err) {
      console.warn("[Mural] Aviso ao buscar posts do Supabase, consultando API do banco:", err);
    }
  }

  try {
    const queryParam = companyId ? `?companyId=${encodeURIComponent(companyId)}` : "";
    const res = await fetch(`/api/mural/posts${queryParam}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.posts)) {
        return json.posts.map(normalizePostFromDB);
      }
    }
  } catch (err) {
    console.warn("[Mural] Erro ao buscar posts da API:", err);
  }

  return null;
};

/**
 * Publica uma nova postagem no Mural Corporativo e persiste no Banco de Dados.
 */
export const publishPostService = async (data: PublishPostData): Promise<Post> => {
  let imageUrl: string | undefined = undefined;

  if (data.imageFile) {
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = data.imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `mural-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("mural-media")
          .upload(filePath, data.imageFile, {
            contentType: data.imageFile.type,
            upsert: false
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("mural-media")
            .getPublicUrl(filePath);

          imageUrl = publicData.publicUrl;
        } else {
          imageUrl = await fileToDataUrl(data.imageFile);
        }
      } catch {
        imageUrl = await fileToDataUrl(data.imageFile);
      }
    } else {
      imageUrl = await fileToDataUrl(data.imageFile);
    }
  }

  const newPost: Post = {
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: data.currentUser.id,
    user_name: data.currentUser.name,
    user_avatar: data.currentUser.avatar,
    user_role:
      data.currentUser.role === UserRole.HR_MANAGER
        ? "Gestor de RH"
        : data.currentUser.role === UserRole.SUPER_ADMIN
        ? "Super Admin"
        : data.currentUser.role === UserRole.SUPERVISOR
        ? "Líder / Supervisor"
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
    is_pinned: false,
    is_edited: false,
    created_at: new Date().toISOString()
  };

  // 1. Persistir no Supabase se configurado
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: insertedPost, error: dbError } = await supabase
        .from("posts")
        .insert([
          {
            company_id: data.companyId,
            user_id: data.currentUser.id,
            user_name: data.currentUser.name,
            user_avatar: data.currentUser.avatar,
            user_role: newPost.user_role,
            user_department: data.currentUser.department,
            content: data.content,
            category: data.category,
            media_url: imageUrl || null,
            media_type: newPost.media_type,
            likes: [],
            comments: [],
            is_pinned: false,
            is_edited: false,
            poll: data.poll || null,
            badge_award: data.badgeAward || null
          }
        ])
        .select()
        .single();

      if (!dbError && insertedPost) {
        newPost.id = insertedPost.id;
        newPost.created_at = insertedPost.created_at;
      }
    } catch (err) {
      console.warn("[Mural] Aviso ao salvar post no Supabase:", err);
    }
  }

  // 2. Persistir no Banco de Dados do Servidor e transmitir via SSE para todos os colaboradores
  try {
    const res = await fetch("/api/mural/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.post) {
        return normalizePostFromDB(json.post);
      }
    }
  } catch (err) {
    console.warn("[Mural] Erro ao salvar post na API do servidor:", err);
  }

  return newPost;
};

/**
 * Atualiza uma postagem no Banco de Dados (curtidas, comentários, votos na enquete, edição ou fixação).
 */
export const updatePostService = async (post: Post): Promise<Post> => {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("posts")
        .update({
          content: post.content,
          category: post.category,
          likes: post.likes,
          comments: post.comments,
          poll: post.poll || null,
          badge_award: post.badge_award || null,
          is_pinned: Boolean(post.is_pinned),
          is_edited: Boolean(post.is_edited),
          updated_at: new Date().toISOString()
        })
        .eq("id", post.id);
    } catch (err) {
      console.warn("[Mural] Aviso ao atualizar post no Supabase:", err);
    }
  }

  try {
    const res = await fetch(`/api/mural/posts/${encodeURIComponent(post.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.post) {
        return normalizePostFromDB(json.post);
      }
    }
  } catch (err) {
    console.warn("[Mural] Erro ao atualizar post na API do servidor:", err);
  }

  return post;
};

/**
 * Remove uma postagem do Banco de Dados.
 */
export const deletePostService = async (postId: string): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("posts").delete().eq("id", postId);
    } catch (err) {
      console.warn("[Mural] Aviso ao excluir post no Supabase:", err);
    }
  }

  try {
    await fetch(`/api/mural/posts/${encodeURIComponent(postId)}`, {
      method: "DELETE"
    });
  } catch (err) {
    console.warn("[Mural] Erro ao excluir post na API do servidor:", err);
  }
};
