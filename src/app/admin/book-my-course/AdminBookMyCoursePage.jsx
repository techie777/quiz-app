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

  // Orders Filter & Dispatch States
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [dispatchModal, setDispatchModal] = useState({
    isOpen: false,
    order: null,
    courierPartner: "Delhivery",
    trackingNumber: "",
    status: "SHIPPED",
    dispatchDate: "",
    notes: "",
  });
  const [isSavingDispatch, setIsSavingDispatch] = useState(false);
  const [promoDeleteConfirm, setPromoDeleteConfirm] = useState({ isOpen: false, id: null, code: "" });

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

  const confirmDeletePromo = async () => {
    if (!promoDeleteConfirm.id) return;
    try {
      const res = await fetch(`/api/admin/book-my-course?type=promo&id=${promoDeleteConfirm.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Promo deleted");
        setPromoDeleteConfirm({ isOpen: false, id: null, code: "" });
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

  const openDispatchModal = (order) => {
    setDispatchModal({
      isOpen: true,
      order,
      courierPartner: order.dispatch?.courierPartner || "Delhivery",
      trackingNumber: order.dispatch?.trackingNumber || "",
      status: order.status === "PENDING" ? "SHIPPED" : order.status,
      dispatchDate: order.dispatch?.dispatchDate ? new Date(order.dispatch.dispatchDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      notes: order.dispatch?.notes || "",
    });
  };

  const saveDispatchTracking = async (e) => {
    e.preventDefault();
    if (!dispatchModal.order) return;

    setIsSavingDispatch(true);
    try {
      const res = await fetch("/api/admin/book-my-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order_dispatch_update",
          data: {
            id: dispatchModal.order.id,
            status: dispatchModal.status,
            courierPartner: dispatchModal.courierPartner,
            trackingNumber: dispatchModal.trackingNumber.trim(),
            dispatchDate: dispatchModal.dispatchDate,
            notes: dispatchModal.notes.trim(),
          },
        }),
      });

      if (res.ok) {
        toast.success("Order dispatch & tracking updated!");
        setDispatchModal({ isOpen: false, order: null, courierPartner: "Delhivery", trackingNumber: "", status: "SHIPPED", dispatchDate: "", notes: "" });
        fetchData(TAB_ORDERS);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to update dispatch tracking");
      }
    } catch {
      toast.error("Network error updating dispatch tracking");
    } finally {
      setIsSavingDispatch(false);
    }
  };

  // Filtered orders
  const filteredOrders = Array.isArray(data) ? data.filter((o) => {
    if (orderStatusFilter !== "ALL" && o.status !== orderStatusFilter) return false;
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    const idStr = (o.id || "").toLowerCase();
    const parent = (o.parentName || "").toLowerCase();
    const child = (o.childName || "").toLowerCase();
    const phone = (o.contactNumber || "").toLowerCase();
    const tracking = (o.dispatch?.trackingNumber || "").toLowerCase();
    return parent.includes(q) || child.includes(q) || phone.includes(q) || idStr.includes(q) || tracking.includes(q);
  }) : [];

  // Export CSV Function
  const exportOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const headers = [
      "Order ID",
      "Date",
      "Parent Name",
      "Child Name",
      "Contact Number",
      "WhatsApp Allowed",
      "Board",
      "Class",
      "Delivery Address",
      "Total Amount (INR)",
      "Status",
      "Courier Partner",
      "Tracking Number (AWB)",
      "Dispatch Date",
      "Dispatch Notes"
    ];

    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filteredOrders.map((o) => [
      escapeCSV(`#ID-${o.id.toString().slice(-6).toUpperCase()}`),
      escapeCSV(new Date(o.createdAt).toLocaleDateString()),
      escapeCSV(o.parentName),
      escapeCSV(o.childName),
      escapeCSV(o.contactNumber || "N/A"),
      escapeCSV(o.isWhatsApp ? "Yes" : "No"),
      escapeCSV(o.board),
      escapeCSV(o.class),
      escapeCSV(o.deliveryAddress),
      escapeCSV(o.totalAmount),
      escapeCSV(o.status),
      escapeCSV(o.dispatch?.courierPartner || "N/A"),
      escapeCSV(o.dispatch?.trackingNumber || "N/A"),
      escapeCSV(o.dispatch?.dispatchDate ? new Date(o.dispatch.dispatchDate).toLocaleDateString() : "N/A"),
      escapeCSV(o.dispatch?.notes || "")
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Book_My_Course_Orders_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredOrders.length} orders to CSV!`);
  };

  if (!allowed) return <div className={styles.adminContainer}><p>Access Denied</p></div>;

  return (
    <div className={styles.adminContainer}>
      <Toaster position="top-right" />
      <div className={styles.header}>
        <h1 className={styles.title}>Book My Course</h1>
        <p className={styles.subtitle}>Manage student orders, book packages, courier dispatch tracking, promos, and hero banners.</p>
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
          {/* Controls Bar for Orders */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "1.25rem", padding: "14px 18px", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "16px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
              <input
                type="text"
                placeholder="🔍 Search Parent, Child, Phone, or Order ID..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--card-border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  minWidth: "260px",
                  fontWeight: 600,
                  fontSize: "0.88rem"
                }}
              />

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--card-border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  fontSize: "0.88rem"
                }}
              >
                <option value="ALL">All Statuses ({data.length})</option>
                <option value="PENDING">Pending Only</option>
                <option value="PAID">Paid Only</option>
                <option value="SHIPPED">Shipped Only</option>
                <option value="DELIVERED">Delivered Only</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                onClick={exportOrdersCSV}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#10b981",
                  color: "#fff",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"
                }}
              >
                📥 Export Orders CSV ({filteredOrders.length})
              </button>
            </div>
          </div>

          {loading ? <p>Loading orders...</p> : filteredOrders.length === 0 ? <p className={styles.emptyMsg}>No matching orders found.</p> : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Info</th>
                    <th>Course & Address</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Dispatch / Tracking</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td><span className={styles.orderId}>#ID-{order.id.toString().slice(-6).toUpperCase()}</span></td>
                      <td>
                        <div className={styles.custName}>{order.parentName}</div>
                        <div className={styles.childName}>Child: {order.childName}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>📞 {order.contactNumber || "N/A"}</div>
                        <div className={styles.waBadge}>{order.isWhatsApp ? "✅ WhatsApp" : "📞 Call Only"}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{order.board} - Class {order.class}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "200px" }} title={order.deliveryAddress}>
                          📍 {order.deliveryAddress}
                        </div>
                      </td>
                      <td><strong>₹{order.totalAmount}</strong></td>
                      <td>
                        <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={styles.statusSelect}>
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {order.dispatch ? (
                            <span style={{ fontSize: "0.75rem", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", padding: "4px 8px", borderRadius: "6px", fontWeight: 700 }}>
                              🚚 {order.dispatch.courierPartner}: {order.dispatch.trackingNumber || "No AWB"}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Not dispatched</span>
                          )}
                          <button
                            type="button"
                            onClick={() => openDispatchModal(order)}
                            style={{
                              background: "var(--accent, #4361ee)",
                              color: "#fff",
                              border: "none",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              width: "fit-content"
                            }}
                          >
                            📦 {order.dispatch ? "Update Tracking" : "Add Tracking"}
                          </button>
                        </div>
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
                   <button onClick={() => setPromoDeleteConfirm({ isOpen: true, id: p.id, code: p.code })} className={styles.delBtn}>Delete</button>
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

      {/* Order Dispatch & Courier Tracking Modal */}
      {dispatchModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "var(--card-bg, #fff)", maxWidth: "520px", width: "100%", borderRadius: "24px", padding: "28px", boxShadow: "0 25px 30px -5px rgba(0,0,0,0.35)", border: "1px solid var(--card-border, #e2e8f0)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 900, margin: 0, color: "var(--text-primary)" }}>
                  🚚 Courier Dispatch & Tracking
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  Order #ID-{dispatchModal.order?.id?.slice(-6).toUpperCase()} • {dispatchModal.order?.parentName} ({dispatchModal.order?.childName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModal({ isOpen: false, order: null, courierPartner: "Delhivery", trackingNumber: "", status: "SHIPPED", dispatchDate: "", notes: "" })}
                style={{ background: "transparent", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveDispatchTracking} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Courier Partner
                  </label>
                  <select
                    value={dispatchModal.courierPartner}
                    onChange={(e) => setDispatchModal({ ...dispatchModal, courierPartner: e.target.value })}
                    className={styles.statusSelect}
                    style={{ width: "100%" }}
                  >
                    <option value="Delhivery">Delhivery</option>
                    <option value="Blue Dart">Blue Dart</option>
                    <option value="DTDC">DTDC</option>
                    <option value="India Post">India Post (Speed Post)</option>
                    <option value="Ekart">Ekart Logistics</option>
                    <option value="Shadowfax">Shadowfax</option>
                    <option value="Other">Other Courier</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Order Status
                  </label>
                  <select
                    value={dispatchModal.status}
                    onChange={(e) => setDispatchModal({ ...dispatchModal, status: e.target.value })}
                    className={styles.statusSelect}
                    style={{ width: "100%" }}
                  >
                    <option value="SHIPPED">Shipped (In Transit)</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="PAID">Paid (Processing)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Tracking / AWB Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL9876543210 or SP123456789IN"
                  value={dispatchModal.trackingNumber}
                  onChange={(e) => setDispatchModal({ ...dispatchModal, trackingNumber: e.target.value })}
                  className={styles.statusSelect}
                  style={{ width: "100%", padding: "10px 14px", fontWeight: 700, letterSpacing: "1px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Dispatch Date
                </label>
                <input
                  type="date"
                  value={dispatchModal.dispatchDate}
                  onChange={(e) => setDispatchModal({ ...dispatchModal, dispatchDate: e.target.value })}
                  className={styles.statusSelect}
                  style={{ width: "100%", padding: "10px 14px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Internal Dispatch Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handed over to courier boy, package barcode sealed..."
                  value={dispatchModal.notes}
                  onChange={(e) => setDispatchModal({ ...dispatchModal, notes: e.target.value })}
                  className={styles.statusSelect}
                  style={{ width: "100%", padding: "10px 14px", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setDispatchModal({ isOpen: false, order: null, courierPartner: "Delhivery", trackingNumber: "", status: "SHIPPED", dispatchDate: "", notes: "" })}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDispatch}
                  className={styles.saveBtn}
                >
                  {isSavingDispatch ? "Saving..." : "Save Dispatch Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promo Delete Confirmation Modal */}
      {promoDeleteConfirm.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "var(--card-bg, #fff)", maxWidth: "420px", width: "100%", borderRadius: "20px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)", border: "1px solid var(--card-border, #e2e8f0)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 8px 0", color: "#f43f5e" }}>
              Delete Promo Code
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
              Are you sure you want to delete promo code <strong>{promoDeleteConfirm.code}</strong>? Students will no longer be able to use it at checkout.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setPromoDeleteConfirm({ isOpen: false, id: null, code: "" })}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePromo}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Delete Promo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
