import { useState, useEffect, useCallback } from "react";
import {
  Company,
  UserProfile,
  Invitation,
  Training,
  TimeRecord,
  Post,
  Goal
} from "../types";
import { dataService } from "../services/dataService";
import {
  fetchPostsService,
  updatePostService,
  deletePostService
} from "../services/muralService";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { INITIAL_GOALS } from "../utils/constants";

export function useHRData() {
  const [companies, setCompanies] = useState<Company[]>(() => dataService.getCompanies());
  const [users, setUsers] = useState<UserProfile[]>(() => dataService.getUsers());
  const [invitations, setInvitations] = useState<Invitation[]>(() => dataService.getInvitations());
  const [trainings, setTrainings] = useState<Training[]>(() => dataService.getTrainings());
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(() => dataService.getTimeRecords());
  const [posts, setPosts] = useState<Post[]>(() => dataService.getPosts());
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);

  // Sync to localStorage cache
  useEffect(() => {
    dataService.saveCompanies(companies);
  }, [companies]);

  useEffect(() => {
    dataService.saveUsers(users);
  }, [users]);

  useEffect(() => {
    dataService.saveInvitations(invitations);
  }, [invitations]);

  useEffect(() => {
    dataService.saveTrainings(trainings);
  }, [trainings]);

  useEffect(() => {
    dataService.saveTimeRecords(timeRecords);
  }, [timeRecords]);

  useEffect(() => {
    dataService.savePosts(posts);
  }, [posts]);

  // Initial sync from Database (Posts & Collaborators)
  const syncFromDatabase = useCallback(async () => {
    try {
      const dbPosts = await fetchPostsService();
      if (dbPosts && dbPosts.length > 0) {
        setPosts(dbPosts);
      }

      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        if (Array.isArray(usersJson.users) && usersJson.users.length > 0) {
          setUsers(usersJson.users);
        }
      }
    } catch (err) {
      console.warn("[useHRData] Erro ao sincronizar dados iniciais do banco:", err);
    }
  }, []);

  useEffect(() => {
    syncFromDatabase();
  }, [syncFromDatabase]);

  // Real-Time Subscription via SSE Stream (/api/realtime/stream) + Supabase Realtime
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/realtime/stream");

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === "mural:post_created" && data.payload) {
            const incomingPost = data.payload as Post;
            setPosts((prev) => {
              if (prev.some((p) => p.id === incomingPost.id)) return prev;
              return [incomingPost, ...prev];
            });
          } else if (data.event === "mural:post_updated" && data.payload) {
            const updatedPost = data.payload as Post;
            setPosts((prev) =>
              prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
            );
          } else if (data.event === "mural:post_deleted" && data.payload?.id) {
            setPosts((prev) => prev.filter((p) => p.id !== data.payload.id));
          } else if (data.event === "users:updated" && Array.isArray(data.payload?.users)) {
            setUsers(data.payload.users);
          }
        } catch {
          // ignore malformed event
        }
      };
    } catch (err) {
      console.warn("[useHRData] SSE stream indisponível:", err);
    }

    // Supabase Realtime subscription for posts table if configured
    let sbChannel: any = null;
    if (isSupabaseConfigured && supabase) {
      const channelName = "public:mural_posts_realtime";
      try {
        const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
        if (existing) {
          supabase.removeChannel(existing);
        }
      } catch {
        // ignore
      }

      sbChannel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "posts" },
          () => {
            fetchPostsService().then((dbPosts) => {
              if (dbPosts) setPosts(dbPosts);
            });
          }
        )
        .subscribe();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (sbChannel && supabase) {
        try {
          supabase.removeChannel(sbChannel);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // CRUD helpers persisted in Database
  const addUser = (newUser: UserProfile) => {
    setUsers((prev) => {
      if (prev.some((u) => u.id === newUser.id)) return prev;
      return [newUser, ...prev];
    });
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    }).catch((err) => console.warn("Erro ao salvar usuário no banco:", err));
  };

  const updateUser = (updatedUser: UserProfile) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    fetch(`/api/users/${encodeURIComponent(updatedUser.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser)
    }).catch((err) => console.warn("Erro ao atualizar usuário no banco:", err));
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    fetch(`/api/users/${encodeURIComponent(userId)}`, {
      method: "DELETE"
    }).catch((err) => console.warn("Erro ao remover usuário no banco:", err));
  };

  const addCompany = (newCompany: Company) => {
    setCompanies((prev) => [...prev, newCompany]);
  };

  const addPost = (newPost: Post) => {
    setPosts((prev) => {
      if (prev.some((p) => p.id === newPost.id)) return prev;
      return [newPost, ...prev];
    });
  };

  const updatePost = (updatedPost: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    updatePostService(updatedPost).catch((err) =>
      console.warn("Erro ao persistir atualização do post:", err)
    );
  };

  const deletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    deletePostService(postId).catch((err) =>
      console.warn("Erro ao excluir post do banco:", err)
    );
  };

  const addRecord = (newRecord: TimeRecord) => {
    setTimeRecords((prev) => [newRecord, ...prev]);
  };

  const addInvitation = (newInvitation: Invitation) => {
    setInvitations((prev) => [newInvitation, ...prev]);
  };

  return {
    companies,
    setCompanies,
    users,
    setUsers,
    invitations,
    setInvitations,
    trainings,
    setTrainings,
    timeRecords,
    setTimeRecords,
    posts,
    setPosts,
    goals,
    setGoals,
    addUser,
    updateUser,
    deleteUser,
    addCompany,
    addPost,
    updatePost,
    deletePost,
    addRecord,
    addInvitation
  };
}
