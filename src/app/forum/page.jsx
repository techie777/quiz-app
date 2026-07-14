"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "@/styles/Forum.module.css";
import ForumUserAvatar from "@/components/ForumUserAvatar";
import toast from "react-hot-toast";
import { useSession, signIn } from "next-auth/react";

export default function ForumLandingPage() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState([]);
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const TAKE = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(""); // empty means 'General/No Group'
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [gRes, tRes] = await Promise.all([
          fetch("/api/forum/groups"),
          fetch(`/api/forum/topics?skip=0&take=${TAKE}`) 
        ]);
        
        if (gRes.ok) setGroups(await gRes.json());
        if (tRes.ok) {
          const tData = await tRes.json();
          setTopics(tData.topics);
          setHasMore(tData.topics.length >= TAKE);
        }
      } catch (err) {
        toast.error("Failed to load forum data");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const loadMoreTopics = async () => {
    const nextSkip = skip + TAKE;
    try {
      const tRes = await fetch(`/api/forum/topics?skip=${nextSkip}&take=${TAKE}`);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTopics(prev => [...prev, ...tData.topics]);
        setSkip(nextSkip);
        if (tData.topics.length < TAKE) setHasMore(false);
      }
    } catch (error) {
      toast.error("Failed to load more");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return toast.error("Please fill all fields");
    
    setIsSubmitting(true);
    try {
      const payload = { title: newTitle, content: newContent };
      if (selectedGroup) payload.groupId = selectedGroup;

      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.message || data.error || "Failed to create topic");
        return;
      }
      
      toast.success("Topic submitted for approval!");
      setIsModalOpen(false);
      setNewTitle("");
      setNewContent("");
      setSelectedGroup("");

      // Re-fetch to show pending post
      const tRes = await fetch(`/api/forum/topics?skip=0&take=${TAKE}`);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTopics(tData.topics);
        setSkip(0);
        setHasMore(tData.topics.length >= TAKE);
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    if (!session) {
      toast.error("Please login to participate in the forum.");
      return signIn();
    }
    setIsModalOpen(true);
  };

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Community Forum</h1>
        <p className={styles.subtitle}>Discuss exam updates, share knowledge, and connect with other aspirants.</p>
      </header>

      {/* GROUPS SECTION */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Discussion Groups</h2>
        <div className={styles.groupsGrid}>
          {groups.map((group) => (
            <Link key={group.id} href={`/forum/${group.slug}`} className={styles.groupCard}>
              <div className={styles.groupIcon}>
                {group.icon || "📝"}
              </div>
              <div className={styles.groupInfo}>
                <h2>{group.name}</h2>
                <p>{group.description}</p>
                <div className={styles.topicCount}>
                  {group._count?.topics || 0} Topics
                </div>
              </div>
            </Link>
          ))}
          {!loading && groups.length === 0 && (
            <div style={{ gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>No active groups.</div>
          )}
        </div>
      </div>

      {/* ALL TOPICS & SEARCH SECTION */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>Recent Discussions</h2>
          
          <div style={{ display: 'flex', gap: '1rem', flex: '1 1 auto', justifyContent: 'flex-end', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Search topics..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.inputField}
              style={{ marginBottom: 0, maxWidth: '300px' }}
            />
            <button className={styles.createBtn} onClick={openCreateModal}>
              + New Post
            </button>
          </div>
        </div>

        {loading ? (
          <div>Loading topics...</div>
        ) : (
          <div className={styles.topicList}>
            {filteredTopics.map(topic => (
              <Link key={topic.id} href={`/forum/topic/${topic.id}`} className={styles.topicItem}>
                <div className={styles.topicHeader}>
                  <h3 className={styles.topicTitle}>
                    {topic.status === 'PENDING' && <span style={{color: 'orange', fontSize:'0.8rem', border: '1px solid orange', padding:'2px 6px', borderRadius:'12px', marginRight:'8px'}}>PENDING APPROVAL</span>}
                    {topic.status === 'REJECTED' && <span style={{color: 'red', fontSize:'0.8rem', border: '1px solid red', padding:'2px 6px', borderRadius:'12px', marginRight:'8px'}}>REJECTED</span>}
                    {topic.isPinned && "📌 "}{topic.title}
                  </h3>
                </div>
                
                <div className={styles.topicMeta}>
                  <ForumUserAvatar user={topic.author} size={24} />
                  <span>•</span>
                  <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                  {topic.groupId && (
                    <>
                      <span>•</span>
                      <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                        {groups.find(g => g.id === topic.groupId)?.name || "Group"}
                      </span>
                    </>
                  )}
                  <div className={styles.stats}>
                    <span>👁️ {topic.viewCount}</span>
                    <span>💬 {topic._count?.comments || 0}</span>
                    <span>❤️ {topic._count?.likes || 0}</span>
                  </div>
                </div>
                {topic.status === 'REJECTED' && topic.rejectReason && (
                   <div style={{color:'red', fontSize:'0.9rem', marginTop:'0.5rem', background: '#ffebeb', padding:'0.5rem', borderRadius:'8px'}}>
                     <strong>Admin Reason:</strong> {topic.rejectReason}
                   </div>
                )}
              </Link>
            ))}
            
            {filteredTopics.length > 0 && hasMore && !search && (
              <button 
                onClick={loadMoreTopics}
                className={styles.actionBtn}
                style={{ margin: '1rem auto', display: 'flex' }}
              >
                Load More
              </button>
            )}

            {filteredTopics.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No topics found. Be the first to post!
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE POST MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Create New Topic</h2>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize:'0.9rem'}}>All posts are moderated and require admin approval before becoming public.</p>
            <form onSubmit={handleCreate}>
              
              <select 
                className={styles.inputField} 
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="">General (No Group)</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

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
                  {isSubmitting ? "Posting..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
