"use client";

import React, { useState } from 'react';
import SideDrawer from './SideDrawer';
import { 
  Settings, 
  Info, 
  BookOpen, 
  FileText, 
  Layout, 
  Save, 
  Plus, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';

/**
 * SubCategoryDrawer Component
 * Focused workspace for managing an Exam (Sub-Category) with vertical-tab navigation.
 */
export default function SubCategoryDrawer({ 
  isOpen, 
  onClose, 
  examForm, 
  setExamForm, 
  categories, 
  quizCategories, 
  examInfoSections, 
  onSave, 
  onSaveInfoSection, 
  onDeleteInfoSection,
  editingInfoSection,
  setEditingInfoSection
}) {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', icon: <Settings size={18} />, label: 'General' },
    { id: 'info', icon: <Info size={18} />, label: 'Info Hub' },
    { id: 'quizzes', icon: <Layout size={18} />, label: 'Quizzes' },
    { id: 'books', icon: <BookOpen size={18} />, label: 'Recommended Books' },
    { id: 'materials', icon: <FileText size={18} />, label: 'Materials' },
  ];

  const handleUpdateBook = (idx, field, value) => {
    const books = JSON.parse(examForm.booksJson || '[]');
    books[idx][field] = value;
    setExamForm(prev => ({ ...prev, booksJson: JSON.stringify(books) }));
  };

  const handleAddBook = () => {
    const books = JSON.parse(examForm.booksJson || '[]');
    setExamForm(prev => ({ ...prev, booksJson: JSON.stringify([...books, { title: '', link: '', image: '' }]) }));
  };

  return (
    <SideDrawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title={examForm.id ? `Managing: ${examForm.name}` : "Create New Sub-Category"}
      maxWidth="900px"
    >
      <div className="flex h-full min-h-[600px] gap-8">
        {/* Vertical Tabs Sidebar */}
        <aside className="w-64 flex flex-col gap-1 border-r border-slate-100 pr-6 sticky top-0 h-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Form Content Area */}
        <main className="flex-1 flex flex-col">
          <form className="flex-1" onSubmit={onSave}>
             {/* General Tab */}
             {activeTab === 'general' && (
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <FormGroup label="Sub-Category Name">
                      <input 
                        type="text" 
                        value={examForm.name} 
                        onChange={e => {
                          const val = e.target.value;
                          const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                          setExamForm(prev => ({...prev, name: val, slug}));
                        }} 
                        required 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" 
                      />
                    </FormGroup>
                    <FormGroup label="Unique Slug">
                      <input 
                        type="text" 
                        value={examForm.slug} 
                        onChange={e => setExamForm(prev => ({...prev, slug: e.target.value}))} 
                        required 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" 
                      />
                    </FormGroup>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormGroup label="Emoji Icon">
                      <input 
                        type="text" 
                        value={examForm.emoji} 
                        onChange={e => setExamForm(prev => ({...prev, emoji: e.target.value}))} 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" 
                      />
                    </FormGroup>
                    <FormGroup label="Main Category">
                      <select 
                        value={examForm.categoryId} 
                        onChange={e => setExamForm(prev => ({...prev, categoryId: e.target.value}))} 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                         <option value="">-- No Category --</option>
                         {Array.isArray(categories) && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </FormGroup>
                 </div>
                 <FormGroup label="Description">
                    <textarea 
                      value={examForm.description} 
                      onChange={e => setExamForm(prev => ({...prev, description: e.target.value}))} 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" 
                      rows="4"
                    />
                 </FormGroup>
                 <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <input 
                      type="checkbox" 
                      id="hiddenFlag" 
                      checked={examForm.hidden} 
                      onChange={e => setExamForm(prev => ({...prev, hidden: e.target.checked}))}
                      className="w-5 h-5 accent-amber-600"
                    />
                    <label htmlFor="hiddenFlag" className="font-bold text-amber-800 cursor-pointer text-sm">Draft Mode (Hidden from public site)</label>
                 </div>
               </div>
             )}

             {/* Info Hub Tab */}
             {activeTab === 'info' && (
               <div className="space-y-8">
                 {!examForm.id ? (
                   <div className="p-10 text-center bg-slate-50 border-2 border-dashed rounded-3xl text-slate-400 font-bold uppercase tracking-widest text-xs">
                     Save the basic sub-category first to manage sections
                   </div>
                 ) : (
                   <>
                     <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Add Content Section</h4>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <input 
                                type="text" 
                                placeholder="Section Title" 
                                value={editingInfoSection.title}
                                onChange={e => setEditingInfoSection(p => ({...p, title: e.target.value}))}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                              />
                              <select 
                                value={editingInfoSection.type}
                                onChange={e => setEditingInfoSection(p => ({...p, type: e.target.value}))}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                              >
                                 <option value="HEADING">Title / Heading</option>
                                 <option value="PARAGRAPH">Paragraph Text</option>
                                 <option value="LIST">Bullet List (JSON)</option>
                                 <option value="TABLE">Data Table (HTML/JSON)</option>
                                 <option value="DATES">Important Dates</option>
                              </select>
                           </div>
                           <textarea 
                             placeholder="Content Content..." 
                             value={editingInfoSection.content}
                             onChange={e => setEditingInfoSection(p => ({...p, content: e.target.value}))}
                             className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                             rows="4"
                           />
                           <div className="flex justify-between items-center pt-2">
                              <input 
                                type="number" 
                                placeholder="Order" 
                                value={editingInfoSection.sortOrder}
                                onChange={e => setEditingInfoSection(p => ({...p, sortOrder: parseInt(e.target.value)}))}
                                className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-center font-bold"
                              />
                              <button 
                                type="button" 
                                onClick={onSaveInfoSection}
                                className="bg-indigo-600 text-white px-8 py-2.5 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2"
                              >
                                <Save size={18} /> Save Section
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Hub Sections</h4>
                        {examInfoSections.map(sec => (
                          <div key={sec.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors group">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl font-bold text-slate-400 text-sm">{sec.sortOrder}</div>
                               <div>
                                 <div className="font-bold text-slate-800">{sec.title}</div>
                                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{sec.type}</div>
                               </div>
                             </div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => setEditingInfoSection(sec)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Settings size={16}/></button>
                                <button type="button" onClick={() => onDeleteInfoSection(sec.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                             </div>
                          </div>
                        ))}
                     </div>
                   </>
                 )}
               </div>
             )}

             {activeTab === 'quizzes' && (
               <div className="space-y-6">
                 <p className="text-sm text-slate-500 font-medium">Link specific subject quizzes that appear on this exam's dashboard.</p>
                 <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.isArray(quizCategories) && quizCategories.map(qc => (
                      <label key={qc.id} className={`flex items-center gap-4 p-4 rounded-3xl border-2 cursor-pointer transition-all ${examForm.quizCategoryIds?.includes(qc.id) ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 hover:border-slate-200'}`}>
                         <input 
                           type="checkbox" 
                           className="w-5 h-5 accent-indigo-600"
                           checked={examForm.quizCategoryIds?.includes(qc.id)}
                           onChange={e => {
                             const checked = e.target.checked;
                             const current = examForm.quizCategoryIds || [];
                             setExamForm(prev => ({
                               ...prev,
                               quizCategoryIds: checked ? [...current, qc.id] : current.filter(id => id !== qc.id)
                             }));
                           }}
                         />
                         <div>
                           <div className="font-bold text-slate-800">{qc.icon} {qc.name}</div>
                           <div className="text-[10px] text-slate-400 font-mono tracking-widest">{qc.slug}</div>
                         </div>
                      </label>
                    ))}
                 </div>
               </div>
             )}

             {/* Books Tab */}
             {activeTab === 'books' && (
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-medium">Curate recommended reading materials.</p>
                    <button type="button" onClick={handleAddBook} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-100 transition">
                      <Plus size={16} /> Add Recommended Book
                    </button>
                  </div>
                  <div className="space-y-4">
                    {JSON.parse(examForm.booksJson || '[]').map((book, idx) => (
                      <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-6 relative group">
                        <button 
                          type="button" 
                          onClick={() => {
                            const books = JSON.parse(examForm.booksJson || '[]');
                            setExamForm(prev => ({ ...prev, booksJson: JSON.stringify(books.filter((_, i) => i !== idx)) }));
                          }}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-white text-rose-600 rounded-full flex items-center justify-center shadow-md border border-slate-100 group-hover:scale-110 transition-transform"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="w-24 h-32 bg-slate-200 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400">
                           {book.image ? <img src={book.image} className="w-full h-full object-cover rounded-xl" /> : <BookOpen size={30} />}
                        </div>
                        <div className="flex-1 space-y-4">
                           <input 
                             placeholder="Book Title" 
                             value={book.title} 
                             onChange={(e) => handleUpdateBook(idx, 'title', e.target.value)}
                             className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                           />
                           <div className="grid grid-cols-2 gap-3">
                              <input 
                                placeholder="Thumbnail Image URL" 
                                value={book.image} 
                                onChange={(e) => handleUpdateBook(idx, 'image', e.target.value)}
                                className="p-2 bg-white border border-slate-200 rounded-xl text-xs"
                              />
                              <input 
                                placeholder="Purchase Link" 
                                value={book.link} 
                                onChange={(e) => handleUpdateBook(idx, 'link', e.target.value)}
                                className="p-2 bg-white border border-slate-200 rounded-xl text-xs"
                              />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {/* Sticky Footer for Form Actions */}
             <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 -mx-8 -mb-8 mt-auto flex items-center justify-end gap-3 z-10">
                <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center gap-2">
                  <Save size={20} /> Save Configuration
                </button>
             </div>
          </form>
        </main>
      </div>
    </SideDrawer>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</label>
      {children}
    </div>
  );
}
