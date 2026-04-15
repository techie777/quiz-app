"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import styles from "@/styles/FunFacts.module.css";

export default function AdminFunFactsPage() {
  const [activeTab, setActiveTab] = useState("manage");
  
  // Categories and Facts
  const [categories, setCategories] = useState([]);
  const [facts, setFacts] = useState([]);
  const [loadingFacts, setLoadingFacts] = useState(false);
  
  // Category Form
  const [catName, setCatName] = useState("");
  const [catNameHi, setCatNameHi] = useState("");
  const [catImage, setCatImage] = useState("");
  
  // Single Fact Form/Edit Form
  const [editingId, setEditingId] = useState(null);
  const [factCatId, setFactCatId] = useState("");
  const [factDesc, setFactDesc] = useState("");
  const [factDescHi, setFactDescHi] = useState("");
  const [factImage, setFactImage] = useState("");
  const [isDaily, setIsDaily] = useState(false);
  const [genLang, setGenLang] = useState("EN");
  
   // Bulk File
  const [file, setFile] = useState(null);

  // Selection & Duplicate States
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);
  const [filterCatId, setFilterCatId] = useState("");

  // Duplicate detection logic
  const duplicateCounts = useMemo(() => {
    const counts = {};
    facts.forEach(f => {
      const desc = f.description?.trim().toLowerCase();
      if (!desc) return;
      counts[desc] = (counts[desc] || 0) + 1;
    });
    return counts;
  }, [facts]);

  const isFactDuplicate = (desc) => {
    if (!desc) return false;
    return duplicateCounts[desc.trim().toLowerCase()] > 1;
  };

  const handleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const currentVisibleFacts = useMemo(() => {
    let list = facts.filter(f => !filterCatId || f.categoryId === filterCatId);
    if (showOnlyDuplicates) {
      list = list.filter(f => isFactDuplicate(f.description));
    }
    return list;
  }, [facts, filterCatId, showOnlyDuplicates, duplicateCounts]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(currentVisibleFacts.map(f => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.size} selected facts?`)) return;
    
    try {
      const ids = Array.from(selectedIds).join(",");
      const res = await fetch(`/api/admin/fun-facts?ids=${ids}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Bulk delete successful!");
        setSelectedIds(new Set());
        fetchFacts();
      } else {
        throw new Error("Failed to delete selected facts");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchFacts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/fun-facts/categories");
      const data = await res.json();
      if (res.ok) setCategories(data.categories);
    } catch (error) { console.error(error); }
  };

  const fetchFacts = async () => {
    setLoadingFacts(true);
    try {
      const res = await fetch("/api/admin/fun-facts");
      const data = await res.json();
      if (res.ok) setFacts(data.facts);
    } catch (error) { console.error(error); }
    setLoadingFacts(false);
  };

  const handleDownloadTemplate = () => {
    window.location.href = "/api/admin/fun-facts/template";
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const res = await fetch("/api/admin/fun-facts/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, nameHi: catNameHi, slug, image: catImage, sortOrder: 0 })
      });
      if (res.ok) {
        toast.success("Category created!");
        setCatName(""); setCatNameHi(""); setCatImage("");
        fetchCategories();
      } else throw new Error(await res.text());
    } catch (err) { toast.error("Failed to create category"); }
  };

  const handleSaveFact = async (e) => {
    e.preventDefault();
    const url = "/api/admin/fun-facts";
    const method = editingId ? "PATCH" : "POST";
    const body = { 
      id: editingId,
      categoryId: factCatId, 
      description: factDesc, 
      descriptionHi: factDescHi,
      image: factImage,
      isDaily
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast.success(editingId ? "Fact updated!" : "Fact added!");
        setFactDesc(""); setFactDescHi(""); setFactImage(""); setFactCatId(""); setIsDaily(false); setEditingId(null);
        fetchFacts();
        setActiveTab("manage");
      } else throw new Error(await res.text());
    } catch (err) { toast.error(err.message || "Failed to save fact"); }
  };

  const handleEdit = (fact) => {
    setEditingId(fact.id);
    setFactCatId(fact.categoryId);
    setFactDesc(fact.description);
    setFactDescHi(fact.descriptionHi || "");
    setFactImage(fact.image || "");
    setIsDaily(fact.isDaily || false);
    setActiveTab("single");
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/admin/fun-facts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted!");
        fetchFacts();
      }
    } catch (err) { toast.error("Failed to delete"); }
  };

  const toggleHide = async (fact) => {
    try {
      const res = await fetch("/api/admin/fun-facts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fact.id, hidden: !fact.hidden })
      });
      if (res.ok) {
        toast.success(fact.hidden ? "Fact visible" : "Fact hidden");
        fetchFacts();
      }
    } catch (err) { toast.error("Operation failed"); }
  };

  const handleManualUpload = async (e) => {
    const ufile = e.target.files?.[0];
    if (!ufile) return;
    toast.loading("Uploading raw image...", { id: "uploadraw" });
    const formData = new FormData();
    formData.append("file", ufile, `raw-fact-${Date.now()}.png`);
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setFactImage(data.url);
        toast.success("Image uploaded successfully!", { id: "uploadraw" });
      } else throw new Error(data.error);
    } catch(err) { toast.error("Upload failed", { id: "uploadraw" }); }
  };

  const handleGenerateImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const textToUse = genLang === "EN" ? factDesc : factDescHi;
    if (!textToUse) {
      toast.error(`Please enter ${genLang} description first!`);
      return;
    }
    
    // Check if duplicate
    const isDup = isFactDuplicate(textToUse);
    if(isDup && !confirm("Warning: This description is already used by another fact! Proceed to generate image?")) return;

    toast.loading("Generating engine image...", { id: "genimg" });
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        canvas.width = 1080;
        canvas.height = 1080;
        
        // Draw centered/cropped image
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        
        // Solid Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(0.5, "rgba(0,0,0,0.5)");
        gradient.addColorStop(1, "rgba(0,0,0,0.95)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Watermark/Brand top
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        
        // Text settings
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        
        const words = textToUse.split(" ");
        let lines = [];
        let curLine = "";
        const maxW = canvas.width - 120;
        
        for(let i=0; i<words.length; i++) {
          let test = curLine + words[i] + " ";
          let m = ctx.measureText(test);
          if (m.width > maxW && i > 0) {
            lines.push(curLine.trim());
            curLine = words[i] + " ";
          } else {
             curLine = test;
          }
        }
        lines.push(curLine.trim());

        const lh = 70;
        const th = lines.length * lh;
        const startY = (canvas.height / 2) - (th / 2) + 120; // pushed down a bit

        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        lines.forEach((l, i) => {
          ctx.fillText(l, canvas.width / 2, startY + (i * lh));
        });

        // Add extra text
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.font = "bold 40px sans-serif";
        ctx.fillStyle = "#fbbf24"; // yellow-400
        const bottomText = "Factify Hub";
        ctx.fillText(bottomText, canvas.width / 2, canvas.height - 60);

        canvas.toBlob(async (blob) => {
          if (!blob) return toast.error("Failed to make blob", { id: "genimg" });
          const fileData = new FormData();
          fileData.append("file", blob, `fact-engine-${Date.now()}.jpg`);
          try {
            const res = await fetch("/api/upload/image", {
              method: "POST",
              body: fileData
            });
            const data = await res.json();
            if (res.ok && data.url) {
              setFactImage(data.url);
              toast.success("Image generated & uploaded!", { id: "genimg" });
            } else {
              throw new Error(data.error);
            }
          } catch(err) {
            toast.error("Upload failed", { id: "genimg" });
          }
        }, "image/jpeg", 0.9);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset
  };

  // Smart Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalFacts, setTotalFacts] = useState(0);
  const [completedFacts, setCompletedFacts] = useState(0);

  const handleSmartBulkUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    
    setIsUploading(true);
    setUploadProgress(0);
    setCompletedFacts(0);
    
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const XLSX = await import("xlsx");
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          if (!data || data.length === 0) {
            toast.error("Excel file is empty");
            setIsUploading(false);
            return;
          }

          setTotalFacts(data.length);

          // Confirmation Dialogue
          if (!confirm(`Found ${data.length} facts in the file. Are you sure you want to start the bulk upload?`)) {
            setIsUploading(false);
            return;
          }

          const batchSize = 10;
          const batches = [];
          for (let i = 0; i < data.length; i += batchSize) {
            batches.push(data.slice(i, i + batchSize));
          }

          let localCompleted = 0;
          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const res = await fetch("/api/admin/fun-facts/bulk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rows: batch })
            });

            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.details || errData.error || "Batch upload failed");
            }

            localCompleted += batch.length;
            setCompletedFacts(localCompleted);
            setUploadProgress(Math.round((localCompleted / data.length) * 100));
          }

          toast.success(`Successfully uploaded all ${data.length} facts!`);
          fetchCategories();
          fetchFacts();
          setFile(null);
        } catch (err) {
          console.error(err);
          toast.error(`Upload stopped: ${err.message}`, { duration: 5000 });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      toast.error("Failed to read file");
      setIsUploading(false);
    }
  };


  return (
    <div className={styles.adminPage}>
      <h1 className={styles.adminTitle}>Factify Admin Portal</h1>
      
      <div className={styles.tabs}>
        {[
          { id: "manage", label: "Manage Facts" },
          { id: "single", label: editingId ? "Edit Fact" : "Add Fact" },
          { id: "bulk", label: "Bulk Upload" },
          { id: "categories", label: "Categories" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id !== "single") setEditingId(null); }}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.adminContent}>
         {activeTab === "manage" && (
          <div className={styles.adminCard}>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                 <h2 className={styles.sectionTitle}>Fact Management ({currentVisibleFacts.length})</h2>
                 {selectedIds.size > 0 && (
                   <button 
                     onClick={handleBulkDelete}
                     className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition flex items-center gap-2"
                   >
                     Clear Selected ({selectedIds.size})
                   </button>
                 )}
              </div>
              
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-500 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <input 
                    type="checkbox" 
                    checked={showOnlyDuplicates} 
                    onChange={e => setShowOnlyDuplicates(e.target.checked)} 
                  />
                  Only Multiples
                </label>

                <select 
                  value={filterCatId} 
                  onChange={(e) => {
                    setFilterCatId(e.target.value);
                    setSelectedIds(new Set()); // Clear selection on category change
                  }}
                  className={styles.select}
                  style={{ width: "auto", minWidth: "180px", padding: "0.4rem 0.75rem" }}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={fetchFacts} className={styles.submitBtn} style={{ width: "auto", padding: "0.5rem 1rem" }}>Refresh</button>
              </div>
            </div>
            
            <div className={styles.tableContainer}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        onChange={e => handleSelectAll(e.target.checked)}
                        checked={currentVisibleFacts.length > 0 && selectedIds.size === currentVisibleFacts.length} 
                      />
                    </th>
                    <th>Description (EN)</th>
                    <th>Category</th>
                    <th>Views</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVisibleFacts.map((f) => {
                    const isDup = isFactDuplicate(f.description);
                    return (
                    <tr 
                      key={f.id} 
                      className={`${f.hidden ? styles.hiddenRow : ""} ${isDup ? styles.duplicateRow : ""}`}
                    >
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(f.id)} 
                          onChange={() => handleSelectOne(f.id)} 
                        />
                      </td>
                      <td className={styles.factTextColumn}>
                        <div className="flex items-center gap-2">
                           {f.description}
                           {isDup && (
                             <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Multiple Found</span>
                           )}
                        </div>
                      </td>
                      <td>{f.category?.name}</td>
                      <td>{f.views}</td>
                      <td>{f.hidden ? "Hidden" : "Visible"}</td>
                      <td className={styles.actionCell}>
                        <button onClick={() => handleEdit(f)} className={styles.editBtn}>Edit</button>
                        <button onClick={() => toggleHide(f)} className={styles.hideBtn}>{f.hidden ? "Show" : "Hide"}</button>
                        <button onClick={() => handleDelete(f.id)} className={styles.deleteBtn}>Del</button>
                      </td>
                    </tr>
                   );
                  })}
                  {currentVisibleFacts.length === 0 && !loadingFacts && <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-medium">No facts found. Check your filters or add new content!</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bulk" && (
          <div className={styles.adminCard}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={styles.sectionTitle}>Bulk Upload</h2>
              <button onClick={handleDownloadTemplate} className={styles.editBtn} style={{ background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}>
                Download Sample Template
              </button>
            </div>
            <p className={styles.helpText}>
              Upload .xlsx. Columns: <b>Category</b>, <b>Category (Hindi)</b>, <b>Fun Fact Description</b>, <b>Fun Fact Description (Hindi)</b>, <b>Image URL</b>.
              <br/><i>Note: If you only provide one category in the list, all facts will be linked to it.</i>
            </p>
            <form onSubmit={handleSmartBulkUpload} className={styles.headerActions}>
              <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className={styles.fileInput} disabled={isUploading} />
              <button 
                type="submit" 
                className={styles.submitBtn} 
                disabled={isUploading || !file}
              >
                {isUploading ? "Uploading..." : "Start Upload"}
              </button>
            </form>

            {file && !isUploading && (
              <div className="mt-2 text-sm text-blue-600 font-medium">
                📄 File selected. Click Start to begin importing facts.
              </div>
            )}

            {isUploading && (
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <span>Uploading Facts: {completedFacts} / {totalFacts}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className={styles.progressBarWrapper}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className={styles.progressNote}>Do not close this page until upload is complete.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "single" && (
          <div className={styles.adminCard}>
            <h2 className={styles.sectionTitle}>{editingId ? "Edit Fun Fact" : "Add Single Fact"}</h2>
            <form onSubmit={handleSaveFact} className={styles.adminForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Category</label>
                <select required value={factCatId} onChange={(e) => setFactCatId(e.target.value)} className={styles.select}>
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description (EN)</label>
                  <textarea required rows={3} value={factDesc} onChange={(e) => setFactDesc(e.target.value)} className={styles.textarea} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description (HI)</label>
                  <textarea required rows={3} value={factDescHi} onChange={(e) => setFactDescHi(e.target.value)} className={styles.textarea} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Image URL (Optional)</label>
                <div className="flex gap-2">
                  <input type="url" value={factImage} onChange={(e) => setFactImage(e.target.value)} className={styles.input} />
                  <button 
                    type="button" 
                    onClick={() => {
                        const cat = categories.find(c => c.id === factCatId);
                        if(!cat) return toast.error("Select a category first!");
                        setFactImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(cat.name + " realistic minimalist photo")}?width=400&height=400&nologo=true`);
                        toast.success("Reference URL auto-filled!");
                    }}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-colors"
                  >
                    🚀 Auto Fetch
                  </button>
                  <label className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer flex items-center justify-center">
                    📁 Native Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleManualUpload} />
                  </label>
                </div>
                {factImage && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                    <img src={factImage} alt="Thumbnail preview" className="h-32 object-cover border rounded-xl shadow-sm" />
                  </div>
                )}
              </div>
              <div className="p-4 border border-indigo-100 bg-white rounded-xl mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isDaily} onChange={(e) => setIsDaily(e.target.checked)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  <div>
                    <span className="block text-sm font-bold text-gray-900">Mark as Daily Pick 🌟</span>
                    <span className="block text-xs text-gray-500">Enable this to feature this fact prominently today. Previous daily picks will be unset automatically.</span>
                  </div>
                </label>
              </div>
              <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl mb-6">
                 <h3 className="text-sm font-bold text-indigo-900 mb-2">Fact Engine: Generate Image Overlay</h3>
                 <p className="text-xs text-indigo-600 mb-4">Upload a background image, and the system will automatically format and overlay the fact text on it.</p>
                 <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-sm font-medium">
                       Text Language: 
                       <select value={genLang} onChange={e=>setGenLang(e.target.value)} className="p-1 border rounded bg-white text-sm outline-none">
                          <option value="EN">English</option>
                          <option value="HI">Hindi</option>
                       </select>
                    </label>
                    <input type="file" accept="image/*" onChange={handleGenerateImage} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                 </div>
              </div>
              <button type="submit" className={styles.submitBtn}>{editingId ? "Update Fact" : "Add Fact"}</button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className={styles.hideBtn} style={{ marginTop: "0.5rem", width: "100%" }}>Cancel Edit</button>}
            </form>
          </div>
        )}

        {activeTab === "categories" && (
          <div className={styles.adminGrid}>
            <div className={styles.adminCard}>
              <h2 className={styles.sectionTitle}>New Category</h2>
              <form onSubmit={handleCreateCategory} className={styles.adminForm}>
                <div className={styles.formGroup}><label className={styles.label}>Name (EN)</label><input required type="text" value={catName} onChange={(e) => setCatName(e.target.value)} className={styles.input} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Name (HI)</label><input required type="text" value={catNameHi} onChange={(e) => setCatNameHi(e.target.value)} className={styles.input} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Image URL</label><input type="url" value={catImage} onChange={(e) => setCatImage(e.target.value)} className={styles.input} /></div>
                <button type="submit" className={styles.submitBtn}>Create</button>
              </form>
            </div>
            
            <div className={`${styles.adminCard} ${styles.scrollList}`}>
              <h2 className={styles.sectionTitle}>Categories ({categories.length})</h2>
              <ul className={styles.list}>
                {categories.map((c) => (
                  <li key={c.id} className={styles.listItem}>
                    <div><p className={styles.itemTitle}>{c.name} / {c.nameHi}</p><p className={styles.itemSubtitle}>{c._count?.facts || 0} facts</p></div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
