import React from "react";
import { Megaphone, ArrowRight, Heart, MessageSquare, Award, BarChart2, Pin } from "lucide-react";
import { Post } from "../types";
import { getTimeAgo } from "../utils/formatters";

interface GlobalAnnouncementsProps {
  posts: Post[];
  onNavigateTab: (tab: string) => void;
}

export const GlobalAnnouncements: React.FC<GlobalAnnouncementsProps> = ({
  posts,
  onNavigateTab,
}) => {
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getCategoryBadge = (category: Post["category"]) => {
    switch (category) {
      case "aviso":
        return {
          label: "Aviso",
          className: "bg-blue-50 text-blue-700 border-blue-200/80",
        };
      case "operacao":
        return {
          label: "Operação",
          className: "bg-amber-50 text-amber-700 border-amber-200/80",
        };
      case "comemoracao":
        return {
          label: "Comemoração",
          className: "bg-purple-50 text-purple-700 border-purple-200/80",
        };
      case "treinamento":
        return {
          label: "Treinamento",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        };
      case "destaque":
        return {
          label: "Destaque",
          className: "bg-rose-50 text-rose-700 border-rose-200/80",
        };
      default:
        return {
          label: category,
          className: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full max-h-[calc(100vh-120px)] sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-xl text-[#0043FF]">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Avisos Globais</h3>
            <p className="text-[11px] text-slate-400">Feed oficial de notícias</p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab("mural")}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0043FF] hover:text-blue-700 hover:underline transition cursor-pointer"
        >
          <span>Ir para o Mural</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Announcements List */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
        {sortedPosts.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
            <p className="text-xs text-slate-400 font-medium">
              Nenhum aviso publicado no momento.
            </p>
          </div>
        ) : (
          sortedPosts.map((post) => {
            const badge = getCategoryBadge(post.category);
            return (
              <div
                key={post.id}
                className={`p-3.5 rounded-xl border transition-all duration-200 group ${
                  post.is_pinned
                    ? "bg-teal-50/60 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800"
                    : "bg-slate-50/70 hover:bg-slate-50 border-slate-100 dark:border-slate-800"
                }`}
              >
                {/* Author info & Tag */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={post.user_avatar}
                      alt={post.user_name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-white shadow-xs"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate flex items-center gap-1">
                        <span>{post.user_name}</span>
                        {post.is_edited && (
                          <span className="text-[9px] text-slate-400 font-normal">(editado)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {getTimeAgo(post.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {post.is_pinned && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white flex items-center gap-0.5 shadow-xs">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        Fixado
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-2.5">
                  {post.content}
                </p>

                {/* Poll / Award Attachments */}
                {post.badge_award && (
                  <div className="mb-2.5 p-2 bg-amber-50/80 border border-amber-200/60 rounded-lg flex items-center gap-2 text-amber-900 text-[11px] font-medium">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">
                      Elogio enviado para <strong>{post.badge_award.recipient_name}</strong>
                    </span>
                  </div>
                )}

                {post.poll && (
                  <div className="mb-2.5 p-2 bg-indigo-50/80 border border-indigo-200/60 rounded-lg flex items-center gap-2 text-indigo-900 text-[11px] font-medium">
                    <BarChart2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">Enquete: {post.poll.question}</span>
                  </div>
                )}

                {/* Footer stats */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/40">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      {post.likes ? post.likes.length : 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-blue-400" />
                      {post.comments ? post.comments.length : 0}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateTab("mural")}
                    className="text-[10px] font-semibold text-slate-500 hover:text-[#0043FF] group-hover:underline"
                  >
                    Ver no Mural
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
