import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Heart, MessageCircle, Repeat2, ArrowLeft, Loader2, ImagePlus, X, Trash2, Paperclip, File as FileIcon, Smile, Flag, ShieldCheck, ShieldX, Home, Settings as SettingsIcon, Share2, Pencil, MoreHorizontal, Tv, Megaphone, MessagesSquare, Box, Coffee, Plus, Video, Search, HelpCircle, Newspaper, MessageSquare, CheckCircle2, FileText, Image as ImageIcon, LogOut, ClipboardCheck, User, Users, Handshake, Copy } from "lucide-react";
import { initPush } from "./push.js";

const MAX_LEN = 280;
const uid = () => Math.random().toString(36).slice(2, 10);

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m}分钟`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时`;
  const d = Math.floor(h / 24);
  return `${d}天`;
}

function handleFromName(name) {
  return "@" + (name.trim() ? name.trim().toLowerCase().replace(/\s+/g, "") : "guest");
}

function MediaPreview({ url, style, onOpen }) {
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      style={{ ...styles.media, cursor: onOpen ? "zoom-in" : "default", ...style }}
      onClick={(e) => {
        e.stopPropagation();
        if (onOpen) onOpen(url);
      }}
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  );
}

function PhotoStrip({ urls, onOpen, style }) {
  if (!urls || !urls.length) return null;
  const items = urls.slice(0, 9);
  return (
    <div
      className="photo-strip no-scrollbar"
      style={{
        display: "flex",
        alignItems: "center",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollSnapType: "x proximity",
        scrollBehavior: "smooth",
        padding: "6px 12px 6px 4px",
        marginTop: 8,
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((url, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            flex: "0 0 auto",
            width: 132,
            height: 132,
            marginLeft: i === 0 ? 0 : -66,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(20,30,28,0.20)",
            scrollSnapAlign: "start",
            zIndex: i + 1,
            cursor: "zoom-in",
            transition: "transform .25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpen) onOpen(url);
          }}
        >
          <img
            src={url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      ))}
    </div>
  );
}

async function shareImageUrl(url) {
  try {
    if (navigator.share) {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    }
  } catch (e) {
    // fall through to download
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = "photo.jpg";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function ImageLightbox({ url, onClose }) {
  if (!url) return null;
  return (
    <div style={styles.lightboxOverlay} onClick={onClose}>
      <div style={styles.lightboxTopBar} onClick={(e) => e.stopPropagation()}>
        <button style={styles.lightboxIconBtn} onClick={onClose}>
          <X size={20} />
        </button>
        <button style={styles.lightboxIconBtn} onClick={() => shareImageUrl(url)}>
          <Share2 size={19} />
        </button>
      </div>
      <img
        src={url}
        alt=""
        style={styles.lightboxImg}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function ComposeRing({ value, max }) {
  const pct = Math.min(value / max, 1);
  const r = 9;
  const c = 2 * Math.PI * r;
  const over = value > max;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r={r} fill="none" stroke="#e7e3da" strokeWidth="2.4" />
      <circle
        cx="11"
        cy="11"
        r={r}
        fill="none"
        stroke={over ? "#d1394f" : "#0f6e5c"}
        strokeWidth="2.4"
        strokeDasharray={c}
        strokeDashoffset={c - c * pct}
        strokeLinecap="round"
        transform="rotate(-90 11 11)"
        style={{ transition: "stroke-dashoffset .15s ease" }}
      />
    </svg>
  );
}

const COLOR_SWATCHES = [
  "#0f6e5c",
  "#2d3a63",
  "#a45a2a",
  "#5b4b8a",
  "#3d6b8a",
  "#8a3d55",
  "#6b8a3d",
  "#8a6a2a",
  "#d4e5ef",
  "#f5fbfe",
  "#c8d8e1",
  "#d8e699",
  "#6bb392",
];

function Avatar({ name, size = 40, avatarUrl, color }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  const initial = (name.trim()[0] || "?").toUpperCase();
  const hue = color || COLOR_SWATCHES[name.length % COLOR_SWATCHES.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: hue,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

// --- storage layer: talks to the Cloudflare Pages Function at /api/data ---
async function loadPosts() {
  const res = await fetch("/api/data");
  if (!res.ok) throw new Error("load failed");
  const data = await res.json();
  // Backward-compatible: accept either the correct { posts: [...] } shape
  // or a raw array (in case an older/broken save wrote one directly).
  if (Array.isArray(data)) return data;
  return data.posts || [];
}

async function savePosts(posts) {
  const res = await fetch("/api/data", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ posts }),
  });
  if (!res.ok) throw new Error("save failed");
}

// Compress the picked image and turn it into a data: URL directly in the
// browser — no external image host, no server round trip, nothing to break.
function compressImageToDataUrl(file, maxDim = 1080, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB raw file cap

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error("文件太大了，最大支持 4MB"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取失败"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.6 5.6C41.6 36.2 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function FileChip({ name, size, url }) {
  return (
    <a
      href={url}
      download={name || "file"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.7)",
        color: "#2b271f",
        fontSize: 13,
        textDecoration: "none",
        marginTop: 8,
        maxWidth: "100%",
      }}
    >
      <FileIcon size={16} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name || "文件"}
      </span>
      {size ? <span style={{ color: "#9a968a", flexShrink: 0 }}>{formatFileSize(size)}</span> : null}
    </a>
  );
}

const EMOJI_LIST = [
  "😀", "😂", "🥹", "😍", "🤔", "😅", "😭", "😡", "😴", "🥳",
  "😎", "🙄", "😱", "🤗", "🤝", "👍", "👎", "👏", "🙏", "💪",
  "❤️", "💔", "🔥", "✨", "🎉", "🎂", "☕", "🍺", "🐱", "🐶",
  "🌟", "🌈", "☀️", "🌙", "⚡", "💯", "✅", "❌", "😢", "😆",
];

