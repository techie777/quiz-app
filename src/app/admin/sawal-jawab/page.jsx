"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Search, HelpCircle, ChevronRight, Layers, FileText, AlertCircle, Upload, Download as DownloadIcon, X } from "lucide-react";
import { toast } from "react-hot-toast";
import CategorySearchSelect from "@/components/admin/CategorySearchSelect";

export default function SawalJawabAdmin() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("items"); // 'items' or 'categories'
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "item",
    id: "",
    categoryId: "",
    question: "",
    questionHi: "",
    answer: "",
    answerHi: "",
    name: "",
    nameHi: "",
    slug: "",
    sortOrder: 0
  });

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, title: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sawal-jawab");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
        setItems(data.items || []);
      } else {
        toast.error(data.error || "Failed to fetch data");
      }
    } catch (err) {
      toast.error("Internal server error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = formData.id ? "PUT" : "POST";
    const payload = { ...formData };
    if (!payload.id) delete payload.id;

    try {
      const res = await fetch("/api/admin/sawal-jawab", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`${formData.type === 'item' ? 'Item' : 'Category'} saved successfully!`);
        setIsFormOpen(false);
        fetchData();
        resetForm();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (err) {
      toast.error("Submission failed");
    }
  };

  const requestDelete = (type, id, title) => {
    setDeleteConfirm({
      isOpen: true,
      type,
      id,
      title: title || (type === "item" ? "Question" : "Category")
    });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteConfirm;
    if (!id || !type) return;

    try {
      const res = await fetch(`/api/admin/sawal-jawab?type=${type}&id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Deleted successfully");
        setDeleteConfirm({ isOpen: false, type: null, id: null, title: "" });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const resetForm = () => {
    setFormData({
      type: activeTab === "categories" ? "category" : "item",
      id: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      question: "",
      questionHi: "",
      answer: "",
      answerHi: "",
      name: "",
      nameHi: "",
      slug: "",
      sortOrder: 0
    });
  };

  const handleEdit = (type, data) => {
    setFormData({
      type,
      id: data.id,
      categoryId: data.categoryId || "",
      question: data.question || "",
      questionHi: data.questionHi || "",
      answer: data.answer || "",
      answerHi: data.answerHi || "",
      name: data.name || "",
      nameHi: data.nameHi || "",
      slug: data.slug || "",
      sortOrder: data.sortOrder || 0
    });
    setIsFormOpen(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(search.toLowerCase()) || 
                          (item.questionHi && item.questionHi.includes(search));
    const matchesCategory = filterCategory === "all" || item.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      
      {/* Top Banner with Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-indigo-600 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-black flex items-center gap-4">
             🧩 Sawal Jawab Manager
          </h1>
          <p className="text-indigo-100 font-bold mt-2 opacity-80">Full Control • Bulk Upload • Analytics</p>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-indigo-50 transition-all active:scale-95"
          >
            <Upload size={24} /> Bulk Import Excel
          </button>
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="bg-indigo-900/40 text-white border border-white/20 px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-900/60 transition-all active:scale-95 backdrop-blur-sm"
          >
            <Plus size={24} /> Add New
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Tabs & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-3xl border border-slate-200 dark:border-slate-700">
          <div className="flex p-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab("items")}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'items' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <FileText size={16} /> Questions
            </button>
            <button 
              onClick={() => setActiveTab("categories")}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Layers size={16} /> Categories
            </button>
          </div>

          <div className="flex flex-grow w-full md:w-auto gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search mysteries..." 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium text-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {activeTab === "items" && categories.length > 0 && (
              <div className="min-w-[200px]">
                <CategorySearchSelect
                  categories={categories.map(c => ({ id: c.id, topic: c.name }))}
                  value={filterCategory}
                  onChange={val => setFilterCategory(val || "all")}
                  includeAllOption={true}
                  placeholder="🔍 Search category..."
                />
              </div>
            )}
          </div>
        </div>

        {loading && items.length === 0 && categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">Loading Manager...</p>
          </div>
        ) : (
          <div className="min-h-[400px]">
            {activeTab === "items" ? (
              filteredItems.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-20 text-center shadow-sm">
                  <HelpCircle className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">No Questions Found</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Start by adding your first tricky question or select a different category.</p>
                  <button 
                      onClick={() => { resetForm(); setIsFormOpen(true); }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold transition-all"
                  >
                      Create Question
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:border-indigo-500/30 transition-all group flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/50 dark:border-indigo-800/40 px-4 py-1.5 rounded-full">
                            {item.category?.name || 'Uncategorized'}
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button onClick={() => handleEdit('item', item)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => requestDelete('item', item.id, item.question)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-black text-xl mb-4 text-slate-900 dark:text-slate-100 leading-tight line-clamp-3">{item.question}</h3>
                      </div>
                      <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">The Jawab:</p>
                        <p className="text-slate-700 dark:text-slate-300 font-bold line-clamp-2">{item.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Categories View */
              categories.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-20 text-center shadow-sm">
                  <Layers className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">No Categories Yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">You need at least one category before adding questions.</p>
                  <button 
                      onClick={() => { setActiveTab('categories'); resetForm(); setIsFormOpen(true); }}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                  >
                      Create Category
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-left">
                      <tr>
                        <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Name & Hindi</th>
                        <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">URL Slug</th>
                        <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Questions</th>
                        <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {categories.map(cat => (
                        <tr key={cat.id} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 transition-all group">
                          <td className="px-8 py-5">
                            <div className="font-black text-slate-900 dark:text-slate-100 text-lg">{cat.name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{cat.nameHi}</div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{cat.slug}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800/40 px-4 py-1.5 rounded-full text-xs font-black">
                              {cat._count?.items || 0} items
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => handleEdit('category', cat)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm">
                                <Edit2 size={18} />
                              </button>
                              <button onClick={() => requestDelete('category', cat.id, cat.name)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => setIsFormOpen(false)}></div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">
                  {formData.id ? 'Edit' : 'Create New'} {formData.type === 'item' ? 'Mystery' : 'Category'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">Fill in the details below to update your mystery wall.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-700 transition-all">&times;</button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 max-h-[calc(90vh-140px)]">
              {formData.type === "item" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Layers size={14} /> Category Selection
                    </label>
                    {categories.length === 0 ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 text-sm font-bold">
                        <AlertCircle size={18} />
                        Please create a category first!
                      </div>
                    ) : (
                      <CategorySearchSelect
                        categories={categories.map(c => ({ id: c.id, topic: c.name }))}
                        value={formData.categoryId}
                        onChange={val => setFormData({...formData, categoryId: val})}
                        placeholder="🔍 Search & select category..."
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">The Question (English)</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all font-bold text-slate-800 dark:text-slate-100 min-h-[80px] resize-none"
                        value={formData.question}
                        onChange={e => setFormData({...formData, question: e.target.value})}
                        placeholder="e.g. What has keys but can't open locks?"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">सवाल (Hindi)</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all font-bold text-slate-800 dark:text-slate-100 min-h-[80px] resize-none"
                        value={formData.questionHi}
                        onChange={e => setFormData({...formData, questionHi: e.target.value})}
                        placeholder="जैसे: वह क्या है जिसके पास चाबियां हैं लेकिन ताले नहीं खोल सकता?"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Answer (EN)</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all font-black text-slate-800 dark:text-slate-100"
                        value={formData.answer}
                        onChange={e => setFormData({...formData, answer: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">जवाब (HI)</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all font-black text-slate-800 dark:text-slate-100"
                        value={formData.answerHi}
                        onChange={e => setFormData({...formData, answerHi: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Category Form Fields */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category Name (EN)</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all font-black text-slate-800 dark:text-slate-100"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">श्रेणी का नाम (HI)</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all font-black text-slate-800 dark:text-slate-100"
                        value={formData.nameHi}
                        onChange={e => setFormData({...formData, nameHi: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Slug (Auto if empty)</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all font-mono text-sm text-slate-800 dark:text-slate-100"
                        value={formData.slug}
                        onChange={e => setFormData({...formData, slug: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order (Sort)</label>
                      <input 
                        type="number"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all font-black text-slate-800 dark:text-slate-100"
                        value={formData.sortOrder}
                        onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={formData.type === 'item' && categories.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {formData.id ? 'Save Changes' : `Create ${formData.type === 'item' ? 'Mystery' : 'Category'}`} 
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity" onClick={() => setIsBulkModalOpen(false)}></div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 w-full max-w-xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none flex items-center gap-3">
                  <Upload className="text-indigo-600 dark:text-indigo-400" /> Bulk Import
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">Upload your Excel file to add multiple questions at once.</p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-700 transition-all">&times;</button>
            </header>

            <div className="p-8 space-y-8">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center text-center">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm mb-4">
                  <DownloadIcon className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                </div>
                <h4 className="font-black text-indigo-900 dark:text-indigo-200 mb-1">Download Template</h4>
                <p className="text-indigo-600/70 dark:text-indigo-300/70 text-xs font-bold mb-4">Use our standard Excel format to ensure data consistency.</p>
                <a 
                  href="/api/admin/sawal-jawab/template" 
                  className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 px-6 py-2.5 rounded-xl font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 border dark:border-slate-700"
                >
                  Download .xlsx Template
                </a>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Select Excel File</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    className="hidden" 
                    id="bulk-file-input"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append("file", file);

                      setIsUploading(true);
                      const toastId = toast.loading("Processing Excel file...");

                      try {
                        const res = await fetch("/api/admin/sawal-jawab/bulk", {
                          method: "POST",
                          body: formData
                        });
                        const data = await res.json();

                        if (res.ok) {
                          toast.success(`Success! ${data.summary.success} questions imported.`, { id: toastId });
                          setIsBulkModalOpen(false);
                          fetchData();
                        } else {
                          toast.error(data.error || "Upload failed", { id: toastId });
                        }
                      } catch (err) {
                        toast.error("Network error during upload", { id: toastId });
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  <label 
                    htmlFor="bulk-file-input"
                    className={`w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <FileText className="text-slate-300 dark:text-slate-600 w-12 h-12 mb-4" />
                    <span className="font-black text-slate-900 dark:text-slate-100">Click to Browse or Drag & Drop</span>
                    <span className="text-slate-400 text-xs font-bold mt-1">Supports .xlsx and .xls files</span>
                  </label>
                </div>
              </div>
            </div>

            <footer className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="px-8 py-3 rounded-2xl font-black text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Confirm Deletion
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Are you sure you want to delete this {deleteConfirm.type === "item" ? "question" : "category"}? This action cannot be undone.
              </p>
              {deleteConfirm.title && (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl truncate">
                  &ldquo;{deleteConfirm.title}&rdquo;
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null, title: "" })}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
