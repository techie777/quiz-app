"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/BookMyCourse.module.css";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const PAYMENT_STEP_NONE = null;
const PAYMENT_STEP_SELECT = "select";
const PAYMENT_STEP_CARD = "card";
const PAYMENT_STEP_OTP = "otp";
const PAYMENT_STEP_PROCESSING = "processing";

export default function BookMyCoursePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [orderData, setOrderData] = useState(null);
  
  // Payment states
  const [paymentStep, setPaymentStep] = useState(PAYMENT_STEP_NONE);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [otp, setOtp] = useState("");

  // Selection state
  const [selection, setSelection] = useState({ board: "", class: "" });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [promoData, setPromoData] = useState(null); // { code, discountType, discountValue }
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  const [form, setForm] = useState({ parentName: "", childName: "", deliveryAddress: "", contactNumber: "", isWhatsApp: true });

  const fetchInitialData = async () => {
    try {
      const [pkgRes, bannerRes] = await Promise.all([
        fetch("/api/course-packages"),
        fetch("/api/settings")
      ]);
      
      const pkgData = await pkgRes.json();
      const bannerData = await bannerRes.json();
      
      setPackages(Array.isArray(pkgData) ? pkgData : []);
      
      const bannerValue = bannerData?.bookMyCourseHero;
      if (bannerValue) {
        try {
          const parsed = JSON.parse(bannerValue);
          setBanners(Array.isArray(parsed) ? parsed : [bannerValue]);
        } catch {
          setBanners([bannerValue]);
        }
      } else {
        setBanners(["/assets/course-hero.png"]);
      }
      
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      // Also fetch delivery fee
      try {
        const sRes = await fetch("/api/settings?key=globalDeliveryFee");
        if (sRes.ok) {
          const sData = await sRes.json();
          setDeliveryFee(parseFloat(sData.value || 0));
        }
      } catch {}
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleNext = () => {
    if (step === 1 && (!selection.board || !selection.class)) {
      toast.error("Please select Board and Class");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromoData(data);
        toast.success(`Discount Applied: ${data.discountType === "PERCENTAGE" ? data.discountValue + "%" : "₹" + data.discountValue}`);
      } else {
        toast.error(data.error || "Invalid Coupon");
        setPromoData(null);
      }
    } catch {
      toast.error("Validation failed");
    }
  };

  const calculateTotal = () => {
    const basePrice = selectedPackage?.price || 1499;
    let final = basePrice;
    
    if (promoData) {
      if (promoData.discountType === "PERCENTAGE") {
        final = basePrice * (1 - promoData.discountValue / 100);
      } else {
        final = basePrice - promoData.discountValue;
      }
    }
    
    return Math.round(final + deliveryFee);
  };

  const startPaymentFlow = () => {
    if (!form.parentName || !form.childName || !form.deliveryAddress || !form.contactNumber) {
      toast.error("Please fill all details");
      return;
    }
    setPaymentStep(PAYMENT_STEP_SELECT);
  };

  const processOrderToDB = async () => {
    setPaymentStep(PAYMENT_STEP_PROCESSING);
    await new Promise(r => setTimeout(r, 2000));

    try {
      const finalPrice = calculateTotal();
      const res = await fetch("/api/course-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage?.id || "661234567890123456789012", // Mock valid ObjectId for Prisma if fallback
          ...form,
          board: selection.board || "CBSE",
          class: parseInt(selection.class, 10),
          totalAmount: finalPrice,
          couponCode: promoData ? coupon : null
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrderData(data);
        setPaymentStep(PAYMENT_STEP_NONE);
        setStep(4);
      } else {
        toast.error(data.error || "Failed to place order");
        setPaymentStep(PAYMENT_STEP_NONE);
      }
    } catch (err) {
      console.error("Order process error:", err);
      toast.error("Network error. Please try again.");
      setPaymentStep(PAYMENT_STEP_NONE);
    } finally {
      // Nothing
    }
  };

  const updateSelection = (field, value) => {
    const newSelection = { ...selection, [field]: value };
    setSelection(newSelection);
    if (field === "class" || field === "board") {
       const pkg = packages.find(p => p.board === (field === "board" ? value : selection.board) && p.class === parseInt(field === "class" ? value : selection.class, 10));
       setSelectedPackage(pkg || null);
    }
  };

  if (loading) return <div className={styles.loading}>Loading Course Portal...</div>;

  return (
    <div className={styles.container}>
      <Toaster />
      
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
            <div className={styles.promoBadge}>1 Year FREE Quiz Access 🎁</div>
            <h1 className={styles.hindiTitle}>स्कूल कोर्स अभी बुक करें!</h1>
            <p className={styles.hindiDesc}>
              अपने बच्चे की पढ़ाई को बनाएं डिजिटल और बेहतर! अब किताबों के लिए दुकान-दुकान भटकने की टेंशन खत्म बाजार की भाग-दौड़ और भारी डिस्काउंट की चिंता छोड़िए! हम आपके बच्चे के लिए लाए हैं स्कूल द्वारा सर्टिफाइड ओरिजिनल बुक्स और स्टडी किट्स, वो भी सबसे किफायती दामों पर। बस अपना बोर्ड और क्लास चुनें, घर बैठे डिलीवरी पाएं और साथ में 1 साल का Quiz Pro एक्सेस बिल्कुल फ्री पाएं। सही पढ़ाई, अब एक क्लिक की दूरी पर! &apos;Book My Course&apos; के साथ घर बैठे ऑर्डर करें और पाएं प्रीमियम क्वालिटी बुक्स सीधे अपने दरवाजे पर। सही रिसोर्स, सही समय पर—ताकि आपका बच्चा रहे सबसे आगे!
            </p>
            <button className={styles.bookNowBtn} onClick={() => document.getElementById("order-flow").scrollIntoView({ behavior: "smooth" })}>BOOK NOW</button>
            <div className={styles.trustBadges}>
              <div className={styles.badge}>✔️ CBSE/ICSE/State</div>
              <div className={styles.badge}>✔️ Free Delivery</div>
            </div>
          </motion.div>
          <div className={styles.heroRight}>
            <AnimatePresence mode="wait">
              {banners.length > 0 && (
                <motion.div key={currentBannerIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.bannerWrapper}>
                  <img src={banners[currentBannerIndex]} alt="Slide" className={styles.heroImg} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <main id="order-flow" className={styles.mainContent}>
        <div className={styles.stepper}>
          {["1. Select", "2. Details", "3. Checkout"].map((s, i) => <div key={i} className={`${styles.step} ${step >= i+1 ? styles.active : ""}`}>{s}</div>)}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.selectionCard}>
            <div className={styles.cardInfo}><h2>Select Class & Board</h2><p>Choose your curriculum to view tailored packages.</p></div>
            <div className={styles.inputGroup}><label>Curriculum</label><div className={styles.optionsGrid}>{["CBSE", "ICSE", "State"].map(b => <button key={b} className={selection.board === b ? styles.selected : ""} onClick={() => updateSelection("board", b)}>{b}</button>)}</div></div>
            <div className={styles.inputGroup}><label>Standard (1-12)</label><div className={styles.classOptionsGrid}>{[...Array(12)].map((_, i) => <button key={i+1} className={String(selection.class) === String(i+1) ? styles.selected : ""} onClick={() => updateSelection("class", i+1)}>{i+1}</button>)}</div></div>
            <button className={styles.primaryBtn} onClick={handleNext}>View My Package →</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.detailsCard}>
            <div className={styles.pkgHeader}>
               <div className={styles.titleArea}><h3>{selectedPackage?.name || `Package for Class ${selection.class}`}</h3><span className={styles.promoLabel}>🔥 BEST DEAL</span></div>
               <div className={styles.priceContainer}><span className={styles.strikePrice}>₹{Math.round((selectedPackage?.price || 1499)/0.8)}</span><span className={styles.priceTag}>₹{selectedPackage?.price || 1499}</span></div>
            </div>
            <div className={styles.valueBundles}>
               <div className={styles.vItem}><span>🚚</span> Free Delivery</div>
               <div className={styles.vItem}><span>🎁</span> Quiz Pro Access</div>
               <div className={styles.vItem}><span>📱</span> Study Tool</div>
            </div>
            <div className={styles.bookListGrid}>
               {["Math", "Science", "English", "Notebooks"].map((b, i) => <motion.div key={i} className={styles.bookItem}><span>📚</span> {b}</motion.div>)}
            </div>
            <div className={styles.btnRow}>
               <button className={styles.primaryBtn} onClick={handleNext}>Proceed to Checkout →</button>
               <button className={styles.backBtn} onClick={handleBack}>← Change Selection</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.formCard}>
            <div className={styles.checkoutHeader}><h2>Shipping Details</h2><p>Class {selection.class} • {selection.board} Board</p></div>
            <div className={styles.formGrid}>
               <div className={styles.field}><label>Parent Name</label><input value={form.parentName} onChange={(e) => setForm({...form, parentName: e.target.value})} /></div>
               <div className={styles.field}><label>Child Name</label><input value={form.childName} onChange={(e) => setForm({...form, childName: e.target.value})} /></div>
               <div className={styles.field}><label>Contact Number</label><input value={form.contactNumber} onChange={(e) => setForm({...form, contactNumber: e.target.value})} placeholder="10-digit mobile" /></div>
               <div className={styles.field}>
                  <label className={styles.waCheckboxLabel}>
                     <input type="checkbox" checked={form.isWhatsApp} onChange={(e) => setForm({...form, isWhatsApp: e.target.checked})} />
                     <span>Is this your WhatsApp? 💬</span>
                  </label>
               </div>
               <div className={styles.fieldFull}><label>Full Address</label><textarea value={form.deliveryAddress} onChange={(e) => setForm({...form, deliveryAddress: e.target.value})} rows={2} /></div>
            </div>
            <div className={styles.couponSection}><input placeholder="Promo Code" value={coupon} onChange={(e) => setCoupon(e.target.value)} /><button onClick={applyCoupon}>Apply</button></div>
            <div className={styles.summaryBox}>
               <div className={styles.priceBreakdown}>
                  {deliveryFee > 0 && <div><span>Delivery Fee:</span> <span>₹{deliveryFee}</span></div>}
                  {promoData && <div className={styles.discountRow}><span>Discount ({promoData.code}):</span> <span>-₹{Math.round((selectedPackage?.price || 1499) - (calculateTotal() - deliveryFee))}</span></div>}
               </div>
               <div className={styles.netAmount}>Total Payable: <strong>₹{calculateTotal()}</strong></div>
               <div className={styles.btnRow}>
                 <button className={styles.payBtn} onClick={startPaymentFlow}>Confirm & Pay ₹{calculateTotal()} →</button>
                 <button className={styles.backBtn} onClick={handleBack}>← Back to Details</button>
               </div>
            </div>
          </motion.div>
        )}

        {step === 4 && orderData && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={styles.successDialogue}>
             <div className={styles.checkInner}>✓</div>
             <h2 className={styles.thankYou}>Booking Successful!</h2>
             <div className={styles.orderStats}><div className={styles.statItem}><span className={styles.statLabel}>Order ID</span><span className={styles.statValue}>#ID-{orderData.id.toString().slice(-6).toUpperCase()}</span></div></div>
             <div className={styles.waNote}><p>🚀 All tracking and digital access links sent to **WhatsApp**.</p></div>
             <a href="https://wa.me/91XXXXXXXXXX" className={styles.waSupportBtn} target="_blank"><span>💬</span> Support on WhatsApp</a>
             <button className={styles.primaryBtn} onClick={() => window.location.reload()} style={{marginTop:20}}>Book Another Bundle</button>
          </motion.div>
        )}
      </main>

      {/* 💳 Payment Gate Mock */}
      <AnimatePresence>
        {paymentStep && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.paymentModalOverlay}>
            <motion.div initial={{ y: 50, opacity:0 }} animate={{ y: 0, opacity:1 }} exit={{ y: 50, opacity:0 }} className={styles.paymentModal}>
              {paymentStep === PAYMENT_STEP_SELECT && (
                <div className={styles.paymentSelect}>
                  <div className={styles.modalHeader}><h3>Select Payment</h3><span className={styles.amountBadge}>₹{calculateTotal()}</span></div>
                  <div className={styles.methodsGrid}>
                    <button onClick={() => { setSelectedMethod("UPI"); setPaymentStep(PAYMENT_STEP_PROCESSING); setTimeout(processOrderToDB, 1500); }}><span>⚡</span> UPI Payment</button>
                    <button onClick={() => { setSelectedMethod("CARD"); setPaymentStep(PAYMENT_STEP_CARD); }}><span>💳</span> Card Payment</button>
                  </div>
                  <button className={styles.modalClose} onClick={() => setPaymentStep(PAYMENT_STEP_NONE)}>Cancel</button>
                </div>
              )}
              {paymentStep === PAYMENT_STEP_CARD && <div className={styles.cardForm}><h3>Secure Card Pay</h3><div className={styles.dummyCardRow}><input placeholder="Card Details" disabled /></div><button className={styles.primaryBtn} style={{marginTop:20}} onClick={() => setPaymentStep(PAYMENT_STEP_OTP)}>Generate OTP</button><button className={styles.modalClose} onClick={() => setPaymentStep(PAYMENT_STEP_SELECT)}>Back</button></div>}
              {paymentStep === PAYMENT_STEP_OTP && <div className={styles.otpForm}><div className={styles.lockIcon}>🔒</div><h3>Verify Account</h3><div className={styles.otpGrid}><input value="1" readOnly /><input value="2" readOnly /><input value="3" readOnly /><input value="4" readOnly /></div><button className={styles.primaryBtn} onClick={processOrderToDB}>Verify & Pay ₹{calculateTotal()}</button></div>}
              {paymentStep === PAYMENT_STEP_PROCESSING && <div className={styles.processing}><div className={styles.spinner}></div><h3>Processing Pay...</h3><p className={styles.bankStatus}>Communicating securely with {selectedMethod === "UPI" ? "UPI" : "Bank"} Gateway...</p></div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
