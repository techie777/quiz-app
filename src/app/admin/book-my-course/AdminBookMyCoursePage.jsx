"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/AdminBookMyCourse.module.css";
import toast, { Toaster } from "react-hot-toast";
import { useAdmin } from "@/context/AdminContext";
import ImageUpload from "@/components/admin/ImageUpload";

const TAB_ORDERS = "orders";
const TAB_PACKAGES = "packages";
const TAB_BANNER = "banner";
const TAB_PROMOS = "promos";
const TAB_SETTINGS = "settings";

export default function AdminBookMyCoursePage() {
  const { adminUser } = useAdmin();
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.bookMyCourse !== false;

  const [activeTab, setActiveTab] = useState(TAB_ORDERS);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Banner state
  const [bannerUrls, setBannerUrls] = useState([]);
  
  // Package form state
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [pkgForm, setPkgForm] = useState({ id: "", board: "CBSE", class: 1, name: "", price: 0, bookCount: 0, images: "[]", description: "" });

  // Promo form state
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({ id: "", code: "", discountType: "PERCENTAGE", discountValue: 0, status: "ACTIVE", expiryDate: "" });

  // Settings state
  const [settings, setSettings] = useState({ globalDeliveryFee: 0 });

  const fetchData = async (tab) => {
    if (!allowed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/book-my-course?type=${tab}&t=${Date.now()}`, { cache: 'no-store' });
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || "Failed to fetch");

      if (tab === TAB_BANNER) {
        try {
          const parsed = JSON.parse(result.value || "[]");
          setBannerUrls(Array.isArray(parsed) ? parsed : [result.value]);
        } catch {
          setBannerUrls(result.value ? [result.value] : []);
        }
      } else if (tab === TAB_SETTINGS) {
        const mapped = {};
        result.forEach(s => mapped[s.key] = s.value);
        setSettings({ globalDeliveryFee: mapped.globalDeliveryFee || 0 });
      } else {
        setData(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      toast.error(`Failed to fetch ${tab}: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) fetchData(activeTab);
  }, [activeTab, allowed]);

  const updateBanner = async (newUrls = bannerUrls) => {
    try {
      const res = await fetch("/api/admin/book-my-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "banner_update", data: { value: JSON.stringify(newUrls) } }),
      });
      if (res.ok) {
        toast.success("Banners updated!");
        setBannerUrls(newUrls);
      }
    } catch (err) {
      toast.error("Failed to update banners");
    }
  };

  const savePackage = async () => {
    try {
      const res = await fetch("/api/admin/book-my-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "package", data: pkgForm }),
      });
      if (res.ok) {
        toast.success("Package saved!");
        setShowPkgForm(false);
        fetchData(TAB_PACKAGES);
      }
    } catch (err) {
      toast.error("Failed to save package");
    }
  };

  const savePromo = async () => {
    try {
      const res = await fetch("/api/admin/book-my-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "promo", data: promoForm }),
      });
      if (res.ok) {
        toast.success("Promo saved!");
        setShowPromoForm(false);
        fetchData(TAB_PROMOS);
      }
    } catch (err) {
      toast.error("Failed to save promo");
    }
  };

  const deletePromo = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/admin/book-my-course?type=promo&id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Promo deleted");
        fetchData(TAB_PROMOS);
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const res = await fetch("/api/admin/book-my-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "update_settings", data: { key, value } }),
      });
      if (res.ok) {
        toast.success("Setting updated!");
        setSettings({ ...settings, [key]: value });
      }
    } catch (err) {
      toast.error("Failed to update setting");
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const res = await fetch("/api/admin/book-my-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "order_status_update", data: { id, status } }),
      });
      if (res.ok) {
        toast.success("Status updated!");
        fetchData(TAB_ORDERS);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (!allowed) return <div className={styles.adminContainer}><p>Access Denied</p></div>;

  return (
    <div className={styles.adminContainer}>
      <Toaster position="top-right" />
      <div className={styles.header}>
        <h1 className={styles.title}>Book My Course</h1>
        <p className={styles.subtitle}>Manage student orders, book packages, promos, and landing page banners.</p>
      </div>

      <div className={styles.tabs}>
        {[TAB_ORDERS, TAB_PACKAGES, TAB_PROMOS, TAB_BANNER, TAB_SETTINGS].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`${styles.tabBtn} ${activeTab === t ? styles.activeTab : ""}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === TAB_ORDERS && (
        <div className={styles.contentSection}>
          {loading ? <p>Loading orders...</p> : data.length === 0 ? <p className={styles.emptyMsg}>No orders found.</p> : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead><tr><th>Order ID</th><th>Customer Info</th><th>Course Details</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {data.map((order) => (
                    <tr key={order.id}>
                      <td><span className={styles.orderId}>#ID-{order.id.toString().slice(-6).toUpperCase()}</span></td>
                      <td>
                        <div className={styles.custName}>{order.parentName}</div>
                        <div className={styles.childName}>Child: {order.childName}</div>
                        <div className={styles.waBadge}>{order.isWhatsApp ? "✅ WhatsApp" : "📞 Call Only"}</div>
                      </td>
                      <td>{order.board} - Class {order.class}</td>
                      <td>₹{order.totalAmount}</td>
                      <td>
                        <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={styles.statusSelect}>
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                        </select>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === TAB_PACKAGES && (
        <div className={styles.contentSection}>
          <div className={styles.actionRow}><button className={styles.primaryBtn} onClick={() => { setPkgForm({ id: "", board: "CBSE", class: 1, name: "", price: 0, bookCount: 0, images: "[]", description: "" }); setShowPkgForm(true); }}>+ Add Package</button></div>
          {showPkgForm && (
            <div className={styles.formCard}>
              <h3>{pkgForm.id ? "Edit Package" : "New Package"}</h3>
              <div className={styles.formGrid}>
                <div className={styles.field}><label>Board</label><select value={pkgForm.board} onChange={(e) => setPkgForm({...pkgForm, board: e.target.value})}><option>CBSE</option><option>ICSE</option><option>State</option></select></div>
                <div className={styles.field}><label>Class</label><input type="number" value={pkgForm.class} onChange={(e) => setPkgForm({...pkgForm, class: e.target.value})} /></div>
                <div className={styles.field}><label>Name</label><input value={pkgForm.name} onChange={(e) => setPkgForm({...pkgForm, name: e.target.value})} /></div>
                <div className={styles.field}><label>Price (₹)</label><input type="number" value={pkgForm.price} onChange={(e) => setPkgForm({...pkgForm, price: e.target.value})} /></div>
              </div>
              <div className={styles.formActions}><button className={styles.saveBtn} onClick={savePackage}>Save Package</button><button className={styles.cancelBtn} onClick={() => setShowPkgForm(false)}>Cancel</button></div>
            </div>
          )}
          <div className={styles.packageList}>
            {data.map(pkg => (
              <div key={pkg.id} className={styles.packageCard}>
                <div><strong>{pkg.board} - Class {pkg.class}</strong><div className={styles.pkgName}>{pkg.name}</div><div className={styles.pkgMeta}>₹{pkg.price} • {pkg.bookCount} Books</div></div>
                <button className={styles.editBtn} onClick={() => { setPkgForm({...pkg}); setShowPkgForm(true); }}>Edit</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === TAB_PROMOS && (
        <div className={styles.contentSection}>
          <div className={styles.actionRow}><button className={styles.primaryBtn} onClick={() => { setPromoForm({ id: "", code: "", discountType: "PERCENTAGE", discountValue: 0, status: "ACTIVE", expiryDate: "" }); setShowPromoForm(true); }}>+ New Promo Code</button></div>
          {showPromoForm && (
            <div className={styles.formCard}>
               <h3>{promoForm.id ? "Edit Promo" : "New Promo"}</h3>
               <div className={styles.formGrid}>
                  <div className={styles.field}><label>Code</label><input value={promoForm.code} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} placeholder="E.g. WELCOME10" /></div>
                  <div className={styles.field}><label>Discount Type</label><select value={promoForm.discountType} onChange={e => setPromoForm({...promoForm, discountType: e.target.value})}><option value="PERCENTAGE">Percentage (%)</option><option value="FIXED">Fixed Amount (₹)</option></select></div>
                  <div className={styles.field}><label>Value</label><input type="number" value={promoForm.discountValue} onChange={e => setPromoForm({...promoForm, discountValue: e.target.value})} /></div>
                  <div className={styles.field}><label>Status</label><select value={promoForm.status} onChange={e => setPromoForm({...promoForm, status: e.target.value})}><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option></select></div>
               </div>
               <div className={styles.formActions}><button className={styles.saveBtn} onClick={savePromo}>Save Promo</button><button className={styles.cancelBtn} onClick={() => setShowPromoForm(false)}>Cancel</button></div>
            </div>
          )}
          <table className={styles.table}>
             <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Status</th><th>Actions</th></tr></thead>
             <tbody>{data.map(p => (
               <tr key={p.id}>
                 <td><strong>{p.code}</strong></td>
                 <td>{p.discountType}</td>
                 <td>{p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : `₹${p.discountValue}`}</td>
                 <td><span className={p.status === "ACTIVE" ? styles.statusActive : styles.statusPaused}>{p.status}</span></td>
                 <td>
                   <button onClick={() => { setPromoForm(p); setShowPromoForm(true); }} className={styles.editBtn}>Edit</button>
                   <button onClick={() => deletePromo(p.id)} className={styles.delBtn}>Delete</button>
                 </td>
               </tr>
             ))}</tbody>
          </table>
        </div>
      )}

      {activeTab === TAB_SETTINGS && (
        <div className={styles.contentSection}>
           <div className={styles.formCard}>
              <h3>Booking Settings</h3>
              <div className={styles.field}>
                 <label>Global Delivery Fee (₹)</label>
                 <div style={{display:'flex', gap:10}}>
                    <input type="number" value={settings.globalDeliveryFee} onChange={e => setSettings({...settings, globalDeliveryFee: e.target.value})} />
                    <button className={styles.saveBtn} onClick={() => updateSetting("globalDeliveryFee", settings.globalDeliveryFee)}>Update Fee</button>
                 </div>
                 <p className={styles.miniHelp}>Enter 0 for free delivery across the platform.</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === TAB_BANNER && (
        <div className={styles.contentSection}>
          <div className={styles.bannerTabHeader}><h3>Landing Hero Banners</h3><ImageUpload label="Add Slide" onUploadSuccess={url => updateBanner([...bannerUrls, url])} /></div>
          <div className={styles.bannerGrid} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginTop: "20px" }}>
            {bannerUrls.map((url, index) => (
              <div key={index} className={styles.bannerCard} style={{ position: "relative", background: "white", padding: "10px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <img src={url} alt={`Slide ${index + 1}`} style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "10px" }} />
                <button onClick={() => updateBanner(bannerUrls.filter((_, i) => i !== index))} style={{ marginTop: 10, background: "#fee2e2", color: "#ef4444", border: "none", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
