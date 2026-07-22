import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Sparkles,
  Award,
  Trash2,
  Edit2,
  X,
  Vote,
  Send,
  Plus,
  BarChart2
} from "lucide-react";
import { UserProfile, Post, UserRole } from "../types";
import { BADGE_OPTIONS, POST_CATEGORIES } from "../utils/constants";
import { getTimeAgo } from "../utils/formatters";

interface MuralProps {
  currentUser: UserProfile;
  users: UserProfile[];
  posts: Post[];
  activeCompanyId: string;
  onAddPost: (post: Post) => void;
  onUpdatePost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
}

export const Mural: React.FC<MuralProps> = ({
  currentUser,
  users,
  posts,
  activeCompanyId,
  onAddPost,
  onUpdatePost,
  onDeletePost
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<Post["category"]>("aviso");
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [selectedBadge, setSelectedBadge] = useState<typeof BADGE_OPTIONS[0] | null>(null);
  const [badgeRecipientId, setBadgeRecipientId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "pdf" | "video" | "none">("none");

  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const companyPosts = posts.filter((p) => p.company_id === activeCompanyId);
  const companyUsers = users.filter((u) => u.company_id === activeCompanyId);

  const filteredPosts =
    selectedCategory === "todos"
      ? companyPosts
      : companyPosts.filter((p) => p.category === selectedCategory);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    let pollData;
    if (showPollBuilder && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2) {
      pollData = {
        question: pollQuestion.trim(),
        options: pollOptions
          .filter((o) => o.trim())
          .map((opt, idx) => ({
            id: `opt-${Date.now()}-${idx}`,
            text: opt.trim(),
            votes: []
          }))
      };
    }

    let badgeData;
    if (selectedBadge && badgeRecipientId) {
      const recipient = users.find((u) => u.id === badgeRecipientId);
      if (recipient) {
        badgeData = {
          badge_name: selectedBadge.name,
          icon: selectedBadge.icon,
          description: selectedBadge.description,
          recipient_name: recipient.name,
          recipient_id: recipient.id
        };
      }
    }

    const newPost: Post = {
      id: `post-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      user_role:
        currentUser.role === UserRole.HR_MANAGER
          ? "Gestor de RH"
          : currentUser.role === UserRole.SUPER_ADMIN
          ? "Super Admin"
          : "Colaborador",
      user_department: currentUser.department,
      company_id: activeCompanyId,
      content: newPostContent.trim(),
      category: newPostCategory,
      media_url: mediaUrl || undefined,
      media_type: mediaUrl ? mediaType : "none",
      likes: [],
      comments: [],
      poll: pollData,
      badge_award: badgeData,
      created_at: new Date().toISOString()
    };

    onAddPost(newPost);

    // Reset Form
    setNewPostContent("");
    setShowPollBuilder(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setSelectedBadge(null);
    setBadgeRecipientId("");
    setMediaUrl("");
    setMediaType("none");
  };

  const handleToggleLike = (post: Post) => {
    const hasLiked = post.likes.includes(currentUser.id);
    const newLikes = hasLiked
      ? post.likes.filter((id) => id !== currentUser.id)
      : [...post.likes, currentUser.id];

    onUpdatePost({ ...post, likes: newLikes });
  };

  const handleVotePoll = (post: Post, optionId: string) => {
    if (!post.poll) return;

    const newOptions = post.poll.options.map((opt) => {
      // Remove vote if user already voted in another option
      const cleanVotes = opt.votes.filter((uid) => uid !== currentUser.id);
      if (opt.id === optionId) {
        return { ...opt, votes: [...cleanVotes, currentUser.id] };
      }
      return { ...opt, votes: cleanVotes };
    });

    onUpdatePost({
      ...post,
      poll: {
        ...post.poll,
        options: newOptions
      }
    });
  };

  const handleAddComment = (post: Post) => {
    const text = commentInputs[post.id];
    if (!text || !text.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      text: text.trim(),
      created_at: new Date().toISOString()
    };

    onUpdatePost({
      ...post,
      comments: [...post.comments, newComment]
    });

    setCommentInputs({ ...commentInputs, [post.id]: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Main Feed Column */}
      <div className="lg:col-span-8 space-y-6">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pb-1">
          {POST_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider transition cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#14B8A6] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Composer Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex items-start gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div className="flex-1">
                <textarea
                  placeholder="Compartilhe um aviso importante, comemoração ou novidade..."
                  className="w-full border-none outline-none text-sm placeholder-slate-400 resize-none min-h-[70px] pt-1"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
              </div>
            </div>

            {/* Poll Builder View */}
            {showPollBuilder && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => setShowPollBuilder(false)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 mb-1">
                  <Vote className="w-4 h-4" /> Criar Enquete Corporativa
                </div>
                <input
                  type="text"
                  placeholder="Pergunta da Enquete..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-[#14B8A6] focus:outline-none bg-white font-medium"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Opção ${idx + 1}`}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 px-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="text-[11px] text-teal-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Opção
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <select
                  className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value as Post["category"])}
                >
                  <option value="aviso">Aviso</option>
                  <option value="operacao">Operação</option>
                  <option value="comemoracao">Comemoração</option>
                  <option value="treinamento">Treinamento</option>
                  <option value="destaque">Destaque</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowPollBuilder(!showPollBuilder)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                    showPollBuilder
                      ? "bg-teal-50 border-teal-200 text-teal-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Enquete
                </button>
              </div>

              <button
                type="submit"
                disabled={!newPostContent.trim()}
                className="bg-[#14B8A6] hover:bg-teal-600 disabled:bg-teal-200 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-teal-500/10 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Publicar
              </button>
            </div>
          </form>
        </div>

        {/* Feed Posts List */}
        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const hasLiked = post.likes.includes(currentUser.id);

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.user_avatar}
                      alt={post.user_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{post.user_name}</span>
                        <span className="text-[10px] font-extrabold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {post.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {post.user_department} • {getTimeAgo(post.created_at)}
                      </div>
                    </div>
                  </div>

                  {(post.user_id === currentUser.id ||
                    currentUser.role === UserRole.HR_MANAGER ||
                    currentUser.role === UserRole.SUPER_ADMIN) && (
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition"
                      title="Excluir postagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                  {post.content}
                </div>

                {/* Badge Award Banner */}
                {post.badge_award && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
                    <span className="text-3xl">{post.badge_award.icon}</span>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {post.badge_award.recipient_name} recebeu "{post.badge_award.badge_name}"
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {post.badge_award.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Poll View */}
                {post.poll && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Vote className="w-4 h-4 text-teal-600" /> {post.poll.question}
                    </h5>
                    <div className="space-y-2">
                      {post.poll.options.map((opt) => {
                        const totalVotes = post.poll?.options.reduce(
                          (acc, o) => acc + o.votes.length,
                          0
                        ) || 1;
                        const percentage = Math.round((opt.votes.length / (totalVotes || 1)) * 100);
                        const isVoted = opt.votes.includes(currentUser.id);

                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleVotePoll(post, opt.id)}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-semibold relative overflow-hidden transition cursor-pointer ${
                              isVoted
                                ? "border-teal-400 bg-teal-50/60 text-teal-900"
                                : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <div
                              className="absolute top-0 left-0 bottom-0 bg-teal-200/30 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="relative z-10 flex justify-between items-center">
                              <span>
                                {opt.text} {isVoted && "✓"}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {percentage}% ({opt.votes.length})
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Bar (Likes & Comments Count) */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                  <button
                    onClick={() => handleToggleLike(post)}
                    className={`flex items-center gap-1.5 hover:text-[#14B8A6] transition ${
                      hasLiked ? "text-[#14B8A6] font-bold" : ""
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`} />
                    <span>{post.likes.length} Curtidas</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    <span>{post.comments.length} Comentários</span>
                  </div>
                </div>

                {/* Comments List */}
                {post.comments.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    {post.comments.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl text-xs"
                      >
                        <img
                          src={c.user_avatar}
                          alt={c.user_name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-800">{c.user_name}</div>
                          <div className="text-slate-600 mt-0.5">{c.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Escreva um comentário..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-[#14B8A6] focus:outline-none"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment(post);
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(post)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs transition"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Widget Column */}
      <div className="lg:col-span-4 space-y-6">
        {/* Birthdays Widget */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h3 className="font-bold text-slate-800 text-sm">Aniversariantes do Mês</h3>
          </div>
          <div className="space-y-3">
            {companyUsers.slice(0, 3).map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 bg-pink-50/40 p-3 rounded-xl border border-pink-100/50"
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-9 h-9 rounded-full object-cover border border-white"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{u.name}</div>
                  <div className="text-[10px] text-pink-600 font-semibold">
                    {u.department}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Recognitions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-[#0043FF]" />
            <h3 className="font-bold text-slate-800 text-sm">Quadro de Reconhecimento</h3>
          </div>
          <div className="space-y-3">
            {BADGE_OPTIONS.slice(0, 3).map((badge) => (
              <div
                key={badge.name}
                className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100"
              >
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <div className="text-xs font-bold text-slate-800">{badge.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
