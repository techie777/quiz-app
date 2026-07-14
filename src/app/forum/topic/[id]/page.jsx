"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/Forum.module.css";
import ForumUserAvatar from "@/components/ForumUserAvatar";
import toast from "react-hot-toast";
import { useSession, signIn } from "next-auth/react";

export default function TopicPage({ params }) {
  const { data: session } = useSession();
  const { id } = params;
  const router = useRouter();
  
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTopic = async () => {
    try {
      const res = await fetch(`/api/forum/topics/${id}`);
      if (!res.ok) throw new Error("Not found");
      setTopic(await res.json());
    } catch (err) {
      toast.error("Topic not found");
      router.push("/forum");
    }
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/forum/comments?topicId=${id}`);
    if (res.ok) setComments(await res.json());
  };

  useEffect(() => {
    Promise.all([fetchTopic(), fetchComments()]).finally(() => setLoading(false));
  }, [id]);

  const handleLike = async (topicId, commentId = null) => {
    if (!session) return signIn();
    try {
      const res = await fetch("/api/forum/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, commentId })
      });
      if (res.ok) {
        if (commentId) fetchComments();
        else fetchTopic();
      } else {
        const data = await res.json();
        if (res.status === 401) toast.error("Please login to like");
        else toast.error(data.error || "Failed to like");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleReport = async (topicId, commentId = null) => {
    if (!session) return signIn();
    const reason = prompt("Reason for reporting?");
    if (!reason) return;

    try {
      const res = await fetch("/api/forum/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, commentId, reason })
      });
      if (res.ok) toast.success("Report submitted for review.");
      else {
        if (res.status === 401) toast.error("Please login to report");
        else toast.error("Failed to report");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const submitComment = async () => {
    if (!session) return signIn();
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/forum/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: replyContent, 
          topicId: id, 
          parentId: replyingTo?.id || null 
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to post comment");
        return;
      }
      
      setReplyContent("");
      setReplyingTo(null);
      fetchComments();
      fetchTopic();
      toast.success("Comment posted!");
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    
    try {
      const res = await fetch(`/api/forum/topics/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Topic deleted successfully");
        router.push("/forum");
      } else {
        toast.error("Failed to delete topic");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!topic) return null;

  // Organize comments into a tree
  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);

  const CommentThread = ({ comment }) => {
    const replies = getReplies(comment.id);
    return (
      <div className={styles.commentItem}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <ForumUserAvatar user={comment.author} size={32} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className={styles.commentBody}>{comment.content}</div>
        
        <div className={styles.actionRow}>
          <button className={styles.actionBtn} onClick={() => handleLike(null, comment.id)}>
            ❤️ {comment._count.likes}
          </button>
          <button className={styles.actionBtn} onClick={() => { setReplyingTo(comment); document.getElementById('replyBox').scrollIntoView(); }}>
            ↩️ Reply
          </button>
          <button className={styles.actionBtn} onClick={() => handleReport(null, comment.id)} style={{ marginLeft: 'auto', border: 'none' }}>
            🚩 Report
          </button>
        </div>

        {replies.length > 0 && (
          <div className={styles.replyLine}>
            {replies.map(r => <CommentThread key={r.id} comment={r} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Link href={`/forum/${topic.group.slug}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to {topic.group.name}
      </Link>

      <div className={styles.postContent}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          {topic.status === 'PENDING' && <span style={{color: 'orange', fontSize:'1rem', border: '1px solid orange', padding:'2px 8px', borderRadius:'12px', marginRight:'12px', verticalAlign:'middle'}}>PENDING APPROVAL</span>}
          {topic.status === 'REJECTED' && <span style={{color: 'red', fontSize:'1rem', border: '1px solid red', padding:'2px 8px', borderRadius:'12px', marginRight:'12px', verticalAlign:'middle'}}>REJECTED</span>}
          {topic.isPinned && "📌 "}{topic.title}
        </h1>
        {topic.status === 'REJECTED' && topic.rejectReason && (
          <div style={{color:'red', fontSize:'1rem', marginBottom:'1.5rem', background: '#ffebeb', padding:'1rem', borderRadius:'8px'}}>
            <strong>Rejection Reason:</strong> {topic.rejectReason}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <ForumUserAvatar user={topic.author} size={48} />
          <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <div>{new Date(topic.createdAt).toLocaleString()}</div>
            <div>👁️ {topic.viewCount} views</div>
          </div>
        </div>

        <div className={styles.postBody}>
          {topic.content}
        </div>

        <div className={styles.actionRow} style={{ marginTop: '2rem' }}>
          <button className={styles.actionBtn} onClick={() => handleLike(topic.id, null)} disabled={topic.status !== 'APPROVED'}>
            ❤️ Like ({topic._count.likes})
          </button>
          <button className={styles.actionBtn} onClick={() => { setReplyingTo(null); document.getElementById('replyBox').scrollIntoView(); }} disabled={topic.status !== 'APPROVED'}>
            💬 Comment ({topic._count.comments})
          </button>
          <button className={styles.actionBtn} onClick={() => handleReport(topic.id, null)} style={{ marginLeft: 'auto', border: 'none' }}>
            🚩 Report Post
          </button>
          {session?.user?.id === topic.authorId && (
            <button className={styles.actionBtn} onClick={handleDeleteTopic} style={{ color: 'red', borderColor: 'red', background: '#ffebeb' }}>
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      <div className={styles.commentsSection} id="replyBox">
        <h2 className={styles.commentsHeader}>Comments ({comments.length})</h2>
        
        <div className={styles.commentBox}>
          {replyingTo && (
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Replying to <strong>{replyingTo.author.name}</strong></span>
              <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>
          )}
          <textarea 
            className={styles.commentInput} 
            placeholder="Write a comment..." 
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
          />
          <button 
            className={styles.submitBtn} 
            style={{ width: 'auto' }} 
            onClick={submitComment}
            disabled={isSubmitting || !replyContent.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>

        {topic.status === 'APPROVED' && (
          <div>
            {rootComments.map(comment => (
              <CommentThread key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
