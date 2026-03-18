"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminSettings.module.css";
import toast from "react-hot-toast";

const DEFAULT_CHIPS = ["Science", "History", "GK", "Quick 5 Min"];
const DEFAULT_NAV_ITEMS = [
  { id: "daily-quiz", label: "Daily quiz", href: "/daily/quiz-of-the-day", children: [] },
  { id: "daily-current-affairs", label: "Daily current affairs", href: "/daily/daily-current-affairs", children: [] },
  {
    id: "school-study",
    label: "School study",
    href: "/school-study",
    children: [
      { id: "mp-board", label: "Madhya Pradesh", href: "/school-study/madhya-pradesh" },
      { id: "cbse", label: "CBSE", href: "/school-study/cbse" },
      { id: "cisce", label: "CISCE", href: "/school-study/cisce" },
    ],
  },
  { id: "previous-years-papers", label: "Previous years papers", href: "/previous-years-papers", children: [] },
  {
    id: "govt-exams",
    label: "Govt exams",
    href: "/govt-exams",
    children: [
      { id: "upsc", label: "UPSC", href: "/govt-exams/upsc" },
      { id: "ssc", label: "SSC", href: "/govt-exams/ssc" },
      { id: "rrb", label: "RRB", href: "/govt-exams/rrb" },
      { id: "ibp", label: "IBP", href: "/govt-exams/ibp" },
    ],
  },
];

const DEFAULT_FOOTER_SECTIONS = [
  {
    id: "platform",
    heading: "Platform",
    links: [{ id: "home", label: "Quizzes", href: "/" }],
  },
  {
    id: "company",
    heading: "Company",
    links: [{ id: "about", label: "About Us", href: "/about" }],
  },
  {
    id: "legal",
    heading: "Legal",
    links: [
      { id: "terms", label: "Terms of Usage", href: "/terms" },
      { id: "privacy", label: "Privacy Policy", href: "/privacy" },
      { id: "copyright", label: "Copyright", href: "/copyright" },
    ],
  },
];

function parseChips(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function parseFooterSections(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((s) => {
        const heading = String(s?.heading || "").trim();
        const id = String(s?.id || heading || Math.random().toString(36).slice(2, 8)).trim();
        const links = Array.isArray(s?.links)
          ? s.links
              .map((l) => ({
                id: String(l?.id || l?.label || Math.random().toString(36).slice(2, 8)).trim(),
                label: String(l?.label || "").trim(),
                href: String(l?.href || "").trim(),
              }))
              .filter((l) => l.label && l.href)
          : [];
        return { id, heading, links };
      })
      .filter((s) => s.heading);
  } catch {
    return [];
  }
}

