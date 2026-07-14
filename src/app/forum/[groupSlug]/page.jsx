"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/Forum.module.css";
import ForumUserAvatar from "@/components/ForumUserAvatar";
import toast from "react-hot-toast";

export default function GroupPage({ params }) {
  const { groupSlug } = params;
  const router = useRouter();
  
  const [group, setGroup] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [gRes, tRes] = await Promise.all([
          fetch(`/api/forum/groups`),
          fetch(`/api/forum/topics?groupId=${groupSlug}`) // We need groupId, wait we only have groupSlug. 
          // Let's modify logic: fetch groups, find ID, then fetch topics.
        ]);
        
        if (!gRes.ok) throw new Error("Failed to load");
        
        const groups = await gRes.json();
        const foundGroup = groups.find(g => g.slug === groupSlug);
        
        if (!foundGroup) {
          router.push("/forum");
          return;
        }
        
        setGroup(foundGroup);
        
        const topicsRes = await fetch(`/api/forum/topics?groupId=${foundGroup.id}`);
        if (topicsRes.ok) {
          const data = await topicsRes.json();
          setTopics(data.topics);
        }
      } catch (err) {
        toast.error("Error loading group");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupSlug, router]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return toast.error("Please fill all fields");
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent, groupId: group.id })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.message || data.error || "Failed to create topic");
        return;
      }
      
      toast.success("Topic created!");
      setIsModalOpen(false);
      setNewTitle("");
      setNewContent("");
      // Refresh topics
      const topicsRes = await fetch(`/api/forum/topics?groupId=${group.id}`);
      if (topicsRes.ok) {
        const tData = await topicsRes.json();
        setTopics(tData.topics);
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!group) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ textAlign: 'left', marginBottom: '1rem' }}>
        <Link href="/forum" style={{ color: 'var(--primary-color)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
          &larr; Back to Forums
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className={styles.groupIcon} style={{ width: 80, height: 80, fontSize: '3rem' }}>{group.icon}</div>
          <div>
            <h1 className={styles.title} style={{ fontSize: '2rem' }}>{group.name}</h1>
            <p className={styles.subtitle}>{group.description}</p>
          </div>
        </div>
      </header>

      <div className={styles.topicControls}>
        <div style={{ fontWeight: 600 }}>{topics.length} Topics</div>
        <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
          + Create Post
        </button>
      </div>

      <div className={styles.topicList}>
        {topics.map(topic => (
          <Link key={topic.id} href={`/forum/topic/${topic.id}`} className={styles.topicItem}>
            <div className={styles.topicHeader}>
              <h3 className={styles.topicTitle}>
                {topic.isPinned && "📌 "}{topic.title}
              </h3>
            </div>
            
            <div className={styles.topicMeta}>
              <ForumUserAvatar user={topic.author} size={24} />
              <span>•</span>
              <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <div className={styles.stats}>
                <span>👁️ {topic.viewCount}</span>
                <span>💬 {topic._count.comments}</span>
                <span>❤️ {topic._count.likes}</span>
              </div>
            </div>
          </Link>
        ))}
        {topics.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No topics yet. Be the first to post!
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Create New Topic</h2>
            <form onSubmit={handleCreate}>
              <input 
                className={styles.inputField} 
                placeholder="Topic Title" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                maxLength={100}
                required
              />
              <textarea 
                className={styles.inputField} 
                placeholder="What do you want to discuss?" 
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={6}
                required
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} style={{ width: 'auto' }} disabled={isSubmitting}>
                  {isSubmitting ? "Posting..." : "Post Topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