function EmojiPicker({ onPick, onClose }) {
  return (
    <div style={styles.emojiPopover}>
      {EMOJI_LIST.map((e) => (
        <button
          key={e}
          type="button"
          style={styles.emojiBtn}
          onClick={() => {
            onPick(e);
            onClose();
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function ChannelCarousel({ title, items, canPost, onDelete, onOpenImage, isDark, ds, syncTick }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!items.length) return;
    const next = syncTick % items.length;
    setIndex(next);
    const el = scrollRef.current;
    const card = el && el.children[next];
    if (el && card) {
      el.scrollTo({
        left: card.offsetLeft - (el.clientWidth - card.clientWidth) / 2,
        behavior: "smooth",
      });
    }
  }, [syncTick, items.length]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || !el.children.length) return;
    let closest = 0;
    let closestDist = Infinity;
    const center = el.scrollLeft + el.clientWidth / 2;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    setIndex(closest);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={ds(styles.channelSlotLabel, styles.channelSlotLabelDark)}>{title}</div>
      {items.length > 0 ? (
        <>
          <div ref={scrollRef} onScroll={handleScroll} style={styles.channelCarousel}>
            {items.map((it) => (
              <div key={it.id} style={ds(styles.channelSlide, styles.channelSlideDark)}>
                {it.imageUrl && (
                  <img
                    src={it.imageUrl}
                    alt=""
                    style={styles.channelSlideImg}
                    onClick={() => onOpenImage(it.imageUrl)}
                  />
                )}
                {it.caption && (
                  <div style={ds(styles.channelSlideCaption, styles.channelSlideCaptionDark)}>
                    {it.caption}
                  </div>
                )}
                <div style={styles.channelSlideMeta}>
                  {it.authorName} <RoleBadge role={it.authorRole} />
                </div>
                {canPost && (
                  <button style={styles.channelDeleteBtn} onClick={() => onDelete(it.id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {items.length > 1 && (
            <div style={styles.channelDots}>
              {items.map((_, i) => (
                <span
                  key={i}
                  style={{ ...styles.channelDot, ...(i === index ? styles.channelDotActive : {}) }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={ds(styles.channelSlideEmpty, styles.channelSlideEmptyDark)}>暂无内容</div>
      )}
    </div>
  );
}

function BoardView({
  boardId,
  board,
  posts,
  user,
  myId,
  displayName,
  handle,
  isMod,
  isDark,
  ds,
  canDelete,
  deletePost,
  reportPost,
  repostPost,
  toggleLike,
  likedLocal,
  persist,
  posts_setPosts,
  setView,
  onOpenImage,
  onOpenProfile,
}) {
  const [draft, setDraft] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const feedbackFileRef = useRef(null);
  const feedbackVideoRef = useRef(null);
  const feedbackPhotoRef = useRef(null);
  const [feedbackAttachment, setFeedbackAttachment] = useState(null);
  const [feedbackAttachBusy, setFeedbackAttachBusy] = useState(false);
  const [feedbackAttachError, setFeedbackAttachError] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const isFeedbackBoard = boardId === "feedback";

  const boardPosts = useMemo(
    () =>
      posts
        .filter((p) => p.boardId === boardId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [posts, boardId]
  );

  async function handleFilePicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await compressImageToDataUrl(file);
      setMediaUrl(url);
    } catch (err) {
      // ignore — non-critical preview failure
    } finally {
      setUploading(false);
    }
  }

  function submitBoardPost() {
    if (!user) return;
    const text = draft.trim();
    if (!text && !mediaUrl) return;
    const post = {
      id: uid(),
      author: displayName,
      handle,
      authorId: myId,
      authorRole: user.role || "user",
      authorAvatar: user.avatarUrl || null,
      authorColor: user.color || null,
      body: text,
      mediaUrl: mediaUrl || null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      pending: false,
      reports: [],
      boardId,
      createdAt: Date.now(),
      likes: 0,
      likedBy: [],
      replies: [],
    };
    const next = [post, ...posts];
    posts_setPosts(next);
    persist(next);
    setDraft("");
    setMediaUrl("");
  }

  async function handleFeedbackAttachPicked(e, kind) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setFeedbackAttachError(null);
    setFeedbackAttachBusy(true);
    try {
      const url = kind === "照片" ? await compressImageToDataUrl(file) : await readFileAsDataUrl(file);
      setFeedbackAttachment({ kind, name: file.name, size: file.size, url });
    } catch (err) {
      setFeedbackAttachError(err.message || "文件处理失败，请重试");
    } finally {
      setFeedbackAttachBusy(false);
    }
  }

  function submitFeedback() {
    if (!user) return;
    const text = draft.trim();
    if (!text && !feedbackAttachment) return;
    const isPhoto = feedbackAttachment && feedbackAttachment.kind === "照片";
    const post = {
      id: uid(),
      author: displayName,
      handle,
      authorId: myId,
      authorRole: user.role || "user",
      authorAvatar: user.avatarUrl || null,
      authorColor: user.color || null,
      body: text,
      mediaUrl: isPhoto ? feedbackAttachment.url : null,
      fileUrl: feedbackAttachment && !isPhoto ? feedbackAttachment.url : null,
      fileName: feedbackAttachment && !isPhoto ? feedbackAttachment.name : null,
      fileSize: feedbackAttachment && !isPhoto ? feedbackAttachment.size : null,
      pending: false,
      resolved: false,
      reports: [],
      boardId,
      createdAt: Date.now(),
      likes: 0,
      likedBy: [],
      replies: [],
    };
    const next = [post, ...posts];
    posts_setPosts(next);
    persist(next);
    setDraft("");
    setFeedbackAttachment(null);
    setFeedbackSubmitted(true);
  }

  function toggleFeedbackResolved(postId, resolved) {
    const next = posts.map((p) => (p.id === postId ? { ...p, resolved } : p));
    posts_setPosts(next);
    persist(next);
  }

  const Icon = board?.Icon;
  const isOfficial = !!user && user.role === "official";

  const myFeedbackPosts = useMemo(
    () =>
      posts
        .filter((p) => p.boardId === "feedback" && p.authorId === myId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [posts, myId]
  );

  if (isFeedbackBoard && isMod && !isOfficial) {
    return (
      <div className="view-slide">
        <div style={ds(styles.channelHeaderBar, styles.channelHeaderBarDark)}>
          <button style={styles.backBtn} onClick={() => setView("channel")}>
            <ArrowLeft size={18} /> 返回
          </button>
          <span style={styles.channelHeaderTitle}>
            {Icon && <Icon size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />}
            {board?.name || "意见反馈"}
          </span>
          <span style={{ width: 46 }} />
        </div>
        <div style={styles.empty}>仅官方账号可查看意见反馈的具体内容</div>
      </div>
    );
  }

  if (isFeedbackBoard && !isMod) {
    return (
      <div className="view-slide">
        <div style={ds(styles.channelHeaderBar, styles.channelHeaderBarDark)}>
          <button style={styles.backBtn} onClick={() => setView("channel")}>
            <ArrowLeft size={18} /> 返回
          </button>
          <span style={styles.channelHeaderTitle}>
            {Icon && <Icon size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />}
            {board?.name || "意见反馈"}
          </span>
          <span style={{ width: 46 }} />
        </div>

        {feedbackSubmitted ? (
          <div style={styles.feedbackConfirmWrap}>
            <CheckCircle2 size={72} style={styles.feedbackConfirmIcon} />
            <div style={ds(styles.feedbackConfirmText, styles.feedbackConfirmTextDark)}>已通知管理员</div>
            <div style={ds(styles.feedbackConfirmSub, styles.feedbackConfirmSubDark)}>
              预计在一至五天工作日回复
            </div>
            <button
              style={styles.feedbackBackLink}
              onClick={() => setFeedbackSubmitted(false)}
            >
              <ArrowLeft size={14} /> 返回
            </button>
          </div>
        ) : (
          <div style={ds(styles.feedbackComposeWrap, styles.feedbackComposeWrapDark)}>
            <div style={ds(styles.feedbackComposeTitle, styles.feedbackComposeTitleDark)}>反馈意见</div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="请描述你遇到的问题或建议…"
              rows={8}
              style={ds(styles.feedbackTextarea, styles.feedbackTextareaDark)}
            />
            <input
              ref={feedbackFileRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => handleFeedbackAttachPicked(e, "文件")}
            />
            <input
              ref={feedbackVideoRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={(e) => handleFeedbackAttachPicked(e, "视频文件")}
            />
            <input
              ref={feedbackPhotoRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFeedbackAttachPicked(e, "照片")}
            />
            <div style={styles.feedbackAttachRow}>
              <button type="button" style={styles.feedbackAttachBtn} onClick={() => feedbackFileRef.current && feedbackFileRef.current.click()}>
                <FileText size={14} /> 文件
              </button>
              <button type="button" style={styles.feedbackAttachBtn} onClick={() => feedbackVideoRef.current && feedbackVideoRef.current.click()}>
                <Video size={14} /> 视频文件
              </button>
              <button type="button" style={styles.feedbackAttachBtn} onClick={() => feedbackPhotoRef.current && feedbackPhotoRef.current.click()}>
                <ImageIcon size={14} /> 照片
              </button>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                style={styles.feedbackUploadBtn}
                disabled={(!draft.trim() && !feedbackAttachment) || feedbackAttachBusy}
                onClick={submitFeedback}
              >
                上传
              </button>
            </div>
            {feedbackAttachBusy && (
              <div style={styles.uploadingRow}>
                <Loader2 size={14} className="spin" /> 文件处理中…
              </div>
            )}
            {feedbackAttachError && (
              <div style={styles.errorNote}>{feedbackAttachError}</div>
            )}
            {feedbackAttachment && !feedbackAttachBusy && (
              <div style={ds(styles.feedbackAttachedName, styles.feedbackAttachedNameDark)}>
                已选择{feedbackAttachment.kind}：{feedbackAttachment.name}
                <button
                  type="button"
                  style={styles.feedbackAttachRemoveBtn}
                  onClick={() => setFeedbackAttachment(null)}
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {myFeedbackPosts.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={ds(styles.feedbackHistoryTitle, styles.feedbackHistoryTitleDark)}>我的反馈记录</div>
            {myFeedbackPosts.map((p) => (
              <div key={p.id} style={ds(styles.feedbackHistoryCard, styles.feedbackHistoryCardDark)}>
                <div style={ds(styles.feedbackHistoryBody, styles.feedbackHistoryBodyDark)}>{p.body}</div>
                <div style={styles.feedbackHistoryFootRow}>
                  <span style={styles.feedbackHistoryTime}>{timeAgo(p.createdAt)}</span>
                  <span
                    style={
                      p.resolved
                        ? styles.feedbackStatusDone
                        : styles.feedbackStatusPending
                    }
                  >
                    {p.resolved ? "已完成" : "处理中"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="view-slide">
      <div style={ds(styles.channelHeaderBar, styles.channelHeaderBarDark)}>
        <button style={styles.backBtn} onClick={() => setView("channel")}>
          <ArrowLeft size={18} /> 返回
        </button>
        <span style={styles.channelHeaderTitle}>
          {Icon && <Icon size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />}
          {board?.name || "板块"}
        </span>
        <span style={{ width: 46 }} />
      </div>

      {user?.bannedFeed ? (
        <div style={styles.errorNote}>你已被禁止发帖/评论</div>
      ) : isFeedbackBoard ? null : (
        <div style={ds(styles.composeBox, styles.composeBoxDark)}>
          <Avatar name={displayName} avatarUrl={user?.avatarUrl} color={user?.color} />
          <div style={{ flex: 1 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`发布到"${board?.name || "板块"}"`}
              rows={2}
              style={ds(styles.composeTextarea, styles.composeTextareaDark)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFilePicked}
            />
            {!mediaUrl && !uploading && (
              <button
                type="button"
                style={styles.attachBtn}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <ImagePlus size={15} /> 添加图片
              </button>
            )}
            {uploading && (
              <div style={styles.uploadingRow}>
                <Loader2 size={14} className="spin" /> 图片处理中…
              </div>
            )}
            {mediaUrl && (
              <div style={styles.mediaPreviewWrap}>
                <MediaPreview url={mediaUrl} style={{ marginTop: 8 }} />
                <button
                  type="button"
                  style={styles.removeMediaBtn}
                  onClick={() => setMediaUrl("")}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                className="post-btn"
                style={styles.postBtn}
                disabled={!draft.trim() && !mediaUrl}
                onClick={submitBoardPost}
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}

      {boardPosts.length === 0 ? (
        <div style={styles.empty}>这个板块还没有内容</div>
      ) : (
        boardPosts.map((p) => (
          <div key={p.id} style={ds({ ...styles.postCard, ...styles.postCardEdge }, styles.postCardDark)}>
            <div style={{ cursor: "pointer" }} onClick={() => onOpenProfile && onOpenProfile(p.authorId)}>
              <Avatar name={p.author} avatarUrl={p.authorAvatar} color={p.authorColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.postHeadRow}>
                <span style={{ ...ds(styles.postAuthor, styles.postAuthorDark), cursor: "pointer" }} onClick={() => onOpenProfile && onOpenProfile(p.authorId)}>{p.author}</span>
                <RoleBadge role={p.authorRole} />
                <span style={styles.postHandle}>{p.handle}</span>
                <span style={styles.dot}>·</span>
                <span style={styles.postTime}>{timeAgo(p.createdAt)}</span>
              </div>
              <div style={ds(styles.postBody, styles.postBodyDark)}>{p.body}</div>
              {p.mediaUrl && <MediaPreview url={p.mediaUrl} onOpen={onOpenImage} />}
              {p.fileUrl && <FileChip name={p.fileName} size={p.fileSize} url={p.fileUrl} />}
              {isFeedbackBoard && (
                <div style={styles.feedbackModStatusRow}>
                  <span style={p.resolved ? styles.feedbackStatusDone : styles.feedbackStatusPending}>
                    {p.resolved ? "已完成" : "处理中"}
                  </span>
                  <button
                    type="button"
                    style={p.resolved ? styles.feedbackUnresolveBtn : styles.feedbackResolveBtn}
                    onClick={() => toggleFeedbackResolved(p.id, !p.resolved)}
                  >
                    {p.resolved ? "标记为处理中" : "标记已完成"}
                  </button>
                </div>
              )}
              {p.repostOf && (
                <div style={styles.repostCard}>
                  <div style={styles.repostCardHead}>
                    <Avatar
                      name={p.repostOf.author}
                      size={18}
                      avatarUrl={p.repostOf.authorAvatar}
                      color={p.repostOf.authorColor}
                    />
                    <span style={styles.repostCardAuthor}>{p.repostOf.author}</span>
                    <span style={styles.repostCardHandle}>{p.repostOf.handle}</span>
                  </div>
                  {p.repostOf.body && <div style={styles.repostCardBody}>{p.repostOf.body}</div>}
                  {p.repostOf.mediaUrl && (
                    <MediaPreview url={p.repostOf.mediaUrl} style={{ maxHeight: 200 }} onOpen={onOpenImage} />
                  )}
                </div>
              )}
              <div style={styles.actionRow}>
                <button
                  className="icon-btn"
                  style={styles.actionBtn}
                  onClick={() => repostPost(p)}
                >
                  <Repeat2 size={15} />
                </button>
                <button
                  className={"icon-btn" + (likedLocal[p.id] ? " like-btn active" : "")}
                  style={styles.actionBtn}
                  onClick={() => toggleLike(p.id)}
                >
                  <Heart size={15} fill={likedLocal[p.id] ? "#d1394f" : "none"} /> {p.likes}
                </button>
                {user && myId !== p.authorId && (
                  <button className="icon-btn" style={styles.actionBtn} onClick={() => reportPost(p.id)}>
                    <Flag size={15} />
                  </button>
                )}
                {canDelete(p.authorId) && (
                  <button className="icon-btn" style={styles.actionBtn} onClick={() => deletePost(p.id)}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const NAV_ITEM_WIDTH = 68;
const NAV_ITEM_GAP = 4;

const CHANNEL_BOARDS = [
  { id: "server-promo", name: "服务器宣传", Icon: Megaphone },
  { id: "plugin-discuss", name: "服务器插件讨论", Icon: MessagesSquare },
  { id: "bedrock-plugin", name: "基岩版插件", Icon: Box },
  { id: "java-plugin", name: "Java版插件", Icon: Coffee },
];

const INFO_BOARDS = [
  { id: "faq", name: "常见问题答疑", Icon: HelpCircle },
  { id: "news", name: "新闻资讯", Icon: Newspaper },
  { id: "report", name: "我要举报", Icon: Flag },
  { id: "feedback", name: "意见反馈", Icon: MessageSquare },
];

const ALL_BOARDS = [...CHANNEL_BOARDS, ...INFO_BOARDS];

const ROLE_LABEL = { admin: "管理员", owner: "站主" };
const ROLE_COLOR = { admin: "#3a7ca5", owner: "#8e5bd6" };

function RoleBadge({ role }) {
  if (!role || role === "user") return null;
  if (role === "official") {
    return (
      <img
        src="/official-badge.png"
        alt="官方"
        style={{
          height: 14,
          width: 14,
          objectFit: "contain",
          marginLeft: 4,
          verticalAlign: "middle",
          alignSelf: "center",
          position: "relative",
          top: 1,
        }}
      />
    );
  }
  if (!ROLE_LABEL[role]) return null;
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        color: "#fff",
        background: ROLE_COLOR[role],
        borderRadius: 6,
        padding: "1px 6px",
        marginLeft: 4,
        verticalAlign: "middle",
      }}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

const FRIEND_STATUS_LABEL = {
  none: "加好友",
  outgoing_pending: "申请中",
  incoming_pending: "接受好友申请",
  friends: "已是好友",
};

function FriendsPage({ myId, friendsTabSignal }) {
  const [tab, setTab] = useState("friends"); // "friends" | "requests" | "search"
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [statusMap, setStatusMap] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showMorePanel, setShowMorePanel] = useState(false);
  const [showSocialMenu, setShowSocialMenu] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [pickedFriendIds, setPickedFriendIds] = useState([]);
  const [createGroupBusy, setCreateGroupBusy] = useState(false);
  const [createGroupError, setCreateGroupError] = useState(null);

  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupInput, setGroupInput] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupSending, setGroupSending] = useState(false);
  const [groupError, setGroupError] = useState(null);
  const [groupImage, setGroupImage] = useState(null);
  const [groupImageBusy, setGroupImageBusy] = useState(false);
  const [groupLightboxUrl, setGroupLightboxUrl] = useState(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupCodeCopied, setGroupCodeCopied] = useState(false);
  const groupScrollRef = useRef(null);
  const groupPollRef = useRef(null);
  const groupImageInputRef = useRef(null);

  async function loadGroups() {
    setLoadingGroups(true);
    try {
      const res = await fetch("/api/groups/list");
      const data = await res.json();
      if (res.ok) setGroups(data.groups || []);
    } catch (e) {
      // ignore
    } finally {
      setLoadingGroups(false);
    }
  }

  async function joinGroupByCode() {
    const code = joinCode.trim();
    if (!code) return;
    setJoinBusy(true);
    setJoinError(null);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加入失败");
      setJoinCode("");
      await loadGroups();
    } catch (e) {
      setJoinError(e.message || "加入失败");
    } finally {
      setJoinBusy(false);
    }
  }

  function toggleFriendPick(id) {
    setPickedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function createGroup() {
    if (pickedFriendIds.length === 0) {
      setCreateGroupError("至少要邀请一位好友");
      return;
    }
    setCreateGroupBusy(true);
    setCreateGroupError(null);
    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim(), memberIds: pickedFriendIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "创建失败");
      setShowCreateGroup(false);
      setNewGroupName("");
      setPickedFriendIds([]);
      await loadGroups();
    } catch (e) {
      setCreateGroupError(e.message || "创建失败");
    } finally {
      setCreateGroupBusy(false);
    }
  }

  async function loadGroupMessages(group, { silent } = {}) {
    if (!silent) setGroupLoading(true);
    setGroupError(null);
    try {
      const res = await fetch(`/api/groups/messages?groupId=${encodeURIComponent(group.id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载失败");
      setGroupMessages(data.messages || []);
      if (data.group) setActiveGroup(data.group);
    } catch (e) {
      if (!silent) setGroupError("消息加载失败，请重试");
    } finally {
      if (!silent) setGroupLoading(false);
    }
  }

  function openGroup(group) {
    setActiveGroup(group);
    setGroupMessages([]);
    loadGroupMessages(group);
  }

  function closeGroup() {
    setActiveGroup(null);
    setGroupMessages([]);
    setGroupInput("");
    setGroupError(null);
    setGroupImage(null);
    setShowGroupSettings(false);
  }

  useEffect(() => {
    if (!activeGroup) return;
    groupPollRef.current = setInterval(
      () => loadGroupMessages(activeGroup, { silent: true }),
      4000
    );
    return () => clearInterval(groupPollRef.current);
  }, [activeGroup]);

  useEffect(() => {
    if (groupScrollRef.current) {
      groupScrollRef.current.scrollTop = groupScrollRef.current.scrollHeight;
    }
  }, [groupMessages, activeGroup]);

  async function handleGroupImagePicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setGroupError(null);
    setGroupImageBusy(true);
    try {
      const url = await compressImageToDataUrl(file);
      setGroupImage(url);
    } catch (err) {
      setGroupError("图片处理失败，请重试");
    } finally {
      setGroupImageBusy(false);
    }
  }

  async function sendGroupMessage() {
    const text = groupInput.trim();
    if ((!text && !groupImage) || !activeGroup) return;
    setGroupSending(true);
    setGroupError(null);
    try {
      const res = await fetch("/api/groups/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          groupId: activeGroup.id,
          text,
          imageUrl: groupImage || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setGroupMessages((prev) => [...prev, data.message]);
      setGroupInput("");
      setGroupImage(null);
    } catch (e) {
      setGroupError(e.message || "发送失败，请重试");
    } finally {
      setGroupSending(false);
    }
  }

  async function clearGroupHistory() {
    if (!activeGroup) return;
    try {
      await fetch("/api/groups/clear", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId: activeGroup.id }),
      });
      setGroupMessages([]);
      setShowGroupSettings(false);
    } catch (e) {
      setGroupError("清空失败，请重试");
    }
  }

  async function leaveGroup() {
    if (!activeGroup) return;
    try {
      await fetch("/api/groups/leave", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId: activeGroup.id }),
      });
      closeGroup();
      await loadGroups();
    } catch (e) {
      setGroupError("退出失败，请重试");
    }
  }

  useEffect(() => {
    if (showGroupPanel) loadGroups();
  }, [showGroupPanel]);

  if (activeGroup) {
    return (
      <div className="view-slide" style={styles.chatWrap}>
        <div style={styles.chatHeaderRow}>
          <button style={styles.backBtn} onClick={closeGroup}>
            <ArrowLeft size={18} /> 返回
          </button>
          <span style={{ fontWeight: 700, flex: 1, minWidth: 0 }}>{activeGroup.name}</span>
          <button
            className="glass-grid-item"
            style={styles.friendsMoreBtnSmall}
            onClick={() => setShowGroupSettings(true)}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        <div style={styles.chatScrollArea} ref={groupScrollRef}>
          {groupLoading && <div style={styles.loading}>加载中…</div>}
          {!groupLoading && groupMessages.length === 0 && (
            <div style={styles.loading}>还没有消息，说点什么吧</div>
          )}
          {groupMessages.map((m) => (
            <div
              key={m.id}
              style={m.from === myId ? styles.chatBubbleMineRow : styles.chatBubbleTheirsRow}
            >
              <div style={m.from === myId ? styles.chatBubbleMine : styles.chatBubbleTheirs}>
                {m.text && <div style={{ marginBottom: m.imageUrl ? 6 : 0 }}>{m.text}</div>}
                {m.imageUrl && (
                  <MediaPreview
                    url={m.imageUrl}
                    style={{ width: "auto", height: "auto", maxWidth: 220, maxHeight: 220, marginTop: 0 }}
                    onOpen={setGroupLightboxUrl}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {groupError && <div style={styles.errorNote}>{groupError}</div>}

        {groupImage && (
          <div style={styles.mediaPreviewWrap}>
            <MediaPreview url={groupImage} style={{ width: "auto", height: "auto", maxWidth: 160, maxHeight: 160, marginTop: 4 }} />
            <button type="button" style={styles.removeMediaBtn} onClick={() => setGroupImage(null)}>
              <X size={14} />
            </button>
          </div>
        )}
        {groupImageBusy && (
          <div style={styles.uploadingRow}>
            <Loader2 size={14} className="spin" /> 处理中…
          </div>
        )}

        <input
          ref={groupImageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleGroupImagePicked}
        />

        <div style={{ ...styles.chatInputRow, position: "relative" }}>
          <button
            type="button"
            style={{ ...styles.iconOnlyBtn, flexShrink: 0, padding: 3 }}
            onClick={() => groupImageInputRef.current && groupImageInputRef.current.click()}
          >
            <ImagePlus size={18} />
          </button>
          <input
            type="text"
            value={groupInput}
            onChange={(e) => setGroupInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendGroupMessage();
            }}
            placeholder="发消息…"
            style={{ ...styles.modalInput, flex: "1 1 auto", minWidth: 0 }}
          />
          <button
            style={{ ...styles.modalActionBtn, flexShrink: 0, padding: "9px 12px" }}
            disabled={(!groupInput.trim() && !groupImage) || groupSending}
            onClick={sendGroupMessage}
          >
            发送
          </button>
        </div>
        <ImageLightbox url={groupLightboxUrl} onClose={() => setGroupLightboxUrl(null)} />

        {showGroupSettings && (
          <div style={styles.modalOverlay} onClick={() => setShowGroupSettings(false)}>
            <div
              className="frost-in"
              style={styles.groupSettingsSheet}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.feedbackHistoryTitle}>群聊设置</div>
              <div style={styles.groupCodeRow}>
                <span style={{ color: "#7a766c", fontSize: 13 }}>群聊代码</span>
                <span style={{ fontWeight: 800, letterSpacing: 2, fontSize: 16 }}>
                  {activeGroup.code}
                </span>
                <button
                  type="button"
                  style={styles.iconOnlyBtn}
                  onClick={() => {
                    navigator.clipboard?.writeText(activeGroup.code);
                    setGroupCodeCopied(true);
                    setTimeout(() => setGroupCodeCopied(false), 1500);
                  }}
                >
                  <Copy size={15} />
                </button>
                {groupCodeCopied && <span style={{ fontSize: 12, color: "#0f6e5c" }}>已复制</span>}
              </div>
              <div style={{ fontSize: 12.5, color: "#9a968a", marginTop: -4, marginBottom: 4 }}>
                把这个代码发给别人，他们就能加入这个群
              </div>
              <button style={styles.modalDangerBtn} onClick={clearGroupHistory}>
                清空聊天记录
              </button>
              <button style={styles.modalDangerBtn} onClick={leaveGroup}>
                退出群聊
              </button>
              <button style={styles.modalLinkBtn} onClick={() => setShowGroupSettings(false)}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  async function refreshLists() {
    setLoadingList(true);
    try {
      const [fRes, rRes] = await Promise.all([
        fetch("/api/friends/list"),
        fetch("/api/friends/requests"),
      ]);
      const fData = await fRes.json();
      const rData = await rRes.json();
      setFriends(fData.friends || []);
      setRequests(rData.requests || []);
    } catch (e) {
      setErrorMsg("加载失败，请重试");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    refreshLists();
  }, []);

  useEffect(() => {
    if (friendsTabSignal) setTab(friendsTabSignal.tab);
  }, [friendsTabSignal]);

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
      const statuses = {};
      await Promise.all(
        (data.results || []).map(async (u) => {
          const sRes = await fetch(`/api/friends/status?targetId=${encodeURIComponent(u.id)}`);
          const sData = await sRes.json();
          statuses[u.id] = sData.status || "none";
        })
      );
      setStatusMap((prev) => ({ ...prev, ...statuses }));
    } catch (e) {
      setErrorMsg("搜索失败，请重试");
    } finally {
      setSearching(false);
    }
  }

  async function sendRequest(targetId) {
    setBusyId(targetId);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMap((prev) => ({ ...prev, [targetId]: data.status }));
        if (data.status === "friends") refreshLists();
      }
    } catch (e) {
      // ignore, leave status as-is
    } finally {
      setBusyId(null);
    }
  }

  async function respond(fromId, accept) {
    setBusyId(fromId);
    try {
      await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromId, accept }),
      });
      await refreshLists();
    } catch (e) {
      setErrorMsg("操作失败，请重试");
    } finally {
      setBusyId(null);
    }
  }

  async function removeFriend(friendId) {
    if (!window.confirm("确定要删除这个好友吗？")) return;
    setBusyId(friendId);
    try {
      await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      await refreshLists();
    } catch (e) {
      setErrorMsg("操作失败，请重试");
    } finally {
      setBusyId(null);
    }
  }

  const [chatFriend, setChatFriend] = useState(null);
  const [chatLightboxUrl, setChatLightboxUrl] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [chatImage, setChatImage] = useState(null);
  const [chatImageBusy, setChatImageBusy] = useState(false);
  const [chatFile, setChatFile] = useState(null);
  const [chatFileBusy, setChatFileBusy] = useState(false);
  const [showChatEmoji, setShowChatEmoji] = useState(false);
  const chatScrollRef = useRef(null);
  const chatPollRef = useRef(null);
  const chatImageInputRef = useRef(null);
  const chatFileInputRef = useRef(null);

  async function loadChat(friend, { silent } = {}) {
    if (!silent) setChatLoading(true);
    setChatError(null);
    try {
      const res = await fetch(`/api/chat/messages?with=${encodeURIComponent(friend.id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载失败");
      setChatMessages(data.messages || []);
    } catch (e) {
      if (!silent) setChatError("消息加载失败，请重试");
    } finally {
      if (!silent) setChatLoading(false);
    }
  }

  function openChat(friend) {
    setChatFriend(friend);
    setChatMessages([]);
    loadChat(friend);
  }

  function closeChat() {
    setChatFriend(null);
    setChatMessages([]);
    setChatInput("");
    setChatError(null);
    setChatImage(null);
    setChatFile(null);
  }

  useEffect(() => {
    if (!chatFriend) return;
    chatPollRef.current = setInterval(() => loadChat(chatFriend, { silent: true }), 4000);
    return () => clearInterval(chatPollRef.current);
  }, [chatFriend]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatFriend]);

  async function handleChatImagePicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setChatError(null);
    setChatImageBusy(true);
    try {
      const url = await compressImageToDataUrl(file);
      setChatImage(url);
    } catch (err) {
      setChatError("图片处理失败，请重试");
    } finally {
      setChatImageBusy(false);
    }
  }

  async function handleChatFilePicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setChatError(null);
    setChatFileBusy(true);
    try {
      const url = await readFileAsDataUrl(file);
      setChatFile({ url, name: file.name, size: file.size });
    } catch (err) {
      setChatError(err.message || "文件处理失败，请重试");
    } finally {
      setChatFileBusy(false);
    }
  }

  async function sendChatMessage() {
    const text = chatInput.trim();
    if ((!text && !chatImage && !chatFile) || !chatFriend) return;
    setChatSending(true);
    setChatError(null);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: chatFriend.id,
          text,
          imageUrl: chatImage || undefined,
          fileUrl: chatFile?.url || undefined,
          fileName: chatFile?.name || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setChatMessages((prev) => [...prev, data.message]);
      setChatInput("");
      setChatImage(null);
      setChatFile(null);
    } catch (e) {
      setChatError(e.message || "发送失败，请重试");
    } finally {
      setChatSending(false);
    }
  }

  if (chatFriend) {
    return (
      <div className="view-slide" style={styles.chatWrap}>
        <div style={styles.chatHeaderRow}>
          <button style={styles.backBtn} onClick={closeChat}>
            <ArrowLeft size={18} /> 返回
          </button>
          <Avatar name={chatFriend.name} size={28} avatarUrl={chatFriend.avatarUrl} color={chatFriend.color} />
          <span style={{ fontWeight: 700 }}>{chatFriend.name}</span>
        </div>

        <div style={styles.chatScrollArea} ref={chatScrollRef}>
          {chatLoading && <div style={styles.loading}>加载中…</div>}
          {!chatLoading && chatMessages.length === 0 && (
            <div style={styles.loading}>还没有消息，说点什么吧</div>
          )}
          {chatMessages.map((m) => (
            <div
              key={m.id}
              style={m.from === myId ? styles.chatBubbleMineRow : styles.chatBubbleTheirsRow}
            >
              <div style={m.from === myId ? styles.chatBubbleMine : styles.chatBubbleTheirs}>
                {m.text && <div style={{ marginBottom: m.imageUrl || m.fileUrl ? 6 : 0 }}>{m.text}</div>}
                {m.imageUrl && (
                  <MediaPreview
                    url={m.imageUrl}
                    style={{ width: "auto", height: "auto", maxWidth: 220, maxHeight: 220, marginTop: 0 }}
                    onOpen={setChatLightboxUrl}
                  />
                )}
                {m.fileUrl && <FileChip name={m.fileName} size={m.fileSize} url={m.fileUrl} />}
              </div>
            </div>
          ))}
        </div>

        {chatError && <div style={styles.errorNote}>{chatError}</div>}

        {chatImage && (
          <div style={styles.mediaPreviewWrap}>
            <MediaPreview url={chatImage} style={{ width: "auto", height: "auto", maxWidth: 160, maxHeight: 160, marginTop: 4 }} />
            <button type="button" style={styles.removeMediaBtn} onClick={() => setChatImage(null)}>
              <X size={14} />
            </button>
          </div>
        )}
        {chatFile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileChip name={chatFile.name} size={chatFile.size} url={chatFile.url} />
            <button type="button" style={styles.removeMediaBtn} onClick={() => setChatFile(null)}>
              <X size={14} />
            </button>
          </div>
        )}
        {(chatImageBusy || chatFileBusy) && (
          <div style={styles.uploadingRow}>
            <Loader2 size={14} className="spin" /> 处理中…
          </div>
        )}

        <input
          ref={chatImageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleChatImagePicked}
        />
        <input
          ref={chatFileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleChatFilePicked}
        />

        <div style={{ ...styles.chatInputRow, position: "relative" }}>
          <button
            type="button"
            style={{ ...styles.iconOnlyBtn, flexShrink: 0, padding: 3 }}
            onClick={() => chatImageInputRef.current && chatImageInputRef.current.click()}
          >
            <ImagePlus size={18} />
          </button>
          <button
            type="button"
            style={{ ...styles.iconOnlyBtn, flexShrink: 0, padding: 3 }}
            onClick={() => chatFileInputRef.current && chatFileInputRef.current.click()}
          >
            <Paperclip size={18} />
          </button>
          <button
            type="button"
            style={{ ...styles.iconOnlyBtn, flexShrink: 0, padding: 3 }}
            onClick={() => setShowChatEmoji((v) => !v)}
          >
            <Smile size={18} />
          </button>
          {showChatEmoji && (
            <EmojiPicker
              onPick={(e) => setChatInput((v) => v + e)}
              onClose={() => setShowChatEmoji(false)}
            />
          )}
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendChatMessage();
            }}
            placeholder="发消息…"
            style={{ ...styles.modalInput, flex: "1 1 auto", minWidth: 0 }}
          />
          <button
            style={{ ...styles.modalActionBtn, flexShrink: 0, padding: "9px 12px" }}
            disabled={(!chatInput.trim() && !chatImage && !chatFile) || chatSending}
            onClick={sendChatMessage}
          >
            发送
          </button>
        </div>
        <ImageLightbox url={chatLightboxUrl} onClose={() => setChatLightboxUrl(null)} />
      </div>
    );
  }

  return (
    <div className="view-slide">
      {errorMsg && <div style={styles.errorNote}>{errorMsg}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, position: "relative" }}>
        <button
          className="glass-grid-item"
          style={styles.friendsMoreBtn}
          onClick={() => setShowSocialMenu((v) => !v)}
        >
          <Users size={17} />
        </button>
        {showSocialMenu && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 9 }}
              onClick={() => setShowSocialMenu(false)}
            />
            <div className="frost-in" style={styles.socialMenu}>
              <button
                className="glass-grid-item"
                style={{ ...styles.navPlusGridItem, ...styles.navPlusGridItemTL, borderBottom: "none" }}
                onClick={() => {
                  setShowSocialMenu(false);
                  setShowMorePanel(true);
                }}
              >
                <Handshake size={20} />
              </button>
              <button
                className="glass-grid-item"
                style={{ ...styles.navPlusGridItem, borderRight: "none" }}
                onClick={() => {
                  setShowSocialMenu(false);
                  setShowGroupPanel(true);
                }}
              >
                <Users size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {tab === "friends" && (
        <div style={{ padding: "8px 0" }}>
          {loadingList && <div style={styles.loading}>加载中…</div>}
          {!loadingList && friends.length === 0 && (
            <div style={styles.empty}>还没有好友，点右上角加一个吧</div>
          )}
          {friends.map((u) => (
            <div
              key={u.id}
              style={styles.friendRowFlat}
              onClick={() => openChat(u)}
            >
              <Avatar name={u.name} avatarUrl={u.avatarUrl} color={u.color} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.postAuthor}>{u.name}</div>
                <div style={styles.postHandle}>@{u.id}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showMorePanel && (
        <div className="view-slide frost-in" style={styles.friendsMorePanel}>
          <div style={styles.channelHeaderBar}>
            <button style={styles.backBtn} onClick={() => setShowMorePanel(false)}>
              <ArrowLeft size={18} /> 返回
            </button>
            <span style={styles.channelHeaderTitle}>好友</span>
            <span style={{ width: 46 }} />
          </div>

          <div style={{ padding: "8px 0" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="搜索用户名或昵称，添加好友"
                style={{ ...styles.modalInput, flex: 1, minWidth: 0 }}
              />
              <button style={styles.modalActionBtn} onClick={runSearch} disabled={searching}>
                {searching ? "搜索中…" : "搜索"}
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              {results.map((u) => (
                <div key={u.id} style={styles.friendRow}>
                  <Avatar name={u.name} avatarUrl={u.avatarUrl} color={u.color} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.postAuthor}>{u.name}</div>
                    <div style={styles.postHandle}>@{u.id}</div>
                  </div>
                  <button
                    style={styles.friendActionBtn}
                    disabled={
                      busyId === u.id ||
                      statusMap[u.id] === "friends" ||
                      statusMap[u.id] === "outgoing_pending"
                    }
                    onClick={() =>
                      statusMap[u.id] === "incoming_pending"
                        ? respond(u.id, true).then(() =>
                            setStatusMap((prev) => ({ ...prev, [u.id]: "friends" }))
                          )
                        : sendRequest(u.id)
                    }
                  >
                    {FRIEND_STATUS_LABEL[statusMap[u.id] || "none"]}
                  </button>
                </div>
              ))}
              {!searching && query && results.length === 0 && (
                <div style={styles.empty}>没找到这个用户</div>
              )}
            </div>
          </div>

          <div style={{ padding: "8px 0" }}>
            <div style={styles.feedbackHistoryTitle}>好友申请</div>
            {loadingList && <div style={styles.loading}>加载中…</div>}
            {!loadingList && requests.length === 0 && (
              <div style={styles.empty}>暂时没有好友申请</div>
            )}
            {requests.map((u) => (
              <div key={u.id} style={styles.friendRow}>
                <Avatar name={u.name} avatarUrl={u.avatarUrl} color={u.color} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.postAuthor}>{u.name}</div>
                  <div style={styles.postHandle}>@{u.id}</div>
                </div>
                <button
                  style={styles.friendActionBtn}
                  disabled={busyId === u.id}
                  onClick={() => respond(u.id, true)}
                >
                  接受
                </button>
                <button
                  style={styles.modalLinkBtn}
                  disabled={busyId === u.id}
                  onClick={() => respond(u.id, false)}
                >
                  拒绝
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showGroupPanel && !showCreateGroup && (
        <div className="view-slide frost-in" style={styles.friendsMorePanel}>
          <div style={styles.channelHeaderBar}>
            <button style={styles.backBtn} onClick={() => setShowGroupPanel(false)}>
              <ArrowLeft size={18} /> 返回
            </button>
            <span style={styles.channelHeaderTitle}>群聊</span>
            <button
              className="glass-grid-item"
              style={styles.friendsMoreBtnSmall}
              onClick={() => setShowCreateGroup(true)}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ padding: "8px 0" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinGroupByCode()}
                placeholder="输入群聊代码加入"
                style={{ ...styles.modalInput, flex: 1, minWidth: 0 }}
              />
              <button style={styles.modalActionBtn} onClick={joinGroupByCode} disabled={joinBusy}>
                {joinBusy ? "加入中…" : "加入"}
              </button>
            </div>
            {joinError && <div style={styles.errorNote}>{joinError}</div>}
          </div>

          <div style={{ padding: "8px 0" }}>
            <div style={styles.feedbackHistoryTitle}>我的群聊</div>
            {loadingGroups && <div style={styles.loading}>加载中…</div>}
            {!loadingGroups && groups.length === 0 && (
              <div style={styles.empty}>还没有群聊，点右上角创建一个吧</div>
            )}
            {groups.map((g) => (
              <div key={g.id} style={styles.friendRowFlat} onClick={() => openGroup(g)}>
                <Avatar name={g.name} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.postAuthor}>{g.name}</div>
                  <div style={styles.postHandle}>{g.members.length} 位成员</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showGroupPanel && showCreateGroup && (
        <div className="view-slide frost-in" style={styles.friendsMorePanel}>
          <div style={styles.channelHeaderBar}>
            <button style={styles.backBtn} onClick={() => setShowCreateGroup(false)}>
              <ArrowLeft size={18} /> 返回
            </button>
            <span style={styles.channelHeaderTitle}>创建群聊</span>
            <span style={{ width: 46 }} />
          </div>

          <div style={{ padding: "8px 0" }}>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="群聊名称（可选）"
              style={{ ...styles.modalInput, width: "100%" }}
            />
            <div style={{ fontSize: 12.5, color: "#9a968a", margin: "10px 0 4px" }}>
              至少选择一位好友邀请入群
            </div>
            {friends.length === 0 && (
              <div style={styles.empty}>还没有好友，先去加几个好友吧</div>
            )}
            {friends.map((u) => (
              <div
                key={u.id}
                style={styles.friendRowFlat}
                onClick={() => toggleFriendPick(u.id)}
              >
                <Avatar name={u.name} avatarUrl={u.avatarUrl} color={u.color} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.postAuthor}>{u.name}</div>
                  <div style={styles.postHandle}>@{u.id}</div>
                </div>
                <input type="checkbox" readOnly checked={pickedFriendIds.includes(u.id)} />
              </div>
            ))}
            {createGroupError && <div style={styles.errorNote}>{createGroupError}</div>}
            <button
              style={{ ...styles.modalActionBtn, width: "100%", marginTop: 12 }}
              disabled={createGroupBusy}
              onClick={createGroup}
            >
              {createGroupBusy ? "创建中…" : "创建群聊"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserProfilePage({
  id,
  myId,
  user,
  isDark,
  ds,
  posts,
  likedLocal,
  toggleLike,
  repostPost,
  canDelete,
  deletePost,
  reportPost,
  onOpenImage,
  onUpdateUser,
  setView,
}) {
  const isSelf = myId === id;
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [editingHobby, setEditingHobby] = useState(false);
  const [hobbyDraft, setHobbyDraft] = useState("");
  const [savingField, setSavingField] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [bannerBusy, setBannerBusy] = useState(false);

  const [dmOpen, setDmOpen] = useState(false);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmInput, setDmInput] = useState("");
  const [dmLoading, setDmLoading] = useState(false);
  const [dmSending, setDmSending] = useState(false);
  const [dmError, setDmError] = useState(null);

  async function loadProfile() {
    setLoadingProfile(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/users/profile?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载失败");
      setProfile(data);
      setBioDraft(data.user.bio || "");
      setHobbyDraft(data.user.hobby || "");
    } catch (e) {
      setErrorMsg(e.message || "加载失败，请重试");
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [id]);

  async function toggleFollow() {
    if (!user || isSelf || !profile) return;
    setFollowBusy(true);
    try {
      const res = await fetch("/api/follow/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      setProfile((p) => ({ ...p, isFollowing: data.following, followersCount: data.followersCount }));
    } catch (e) {
      setErrorMsg(e.message || "操作失败，请重试");
    } finally {
      setFollowBusy(false);
    }
  }

  async function saveField(fields) {
    setSavingField(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      setProfile((p) => ({ ...p, user: { ...p.user, ...fields } }));
      if (onUpdateUser) onUpdateUser(data.user);
    } catch (e) {
      setErrorMsg(e.message || "保存失败，请重试");
    } finally {
      setSavingField(false);
    }
  }

  async function handleAvatarPicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setAvatarBusy(true);
    setErrorMsg(null);
    try {
      const dataUrl = await compressImageToDataUrl(file, 480, 0.8);
      await saveField({ avatarUrl: dataUrl });
    } catch (err) {
      setErrorMsg("头像上传失败，请重试");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleBannerPicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBannerBusy(true);
    setErrorMsg(null);
    try {
      const dataUrl = await compressImageToDataUrl(file, 1080, 0.75);
      await saveField({ bannerUrl: dataUrl });
    } catch (err) {
      setErrorMsg("图片上传失败，请重试");
    } finally {
      setBannerBusy(false);
    }
  }

  async function loadDm() {
    setDmLoading(true);
    setDmError(null);
    try {
      const res = await fetch(`/api/dm/messages?with=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载失败");
      setDmMessages(data.messages || []);
    } catch (e) {
      setDmError(e.message || "加载失败，请重试");
    } finally {
      setDmLoading(false);
    }
  }

  function openDm() {
    setDmOpen(true);
    loadDm();
  }

  async function sendDm() {
    const text = dmInput.trim();
    if (!text) return;
    setDmSending(true);
    setDmError(null);
    try {
      const res = await fetch("/api/dm/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: id, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setDmMessages((prev) => [...prev, data.message]);
      setDmInput("");
    } catch (e) {
      setDmError(e.message || "发送失败，请重试");
    } finally {
      setDmSending(false);
    }
  }

  const userPosts = posts
    .filter((p) => p.authorId === id && !p.pending)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (loadingProfile && !profile) {
    return (
      <div className="view-slide">
        <div style={styles.loading}>加载中…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="view-slide">
        <div style={styles.empty}>{errorMsg || "找不到这个用户"}</div>
      </div>
    );
  }

  const pu = profile.user;

  return (
    <div className="view-slide">
      {errorMsg && <div style={styles.errorNote}>{errorMsg}</div>}

      <div
        style={{
          ...styles.profileBanner,
          backgroundImage: pu.bannerUrl ? `url(${pu.bannerUrl})` : undefined,
          cursor: isSelf ? "pointer" : "default",
        }}
        onClick={() => isSelf && bannerInputRef.current && bannerInputRef.current.click()}
      >
        {!pu.bannerUrl && (
          <span style={styles.profileBannerHint}>
            {bannerBusy ? "上传中…" : isSelf ? "点击添加图片" : ""}
          </span>
        )}
        {isSelf && (
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleBannerPicked}
          />
        )}
      </div>

      <div style={styles.profileHeadRow}>
        <div
          style={{ position: "relative", cursor: isSelf ? "pointer" : "default" }}
          onClick={() => isSelf && avatarInputRef.current && avatarInputRef.current.click()}
        >
          <Avatar name={pu.name || pu.id} avatarUrl={pu.avatarUrl} color={pu.color} size={64} />
          {isSelf && (
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarPicked}
            />
          )}
          {avatarBusy && (
            <div style={styles.profileAvatarBusy}>
              <Loader2 size={16} className="spin" />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {!isSelf && user && (
            <button
              style={profile.isFollowing ? styles.profileUnfollowBtn : styles.profileFollowBtn}
              disabled={followBusy}
              onClick={toggleFollow}
            >
              {profile.isFollowing ? "取消关注" : "关注"}
            </button>
          )}
          {!isSelf && user && !profile.isFriend && (
            <button style={styles.profileDmBtn} onClick={openDm}>
              私信
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={ds(styles.postAuthor, styles.postAuthorDark)}>{pu.name || pu.id}</span>
        <RoleBadge role={pu.role} />
      </div>
      <div style={styles.postHandle}>ID: {pu.id}</div>

      <div style={styles.profileStatsRow}>
        <span>粉丝 {profile.followersCount}</span>
        <span>关注 {profile.followingCount}</span>
        {pu.ipLocation && <span>{pu.ipLocation}</span>}
        {pu.createdAt && <span>注册于 {new Date(pu.createdAt).toLocaleDateString()}</span>}
      </div>

      <div style={styles.profileFieldRow}>
        {isSelf && editingHobby ? (
          <input
            autoFocus
            style={styles.profileFieldInput}
            value={hobbyDraft}
            placeholder="爱好"
            onChange={(e) => setHobbyDraft(e.target.value)}
            onBlur={() => {
              setEditingHobby(false);
              saveField({ hobby: hobbyDraft });
            }}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
          />
        ) : (
          <span
            style={{ cursor: isSelf ? "pointer" : "default" }}
            onClick={() => isSelf && setEditingHobby(true)}
          >
            爱好：{pu.hobby || (isSelf ? "点击添加" : "暂无")}
          </span>
        )}
      </div>

      {isSelf && editingBio ? (
        <textarea
          autoFocus
          rows={2}
          style={ds(styles.composeTextarea, styles.composeTextareaDark)}
          value={bioDraft}
          placeholder="说说…"
          onChange={(e) => setBioDraft(e.target.value)}
          onBlur={() => {
            setEditingBio(false);
            saveField({ bio: bioDraft });
          }}
        />
      ) : (
        <div
          style={{ ...styles.profileBio, cursor: isSelf ? "pointer" : "default" }}
          onClick={() => isSelf && setEditingBio(true)}
        >
          {pu.bio || (isSelf ? "点击写点什么…" : "")}
        </div>
      )}

      {dmOpen && (
        <div style={styles.modalOverlay} onClick={() => setDmOpen(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>私信 {pu.name || pu.id}</div>
            <div style={{ maxHeight: 280, overflowY: "auto", margin: "8px 0" }}>
              {dmLoading && <div style={styles.loading}>加载中…</div>}
              {!dmLoading && dmMessages.length === 0 && (
                <div style={styles.empty}>还没有私信，说点什么吧</div>
              )}
              {dmMessages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    textAlign: m.from === myId ? "right" : "left",
                    margin: "6px 0",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 10px",
                      borderRadius: 12,
                      background: m.from === myId ? "#0f6e5c" : "#eee",
                      color: m.from === myId ? "#fff" : "#333",
                      maxWidth: "80%",
                      wordBreak: "break-word",
                    }}
                  >
                    {m.text}
                  </span>
                </div>
              ))}
            </div>
            {dmError && <div style={styles.errorNote}>{dmError}</div>}
            {!profile.isFollowing && (
              <div style={{ fontSize: 12, color: "#9a968a", marginBottom: 6 }}>
                对方还没有回关你，只能发送一条私信
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={dmInput}
                onChange={(e) => setDmInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendDm()}
                placeholder="发送私信…"
                style={{ ...styles.modalInput, flex: 1, minWidth: 0 }}
              />
              <button style={styles.modalActionBtn} onClick={sendDm} disabled={dmSending}>
                发送
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, fontWeight: 700, padding: "6px 0" }}>帖子</div>

      {userPosts.length === 0 ? (
        <div style={styles.empty}>还没有发布任何内容</div>
      ) : (
        userPosts.map((p) => (
          <div key={p.id} style={ds({ ...styles.postCard, ...styles.postCardEdge }, styles.postCardDark)}>
            <Avatar name={p.author} avatarUrl={p.authorAvatar} color={p.authorColor} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.postHeadRow}>
                <span style={ds(styles.postAuthor, styles.postAuthorDark)}>{p.author}</span>
                <RoleBadge role={p.authorRole} />
                <span style={styles.postTime}>{timeAgo(p.createdAt)}</span>
              </div>
              <div style={ds(styles.postBody, styles.postBodyDark)}>{p.body}</div>
              {p.mediaUrl && <MediaPreview url={p.mediaUrl} onOpen={onOpenImage} />}
              <div style={styles.actionRow}>
                <button className="icon-btn" style={styles.actionBtn} onClick={() => repostPost(p)}>
                  <Repeat2 size={15} />
                </button>
                <button
                  className={"icon-btn" + (likedLocal[p.id] ? " like-btn active" : "")}
                  style={styles.actionBtn}
                  onClick={() => toggleLike(p.id)}
                >
                  <Heart size={15} fill={likedLocal[p.id] ? "#d1394f" : "none"} /> {p.likes}
                </button>
                {user && myId !== p.authorId && (
                  <button className="icon-btn" style={styles.actionBtn} onClick={() => reportPost(p.id)}>
                    <Flag size={15} />
                  </button>
                )}
                {canDelete(p.authorId) && (
                  <button className="icon-btn" style={styles.actionBtn} onClick={() => deletePost(p.id)}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function App() {

  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsAvatar, setSettingsAvatar] = useState(null);
  const [settingsColor, setSettingsColor] = useState(COLOR_SWATCHES[0]);
  const [editingName, setEditingName] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const avatarInputRef = useRef(null);

  const [draft, setDraft] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [attachFile, setAttachFile] = useState(null); // { url, name, size }
  const [fileBusy, setFileBusy] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [showComposeEmoji, setShowComposeEmoji] = useState(false);
  const [showComposeTools, setShowComposeTools] = useState(false);
  const [view, setView] = useState("feed");
  const fileInputRef = useRef(null);
  const genericFileInputRef = useRef(null);
  const composeVideoInputRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [showReplyEmoji, setShowReplyEmoji] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const [channelItems, setChannelItems] = useState([]);
  const [channelLoaded, setChannelLoaded] = useState(false);
  const [showAddChannelItem, setShowAddChannelItem] = useState(false);
  const [channelSlot, setChannelSlot] = useState(1);
  const [channelCaption, setChannelCaption] = useState("");
  const [channelImage, setChannelImage] = useState(null);
  const [channelImageBusy, setChannelImageBusy] = useState(false);
  const [channelBusy, setChannelBusy] = useState(false);
  const [channelError, setChannelError] = useState(null);
  const channelImageInputRef = useRef(null);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [channelTick, setChannelTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setChannelTick((t) => t + 1), 4000);
    return () => clearInterval(timer);
  }, []);
  const canPostChannel = !!user && (user.role === "official" || user.role === "owner");

  const channelBySlot = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [], 4: [] };
    for (const it of channelItems) {
      const slot = groups[it.slot] ? it.slot : 1;
      groups[slot].push(it);
    }
    return groups;
  }, [channelItems]);

  async function loadChannel() {
    try {
      const res = await fetch("/api/channel");
      const data = await res.json();
      setChannelItems(data.items || []);
    } catch (e) {
      // silent — channel is non-critical
    } finally {
      setChannelLoaded(true);
    }
  }

  useEffect(() => {
    loadChannel();
  }, []);

  async function handleChannelImagePicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setChannelError(null);
    setChannelImageBusy(true);
    try {
      const url = await compressImageToDataUrl(file, 1080, 0.75);
      setChannelImage(url);
    } catch (err) {
      setChannelError("图片处理失败，请重试");
    } finally {
      setChannelImageBusy(false);
    }
  }

  async function submitChannelItem() {
    if (!channelImage && !channelCaption.trim()) return;
    if (channelItems.length >= 50) {
      setChannelError("轮播区最多只能存放 50 张照片，请先删除一些旧内容");
      return;
    }
    setChannelBusy(true);
    setChannelError(null);
    try {
      const newItem = {
        id: uid(),
        slot: channelSlot,
        imageUrl: channelImage || null,
        caption: channelCaption.trim(),
        authorName: user.name,
        authorRole: user.role,
        createdAt: Date.now(),
      };
      const next = [newItem, ...channelItems];
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发布失败");
      setChannelItems(next);
      setChannelCaption("");
      setChannelImage(null);
      setShowAddChannelItem(false);
    } catch (e) {
      setChannelError(e.message || "发布失败，请重试");
    } finally {
      setChannelBusy(false);
    }
  }

  async function deleteChannelItem(id) {
    if (!window.confirm("删除这条轮播内容？")) return;
    const next = channelItems.filter((it) => it.id !== id);
    try {
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除失败");
      setChannelItems(next);
    } catch (e) {
      alert(e.message || "删除失败");
    }
  }


  const myId = user ? user.id || user.username || user.email : null;
  const likedLocal = useMemo(() => {
    const map = {};
    if (myId) {
      for (const p of posts) {
        if (p.likedBy && p.likedBy.includes(myId)) map[p.id] = true;
      }
    }
    return map;
  }, [posts, myId]);
  const theme = user?.theme === "dark" ? "dark" : "light";
  const isDark = theme === "dark";
  function ds(base, darkOverride) {
    return isDark ? { ...base, ...darkOverride } : base;
  }
  const displayName = user?.name || user?.username || "访客";
  const handle = user ? handleFromName(user.username || (user.email || "user").split("@")[0]) : "@访客";
  const nameRequired = !!(authChecked && user && !user.name);
  const navIndex =
    view === "friends" ? 1 : view === "channel" || view === "board" ? 2 : 0;
  const [pressedNav, setPressedNav] = useState(null);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [friendsTabSignal, setFriendsTabSignal] = useState(null);
  const [profileViewId, setProfileViewId] = useState(null);
  function openProfile(id) {
    if (!id) return;
    setProfileViewId(id);
    setView("profile");
  }
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setPosts(await loadPosts());
      } catch (e) {
        setError("加载失败，请刷新重试");
      } finally {
        setLoaded(true);
      }
    })();
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user || null);
        if (data.user) initPush();
      } catch (e) {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (nameRequired) {
      setSettingsName("");
      setSettingsAvatar(user.avatarUrl || null);
      setSettingsColor(user.color || COLOR_SWATCHES[0]);
      setSettingsError(null);
    }
  }, [nameRequired]);


  function resetAuthForm() {
    setFormUsername("");
    setFormPassword("");
    setFormConfirmPassword("");
    setLoginError(null);
  }

  async function doLogin() {
    setLoginError(null);
    if (!formUsername.trim() || !formPassword) return;
    setLoginBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: formUsername.trim(), password: formPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登录失败");
      setUser(data.user);
      initPush();
      setShowSettings(false);
      resetAuthForm();
    } catch (e) {
      setLoginError(e.message || "用户名或密码不对");
    } finally {
      setLoginBusy(false);
    }
  }

  async function doRegister() {
    setLoginError(null);
    if (!formUsername.trim() || !formPassword || !formConfirmPassword) return;
    if (formPassword !== formConfirmPassword) {
      setLoginError("两次输入的密码不一致");
      return;
    }
    setLoginBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: formUsername.trim(),
          password: formPassword,
          confirmPassword: formConfirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "注册失败");
      setUser(data.user);
      initPush();
      setShowSettings(false);
      resetAuthForm();
    } catch (e) {
      setLoginError(e.message || "注册失败，请重试");
    } finally {
      setLoginBusy(false);
    }
  }

  function loginWithGoogle() {
    window.location.href = "/api/auth/google/start";
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  function openSettings() {
    if (!user) return;
    setSettingsName(user.name || "");
    setSettingsAvatar(user.avatarUrl || null);
    setSettingsColor(user.color || COLOR_SWATCHES[0]);
    setSettingsError(null);
  }

  async function handleSettingsAvatarPicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await compressImageToDataUrl(file, 240, 0.75);
      setSettingsAvatar(url);
      if (!nameRequired) await autoSaveProfile({ avatarUrl: url });
    } catch (err) {
      setSettingsError("头像处理失败，请换一张试试");
    }
  }

  function syncMyPostsWithProfile(updatedUser) {
    if (!myId || !updatedUser) return;
    let changed = false;
    const patchAuthorFields = (item) => {
      if (!item || item.authorId !== myId) return item;
      changed = true;
      return {
        ...item,
        author: updatedUser.name || item.author,
        authorAvatar: updatedUser.avatarUrl || null,
        authorColor: updatedUser.color || item.authorColor,
      };
    };
    const next = posts.map((p) => {
      let updated = patchAuthorFields(p);
      if (p.repostOf && p.repostOf.authorId === myId) {
        updated = { ...updated, repostOf: patchAuthorFields(p.repostOf) };
      }
      if (p.replies && p.replies.length) {
        updated = { ...updated, replies: p.replies.map(patchAuthorFields) };
      }
      return updated;
    });
    if (changed) {
      setPosts(next);
      persist(next);
    }
  }

  async function autoSaveProfile(patch) {
    setSettingsBusy(true);
    setSettingsError(null);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      setUser(data.user);
      syncMyPostsWithProfile(data.user);
    } catch (e) {
      setSettingsError("保存失败，请重试");
    } finally {
      setSettingsBusy(false);
    }
  }

  function commitName() {
    setEditingName(false);
    const trimmed = settingsName.trim();
    if (trimmed && trimmed !== user.name) autoSaveProfile({ name: trimmed });
  }

  async function saveSettings() {
    setSettingsError(null);
    setSettingsBusy(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: settingsName.trim(),
          avatarUrl: settingsAvatar,
          color: settingsColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      setUser(data.user);
      syncMyPostsWithProfile(data.user);
      setShowSettings(false);
    } catch (e) {
      setSettingsError("保存失败，请重试");
    } finally {
      setSettingsBusy(false);
    }
  }

  const [redeemInput, setRedeemInput] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState(null);

  async function redeemCode() {
    if (!redeemInput.trim()) return;
    setRedeemBusy(true);
    setRedeemMsg(null);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: redeemInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "兑换失败");
      setUser(data.user);
      setRedeemInput("");
      setRedeemMsg("兑换成功！");
    } catch (e) {
      setRedeemMsg(e.message || "兑换失败");
    } finally {
      setRedeemBusy(false);
    }
  }

  const [adminTargetId, setAdminTargetId] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg, setAdminMsg] = useState(null);

  async function setAdminRole(role) {
    if (!adminTargetId.trim()) return;
    setAdminBusy(true);
    setAdminMsg(null);
    try {
      const res = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: adminTargetId.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      const labels = { admin: "已设为管理员", owner: "已设为站主", user: "已取消身份" };
      setAdminMsg(labels[role] || "操作成功");
      setAdminTargetId("");
    } catch (e) {
      setAdminMsg(e.message || "操作失败");
    } finally {
      setAdminBusy(false);
    }
  }

  const [banTargetId, setBanTargetId] = useState("");
  const [banBusy, setBanBusy] = useState(false);
  const [banMsg, setBanMsg] = useState(null);

  const [accessTargetId, setAccessTargetId] = useState("");
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessMsg, setAccessMsg] = useState(null);

  const [idChangeBusy, setIdChangeBusy] = useState(false);
  const [idChangeMsg, setIdChangeMsg] = useState(null);

  async function changeMyId() {
    setIdChangeBusy(true);
    setIdChangeMsg(null);
    try {
      const res = await fetch("/api/users/friend-code", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      setUser((u) => (u ? { ...u, friendCode: data.friendCode } : u));
      setIdChangeMsg("已更换为新ID");
    } catch (e) {
      setIdChangeMsg(e.message || "操作失败");
    } finally {
      setIdChangeBusy(false);
    }
  }

  async function setContentAccess(contentAccess) {
    if (!accessTargetId.trim()) return;
    setAccessBusy(true);
    setAccessMsg(null);
    try {
      const res = await fetch("/api/admin/set-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: accessTargetId.trim(), contentAccess }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      setAccessMsg(contentAccess ? "已授予访问权限" : "已取消访问权限");
      setAccessTargetId("");
    } catch (e) {
      setAccessMsg(e.message || "操作失败");
    } finally {
      setAccessBusy(false);
    }
  }

  async function setBan(type, banned) {
    if (!banTargetId.trim()) return;
    setBanBusy(true);
    setBanMsg(null);
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: banTargetId.trim(), type, banned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      const label = type === "chat" ? "私聊" : "发帖";
      setBanMsg(banned ? `已封禁${label}` : `已解封${label}`);
    } catch (e) {
      setBanMsg(e.message || "操作失败");
    } finally {
      setBanBusy(false);
    }
  }

  const persist = useCallback(async (data) => {
    setSaving(true);
    try {
      await savePosts(data);
      setError(null);
    } catch (e) {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }, []);

  async function handleFilePicked(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow picking the same file again later
    if (!files.length) return;
    setUploadError(null);
    setUploading(true);
    try {
      const room = Math.max(0, 9 - mediaUrls.length);
      const picked = files.slice(0, room);
      const urls = await Promise.all(picked.map((f) => compressImageToDataUrl(f)));
      setMediaUrls((prev) => [...prev, ...urls].slice(0, 9));
    } catch (err) {
      setUploadError("图片处理失败，请重试");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenericFilePicked(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    setFileBusy(true);
    try {
      const url = await readFileAsDataUrl(file);
      setAttachFile({ url, name: file.name, size: file.size });
    } catch (err) {
      setFileError(err.message || "文件处理失败，请重试");
    } finally {
      setFileBusy(false);
    }
  }

  function submitPost() {
    if (!user) {
      setShowSettings(true);
      return;
    }
    const text = draft.trim();
    if ((!text && !mediaUrls.length && !attachFile) || text.length > MAX_LEN) return;
    const isMod = user.role === "admin" || user.role === "official";
    const post = {
      id: uid(),
      author: displayName,
      handle,
      authorId: myId,
      authorRole: user.role || "user",
      authorAvatar: user.avatarUrl || null,
      authorColor: user.color || null,
      body: text,
      mediaUrl: mediaUrls[0] || null,
      mediaUrls: mediaUrls.length ? mediaUrls : null,
      fileUrl: attachFile?.url || null,
      fileName: attachFile?.name || null,
      fileSize: attachFile?.size || null,
      pending: !!mediaUrls.length && !isMod,
      reports: [],
      createdAt: Date.now(),
      likes: 0,
      likedBy: [],
      replies: [],
    };
    const next = [post, ...posts];
    setPosts(next);
    persist(next);
    setDraft("");
    setMediaUrls([]);
    setAttachFile(null);
    setShowComposeTools(false);
    if (view === "compose") setView("feed");
  }

  function toggleLike(id) {
    if (!user || !myId) {
      setShowSettings(true);
      return;
    }
    const target = posts.find((p) => p.id === id);
    if (!target || (target.likedBy && target.likedBy.includes(myId))) return;
    const next = posts.map((p) =>
      p.id === id
        ? { ...p, likes: p.likes + 1, likedBy: [...(p.likedBy || []), myId] }
        : p
    );
    setPosts(next);
    persist(next);
  }

  function submitReply(id) {
    if (!user) {
      setShowSettings(true);
      return;
    }
    const text = replyDraft.trim();
    if (!text) return;
    const next = posts.map((p) =>
      p.id === id
        ? {
            ...p,
            replies: [
              ...p.replies,
              {
                id: uid(),
                author: displayName,
                handle,
                authorId: myId,
      authorRole: user.role || "user",
                authorAvatar: user.avatarUrl || null,
                authorColor: user.color || null,
                body: text,
                createdAt: Date.now(),
              },
            ],
          }
        : p
    );
    setPosts(next);
    persist(next);
    setReplyDraft("");
  }

  function deletePost(id) {
    if (!window.confirm("删除这条动态？删除后无法恢复。")) return;
    const next = posts.filter((p) => p.id !== id);
    setPosts(next);
    persist(next);
    if (activeId === id) setActiveId(null);
  }

  function deleteReply(postId, replyId) {
    if (!window.confirm("删除这条评论？删除后无法恢复。")) return;
    const next = posts.map((p) =>
      p.id === postId ? { ...p, replies: p.replies.filter((r) => r.id !== replyId) } : p
    );
    setPosts(next);
    persist(next);
  }

  function canDelete(authorId) {
    if (!user) return false;
    if (myId === authorId) return true;
    return user.role === "admin" || user.role === "official";
  }

  const isMod = !!user && (user.role === "admin" || user.role === "official");
  const hasChannelAccess = !!user && (user.role === "official" || !!user.contentAccess);

  function reportPost(id) {
    if (!user) {
      setShowSettings(true);
      return;
    }
    const post = posts.find((p) => p.id === id);
    if (post && (post.reports || []).some((r) => r.reporterId === myId)) {
      alert("你已经举报过这条内容了");
      return;
    }
    const reason = window.prompt("举报原因（可以留空）：") || "";
    const next = posts.map((p) =>
      p.id === id
        ? { ...p, reports: [...(p.reports || []), { reporterId: myId, reason, at: Date.now() }] }
        : p
    );
    setPosts(next);
    persist(next);
    alert("已举报，管理员会看到");
  }

  function approvePost(id) {
    const next = posts.map((p) => (p.id === id ? { ...p, pending: false } : p));
    setPosts(next);
    persist(next);
  }

  function rejectPost(id) {
    if (!window.confirm("拒绝并删除这条待审核内容？")) return;
    const next = posts.filter((p) => p.id !== id);
    setPosts(next);
    persist(next);
    if (activeId === id) setActiveId(null);
  }

  function clearReports(id) {
    const next = posts.map((p) => (p.id === id ? { ...p, reports: [] } : p));
    setPosts(next);
    persist(next);
  }

  const [openMenuPostId, setOpenMenuPostId] = useState(null);

  async function quickBanFeed(targetId) {
    setOpenMenuPostId(null);
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId, type: "feed", banned: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      alert("已封禁该用户的公共聊天发言");
    } catch (e) {
      alert(e.message || "操作失败");
    }
  }

  function repostPost(original) {
    if (!user) {
      setShowSettings(true);
      return;
    }
    const post = {
      id: uid(),
      author: displayName,
      handle,
      authorId: myId,
      authorRole: user.role || "user",
      authorAvatar: user.avatarUrl || null,
      authorColor: user.color || null,
      body: "",
      mediaUrl: null,
      mediaUrls: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      pending: false,
      reports: [],
      repostOf: {
        id: original.id,
        author: original.author,
        handle: original.handle,
        authorAvatar: original.authorAvatar,
        authorColor: original.authorColor,
        body: original.body,
        mediaUrl: original.mediaUrl,
        mediaUrls: original.mediaUrls || null,
      },
      createdAt: Date.now(),
      likes: 0,
      likedBy: [],
      replies: [],
    };
    const next = [post, ...posts];
    setPosts(next);
    persist(next);
  }

  const sorted = useMemo(() => {
    return [...posts]
      .filter((p) => !p.pending || p.authorId === myId)
      .filter((p) =>
        searchQuery.trim()
          ? (p.body || "").toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            (p.author || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
          : true
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, myId, isMod, searchQuery]);
  const activePost = posts.find((p) => p.id === activeId);
  const remaining = MAX_LEN - draft.length;

  function renderSettingsForm() {
    return (
              <>
                {/* SETTINGS_FORM_START */}
                {nameRequired && (
                  <div style={styles.modalTitle}>欢迎！先给自己起个名字</div>
                )}
                <div style={styles.profileHeader}>
                  <div style={styles.profileAvatarWrap}>
                    <Avatar name={settingsName || user.name || "?"} size={76} avatarUrl={settingsAvatar} color={settingsColor} />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleSettingsAvatarPicked}
                    />
                    <button
                      type="button"
                      style={styles.avatarEditBadge}
                      onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                    >
                      <ImagePlus size={13} />
                    </button>
                  </div>

                  {nameRequired ? (
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      placeholder="昵称"
                      maxLength={30}
                      style={styles.profileNameInput}
                    />
                  ) : editingName ? (
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      onBlur={commitName}
                      onKeyDown={(e) => e.key === "Enter" && commitName()}
                      placeholder="昵称"
                      maxLength={30}
                      autoFocus
                      style={styles.profileNameInput}
                    />
                  ) : (
                    <div style={styles.profileNameRow}>
                      <span style={styles.profileNameDisplay}>{user.name}</span>
                      <button
                        type="button"
                        style={styles.pencilBtn}
                        onClick={() => {
                          setSettingsName(user.name || "");
                          setEditingName(true);
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                  <div style={styles.profileHandleRow}>
                    <span style={styles.profileHandle}>{handle}</span>
                    <RoleBadge role={user.role} />
                  </div>
                  {!nameRequired && (
                    <div style={styles.myIdRow}>
                      <span style={styles.myIdLabel}>我的ID：</span>
                      <span style={styles.myIdValue}>{user.friendCode || "生成中…"}</span>
                      <button
                        type="button"
                        style={styles.myIdChangeBtn}
                        disabled={idChangeBusy}
                        onClick={changeMyId}
                      >
                        更换ID
                      </button>
                    </div>
                  )}
                  {idChangeMsg && !nameRequired && (
                    <div style={styles.modalHint}>{idChangeMsg}</div>
                  )}
                  {settingsAvatar && (
                    <button
                      type="button"
                      style={styles.modalLinkBtn}
                      onClick={() => {
                        setSettingsAvatar(null);
                        if (!nameRequired) autoSaveProfile({ avatarUrl: null });
                      }}
                    >
                      移除头像（用颜色代替）
                    </button>
                  )}

                  <div style={styles.swatchRow}>
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSettingsColor(c);
                          if (!nameRequired) autoSaveProfile({ color: c });
                        }}
                        style={{
                          ...styles.swatch,
                          background: c,
                          boxShadow: settingsColor === c ? "0 0 0 2px #fff, 0 0 0 4px " + c : "none",
                        }}
                      />
                    ))}
                  </div>

                  {!nameRequired && (
                    <>
                      <div style={styles.modalHint}>公共聊天背景</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          style={{
                            ...styles.friendActionBtn,
                            flex: 1,
                            background: !isDark
                              ? "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))"
                              : "rgba(255,255,255,0.5)",
                            color: !isDark ? "#fff" : "#5c584d",
                          }}
                          onClick={() => autoSaveProfile({ theme: "light" })}
                        >
                          白
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.friendActionBtn,
                            flex: 1,
                            background: isDark
                              ? "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))"
                              : "rgba(255,255,255,0.5)",
                            color: isDark ? "#fff" : "#5c584d",
                          }}
                          onClick={() => autoSaveProfile({ theme: "dark" })}
                        >
                          黑
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {!nameRequired && (
                  <>
                    <div style={styles.settingsSection}>
                      <div style={styles.settingsSectionTitle}>兑换码</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          value={redeemInput}
                          onChange={(e) => setRedeemInput(e.target.value)}
                          placeholder="输入兑换码"
                          style={{ ...styles.modalInput, flex: 1, minWidth: 0 }}
                        />
                        <button
                          style={styles.friendActionBtn}
                          disabled={!redeemInput.trim() || redeemBusy}
                          onClick={redeemCode}
                        >
                          {redeemBusy ? "兑换中…" : "兑换"}
                        </button>
                      </div>
                      {redeemMsg && <div style={styles.modalHint}>{redeemMsg}</div>}
                    </div>

                    {(user.role === "admin" || user.role === "official") && (
                      <div style={styles.settingsSection}>
                        <div style={styles.settingsSectionTitle}>封禁用户</div>
                        <input
                          type="text"
                          value={banTargetId}
                          onChange={(e) => setBanTargetId(e.target.value)}
                          placeholder="对方ID（如 max123-456）"
                          style={styles.modalInput}
                        />
                        <div style={styles.modalHint}>私人聊天</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            style={{ ...styles.friendActionBtn, flex: 1 }}
                            disabled={!banTargetId.trim() || banBusy}
                            onClick={() => setBan("chat", true)}
                          >
                            封禁私聊
                          </button>
                          <button
                            style={{ ...styles.modalLinkBtn, flex: 1, border: "1px solid #e7e3da", borderRadius: 10 }}
                            disabled={!banTargetId.trim() || banBusy}
                            onClick={() => setBan("chat", false)}
                          >
                            解封私聊
                          </button>
                        </div>
                        <div style={styles.modalHint}>公共聊天（发帖 / 评论）</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            style={{ ...styles.friendActionBtn, flex: 1 }}
                            disabled={!banTargetId.trim() || banBusy}
                            onClick={() => setBan("feed", true)}
                          >
                            封禁公共聊天
                          </button>
                          <button
                            style={{ ...styles.modalLinkBtn, flex: 1, border: "1px solid #e7e3da", borderRadius: 10 }}
                            disabled={!banTargetId.trim() || banBusy}
                            onClick={() => setBan("feed", false)}
                          >
                            解封公共聊天
                          </button>
                        </div>
                        {banMsg && <div style={styles.modalHint}>{banMsg}</div>}
                      </div>
                    )}

                    {user.role === "official" && (
                      <div style={styles.settingsSection}>
                        <div style={styles.settingsSectionTitle}>身份管理（仅官方可见）</div>
                        <input
                          type="text"
                          value={adminTargetId}
                          onChange={(e) => setAdminTargetId(e.target.value)}
                          placeholder="对方ID（如 max123-456）"
                          style={styles.modalInput}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            style={{ ...styles.friendActionBtn, flex: 1 }}
                            disabled={!adminTargetId.trim() || adminBusy}
                            onClick={() => setAdminRole("admin")}
                          >
                            设为管理员
                          </button>
                          <button
                            style={{ ...styles.friendActionBtn, flex: 1, background: "linear-gradient(180deg, rgba(142,91,214,0.95), rgba(120,70,190,0.95))" }}
                            disabled={!adminTargetId.trim() || adminBusy}
                            onClick={() => setAdminRole("owner")}
                          >
                            设为站主
                          </button>
                        </div>
                        <button
                          style={{ ...styles.modalLinkBtn, border: "1px solid #e7e3da", borderRadius: 10, width: "100%" }}
                          disabled={!adminTargetId.trim() || adminBusy}
                          onClick={() => setAdminRole("user")}
                        >
                          取消身份（管理员/站主）
                        </button>
                        {adminMsg && <div style={styles.modalHint}>{adminMsg}</div>}
                      </div>
                    )}

                    {user.role === "official" && (
                      <div style={styles.settingsSection}>
                        <div style={styles.settingsSectionTitle}>内容访问权限（仅官方可见）</div>
                        <input
                          type="text"
                          value={accessTargetId}
                          onChange={(e) => setAccessTargetId(e.target.value)}
                          placeholder="对方ID（如 max123-456）"
                          style={styles.modalInput}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            style={{ ...styles.friendActionBtn, flex: 1 }}
                            disabled={!accessTargetId.trim() || accessBusy}
                            onClick={() => setContentAccess(true)}
                          >
                            授予访问权限
                          </button>
                          <button
                            style={{ ...styles.modalLinkBtn, flex: 1, border: "1px solid #e7e3da", borderRadius: 10 }}
                            disabled={!accessTargetId.trim() || accessBusy}
                            onClick={() => setContentAccess(false)}
                          >
                            取消访问权限
                          </button>
                        </div>
                        {accessMsg && <div style={styles.modalHint}>{accessMsg}</div>}
                      </div>
                    )}
                  </>
                )}

                {settingsError && <div style={styles.errorNote}>{settingsError}</div>}

                {nameRequired && (
                  <button
                    style={styles.modalActionBtn}
                    disabled={!settingsName.trim() || settingsBusy}
                    onClick={saveSettings}
                  >
                    {settingsBusy ? "保存中…" : "保存"}
                  </button>
                )}
                {(user.role === "admin" || user.role === "owner" || user.role === "official") && (
                  <div style={styles.settingsMenuGroup}>
                    <button
                      style={styles.settingsMenuBtn}
                      onClick={() => {
                        setShowSettings(false);
                        setView("modqueue");
                      }}
                    >
                      <ClipboardCheck size={16} /> 审核内容
                    </button>
                    {user.role === "official" && (
                      <button
                        style={styles.settingsMenuBtn}
                        onClick={() => {
                          setShowSettings(false);
                          setActiveBoardId("feedback");
                          setView("board");
                        }}
                      >
                        <MessageSquare size={16} /> 意见反馈
                      </button>
                    )}
                  </div>
                )}
                <button
                  style={styles.logoutFullBtn}
                  onClick={() => {
                    logout();
                    setShowSettings(false);
                    setView("feed");
                  }}
                >
                  <LogOut size={15} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                  退出登录
                </button>
              </>
    );
  }

  return (
    <div style={isDark ? { ...styles.app, ...styles.appDark } : styles.app}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:translateY(0);} }
        .fade-in { animation: fadeIn .3s ease both; }
        @keyframes viewSlide { from { opacity:0; transform: translateX(28px);} to {opacity:1; transform:translateX(0);} }
        .view-slide { animation: viewSlide .75s cubic-bezier(0.16,1,0.3,1) both; }
        .post-card:hover { background: #faf9f6; }
        .icon-btn { transition: color .12s ease, transform .08s ease; }
        .icon-btn:hover { color: #0f6e5c; }
        .icon-btn:active { transform: scale(0.92); }
        .like-btn.active { color: #d1394f; }
        .post-btn:hover:not(:disabled) { background:#0b5748; }
        .post-btn:disabled { opacity:0.4; cursor:default; }
        button:disabled { opacity:0.5; cursor:default; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes frostIn {
          from { opacity: 0; transform: scale(0.85) translateY(6px); filter: blur(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        .frost-in { animation: frostIn .38s cubic-bezier(0.34,1.56,0.64,1) both; }
        .glass-grid-item:hover { background: rgba(255,255,255,0.28); }
        .glass-grid-item:active { transform: scale(0.9); }
        textarea { font-family: inherit; }
        ::placeholder { color:#9a968a; }
        body { margin:0; }
        *, *::before, *::after { box-sizing: border-box; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .photo-strip { scroll-snap-stop: always; }
      `}</style>

      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
        <defs>
          <filter id="liquidGlassDistort" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.010 0.028" numOctaves="2" seed="9" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2.2" result="softNoise" />
            <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="16" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
        <nav style={{ ...styles.bottomNav, position: "static", transform: "none" }}>
          <div style={styles.bottomNavGlassHighlight} />
          <div
            style={{
              ...styles.bottomNavIndicator,
              transform: `translateX(${navIndex * (NAV_ITEM_WIDTH + NAV_ITEM_GAP)}px)`,
            }}
          />
          <button
            style={{
              ...styles.bottomNavItem,
              width: NAV_ITEM_WIDTH,
              transform: pressedNav === 0 ? "scale(1.22)" : "scale(1)",
              ...(view === "feed" ? styles.bottomNavItemActive : {}),
            }}
            onPointerDown={() => setPressedNav(0)}
            onPointerUp={() => setPressedNav(null)}
            onPointerLeave={() => setPressedNav(null)}
            onClick={() => setView("feed")}
          >
            <Home size={20} />
            <span style={styles.bottomNavLabel}>动态</span>
          </button>
          <button
            style={{
              ...styles.bottomNavItem,
              width: NAV_ITEM_WIDTH,
              transform: pressedNav === 1 ? "scale(1.22)" : "scale(1)",
              ...(view === "friends" ? styles.bottomNavItemActive : {}),
            }}
            onPointerDown={() => setPressedNav(1)}
            onPointerUp={() => setPressedNav(null)}
            onPointerLeave={() => setPressedNav(null)}
            onClick={() => (user ? setView("friends") : setShowSettings(true))}
          >
            <MessageCircle size={20} />
            <span style={styles.bottomNavLabel}>社交</span>
          </button>
          <button
            style={{
              ...styles.bottomNavItem,
              width: NAV_ITEM_WIDTH,
              transform: pressedNav === 2 ? "scale(1.22)" : "scale(1)",
              ...(view === "channel" || view === "board" ? styles.bottomNavItemActive : {}),
            }}
            onPointerDown={() => setPressedNav(2)}
            onPointerUp={() => setPressedNav(null)}
            onPointerLeave={() => setPressedNav(null)}
            onClick={() => {
              setActiveBoardId(null);
              setView("channel");
            }}
          >
            <Tv size={20} />
            <span style={styles.bottomNavLabel}>频道</span>
          </button>
        </nav>

        <div style={{ position: "relative" }}>
          <button
            style={{
              ...styles.navPlusBtn,
              transform: showNavMenu ? "rotate(45deg)" : "rotate(0deg)",
            }}
            onClick={() => setShowNavMenu((v) => !v)}
          >
            <Plus size={22} />
          </button>
          {showNavMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 9 }}
                onClick={() => setShowNavMenu(false)}
              />
              <div className="frost-in" style={styles.navPlusMenu}>
                <button
                  style={{ ...styles.navPlusGridItem, ...styles.navPlusGridItemTL }}
                  className="glass-grid-item"
                  onClick={() => {
                    setView("feed");
                    setShowSearchBar(true);
                    setShowNavMenu(false);
                  }}
                >
                  <Search size={20} />
                </button>
                <button
                  style={{ ...styles.navPlusGridItem, ...styles.navPlusGridItemTR }}
                  className="glass-grid-item"
                  onClick={() => {
                    if (!user) { setShowSettings(true); setShowNavMenu(false); return; }
                    openSettings();
                    setView("settings");
                    setShowNavMenu(false);
                  }}
                >
                  <SettingsIcon size={20} />
                </button>
                <button
                  style={{ ...styles.navPlusGridItem, ...styles.navPlusGridItemBL }}
                  className="glass-grid-item"
                  onClick={() => {
                    if (!user) { setShowSettings(true); setShowNavMenu(false); return; }
                    openProfile(myId);
                    setShowNavMenu(false);
                  }}
                >
                  <User size={20} />
                </button>
                <button
                  style={{ ...styles.navPlusGridItem, ...styles.navPlusGridItemBR }}
                  className="glass-grid-item"
                  onClick={() => {
                    if (!user) { setShowSettings(true); setShowNavMenu(false); return; }
                    setView("compose");
                    setShowNavMenu(false);
                  }}
                >
                  <Plus size={22} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      {(showSettings || nameRequired) && (
        <div
          style={styles.modalOverlay}
          onClick={() => {
            if (!nameRequired) {
              setShowSettings(false);
              resetAuthForm();
            }
          }}
        >
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            {!user ? (
              <>
                <div style={styles.modalTitle}>{authMode === "login" ? "登录" : "注册账号"}</div>

                <button style={styles.googleBtn} onClick={loginWithGoogle}>
                  <GoogleIcon size={18} /> 使用 Google 登录
                </button>

                <div style={styles.modalDivider}>或</div>

                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder={authMode === "login" ? "用户名 / ID" : "用户名"}
                  style={styles.modalInput}
                  autoCapitalize="none"
                />
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="密码"
                  style={styles.modalInput}
                />
                {authMode === "register" && (
                  <input
                    type="password"
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    placeholder="重复密码"
                    style={styles.modalInput}
                  />
                )}

                {authMode === "login" ? (
                  <button
                    style={styles.modalActionBtn}
                    disabled={!formUsername.trim() || !formPassword || loginBusy}
                    onClick={doLogin}
                  >
                    {loginBusy ? "登录中…" : "登录"}
                  </button>
                ) : (
                  <button
                    style={styles.modalActionBtn}
                    disabled={
                      !formUsername.trim() || !formPassword || !formConfirmPassword || loginBusy
                    }
                    onClick={doRegister}
                  >
                    {loginBusy ? "注册中…" : "注册"}
                  </button>
                )}

                <button
                  style={styles.modalLinkBtn}
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setLoginError(null);
                  }}
                >
                  {authMode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
                </button>

                {loginError && <div style={styles.errorNote}>{loginError}</div>}
              </>
            ) : (
              renderSettingsForm()
            )}
          </div>
        </div>
      )}

      <main style={styles.main}>
        {!loaded && <div style={styles.loading}>加载中…</div>}

        {loaded && view === "friends" && user && (
          <FriendsPage myId={myId} friendsTabSignal={friendsTabSignal} />
        )}

        {loaded && view === "profile" && profileViewId && (
          <UserProfilePage
            id={profileViewId}
            myId={myId}
            user={user}
            isDark={isDark}
            ds={ds}
            posts={posts}
            likedLocal={likedLocal}
            toggleLike={toggleLike}
            repostPost={repostPost}
            canDelete={canDelete}
            deletePost={deletePost}
            reportPost={reportPost}
            onOpenImage={setLightboxUrl}
            onUpdateUser={(u) => { setUser(u); syncMyPostsWithProfile(u); }}
            setView={setView}
          />
        )}

        {loaded && view === "settings" && user && (
          <div className="view-slide" style={ds(styles.settingsPage, styles.settingsPageDark)}>
            {renderSettingsForm()}
          </div>
        )}

        {loaded && view === "compose" && user && (
          <div className="view-slide" style={ds(styles.composePage, styles.composePageDark)}>
            <div style={styles.composePageHeadRow}>
              <button style={styles.composePageBack} onClick={() => setView("feed")}>
                <ArrowLeft size={18} />
              </button>
              <span style={styles.composePageTitle}>发布动态</span>
              <button
                style={styles.composePageSubmit}
                disabled={(!draft.trim() && !mediaUrls.length && !attachFile) || uploading || fileBusy}
                onClick={submitPost}
              >
                发布
              </button>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="说一说…"
              rows={6}
              style={ds(styles.composePageTextarea, styles.composeTextareaDark)}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFilePicked}
            />
            <input
              ref={genericFileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleGenericFilePicked}
            />
            <input
              ref={composeVideoInputRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={handleGenericFilePicked}
            />

            {(uploading || fileBusy) && (
              <div style={styles.uploadingRow}>
                <Loader2 size={14} className="spin" /> 处理中…
              </div>
            )}
            {uploadError && <div style={styles.errorNote}>{uploadError}</div>}
            {fileError && <div style={styles.errorNote}>{fileError}</div>}

            {mediaUrls.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {mediaUrls.map((u, i) => (
                  <div key={i} style={{ position: "relative", width: 84, height: 84 }}>
                    <MediaPreview
                      url={u}
                      style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 12 }}
                    />
                    <button
                      type="button"
                      style={{ ...styles.removeMediaBtn, top: 4, right: 4 }}
                      onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {mediaUrls.length < 9 && (
                  <button
                    type="button"
                    style={styles.composeAddMoreBtn}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <ImagePlus size={18} />
                  </button>
                )}
              </div>
            )}
            {attachFile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <FileChip name={attachFile.name} size={attachFile.size} url={attachFile.url} />
                <button type="button" style={styles.removeMediaBtn} onClick={() => setAttachFile(null)}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ position: "relative", marginTop: 14 }}>
              <div style={styles.composePageIconRow}>
                <button
                  type="button"
                  style={styles.composePageIconBtn}
                  onClick={() => composeVideoInputRef.current && composeVideoInputRef.current.click()}
                >
                  <Video size={20} />
                </button>
                <button
                  type="button"
                  style={styles.composePageIconBtn}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <ImagePlus size={20} />
                </button>
                <button
                  type="button"
                  style={styles.composePageIconBtn}
                  onClick={() => genericFileInputRef.current && genericFileInputRef.current.click()}
                >
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  style={styles.composePageIconBtn}
                  onClick={() => setShowComposeEmoji((v) => !v)}
                >
                  <Smile size={20} />
                </button>
              </div>
              {showComposeEmoji && (
                <EmojiPicker
                  onPick={(e) => setDraft((d) => d + e)}
                  onClose={() => setShowComposeEmoji(false)}
                />
              )}
            </div>
          </div>
        )}

        {loaded && view === "channel" && (
          <div className="view-slide">
            <div style={ds(styles.channelHeaderBar, styles.channelHeaderBarDark)}>
              <span style={styles.channelHeaderTitle}>MaxWeb 热点信息</span>
              <span style={styles.channelHotTag}>热点</span>
            </div>

            {!hasChannelAccess ? (
              <div style={styles.accessLockedWrap}>
                <ShieldX size={48} style={styles.accessLockedIcon} />
                <div style={ds(styles.accessLockedTitle, styles.accessLockedTitleDark)}>
                  该内容暂未开放
                </div>
                <div style={ds(styles.accessLockedSub, styles.accessLockedSubDark)}>
                  请联系官方获取访问权限
                </div>
              </div>
            ) : (
              <>
            {channelLoaded && channelItems.length === 0 && (
              <div style={styles.empty}>还没有频道内容</div>
            )}

            <ChannelCarousel
              title="轮播区 1"
              items={channelBySlot[1]}
              canPost={canPostChannel}
              onDelete={deleteChannelItem}
              onOpenImage={setLightboxUrl}
              isDark={isDark}
              ds={ds}
              syncTick={channelTick}
            />
            <ChannelCarousel
              title="轮播区 2"
              items={channelBySlot[2]}
              canPost={canPostChannel}
              onDelete={deleteChannelItem}
              onOpenImage={setLightboxUrl}
              isDark={isDark}
              ds={ds}
              syncTick={channelTick}
            />
            <ChannelCarousel
              title="轮播区 3"
              items={channelBySlot[3]}
              canPost={canPostChannel}
              onDelete={deleteChannelItem}
              onOpenImage={setLightboxUrl}
              isDark={isDark}
              ds={ds}
              syncTick={channelTick}
            />
            <ChannelCarousel
              title="轮播区 4"
              items={channelBySlot[4]}
              canPost={canPostChannel}
              onDelete={deleteChannelItem}
              onOpenImage={setLightboxUrl}
              isDark={isDark}
              ds={ds}
              syncTick={channelTick}
            />

            {canPostChannel && (
              <div style={{ marginTop: 14 }}>
                {!showAddChannelItem ? (
                  <button
                    style={styles.attachBtn}
                    onClick={() => setShowAddChannelItem(true)}
                  >
                    <ImagePlus size={15} /> 发布轮播内容
                  </button>
                ) : (
                  <div style={ds(styles.composeBox, styles.composeBoxDark)}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.modalHint}>发布到哪个轮播区</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {[1, 2, 3, 4].map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            style={{
                              ...styles.friendActionBtn,
                              flex: 1,
                              background:
                                channelSlot === slot
                                  ? "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))"
                                  : "rgba(255,255,255,0.5)",
                              color: channelSlot === slot ? "#fff" : "#5c584d",
                            }}
                            onClick={() => setChannelSlot(slot)}
                          >
                            轮播 {slot}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={channelCaption}
                        onChange={(e) => setChannelCaption(e.target.value)}
                        placeholder="写点文字（可选）"
                        rows={1}
                        style={ds(styles.channelCaptionInput, styles.composeTextareaDark)}
                      />
                      <input
                        ref={channelImageInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleChannelImagePicked}
                      />
                      {!channelImage && !channelImageBusy && (
                        <button
                          type="button"
                          style={styles.attachBtn}
                          onClick={() => channelImageInputRef.current && channelImageInputRef.current.click()}
                        >
                          <ImagePlus size={15} /> 添加图片
                        </button>
                      )}
                      {channelImageBusy && (
                        <div style={styles.uploadingRow}>
                          <Loader2 size={14} className="spin" /> 图片处理中…
                        </div>
                      )}
                      {channelImage && (
                        <div style={styles.mediaPreviewWrap}>
                          <MediaPreview url={channelImage} style={{ marginTop: 8 }} />
                          <button
                            type="button"
                            style={styles.removeMediaBtn}
                            onClick={() => setChannelImage(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      {channelError && <div style={styles.errorNote}>{channelError}</div>}
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                          className="post-btn"
                          style={styles.postBtn}
                          disabled={(!channelImage && !channelCaption.trim()) || channelBusy}
                          onClick={submitChannelItem}
                        >
                          {channelBusy ? "发布中…" : "发布"}
                        </button>
                        <button
                          style={styles.modalLinkBtn}
                          onClick={() => {
                            setShowAddChannelItem(false);
                            setChannelImage(null);
                            setChannelCaption("");
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={ds(styles.channelBoardsTitle, styles.channelBoardsTitleDark)}>Minecraft</div>
            <div style={styles.channelBoardsGrid}>
              {CHANNEL_BOARDS.map((b) => (
                <button
                  key={b.id}
                  style={ds(styles.channelBoardBtn, styles.channelBoardBtnDark)}
                  onClick={() => {
                    setActiveBoardId(b.id);
                    setView("board");
                  }}
                >
                  <b.Icon size={22} />
                  <span style={styles.channelBoardLabel}>{b.name}</span>
                </button>
              ))}
            </div>

            <div style={ds(styles.channelBoardsTitle, styles.channelBoardsTitleDark)}>社区服务</div>
            <div style={styles.channelBoardsGrid}>
              {INFO_BOARDS.map((b) => (
                <button
                  key={b.id}
                  style={ds(styles.channelBoardBtn, styles.channelBoardBtnDark)}
                  onClick={() => {
                    setActiveBoardId(b.id);
                    setView("board");
                  }}
                >
                  <b.Icon size={22} />
                  <span style={styles.channelBoardLabel}>{b.name}</span>
                </button>
              ))}
            </div>
              </>
            )}
          </div>
        )}

        {loaded && view === "board" && activeBoardId && !hasChannelAccess && (
          <div className="view-slide">
            <div style={ds(styles.channelHeaderBar, styles.channelHeaderBarDark)}>
              <button style={styles.backBtn} onClick={() => setView("channel")}>
                <ArrowLeft size={18} /> 返回
              </button>
              <span style={styles.channelHeaderTitle}>板块</span>
              <span style={{ width: 46 }} />
            </div>
            <div style={styles.accessLockedWrap}>
              <ShieldX size={48} style={styles.accessLockedIcon} />
              <div style={ds(styles.accessLockedTitle, styles.accessLockedTitleDark)}>
                该内容暂未开放
              </div>
              <div style={ds(styles.accessLockedSub, styles.accessLockedSubDark)}>
                请联系官方获取访问权限
              </div>
            </div>
          </div>
        )}

        {loaded && view === "board" && activeBoardId && hasChannelAccess && (
          <BoardView
            boardId={activeBoardId}
            board={ALL_BOARDS.find((b) => b.id === activeBoardId)}
            posts={posts}
            user={user}
            myId={myId}
            displayName={displayName}
            handle={handle}
            isMod={isMod}
            isDark={isDark}
            ds={ds}
            canDelete={canDelete}
            deletePost={deletePost}
            reportPost={reportPost}
            repostPost={repostPost}
            toggleLike={toggleLike}
            likedLocal={likedLocal}
            persist={persist}
            posts_setPosts={setPosts}
            setView={setView}
            onOpenImage={setLightboxUrl}
            onOpenProfile={openProfile}
          />
        )}

        {loaded && view === "modqueue" && (
          <div className="view-slide">
            <div style={ds(styles.channelHeaderBar, styles.channelHeaderBarDark)}>
              <button style={styles.backBtn} onClick={() => setView("feed")}>
                <ArrowLeft size={18} /> 返回
              </button>
              <span style={styles.channelHeaderTitle}>
                <ClipboardCheck size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
                审核内容
              </span>
              <span style={{ width: 46 }} />
            </div>
            {posts.filter((p) => p.pending).length === 0 ? (
              <div style={styles.empty}>暂无待审核内容</div>
            ) : (
              posts
                .filter((p) => p.pending)
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((p) => (
                  <div key={p.id} style={ds(styles.postCard, styles.postCardDark)}>
                    <Avatar name={p.author} avatarUrl={p.authorAvatar} color={p.authorColor} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.postHeadRow}>
                        <span style={ds(styles.postAuthor, styles.postAuthorDark)}>{p.author}</span>
                        <RoleBadge role={p.authorRole} />
                        <span style={styles.postHandle}>{p.handle}</span>
                        <span style={styles.dot}>·</span>
                        <span style={styles.postTime}>{timeAgo(p.createdAt)}</span>
                      </div>
                      <div style={ds(styles.postBody, styles.postBodyDark)}>{p.body}</div>
                      {p.mediaUrl && (
                        <MediaPreview url={p.mediaUrl} onOpenImage={setLightboxUrl} style={{ marginTop: 8 }} />
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          style={{ ...styles.friendActionBtn, flex: 1 }}
                          onClick={() => approvePost(p.id)}
                        >
                          <ShieldCheck size={14} /> 通过
                        </button>
                        <button
                          style={{ ...styles.modalLinkBtn, flex: 1, border: "1px solid #e7e3da", borderRadius: 10, color: "#c0392b" }}
                          onClick={() => rejectPost(p.id)}
                        >
                          <ShieldX size={14} /> 拒绝
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {loaded && view === "feed" && (
          <div className="view-slide">
            {showSearchBar && (
              <div
                style={{
                  ...ds(styles.headerSearchBar, styles.headerSearchBarDark),
                  marginBottom: 12,
                  marginTop: 10,
                }}
              >
                <Search size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索动态内容"
                  style={ds(styles.headerSearchInput, styles.headerSearchInputDark)}
                />
                <button
                  style={styles.headerSearchClear}
                  onClick={() => {
                    if (searchQuery) setSearchQuery("");
                    else setShowSearchBar(false);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {user?.bannedFeed && (
              <div style={styles.errorNote}>你已被禁止发帖/评论</div>
            )}

            {saving && (
              <div style={styles.savingNote}>
                <Loader2 size={12} /> 保存中…
              </div>
            )}
            {error && <div style={styles.errorNote}>{error}</div>}

            {sorted.length === 0 && (
              <div style={styles.empty}>还没有动态，写下第一条吧。</div>
            )}

            <div>
              {sorted.map((p) => (
                <div
                  key={p.id}
                  className="post-card fade-in"
                  style={ds({ ...styles.postCard, ...styles.postCardEdge }, styles.postCardDark)}
                  onClick={() => {
                    setActiveId(p.id);
                    setView("thread");
                    setReplyDraft("");
                  }}
                >
                  <div style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); openProfile(p.authorId); }}>
                    <Avatar name={p.author} avatarUrl={p.authorAvatar} color={p.authorColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.postHeadRow}>
                      <span style={{ ...ds(styles.postAuthor, styles.postAuthorDark), cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); openProfile(p.authorId); }}>{p.author}</span><RoleBadge role={p.authorRole} />
                      <span style={styles.postHandle}>{p.handle}</span>
                      <span style={styles.dot}>·</span>
                      <span style={styles.postTime}>{timeAgo(p.createdAt)}</span>
                    </div>
                    {p.pending && (
                      <div style={styles.pendingNote}>
                        {isMod ? "待审核（含图片，仅你和作者可见）" : "审核中，仅你自己可见"}
                      </div>
                    )}
                    {isMod && (p.reports || []).length > 0 && (
                      <div
                        style={styles.reportNote}
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(
                            (p.reports || [])
                              .map((r, i) => `${i + 1}. ${r.reason || "（无说明）"}`)
                              .join("\n")
                          );
                        }}
                      >
                        <Flag size={12} /> {p.reports.length} 举报，点击查看
                      </div>
                    )}
                    <div style={ds(styles.postBody, styles.postBodyDark)}>{p.body}</div>
                    {p.mediaUrls && p.mediaUrls.length > 0 ? (
                      <PhotoStrip urls={p.mediaUrls} onOpen={setLightboxUrl} />
                    ) : (
                      p.mediaUrl && <MediaPreview url={p.mediaUrl} onOpen={setLightboxUrl} />
                    )}
                    {p.fileUrl && <FileChip name={p.fileName} size={p.fileSize} url={p.fileUrl} />}
                    {p.repostOf && (
                      <div style={styles.repostCard} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.repostCardHead}>
                          <Avatar
                            name={p.repostOf.author}
                            size={18}
                            avatarUrl={p.repostOf.authorAvatar}
                            color={p.repostOf.authorColor}
                          />
                          <span style={styles.repostCardAuthor}>{p.repostOf.author}</span>
                          <span style={styles.repostCardHandle}>{p.repostOf.handle}</span>
                        </div>
                        {p.repostOf.body && <div style={styles.repostCardBody}>{p.repostOf.body}</div>}
                        {p.repostOf.mediaUrls && p.repostOf.mediaUrls.length > 0 ? (
                          <PhotoStrip urls={p.repostOf.mediaUrls} onOpen={setLightboxUrl} />
                        ) : (
                          p.repostOf.mediaUrl && (
                            <MediaPreview url={p.repostOf.mediaUrl} style={{ maxHeight: 200 }} onOpen={setLightboxUrl} />
                          )
                        )}
                      </div>
                    )}
                    <div style={styles.actionRow}>
                      <button
                        className="icon-btn"
                        style={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveId(p.id);
                          setView("thread");
                        }}
                      >
                        <MessageCircle size={15} /> {p.replies.length}
                      </button>
                      <button
                        className="icon-btn"
                        style={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          repostPost(p);
                        }}
                      >
                        <Repeat2 size={15} />
                      </button>
                      <button
                        className={"icon-btn" + (likedLocal[p.id] ? " like-btn active" : "")}
                        style={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(p.id);
                        }}
                      >
                        <Heart size={15} fill={likedLocal[p.id] ? "#d1394f" : "none"} /> {p.likes}
                      </button>
                      {user && myId !== p.authorId && (
                        <button
                          className="icon-btn"
                          style={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            reportPost(p.id);
                          }}
                        >
                          <Flag size={15} />
                        </button>
                      )}
                      {canDelete(p.authorId) && (
                        <button
                          className="icon-btn"
                          style={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePost(p.id);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      {isMod && (p.reports || []).length > 0 && (
                        <button
                          className="icon-btn"
                          style={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            clearReports(p.id);
                          }}
                        >
                          清除举报
                        </button>
                      )}
                      {isMod && myId !== p.authorId && (
                        <div style={{ position: "relative" }}>
                          <button
                            className="icon-btn"
                            style={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuPostId(openMenuPostId === p.id ? null : p.id);
                            }}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openMenuPostId === p.id && (
                            <div style={styles.postMenuPopover} onClick={(e) => e.stopPropagation()}>
                              <button
                                style={styles.postMenuItem}
                                onClick={() => quickBanFeed(p.authorId)}
                              >
                                <Flag size={13} /> 封禁言论
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {p.pending && isMod && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                          style={{ ...styles.friendActionBtn, flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            approvePost(p.id);
                          }}
                        >
                          <ShieldCheck size={14} /> 通过
                        </button>
                        <button
                          style={{
                            ...styles.modalLinkBtn,
                            flex: 1,
                            border: "1px solid rgba(255,255,255,0.7)",
                            borderRadius: 999,
                            color: "#c0392b",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            rejectPost(p.id);
                          }}
                        >
                          <ShieldX size={14} /> 拒绝
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loaded && view === "thread" && activePost && (
          <div className="view-slide" style={{ position: "relative" }}>
            <button
              style={styles.floatingBackBtn}
              onClick={() => setView("feed")}
              aria-label="返回"
            >
              <ArrowLeft size={18} />
            </button>

            <div style={{ ...styles.postCard, cursor: "default", paddingTop: 40 }}>
              <div
                style={{ cursor: "pointer" }}
                onClick={() => openProfile(activePost.authorId)}
              >
                <Avatar
                  name={activePost.author}
                  size={44}
                  avatarUrl={activePost.authorAvatar}
                  color={activePost.authorColor}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.postHeadRow}>
                  <span
                    style={{ ...ds(styles.postAuthor, styles.postAuthorDark), cursor: "pointer" }}
                    onClick={() => openProfile(activePost.authorId)}
                  >
                    {activePost.author}
                  </span>
                  <RoleBadge role={activePost.authorRole} />
                  <span style={styles.postHandle}>{activePost.handle}</span>
                  <span style={styles.dot}>·</span>
                  <span style={styles.postTime}>{timeAgo(activePost.createdAt)}</span>
                </div>
                {activePost.pending && (
                  <div style={styles.pendingNote}>
                    {isMod ? "待审核（含图片，仅你和作者可见）" : "审核中，仅你自己可见"}
                  </div>
                )}
                {isMod && (activePost.reports || []).length > 0 && (
                  <div
                    style={styles.reportNote}
                    onClick={() =>
                      alert(
                        (activePost.reports || [])
                          .map((r, i) => `${i + 1}. ${r.reason || "（无说明）"}`)
                          .join("\n")
                      )
                    }
                  >
                    <Flag size={12} /> {activePost.reports.length} 举报，点击查看
                  </div>
                )}
                <div style={{ ...ds(styles.postBody, styles.postBodyDark), fontSize: 16 }}>{activePost.body}</div>
                {activePost.mediaUrls && activePost.mediaUrls.length > 0 ? (
                  <PhotoStrip urls={activePost.mediaUrls} onOpen={setLightboxUrl} />
                ) : (
                  activePost.mediaUrl && <MediaPreview url={activePost.mediaUrl} onOpen={setLightboxUrl} />
                )}
                {activePost.fileUrl && <FileChip name={activePost.fileName} size={activePost.fileSize} url={activePost.fileUrl} />}
                <div style={styles.actionRow}>
                  <span style={styles.actionBtn}>
                    <MessageCircle size={15} /> {activePost.replies.length}
                  </span>
                  <button
                    className={"icon-btn" + (likedLocal[activePost.id] ? " like-btn active" : "")}
                    style={styles.actionBtn}
                    onClick={() => toggleLike(activePost.id)}
                  >
                    <Heart size={15} fill={likedLocal[activePost.id] ? "#d1394f" : "none"} />{" "}
                    {activePost.likes}
                  </button>
                  {user && myId !== activePost.authorId && (
                    <button
                      className="icon-btn"
                      style={styles.actionBtn}
                      onClick={() => reportPost(activePost.id)}
                    >
                      <Flag size={15} />
                    </button>
                  )}
                  {canDelete(activePost.authorId) && (
                    <button
                      className="icon-btn"
                      style={styles.actionBtn}
                      onClick={() => deletePost(activePost.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                {activePost.pending && isMod && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      style={{ ...styles.friendActionBtn, flex: 1 }}
                      onClick={() => approvePost(activePost.id)}
                    >
                      <ShieldCheck size={14} /> 通过
                    </button>
                    <button
                      style={{
                        ...styles.modalLinkBtn,
                        flex: 1,
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: 999,
                        color: "#c0392b",
                      }}
                      onClick={() => rejectPost(activePost.id)}
                    >
                      <ShieldX size={14} /> 拒绝
                    </button>
                  </div>
                )}
              </div>
            </div>

            {user?.bannedFeed ? (
              <div style={styles.errorNote}>你已被禁止发帖/评论</div>
            ) : (
              <div style={{ ...styles.replyComposeRow, position: "relative" }}>
                <div style={{ flexShrink: 0 }}>
                  <Avatar name={displayName} size={34} avatarUrl={user?.avatarUrl} color={user?.color} />
                </div>
                <input
                  type="text"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="发布你的回复"
                  style={styles.replyInput}
                  onKeyDown={(e) => e.key === "Enter" && submitReply(activePost.id)}
                />
                <button
                  type="button"
                  style={{ ...styles.iconOnlyBtn, flexShrink: 0 }}
                  onClick={() => setShowReplyEmoji((v) => !v)}
                >
                  <Smile size={17} />
                </button>
                {showReplyEmoji && (
                  <EmojiPicker
                    onPick={(e) => setReplyDraft((d) => d + e)}
                    onClose={() => setShowReplyEmoji(false)}
                  />
                )}
                <button
                  className="post-btn"
                  style={{ ...styles.postBtn, flexShrink: 0 }}
                  disabled={!replyDraft.trim()}
                  onClick={() => submitReply(activePost.id)}
                >
                  回复
                </button>
              </div>
            )}

            <div style={styles.divider} />

            {activePost.replies.map((r) => (
              <div key={r.id} style={ds(styles.postCard, styles.postCardDark)}>
                <div style={{ cursor: "pointer" }} onClick={() => openProfile(r.authorId)}>
                  <Avatar name={r.author} size={34} avatarUrl={r.authorAvatar} color={r.authorColor} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.postHeadRow}>
                    <span
                      style={{ ...ds(styles.postAuthor, styles.postAuthorDark), cursor: "pointer" }}
                      onClick={() => openProfile(r.authorId)}
                    >
                      {r.author}
                    </span>
                    <RoleBadge role={r.authorRole} />
                    <span style={styles.postHandle}>{r.handle}</span>
                    <span style={styles.dot}>·</span>
                    <span style={styles.postTime}>{timeAgo(r.createdAt)}</span>
                  </div>
                  <div style={ds(styles.postBody, styles.postBodyDark)}>{r.body}</div>
                </div>
                {canDelete(r.authorId) && (
                  <button
                    className="icon-btn"
                    style={{ ...styles.actionBtn, alignSelf: "flex-start" }}
                    onClick={() => deleteReply(activePost.id, r.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}

const styles = {
  profileBanner: {
    height: 200,
    marginLeft: -16,
    marginRight: -16,
    marginTop: -12,
    background: "#e9e6dc",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profileBannerHint: { color: "#9a968a", fontSize: 13 },
  profileHeadRow: {
    display: "flex",
    alignItems: "flex-end",
    marginTop: -40,
    marginBottom: 8,
    paddingLeft: 6,
  },
  profileAvatarBusy: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.6)",
    borderRadius: "50%",
  },
  profileFollowBtn: {
    padding: "8px 18px",
    borderRadius: 999,
    border: "none",
    background: "#0f6e5c",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  profileUnfollowBtn: {
    padding: "8px 18px",
    borderRadius: 999,
    border: "1px solid #d8d3c6",
    background: "#fff",
    color: "#5c584d",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  profileDmBtn: {
    padding: "8px 18px",
    borderRadius: 999,
    border: "1px solid #d8d3c6",
    background: "#fff",
    color: "#5c584d",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  profileStatsRow: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    fontSize: 12.5,
    color: "#9a968a",
    margin: "6px 0",
  },
  profileFieldRow: { fontSize: 13.5, color: "#5c584d", margin: "4px 0" },
  profileFieldInput: {
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid #e7e3da",
    fontSize: 13.5,
    outline: "none",
  },
  profileBio: {
    fontSize: 14,
    color: "#2b271f",
    margin: "8px 0 4px",
    padding: "8px 10px",
    borderRadius: 10,
    background: "#f5f3ee",
    minHeight: 20,
  },
  app: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    background: "#ffffff",
    color: "#1c1f24",
    minHeight: "100vh",
  },
  appDark: { background: "#0e0f10", color: "#eceae4" },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    flexWrap: "wrap",
    gap: 10,
  },
  headerDark: {},
  brandRow: { display: "flex", alignItems: "center", gap: 8 },
  logo: { color: "#0f6e5c", fontSize: 18, fontWeight: 700 },
  title: { fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em", color: "#000" },
  titleDark: { color: "#ffffff" },
  nameField: { display: "flex", alignItems: "center", gap: 8 },
  handleTag: { fontSize: 12.5, color: "#9a968a" },
  nameInput: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #e7e3da",
    fontSize: 13,
    background: "#fff",
    width: 120,
    outline: "none",
  },
  userNameTag: { fontSize: 13.5, fontWeight: 700, color: "#2b271f" },
  userNameTagDark: { color: "#f0eee8" },
  headerUserTag: { display: "flex", alignItems: "center", gap: 6 },
  headerSearchBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    padding: "9px 16px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.4)",
    backdropFilter: "blur(24px) saturate(1.8)",
    WebkitBackdropFilter: "blur(24px) saturate(1.8)",
    border: "1px solid rgba(255,255,255,0.55)",
    boxShadow: "0 4px 14px rgba(20,30,28,0.08)",
  },
  headerSearchBarDark: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  headerSearchInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 14,
    color: "#1c1f24",
  },
  headerSearchInputDark: { color: "#eceae4" },
  headerSearchClear: {
    flexShrink: 0,
    border: "none",
    background: "rgba(0,0,0,0.08)",
    borderRadius: "50%",
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#5c584d",
    cursor: "pointer",
  },
  loginBtn: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid rgba(15,110,92,0.25)",
    background: "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(15,110,92,0.35), 0 1px 0 rgba(255,255,255,0.3) inset",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  logoutBtn: {
    padding: "6px 13px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.6)",
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#3d5a52",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(20,40,35,0.08)",
  },
  accountChip: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "5px 12px 5px 5px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.6)",
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(20,40,35,0.08)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(20,30,28,0.35)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    padding: 20,
  },
  modalBox: {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(28px) saturate(1.8)",
    WebkitBackdropFilter: "blur(28px) saturate(1.8)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: 26,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    maxHeight: "85vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow:
      "0 24px 60px rgba(20,30,28,0.28), 0 1px 0 rgba(255,255,255,0.8) inset",
  },
  modalTitle: { fontSize: 17, fontWeight: 800, marginBottom: 4 },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "11px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.7)",
    background: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    fontSize: 14,
    fontWeight: 700,
    color: "#2b271f",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(20,40,35,0.08)",
  },
  modalDivider: {
    textAlign: "center",
    fontSize: 12,
    color: "#8a8578",
    margin: "2px 0",
  },
  modalInput: {
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.7)",
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(6px)",
    fontSize: 14,
    outline: "none",
  },
  modalActionBtn: {
    padding: "11px 14px",
    borderRadius: 999,
    border: "1px solid rgba(15,110,92,0.25)",
    background: "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(15,110,92,0.3), 0 1px 0 rgba(255,255,255,0.3) inset",
  },
  modalLinkBtn: {
    background: "none",
    border: "none",
    color: "#5c7d74",
    fontSize: 12.5,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 4,
  },
  modalHint: { fontSize: 12.5, color: "#7a766c" },
  settingsAvatarRow: { display: "flex", alignItems: "center", gap: 14 },
  profileHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "8px 0 16px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    marginBottom: 4,
  },
  profileAvatarWrap: { position: "relative" },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "2px solid #fff",
    background: "#0f6e5c",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  },
  profileNameInput: {
    border: "none",
    outline: "none",
    background: "none",
    fontSize: 20,
    fontWeight: 800,
    textAlign: "center",
    color: "#1c1f24",
    padding: "4px 8px",
    borderRadius: 10,
    width: "100%",
    maxWidth: 240,
  },
  profileNameRow: { display: "flex", alignItems: "center", gap: 6 },
  profileNameDisplay: { fontSize: 20, fontWeight: 800, color: "#1c1f24" },
  pencilBtn: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "none",
    background: "rgba(15,110,92,0.12)",
    color: "#0f6e5c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  profileHandleRow: { display: "flex", alignItems: "center", gap: 6 },
  profileHandle: { fontSize: 13, color: "#9a968a" },
  myIdRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  myIdLabel: { fontSize: 12.5, color: "#9a968a" },
  myIdValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#2b2a25",
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  myIdChangeBtn: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#12866f",
    background: "rgba(20,130,108,0.08)",
    border: "1px solid rgba(20,130,108,0.2)",
    borderRadius: 999,
    padding: "3px 10px",
    cursor: "pointer",
  },
  settingsSection: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.5)",
    border: "1px solid rgba(255,255,255,0.6)",
    marginTop: 12,
  },
  settingsSectionTitle: { fontSize: 12.5, fontWeight: 800, color: "#5c584d" },
  settingsMenuGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
  },
  settingsMenuBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "11px 14px",
    borderRadius: 999,
    border: "1px solid rgba(20,130,108,0.2)",
    background: "rgba(20,130,108,0.08)",
    color: "#12866f",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
  logoutFullBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 999,
    border: "1px solid rgba(192,57,43,0.25)",
    background: "rgba(192,57,43,0.08)",
    color: "#c0392b",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 6,
  },
  swatchRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  main: { maxWidth: 560, margin: "0 auto", padding: "12px 16px calc(88px + env(safe-area-inset-bottom, 0px))" },
  settingsPage: { maxWidth: 420, margin: "0 auto", padding: "12px 0 20px", display: "flex", flexDirection: "column", gap: 4 },
  settingsPageDark: { color: "#eceae4" },
  composePage: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "12px 0 20px",
    color: "#1c1f24",
  },
  composePageDark: { color: "#eceae4" },
  composePageHeadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 2px",
    marginBottom: 10,
    borderBottom: "1px solid rgba(0,0,0,0.1)",
  },
  composePageBack: {
    border: "none",
    background: "none",
    color: "inherit",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 4,
  },
  composePageTitle: { fontWeight: 800, fontSize: 16 },
  composePageSubmit: {
    border: "none",
    borderRadius: 0,
    background: "#0f6e5c",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13.5,
    padding: "8px 18px",
    cursor: "pointer",
  },
  composePageTextarea: {
    width: "100%",
    minHeight: 140,
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 0,
    outline: "none",
    resize: "vertical",
    fontSize: 15.5,
    lineHeight: 1.6,
    padding: 12,
    background: "transparent",
    boxSizing: "border-box",
  },
  composePageIconRow: {
    display: "flex",
    gap: 10,
    borderTop: "1px solid rgba(0,0,0,0.1)",
    paddingTop: 12,
  },
  composePageIconBtn: {
    width: 40,
    height: 40,
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 0,
    background: "none",
    color: "#5c584d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  bottomNav: {
    position: "fixed",
    left: "50%",
    bottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
    zIndex: 10,
    display: "flex",
    gap: 4,
    padding: "8px 10px",
    borderRadius: 999,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.16) 100%)",
    backdropFilter: "blur(1px) url(#liquidGlassDistort) blur(22px) saturate(1.4) brightness(1.05)",
    WebkitBackdropFilter: "blur(22px) saturate(1.4) brightness(1.05)",
    border: "1px solid rgba(255,255,255,0.5)",
    boxShadow:
      "0 16px 40px rgba(0,0,0,0.22), 0 2px 0 rgba(255,255,255,0.7) inset, 0 -3px 8px rgba(0,0,0,0.08) inset, 0 0 0 1px rgba(255,255,255,0.18) inset",
    overflow: "hidden",
    transition:
      "transform .6s cubic-bezier(0.34,1.56,0.64,1), opacity .4s ease",
  },
  bottomNavGlassHighlight: {
    position: "absolute",
    top: 1,
    left: "6%",
    right: "6%",
    height: "42%",
    borderRadius: "999px / 999px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
    mixBlendMode: "overlay",
    pointerEvents: "none",
  },
  bottomNavIndicator: {
    position: "absolute",
    top: 8,
    left: 10,
    width: NAV_ITEM_WIDTH,
    height: 46,
    borderRadius: 999,
    background:
      "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0.32) 100%)",
    backdropFilter: "blur(1px) url(#liquidGlassDistort) blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    boxShadow:
      "0 6px 14px rgba(0,0,0,0.16), 0 1.5px 0 rgba(255,255,255,0.95) inset, 0 -3px 5px rgba(0,0,0,0.08) inset, 0 0 0 1px rgba(255,255,255,0.6) inset",
    transition: "transform .75s cubic-bezier(0.34,1.56,0.64,1)",
    pointerEvents: "none",
  },
  bottomNavItem: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    border: "none",
    background: "none",
    color: "#8e8e93",
    padding: "6px 18px",
    borderRadius: 999,
    cursor: "pointer",
    transition: "transform .3s cubic-bezier(0.34,1.56,0.64,1)",
    touchAction: "manipulation",
  },
  bottomNavItemActive: {
    color: "#1c1c1e",
  },
  bottomNavLabel: { fontSize: 10.5, fontWeight: 700 },
  navPlusBtn: {
    position: "relative",
    zIndex: 1,
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.5)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.18) 100%)",
    backdropFilter: "blur(1px) url(#liquidGlassDistort) blur(22px) saturate(1.4) brightness(1.05)",
    WebkitBackdropFilter: "blur(22px) saturate(1.4) brightness(1.05)",
    boxShadow:
      "0 16px 34px rgba(0,0,0,0.24), 0 2px 0 rgba(255,255,255,0.75) inset, 0 -3px 7px rgba(0,0,0,0.1) inset, 0 0 0 1px rgba(255,255,255,0.18) inset",
    color: "#1c1c1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform .3s cubic-bezier(0.34,1.56,0.64,1)",
  },
  navPlusMenu: {
    position: "absolute",
    bottom: "calc(100% + 10px)",
    right: 0,
    zIndex: 11,
    width: 124,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    borderRadius: 28,
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.18) 100%)",
    backdropFilter: "blur(1px) url(#liquidGlassDistort) blur(24px) saturate(1.4) brightness(1.05)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4) brightness(1.05)",
    border: "1px solid rgba(255,255,255,0.5)",
    boxShadow:
      "0 16px 40px rgba(0,0,0,0.24), 0 2px 0 rgba(255,255,255,0.75) inset, 0 -3px 8px rgba(0,0,0,0.1) inset, 0 0 0 1px rgba(255,255,255,0.18) inset",
  },
  navPlusGridItem: {
    width: "100%",
    height: 62,
    border: "none",
    background: "transparent",
    color: "#1c1c1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  navPlusGridItemTL: {
    borderRight: "1px solid rgba(255,255,255,0.4)",
    borderBottom: "1px solid rgba(255,255,255,0.4)",
  },
  navPlusGridItemTR: { borderBottom: "1px solid rgba(255,255,255,0.4)" },
  navPlusGridItemBL: { borderRight: "1px solid rgba(255,255,255,0.4)" },
  navPlusGridItemBR: {},
  loading: { color: "#9a968a", fontSize: 14, padding: "24px 0" },
  composeBox: {
    display: "flex",
    gap: 12,
    padding: "16px",
    marginTop: 14,
    borderRadius: 22,
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(18px) saturate(1.6)",
    WebkitBackdropFilter: "blur(18px) saturate(1.6)",
    border: "1px solid rgba(255,255,255,0.6)",
    boxShadow: "0 8px 24px rgba(20,40,35,0.06), 0 1px 0 rgba(255,255,255,0.6) inset",
  },
  composeBoxDark: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  },
  composeTextareaDark: { color: "#eceae4" },
  composeTextarea: {
    width: "100%",
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: 15,
    background: "transparent",
    lineHeight: 1.3,
  },
  feedbackConfirmWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "60px 20px 40px",
    gap: 10,
  },
  feedbackConfirmIcon: { color: "#12866f", marginBottom: 6 },
  feedbackConfirmText: { fontSize: 17, fontWeight: 700, color: "#2b2a25" },
  feedbackConfirmTextDark: { color: "#eceae4" },
  feedbackConfirmSub: { fontSize: 13.5, color: "#7c7869" },
  feedbackConfirmSubDark: { color: "#b8b4a8" },
  feedbackBackLink: {
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "none",
    color: "#12866f",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  feedbackComposeWrap: {
    marginTop: 14,
    padding: 16,
    borderRadius: 0,
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(18px) saturate(1.6)",
    WebkitBackdropFilter: "blur(18px) saturate(1.6)",
    border: "1px solid rgba(180,178,168,0.7)",
  },
  feedbackComposeWrapDark: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  feedbackComposeTitle: { fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#2b2a25" },
  feedbackComposeTitleDark: { color: "#eceae4" },
  feedbackTextarea: {
    width: "100%",
    border: "1px solid #cfcabd",
    outline: "none",
    resize: "none",
    fontSize: 14,
    padding: "10px 12px",
    borderRadius: 0,
    lineHeight: 1.5,
    boxSizing: "border-box",
    background: "transparent",
  },
  feedbackTextareaDark: { color: "#eceae4", border: "1px solid rgba(255,255,255,0.14)" },
  feedbackAttachRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #cfcabd",
    flexWrap: "wrap",
  },
  feedbackAttachBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "rgba(20,130,108,0.08)",
    border: "1px solid rgba(20,130,108,0.2)",
    borderRadius: 0,
    padding: "6px 12px",
    fontSize: 12.5,
    color: "#12866f",
    cursor: "pointer",
  },
  feedbackUploadBtn: {
    background: "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))",
    color: "#fff",
    border: "1px solid rgba(15,110,92,0.25)",
    borderRadius: 0,
    padding: "7px 18px",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
  },
  feedbackAttachedName: {
    marginTop: 8,
    fontSize: 12,
    color: "#7c7869",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  feedbackAttachedNameDark: { color: "#b8b4a8" },
  feedbackAttachRemoveBtn: {
    background: "transparent",
    border: "none",
    color: "#c0392b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  feedbackHistoryTitle: { fontSize: 13, fontWeight: 800, color: "#5c584d", marginBottom: 8 },
  feedbackHistoryTitleDark: { color: "#cfccc0" },
  feedbackHistoryCard: {
    border: "1px solid #e7e3da",
    borderRadius: 0,
    padding: "10px 12px",
    marginBottom: 8,
    background: "rgba(255,255,255,0.5)",
  },
  feedbackHistoryCardDark: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  feedbackHistoryBody: { fontSize: 13.5, color: "#2b2a25", lineHeight: 1.5 },
  feedbackHistoryBodyDark: { color: "#eceae4" },
  feedbackHistoryFootRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  feedbackHistoryTime: { fontSize: 11.5, color: "#9a968a" },
  feedbackStatusDone: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#12866f",
    background: "rgba(20,130,108,0.1)",
    border: "1px solid rgba(20,130,108,0.25)",
    padding: "2px 9px",
  },
  feedbackStatusPending: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#a5772f",
    background: "rgba(196,145,45,0.1)",
    border: "1px solid rgba(196,145,45,0.28)",
    padding: "2px 9px",
  },
  feedbackModStatusRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  feedbackResolveBtn: {
    fontSize: 12,
    fontWeight: 700,
    color: "#12866f",
    background: "rgba(20,130,108,0.08)",
    border: "1px solid rgba(20,130,108,0.2)",
    padding: "4px 10px",
    cursor: "pointer",
  },
  feedbackUnresolveBtn: {
    fontSize: 12,
    fontWeight: 700,
    color: "#7c7869",
    background: "rgba(120,116,105,0.08)",
    border: "1px solid rgba(120,116,105,0.2)",
    padding: "4px 10px",
    cursor: "pointer",
  },
  channelCaptionInput: {
    width: "100%",
    border: "1px solid #e7e3da",
    outline: "none",
    resize: "none",
    fontSize: 13,
    padding: "8px 11px",
    borderRadius: 8,
    lineHeight: 1.4,
    boxSizing: "border-box",
    background: "transparent",
  },
  composeFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  postBtn: {
    background: "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))",
    color: "#fff",
    border: "1px solid rgba(15,110,92,0.25)",
    borderRadius: 999,
    padding: "7px 18px",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(15,110,92,0.3), 0 1px 0 rgba(255,255,255,0.3) inset",
  },
  savingNote: {
    fontSize: 12,
    color: "#9a968a",
    display: "flex",
    gap: 6,
    alignItems: "center",
    padding: "6px 4px",
  },
  errorNote: { fontSize: 12, color: "#d1394f", padding: "4px 4px" },
  pendingNote: {
    fontSize: 12,
    color: "#a8791a",
    background: "rgba(255,214,110,0.35)",
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 8,
    margin: "4px 0",
  },
  reportNote: {
    fontSize: 12,
    color: "#c0392b",
    background: "rgba(255,140,120,0.18)",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    borderRadius: 8,
    margin: "4px 0",
    cursor: "pointer",
    width: "fit-content",
  },
  empty: { color: "#9a968a", fontSize: 14, padding: "40px 0", textAlign: "center" },
  accessLockedWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "70px 24px 40px",
    gap: 8,
  },
  accessLockedIcon: { color: "#c0392b", marginBottom: 6 },
  accessLockedTitle: { fontSize: 16, fontWeight: 700, color: "#2b2a25" },
  accessLockedTitleDark: { color: "#eceae4" },
  accessLockedSub: { fontSize: 13, color: "#9a968a" },
  accessLockedSubDark: { color: "#b8b4a8" },
  channelHeaderBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    marginTop: 12,
    borderRadius: 999,
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.55)",
  },
  channelHeaderBarDark: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  channelHeaderTitle: { fontWeight: 800, fontSize: 15.5 },
  channelHotTag: {
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(180deg, rgba(220,90,60,0.95), rgba(190,60,40,0.95))",
    padding: "4px 12px",
    borderRadius: 999,
  },
  channelCarousel: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    marginTop: 12,
    padding: "6px 2px 10px",
    WebkitOverflowScrolling: "touch",
  },
  channelSlide: {
    position: "relative",
    flex: "0 0 82%",
    scrollSnapAlign: "center",
    borderRadius: 18,
    overflow: "hidden",
    minHeight: 160,
    background: "rgba(255,255,255,0.5)",
    border: "1px solid rgba(255,255,255,0.55)",
    boxShadow: "0 6px 16px rgba(20,30,28,0.08)",
  },
  channelSlideImg: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    display: "block",
    cursor: "zoom-in",
  },
  channelSlideCaption: { padding: "10px 14px 4px", fontSize: 14.5, lineHeight: 1.5 },
  channelSlideMeta: {
    padding: "0 14px 12px",
    fontSize: 12,
    color: "#9a968a",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  channelDeleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "none",
    background: "rgba(20,20,20,0.55)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  channelDots: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  channelDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "rgba(15,110,92,0.25)",
    transition: "all .3s ease",
  },
  channelDotActive: { background: "#0f6e5c", width: 16 },
  channelSlotLabel: { fontSize: 13, fontWeight: 700, color: "#5c584d", margin: "0 2px 6px" },
  channelSlotLabelDark: { color: "#c9c6bd" },
  channelSlideDark: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
  },
  channelSlideCaptionDark: { color: "#e2dfd7" },
  channelSlideEmpty: {
    padding: "30px 0",
    textAlign: "center",
    color: "#9a968a",
    fontSize: 13,
    borderRadius: 20,
    background: "rgba(255,255,255,0.4)",
    border: "1px solid rgba(255,255,255,0.5)",
  },
  channelSlideEmptyDark: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#8a8780",
  },
  channelBoardsTitle: { fontSize: 15, fontWeight: 800, margin: "18px 2px 8px" },
  channelBoardsTitleDark: { color: "#f0eee8" },
  channelBoardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },
  channelBoardBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "18px 10px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.55)",
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    color: "#2b271f",
    cursor: "pointer",
  },
  channelBoardBtnDark: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#eceae4",
  },
  channelBoardLabel: { fontSize: 12.5, fontWeight: 700, textAlign: "center" },
  postCard: {
    display: "flex",
    gap: 12,
    padding: "14px",
    marginTop: 10,
    borderRadius: 20,
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(14px) saturate(1.5)",
    WebkitBackdropFilter: "blur(14px) saturate(1.5)",
    border: "1px solid rgba(255,255,255,0.55)",
    boxShadow: "0 6px 18px rgba(20,40,35,0.05)",
    cursor: "pointer",
  },
  postCardEdge: {
    marginLeft: -16,
    marginRight: -16,
  },
  postCardDark: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
  },
  postHeadRow: { display: "flex", alignItems: "baseline", gap: 6, fontSize: 13.5, flexWrap: "wrap" },
  postAuthor: { fontWeight: 700 },
  postAuthorDark: { color: "#f0eee8" },
  postHandle: { color: "#9a968a" },
  dot: { color: "#c9c4b5" },
  postTime: { color: "#9a968a" },
  postBody: {
    fontSize: 14.5,
    lineHeight: 1.32,
    margin: "4px 0 10px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  postBodyDark: { color: "#e2dfd7" },
  actionRow: {
    display: "flex",
    gap: 20,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid rgba(120,116,105,0.14)",
  },
  repostCard: {
    marginTop: 8,
    padding: 10,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(0,0,0,0.02)",
  },
  repostCardHead: { display: "flex", alignItems: "center", gap: 6 },
  repostCardAuthor: { fontWeight: 700, fontSize: 12.5 },
  repostCardHandle: { fontSize: 11, color: "#9a968a" },
  repostCardBody: { fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  postMenuPopover: {
    position: "absolute",
    bottom: "calc(100% + 6px)",
    right: 0,
    zIndex: 12,
    minWidth: 130,
    padding: 6,
    borderRadius: 12,
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(20px) saturate(1.8)",
    WebkitBackdropFilter: "blur(20px) saturate(1.8)",
    border: "1px solid rgba(255,255,255,0.7)",
    boxShadow: "0 10px 26px rgba(20,30,28,0.2)",
  },
  postMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "none",
    background: "none",
    color: "#c0392b",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "none",
    border: "none",
    color: "#9a968a",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "#0f6e5c",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    padding: "10px 0",
  },
  backBtnBar: {
    position: "sticky",
    top: 57,
    zIndex: 4,
    background: "rgba(244,242,236,0.75)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    marginBottom: 4,
  },
  floatingBackBtn: {
    position: "absolute",
    top: 4,
    left: 4,
    zIndex: 6,
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 2px 8px rgba(20,30,28,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0f6e5c",
    cursor: "pointer",
  },
  friendsTabRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    padding: "10px 0",
    marginBottom: 8,
  },
  friendsTab: {
    padding: "6px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.6)",
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#5c584d",
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(20,40,35,0.06)",
  },
  friendsTabActive: {
    background: "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))",
    color: "#fff",
    border: "1px solid rgba(15,110,92,0.3)",
    boxShadow: "0 4px 14px rgba(15,110,92,0.3)",
  },
  friendsMoreBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.5)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.18) 100%)",
    backdropFilter: "blur(1px) url(#liquidGlassDistort) blur(18px) saturate(1.4) brightness(1.05)",
    WebkitBackdropFilter: "blur(18px) saturate(1.4) brightness(1.05)",
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.18), 0 1.5px 0 rgba(255,255,255,0.8) inset, 0 -2px 5px rgba(0,0,0,0.1) inset, 0 0 0 1px rgba(255,255,255,0.2) inset",
    color: "#1c1c1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  friendsMorePanel: {
    position: "fixed",
    inset: 0,
    zIndex: 20,
    overflowY: "auto",
    background: "#faf9f6",
    padding: "0 16px 24px",
  },
  friendsMoreBtnSmall: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.5)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.18) 100%)",
    backdropFilter: "blur(1px) url(#liquidGlassDistort) blur(14px) saturate(1.4) brightness(1.05)",
    WebkitBackdropFilter: "blur(14px) saturate(1.4) brightness(1.05)",
    boxShadow:
      "0 6px 14px rgba(0,0,0,0.16), 0 1.5px 0 rgba(255,255,255,0.8) inset, 0 -2px 4px rgba(0,0,0,0.1) inset",
    color: "#1c1c1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  socialMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    zIndex: 11,
    width: 108,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    borderRadius: 26,
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.18) 100%)",
    backdropFilter: "blur(1px) url(#liquidGlassDistort) blur(24px) saturate(1.4) brightness(1.05)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4) brightness(1.05)",
    border: "1px solid rgba(255,255,255,0.5)",
    boxShadow:
      "0 16px 40px rgba(0,0,0,0.24), 0 2px 0 rgba(255,255,255,0.75) inset, 0 -3px 8px rgba(0,0,0,0.1) inset, 0 0 0 1px rgba(255,255,255,0.18) inset",
  },
  groupSettingsSheet: {
    position: "fixed",
    left: "50%",
    bottom: 0,
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: "22px 22px 0 0",
    padding: "18px 16px 26px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  groupCodeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(0,0,0,0.04)",
  },
  modalDangerBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    background: "rgba(209,57,79,0.1)",
    color: "#d1394f",
    fontSize: 14.5,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
  },
  friendRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px",
    marginTop: 8,
    borderRadius: 18,
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.55)",
    boxShadow: "0 4px 14px rgba(20,40,35,0.05)",
  },
  friendRowFlat: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 12px",
    marginTop: 6,
    borderRadius: 0,
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  friendActionBtn: {
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(15,110,92,0.25)",
    background: "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))",
    color: "#fff",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  chatWrap: {
    position: "fixed",
    inset: 0,
    zIndex: 30,
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
  },
  chatHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    background: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(255,255,255,0.6)",
    flexShrink: 0,
  },
  chatScrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  chatBubbleMineRow: { display: "flex", justifyContent: "flex-end", minWidth: 0 },
  chatBubbleTheirsRow: { display: "flex", justifyContent: "flex-start", minWidth: 0 },
  chatBubbleMine: {
    background: "linear-gradient(180deg, rgba(20,130,108,0.95), rgba(15,110,92,0.95))",
    color: "#fff",
    padding: "9px 13px",
    borderRadius: "16px 16px 2px 16px",
    maxWidth: "75%",
    minWidth: 0,
    fontSize: 14.5,
    lineHeight: 1.4,
    wordBreak: "break-word",
    boxShadow: "0 3px 10px rgba(15,110,92,0.25)",
  },
  chatBubbleTheirs: {
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.6)",
    color: "#2b271f",
    padding: "9px 13px",
    borderRadius: "16px 16px 16px 2px",
    maxWidth: "75%",
    minWidth: 0,
    fontSize: 14.5,
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  chatInputRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
    background: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderTop: "1px solid rgba(255,255,255,0.6)",
    flexShrink: 0,
  },
  replyComposeRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px",
    marginTop: 10,
    borderRadius: 20,
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",

    border: "1px solid rgba(255,255,255,0.55)",
  },
  replyInput: {
    flex: "1 1 auto",
    minWidth: 0,
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.7)",
    background: "rgba(255,255,255,0.6)",
    fontSize: 14,
    outline: "none",
  },
  divider: { height: 8 },
  mediaInput: {
    width: "100%",
    padding: "8px 11px",
    borderRadius: 8,
    border: "1px solid #e7e3da",
    fontSize: 13,
    marginTop: 8,
    outline: "none",
    boxSizing: "border-box",
  },
  media: {
    display: "block",
    width: "100%",
    maxHeight: 360,
    objectFit: "cover",
    borderRadius: 12,
    marginTop: 8,
    border: "1px solid #e7e3da",
    background: "#efece4",
  },
  lightboxOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    background: "rgba(10,12,12,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  lightboxTopBar: {
    position: "absolute",
    top: "calc(14px + env(safe-area-inset-top, 0px))",
    right: 14,
    display: "flex",
    gap: 10,
  },
  lightboxIconBtn: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  lightboxImg: {
    maxWidth: "100%",
    maxHeight: "88vh",
    objectFit: "contain",
    borderRadius: 8,
  },
  emojiPopover: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: 0,
    zIndex: 15,
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: 2,
    padding: 10,
    width: 240,
    borderRadius: 16,
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(24px) saturate(1.8)",
    WebkitBackdropFilter: "blur(24px) saturate(1.8)",
    border: "1px solid rgba(255,255,255,0.7)",
    boxShadow: "0 12px 30px rgba(20,30,28,0.2)",
  },
  emojiBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    padding: 4,
    cursor: "pointer",
    borderRadius: 8,
  },
  iconOnlyBtn: {
    background: "none",
    border: "none",
    color: "#7a766c",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  attachBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: "6px 13px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.7)",
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "#5c584d",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  uploadingRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    fontSize: 12.5,
    color: "#9a968a",
  },
  mediaPreviewWrap: {
    position: "relative",
  },
  removeMediaBtn: {
    position: "absolute",
    top: 16,
    right: 8,
    background: "rgba(28,31,36,0.65)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  composeAddMoreBtn: {
    width: 84,
    height: 84,
    borderRadius: 12,
    border: "1.5px dashed #cfcabf",
    background: "rgba(0,0,0,0.02)",
    color: "#7a766c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};