function parseNavItems(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((it) => {
        const label = String(it?.label || "").trim();
        const href = String(it?.href || "").trim();
        const id = String(it?.id || label || Math.random().toString(36).slice(2, 8)).trim();
        const children = Array.isArray(it?.children)
          ? it.children
              .map((c) => ({
                id: String(c?.id || c?.label || Math.random().toString(36).slice(2, 8)).trim(),
                label: String(c?.label || "").trim(),
                href: String(c?.href || "").trim(),
              }))
              .filter((c) => c.label)
          : [];
        return { id, label, href, children };
      })
      .filter((it) => it.label);
  } catch {
    return [];
  }
}

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useData();
  const { adminUser } = useAdmin();
  const [companyName, setCompanyName] = useState(settings.companyName || "QuizWeb");
  const [companyWebsite, setCompanyWebsite] = useState(settings.companyWebsite || "");
  const [saved, setSaved] = useState(false);
  const [companyDirty, setCompanyDirty] = useState(false);
  const [chipsDraft, setChipsDraft] = useState(() => {
    const parsed = parseChips(settings.homeChips);
    return parsed.length ? parsed : DEFAULT_CHIPS;
  });
  const [newChip, setNewChip] = useState("");
  const [chipsSaved, setChipsSaved] = useState(false);
  const [chipsDirty, setChipsDirty] = useState(false);
  const [navbarEnabled, setNavbarEnabled] = useState(settings.navbarEnabled !== false);
  const [navItemsDraft, setNavItemsDraft] = useState(() => {
    const parsed = parseNavItems(settings.navbarItems);
    return parsed.length ? parsed : DEFAULT_NAV_ITEMS;
  });
  const [navDirty, setNavDirty] = useState(false);
  const [navSaved, setNavSaved] = useState(false);
  const [footerEnabled, setFooterEnabled] = useState(settings.footerEnabled !== false);
  const [footerBrandDesc, setFooterBrandDesc] = useState(
    settings.footerBrandDesc ||
      "The ultimate platform to test your knowledge across hundreds of categories. Challenge yourself, learn new things, and have fun!"
  );
  const [footerBottomText, setFooterBottomText] = useState(
    settings.footerBottomText || "All rights reserved. Designed for knowledge seekers worldwide."
  );
  const [footerSectionsDraft, setFooterSectionsDraft] = useState(() => {
    const parsed = parseFooterSections(settings.footerSections);
    return parsed.length ? parsed : DEFAULT_FOOTER_SECTIONS;
  });
  const [footerDirty, setFooterDirty] = useState(false);
  const [footerSaved, setFooterSaved] = useState(false);

  useEffect(() => {
    if (!companyDirty) {
      setCompanyName(settings.companyName || "QuizWeb");
      setCompanyWebsite(settings.companyWebsite || "");
    }
  }, [companyDirty, settings.companyName, settings.companyWebsite]);

  useEffect(() => {
    if (chipsDirty) return;
    const parsed = parseChips(settings.homeChips);
    setChipsDraft(parsed.length ? parsed : DEFAULT_CHIPS);
  }, [chipsDirty, settings.homeChips]);

  useEffect(() => {
    if (navDirty) return;
    setNavbarEnabled(settings.navbarEnabled !== false);
    const parsed = parseNavItems(settings.navbarItems);
    setNavItemsDraft(parsed.length ? parsed : DEFAULT_NAV_ITEMS);
  }, [navDirty, settings.navbarEnabled, settings.navbarItems]);

  useEffect(() => {
    if (footerDirty) return;
    setFooterEnabled(settings.footerEnabled !== false);
    setFooterBrandDesc(
      settings.footerBrandDesc ||
        "The ultimate platform to test your knowledge across hundreds of categories. Challenge yourself, learn new things, and have fun!"
    );
    setFooterBottomText(
      settings.footerBottomText || "All rights reserved. Designed for knowledge seekers worldwide."
    );
    const parsed = parseFooterSections(settings.footerSections);
    setFooterSectionsDraft(parsed.length ? parsed : DEFAULT_FOOTER_SECTIONS);
  }, [footerDirty, settings.footerEnabled, settings.footerBrandDesc, settings.footerBottomText, settings.footerSections]);

  const normalizedChips = useMemo(() => {
    const seen = new Set();
    return chipsDraft
      .map((c) => c.trim())
      .filter(Boolean)
      .filter((c) => {
        const key = c.toLowerCase();
        if (key === "trending quiz") return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [chipsDraft]);

  const normalizedNavItems = useMemo(() => {
    const seen = new Set();
    return navItemsDraft
      .map((it) => ({
        id: String(it?.id || it?.label || Math.random().toString(36).slice(2, 8)).trim(),
        label: String(it?.label || "").trim(),
        href: String(it?.href || "").trim(),
        children: Array.isArray(it?.children)
          ? it.children
              .map((c) => ({
                id: String(c?.id || c?.label || Math.random().toString(36).slice(2, 8)).trim(),
                label: String(c?.label || "").trim(),
                href: String(c?.href || "").trim(),
              }))
              .filter((c) => c.label)
          : [],
      }))
      .filter((it) => it.label)
      .filter((it) => {
        const key = it.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [navItemsDraft]);

  const normalizedFooterSections = useMemo(() => {
    return footerSectionsDraft
      .map((s) => ({
        id: String(s?.id || s?.heading || Math.random().toString(36).slice(2, 8)).trim(),
        heading: String(s?.heading || "").trim(),
        links: Array.isArray(s?.links)
          ? s.links
              .map((l) => ({
                id: String(l?.id || l?.label || Math.random().toString(36).slice(2, 8)).trim(),
                label: String(l?.label || "").trim(),
                href: String(l?.href || "").trim(),
              }))
              .filter((l) => l.label && l.href)
          : [],
      }))
      .filter((s) => s.heading);
  }, [footerSectionsDraft]);

  const handleSaveCompany = async () => {
    const success = await updateSettings({ companyName, companyWebsite });
    if (success) {
      toast.success("Company settings saved!");
      setSaved(true);
      setCompanyDirty(false);
      setTimeout(() => setSaved(false), 2000);
    } else {
      toast.error("Failed to save company settings.");
    }
  };

  const handleAddChip = () => {
    const val = newChip.trim();
    if (!val) return;
    setChipsDraft((prev) => [...prev, val]);
    setChipsDirty(true);
    setNewChip("");
  };

  const handleSaveChips = async () => {
    const success = await updateSettings({ homeChips: JSON.stringify(normalizedChips) });
    if (success) {
      toast.success("Home chips saved!");
      setChipsSaved(true);
      setChipsDirty(false);
      setTimeout(() => setChipsSaved(false), 2000);
    } else {
      toast.error("Failed to save home chips.");
    }
  };

  const handleAddNavItem = () => {
    setNavDirty(true);
    setNavItemsDraft((prev) => [
      ...prev,
      { id: `nav_${Date.now()}`, label: "New item", href: "/", children: [] },
    ]);
  };

  const handleAddSubItem = (parentId) => {
    setNavDirty(true);
    setNavItemsDraft((prev) =>
      prev.map((it) =>
        it.id === parentId
          ? {
              ...it,
              children: [
                ...(Array.isArray(it.children) ? it.children : []),
                { id: `sub_${Date.now()}`, label: "New sub item", href: "/" },
              ],
            }
          : it
      )
    );
  };

  const handleSaveNav = async () => {
    const success = await updateSettings({
      navbarEnabled,
      navbarItems: JSON.stringify(normalizedNavItems),
    });
    if (success) {
      toast.success("Navigation settings saved!");
      setNavSaved(true);
      setNavDirty(false);
      setTimeout(() => setNavSaved(false), 2000);
    } else {
      toast.error("Failed to save navigation settings.");
    }
  };

  const handleAddFooterSection = () => {
    setFooterDirty(true);
    setFooterSectionsDraft((prev) => [
      ...prev,
      { id: `footer_${Date.now()}`, heading: "New section", links: [] },
    ]);
  };

  const handleAddFooterLink = (sectionId) => {
    setFooterDirty(true);
    setFooterSectionsDraft((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              links: [
                ...(Array.isArray(s.links) ? s.links : []),
                { id: `link_${Date.now()}`, label: "New link", href: "/" },
              ],
            }
      )
    );
  };

  const handleSaveFooter = async () => {
    const success = await updateSettings({
      footerEnabled,
      footerBrandDesc,
      footerBottomText,
      footerSections: JSON.stringify(normalizedFooterSections),
    });
    if (success) {
      toast.success("Footer saved!");
      setFooterSaved(true);
      setFooterDirty(false);
      setTimeout(() => setFooterSaved(false), 2000);
    } else {
      toast.error("Failed to save footer.");
    }
  };

  const allowed = adminUser?.role === "master" || adminUser?.permissions?.settings !== false;
  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>Manage quiz options and site settings</p>

      {/* Quiz Options */}
      <section className={`${styles.section} glass-card`}>
        <h2 className={styles.sectionTitle}>🎮 Quiz Options</h2>
        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>Difficulty Selection</span>
            <p className={styles.toggleDesc}>
              Allow users to choose difficulty level before starting a quiz.
            </p>
          </div>
          <button
            className={`${styles.toggleSwitch} ${settings.difficultyEnabled ? styles.toggleOn : ""}`}
            onClick={async () => {
              const success = await updateSettings({ difficultyEnabled: !settings.difficultyEnabled });
              if (success) toast.success(`Difficulty selection ${!settings.difficultyEnabled ? "enabled" : "disabled"}`);
              else toast.error("Failed to update difficulty setting.");
            }}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>
      </section>

      {/* Company / PDF Settings */}
      <section className={`${styles.section} glass-card`}>
        <h2 className={styles.sectionTitle}>🏢 Company Settings</h2>
        <p className={styles.sectionDesc}>
          These appear in the header/footer of exported PDF notes.
        </p>
        <div className={styles.field}>
          <label>Company Name</label>
          <input
            className={styles.input}
            value={companyName}
            onChange={(e) => {
              setCompanyDirty(true);
              setCompanyName(e.target.value);
            }}
            placeholder="QuizWeb"
          />
        </div>
        <div className={styles.field}>
          <label>Company Website</label>
          <input
            className={styles.input}
            value={companyWebsite}
            onChange={(e) => {
              setCompanyDirty(true);
              setCompanyWebsite(e.target.value);
            }}
            placeholder="https://quizweb.com"
          />
        </div>
        {saved && (
          <div className={`${styles.msg} ${styles.success}`}>Settings saved!</div>
        )}
        <button className="btn-primary" onClick={handleSaveCompany}>
          Save Company Settings
        </button>
      </section>

      <section className={`${styles.section} glass-card`}>
        <h2 className={styles.sectionTitle}>🏷️ Home Filter Chips</h2>
        <p className={styles.sectionDesc}>
          Manage the chips shown under the Home page search bar. “Trending Quiz” is always available.
        </p>

        <div className={styles.chipsEditor}>
          <div className={styles.chipRow}>
            <input
              className={styles.input}
              value={newChip}
              onChange={(e) => setNewChip(e.target.value)}
              placeholder="Add a chip label (e.g. Science)"
            />
            <button className={styles.addBtn} type="button" onClick={handleAddChip}>
              Add
            </button>
          </div>

          <div className={styles.chipsList}>
            {normalizedChips.map((chip, idx) => (
              <div key={`${chip}-${idx}`} className={styles.chipItem}>
                <input
                  className={styles.input}
                  value={chip}
                  onChange={(e) => {
                    const v = e.target.value;
                    setChipsDirty(true);
                    setChipsDraft((prev) => {
                      const next = [...prev];
                      const originalIndex = prev.findIndex((p) => p.trim() === chip);
                      const i = originalIndex >= 0 ? originalIndex : idx;
                      next[i] = v;
                      return next;
                    });
                  }}
                />
                <button
                  type="button"
                  className={styles.deleteChipBtn}
                  onClick={() => {
                    setChipsDirty(true);
                    setChipsDraft((prev) => prev.filter((c) => c.trim() !== chip));
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            {normalizedChips.length === 0 && (
              <div className={styles.emptyChips}>No chips added yet.</div>
            )}
          </div>

          {chipsSaved && (
            <div className={`${styles.msg} ${styles.success}`}>Chips saved!</div>
          )}
          <button className="btn-primary" onClick={handleSaveChips}>
            Save Chips
          </button>
        </div>
      </section>

      <section className={`${styles.section} glass-card`}>
        <h2 className={styles.sectionTitle}>🧭 Navigation Bar</h2>
        <p className={styles.sectionDesc}>
          Configure the navigation bar shown below the header. Changes reflect on the quiz website instantly.
        </p>

        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>Show Navigation Bar</span>
            <p className={styles.toggleDesc}>Hide or show the navigation bar for users.</p>
          </div>
          <button
            className={`${styles.toggleSwitch} ${navbarEnabled ? styles.toggleOn : ""}`}
            onClick={() => {
              setNavDirty(true);
              setNavbarEnabled((v) => !v);
            }}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.navEditor}>
          <div className={styles.navTopRow}>
            <button className={styles.addBtn} type="button" onClick={handleAddNavItem}>
              Add Navigation Item
            </button>
          </div>

          <div className={styles.navList}>
            {normalizedNavItems.map((item) => (
              <div key={item.id} className={styles.navItem}>
                <div className={styles.navItemRow}>
                  <input
                    className={styles.input}
                    value={item.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNavDirty(true);
                      setNavItemsDraft((prev) =>
                        prev.map((it) => (it.id === item.id ? { ...it, label: v } : it))
                      );
                    }}
                  />
                  <input
                    className={styles.input}
                    value={item.href}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNavDirty(true);
                      setNavItemsDraft((prev) =>
                        prev.map((it) => (it.id === item.id ? { ...it, href: v } : it))
                      );
                    }}
                    placeholder="/path"
                  />
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => handleAddSubItem(item.id)}
                  >
                    Add Sub
                  </button>
                  <button
                    type="button"
                    className={styles.deleteChipBtn}
                    onClick={() => {
                      setNavDirty(true);
                      setNavItemsDraft((prev) => prev.filter((it) => it.id !== item.id));
                    }}
                  >
                    Delete
                  </button>
                </div>

                {Array.isArray(item.children) && item.children.length > 0 && (
                  <div className={styles.subNavList}>
                    {item.children.map((sub) => (
                      <div key={sub.id} className={styles.subNavRow}>
                        <input
                          className={styles.input}
                          value={sub.label}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNavDirty(true);
                            setNavItemsDraft((prev) =>
                              prev.map((it) =>
                                it.id !== item.id
                                  ? it
                                  : {
                                      ...it,
                                      children: it.children.map((c) =>
                                        c.id === sub.id ? { ...c, label: v } : c
                                      ),
                                    }
                              )
                            );
                          }}
                        />
                        <input
                          className={styles.input}
                          value={sub.href}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNavDirty(true);
                            setNavItemsDraft((prev) =>
                              prev.map((it) =>
                                it.id !== item.id
                                  ? it
                                  : {
                                      ...it,
                                      children: it.children.map((c) =>
                                        c.id === sub.id ? { ...c, href: v } : c
                                      ),
                                    }
                              )
                            );
                          }}
                          placeholder="/path"
                        />
                        <button
                          type="button"
                          className={styles.deleteChipBtn}
                          onClick={() => {
                            setNavDirty(true);
                            setNavItemsDraft((prev) =>
                              prev.map((it) =>
                                it.id !== item.id
                                  ? it
                                  : { ...it, children: it.children.filter((c) => c.id !== sub.id) }
                              )
                            );
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {navSaved && <div className={`${styles.msg} ${styles.success}`}>Navigation saved!</div>}
          <button className="btn-primary" onClick={handleSaveNav}>
            Save Navigation
          </button>
        </div>
      </section>

      <section className={`${styles.section} glass-card`}>
        <h2 className={styles.sectionTitle}>🦶 Footer</h2>
        <p className={styles.sectionDesc}>Edit or delete the footer content shown on the public site.</p>

        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>Footer Enabled</span>
            <p className={styles.toggleDesc}>Hide or show the footer globally.</p>
          </div>
          <button
            className={`${styles.toggleSwitch} ${footerEnabled ? styles.toggleOn : ""}`}
            onClick={() => {
              setFooterDirty(true);
              setFooterEnabled((v) => !v);
            }}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.field}>
          <label>Brand Description</label>
          <textarea
            className={styles.textarea}
            rows={3}
            value={footerBrandDesc}
            onChange={(e) => {
              setFooterDirty(true);
              setFooterBrandDesc(e.target.value);
            }}
          />
        </div>

        <div className={styles.field}>
          <label>Bottom Text</label>
          <input
            className={styles.input}
            value={footerBottomText}
            onChange={(e) => {
              setFooterDirty(true);
              setFooterBottomText(e.target.value);
            }}
          />
        </div>

        <div className={styles.field}>
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ margin: 0 }}>Sections</label>
            <button className={styles.addBtn} type="button" onClick={handleAddFooterSection}>
              Add Section
            </button>
          </div>
        </div>

        <div className={styles.navEditor}>
          {footerSectionsDraft.map((section) => (
            <div key={section.id} className={styles.navItem}>
              <div className={styles.navHeader}>
                <input
                  className={styles.input}
                  value={section.heading}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFooterDirty(true);
                    setFooterSectionsDraft((prev) =>
                      prev.map((s) => (s.id === section.id ? { ...s, heading: v } : s))
                    );
                  }}
                  placeholder="Section heading"
                />
                <button
                  type="button"
                  className={styles.deleteChipBtn}
                  onClick={() => {
                    setFooterDirty(true);
                    setFooterSectionsDraft((prev) => prev.filter((s) => s.id !== section.id));
                  }}
                >
                  Delete Section
                </button>
              </div>

              <div style={{ marginTop: "0.6rem" }}>
                <button className={styles.addBtn} type="button" onClick={() => handleAddFooterLink(section.id)}>
                  Add Link
                </button>
              </div>

              <div className={styles.subNavList}>
                {(section.links || []).map((link) => (
                  <div key={link.id} className={styles.subNavItem}>
                    <input
                      className={styles.input}
                      value={link.label}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFooterDirty(true);
                        setFooterSectionsDraft((prev) =>
                          prev.map((s) =>
                            s.id !== section.id
                              ? s
                              : { ...s, links: s.links.map((l) => (l.id === link.id ? { ...l, label: v } : l)) }
                          )
                        );
                      }}
                      placeholder="Label"
                    />
                    <input
                      className={styles.input}
                      value={link.href}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFooterDirty(true);
                        setFooterSectionsDraft((prev) =>
                          prev.map((s) =>
                            s.id !== section.id
                              ? s
                              : { ...s, links: s.links.map((l) => (l.id === link.id ? { ...l, href: v } : l)) }
                          )
                        );
                      }}
                      placeholder="/path"
                    />
                    <button
                      type="button"
                      className={styles.deleteChipBtn}
                      onClick={() => {
                        setFooterDirty(true);
                        setFooterSectionsDraft((prev) =>
                          prev.map((s) =>
                            s.id !== section.id ? s : { ...s, links: s.links.filter((l) => l.id !== link.id) }
                          )
                        );
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {footerSaved && <div className={`${styles.msg} ${styles.success}`}>Footer saved!</div>}
        <button className="btn-primary" onClick={handleSaveFooter}>
          Save Footer
        </button>
      </section>

      {/* Info */}
      <section className={`${styles.section} glass-card`}>
        <h2 className={styles.sectionTitle}>ℹ️ About</h2>
        <p className={styles.sectionDesc}>
          QuizWeb Admin Panel — manage categories, questions, and settings.
          Data is stored in a SQLite database.
        </p>
      </section>
    </div>
  );
}
