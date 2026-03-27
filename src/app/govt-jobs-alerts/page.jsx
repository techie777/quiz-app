"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import styles from "@/styles/GovtJobsAlerts.module.css";
import SkeletonCard from "@/components/govt-jobs/SkeletonCard";
import JobCard from "@/components/govt-jobs/JobCard";
import JobDetailsModal from "@/components/govt-jobs/JobDetailsModal";
import { debounce } from "@/lib/performance";

export default function GovtJobsAlerts() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [filters, setFilters] = useState({
    governmentType: "all",
    education: "all",
    ageLimit: "all",
    lastDateRange: "all"
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [jobAlerts, setJobAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // Debounced search logic
  const debouncedSearchHandler = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearchHandler(value);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExams(true);
  }, [selectedCategory, debouncedSearch, filters, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/exam-categories');
      if (response.ok) {
        const cats = await response.json();
        setCategories(cats);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchExams = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page;
      const skip = (currentPage - 1) * itemsPerPage;
      
      // Construct query parameters
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        skip: skip.toString(),
        search: debouncedSearch,
        category: selectedCategory
      });

      const response = await fetch(`/api/govt-exams?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        const exams = data.exams || [];
        const total = data.total || 0;
        
        const formattedJobs = exams.map(exam => ({
          id: exam.id || exam._id,
          title: exam.title,
          category: exam.category,
          organization: exam.organization,
          governmentType: exam.governmentType,
          lastDate: exam.lastDate,
          startDate: exam.startDate,
          vacancies: exam.vacancies,
          postNames: exam.postNames,
          qualification: exam.qualification,
          ageLimit: exam.ageLimit,
          eligibility: exam.eligibility,
          quota: exam.quota || { gen: 0, sc: 0, st: 0, obc: 0 },
          syllabus: exam.syllabus,
          applicationFee: exam.applicationFee,
          officialWebsite: exam.officialWebsite,
          description: exam.description
        }));
        
        if (reset) {
          setJobAlerts(formattedJobs);
        } else {
          setJobAlerts(prev => [...prev, ...formattedJobs]);
        }
        setTotalJobs(total);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExams(false);
  };

  useEffect(() => {
    if (page > 1) {
      fetchExams(false);
    }
  }, [page]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'govtExams' || e.key === 'examCategories') {
        fetchExams(true);
        fetchCategories();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      governmentType: "all",
      education: "all",
      ageLimit: "all",
      lastDateRange: "all"
    });
    setSelectedCategory("all");
    setSearchTerm("");
    setDebouncedSearch("");
    setPage(1);
  };

  const toggleCardExpansion = (id) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedJob(null);
  };

  const getJobCountByCategory = (categoryId) => {
    if (categoryId === "all") return totalJobs;
    return jobAlerts.filter(job => job.category === categoryId).length;
  };

  const getFilteredAndSortedJobs = () => {
    // Note: Search and Category are now handled on the server side.
    // Client-side filtering is still used for: Government Type, Education, and Date Range.
    let filtered = [...jobAlerts];

    // Government Type filter
    if (filters.governmentType !== "all") {
      filtered = filtered.filter(job => job.governmentType?.toLowerCase().includes(filters.governmentType));
    }

    // Education filter
    if (filters.education !== "all") {
      filtered = filtered.filter(job => job.qualification?.toLowerCase().includes(filters.education.toLowerCase()));
    }

    // Last Date filter
    if (filters.lastDateRange !== "all") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      filtered = filtered.filter(job => {
        const lastDate = new Date(job.lastDate);
        if (filters.lastDateRange === "week") return lastDate >= now && lastDate <= nextWeek;
        if (filters.lastDateRange === "month") return lastDate >= now && lastDate <= nextMonth;
        return true;
      });
    }

    // Sorting - mostly handled by server for search relevance or startDate, 
    // but client can still sort the current page if needed.
    // To be consistent with the server sort (when no search):
    if (!debouncedSearch) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "latest":
            return new Date(b.startDate) - new Date(a.startDate);
          case "oldest":
            return new Date(a.startDate) - new Date(b.startDate);
          case "vacancies-high":
            return b.vacancies - a.vacancies;
          case "vacancies-low":
            return a.vacancies - b.vacancies;
          case "name-asc":
            return a.title.localeCompare(b.title);
          case "name-desc":
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  const filteredJobs = getFilteredAndSortedJobs();

  return (
    <div className={styles.container}>
      {/* Mobile Sidebar Toggle */}
      <button 
        className={styles.sidebarToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
        Filters & Sort
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Filters & Sort</h2>
          <button 
            className={styles.sidebarClose}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className={styles.sidebarContent}>
          {/* Sort Options */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Sort By</h3>
            <div className={styles.sortOptions}>
              <select 
                value={sortBy} 
                onChange={(e) => handleSortChange(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="vacancies-high">Most Vacancies</option>
                <option value="vacancies-low">Least Vacancies</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Government Type Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Government Type</h3>
            <div className={styles.filterOptions}>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="govType" 
                  value="all"
                  checked={filters.governmentType === "all"}
                  onChange={(e) => handleFilterChange("governmentType", e.target.value)}
                />
                <span>All Types</span>
              </label>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="govType" 
                  value="central"
                  checked={filters.governmentType === "central"}
                  onChange={(e) => handleFilterChange("governmentType", e.target.value)}
                />
                <span>Central Govt</span>
              </label>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="govType" 
                  value="state"
                  checked={filters.governmentType === "state"}
                  onChange={(e) => handleFilterChange("governmentType", e.target.value)}
                />
                <span>State Govt</span>
              </label>
            </div>
          </div>

          {/* Education Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Education</h3>
            <div className={styles.filterOptions}>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="education" 
                  value="all"
                  checked={filters.education === "all"}
                  onChange={(e) => handleFilterChange("education", e.target.value)}
                />
                <span>All Levels</span>
              </label>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="education" 
                  value="10th"
                  checked={filters.education === "10th"}
                  onChange={(e) => handleFilterChange("education", e.target.value)}
                />
                <span>10th Pass</span>
              </label>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="education" 
                  value="12th"
                  checked={filters.education === "12th"}
                  onChange={(e) => handleFilterChange("education", e.target.value)}
                />
                <span>12th Pass</span>
              </label>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="education" 
                  value="graduation"
                  checked={filters.education === "graduation"}
                  onChange={(e) => handleFilterChange("education", e.target.value)}
                />
                <span>Graduation</span>
              </label>
            </div>
          </div>

          {/* Last Date Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Last Date</h3>
            <div className={styles.filterOptions}>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="lastDate" 
                  value="all"
                  checked={filters.lastDateRange === "all"}
                  onChange={(e) => handleFilterChange("lastDateRange", e.target.value)}
                />
                <span>All Dates</span>
              </label>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="lastDate" 
                  value="week"
                  checked={filters.lastDateRange === "week"}
                  onChange={(e) => handleFilterChange("lastDateRange", e.target.value)}
                />
                <span>This Week</span>
              </label>
              <label className={styles.filterOption}>
                <input 
                  type="radio" 
                  name="lastDate" 
                  value="month"
                  checked={filters.lastDateRange === "month"}
                  onChange={(e) => handleFilterChange("lastDateRange", e.target.value)}
                />
                <span>This Month</span>
              </label>
            </div>
          </div>

          {/* Clear Filters Button */}
          <button className={styles.clearFiltersButton} onClick={clearFilters}>
            Clear All Filters
          </button>

          {/* Results Count */}
          <div className={styles.resultsCount}>
            <span>{totalJobs}</span> jobs found
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={styles.title}>Government Jobs Alerts</h1>
            <p className={styles.subtitle}>Latest government job notifications and recruitment updates</p>
          </motion.div>
        </div>

        {/* Search and Filter Section */}
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search jobs by title or organization..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
            <button className={styles.searchButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Search
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>Categories</h3>
          <div className={styles.categoryGrid}>
            <button
              className={`${styles.categoryButton} ${selectedCategory === "all" ? styles.active : ''}`}
              onClick={() => {
                setSelectedCategory("all");
                setPage(1);
              }}
            >
              <span className={styles.categoryIcon}>🌟</span>
              <span className={styles.categoryName}>All Jobs</span>
              <span className={styles.categoryCount}>{totalJobs}</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setPage(1);
                }}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryName}>{category.name}</span>
                <span className={styles.categoryCount}>{getJobCountByCategory(category.id)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <div className={styles.content}>
          {loading && jobAlerts.length === 0 ? (
            <div className={styles.jobsGrid}>
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className={styles.empty}>
              <h3>No job alerts found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <>
              <motion.div
                className={styles.jobsGrid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {filteredJobs.map((job, index) => (
                  <JobCard 
                    key={job.id}
                    job={job}
                    index={index}
                    isExpanded={expandedCards.has(job.id)}
                    onToggleExpand={toggleCardExpansion}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </motion.div>

              {/* Load More Button */}
              {jobAlerts.length < totalJobs && (
                <div className={styles.loadMoreContainer}>
                  <button 
                    className={styles.loadMoreButton} 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <span className={styles.loader}></span>
                        Loading...
                      </>
                    ) : (
                      'Load More Jobs'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Features Section */}
        <div className={styles.features}>
          <motion.div
            className={styles.featureSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2>Why Use Our Job Alerts?</h2>
            <div className={styles.featureGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔔</div>
                <h3>Instant Notifications</h3>
                <p>Get real-time alerts for new government job openings</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📱</div>
                <h3>Mobile Friendly</h3>
                <p>Access job alerts on any device, anywhere</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🎯</div>
                <h3>Filtered Results</h3>
                <p>Find jobs matching your qualification and preferences</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📊</div>
                <h3>Complete Information</h3>
                <p>Detailed job descriptions and application guidelines</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Job Details Modal */}
      <AnimatePresence>
        {showDetails && selectedJob && (
          <JobDetailsModal 
            job={selectedJob}
            categories={categories}
            onClose={handleCloseDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
