"use client";

import React, { useMemo } from "react";
import styles from "@/styles/CurrentAffairs.module.css";

const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

// Format date to YYYY-MM-DD
function formatDateStr(year, monthIndex, day) {
  const y = year;
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CalendarWidget({
  selectedDate,
  onSelectDate,
  postedDates = [],
  activeMonthStr, // "YYYY-MM"
  onMonthChange,
  isHindi = false
}) {
  // Parse active month (or default to current month)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const [year, monthIndex] = useMemo(() => {
    if (activeMonthStr && /^\d{4}-\d{2}$/.test(activeMonthStr)) {
      const [y, m] = activeMonthStr.split("-").map(Number);
      return [y, m - 1];
    }
    const ref = selectedDate ? new Date(selectedDate) : new Date();
    return [ref.getFullYear(), ref.getMonth()];
  }, [activeMonthStr, selectedDate]);

  const monthName = useMemo(() => {
    const dt = new Date(year, monthIndex, 1);
    return dt.toLocaleDateString(isHindi ? "hi-IN" : "en-US", { month: "long", year: "numeric" });
  }, [year, monthIndex, isHindi]);

  const postedSet = useMemo(() => new Set(postedDates), [postedDates]);

  // Calculate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    
    const days = [];
    // Padding before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }
    // Month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = formatDateStr(year, monthIndex, d);
      const isFuture = dateStr > todayStr;
      const isPosted = postedSet.has(dateStr);
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === todayStr;

      days.push({
        empty: false,
        dayNumber: d,
        dateStr,
        isFuture,
        isPosted,
        isSelected,
        isToday,
        key: dateStr
      });
    }
    return days;
  }, [year, monthIndex, todayStr, postedSet, selectedDate]);

  const handlePrevMonth = () => {
    const prevDate = new Date(year, monthIndex - 1, 1);
    const mStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    onMonthChange(mStr);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, monthIndex + 1, 1);
    const mStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    onMonthChange(mStr);
  };

  const handleTodayClick = () => {
    const todayMonth = todayStr.slice(0, 7);
    onMonthChange(todayMonth);
    onSelectDate(todayStr);
  };

  const weekdays = isHindi ? WEEKDAYS_HI : WEEKDAYS_EN;

  return (
    <div className={styles.calendarWidget}>
      {/* Calendar Header */}
      <div className={styles.calendarHeader}>
        <button 
          onClick={handlePrevMonth} 
          className={styles.calNavBtn} 
          title="Previous Month"
          aria-label="Previous Month"
        >
          ‹
        </button>
        <div className={styles.calMonthTitle}>{monthName}</div>
        <button 
          onClick={handleNextMonth} 
          className={styles.calNavBtn} 
          title="Next Month"
          aria-label="Next Month"
        >
          ›
        </button>
        <button 
          onClick={handleTodayClick} 
          className={styles.calTodayBadge}
          title="Go to Today"
        >
          {isHindi ? "आज" : "Today"}
        </button>
      </div>

      {/* Weekday Headers */}
      <div className={styles.calendarGrid}>
        {weekdays.map((w, idx) => (
          <div key={idx} className={styles.calWeekdayHeader}>{w}</div>
        ))}

        {/* Days cells */}
        {calendarDays.map((cell) => {
          if (cell.empty) {
            return <div key={cell.key} className={styles.calEmptyCell} />;
          }

          let cellClass = styles.calDayCell;
          if (cell.isSelected) {
            cellClass += ` ${styles.calSelected}`;
          } else if (cell.isFuture) {
            cellClass += ` ${styles.calFuture}`;
          } else if (cell.isPosted) {
            cellClass += ` ${styles.calPostedGreen}`;
          } else {
            // Past or today, not posted
            cellClass += ` ${styles.calMissedRed}`;
          }

          return (
            <button
              key={cell.key}
              onClick={() => onSelectDate(cell.dateStr)}
              className={cellClass}
              title={`${cell.dateStr} - ${cell.isPosted ? (isHindi ? "अपडेट मौजूद है" : "Current Affairs Available") : cell.isFuture ? (isHindi ? "आगामी" : "Upcoming") : (isHindi ? "कोई अपडेट नहीं" : "No Post")}`}
            >
              <span className={styles.calDayNum}>{cell.dayNumber}</span>
              {cell.isToday && <span className={styles.calTodayDot} />}
            </button>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className={styles.calendarLegend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendGreen}`} />
          <span>{isHindi ? "पोस्ट उपलब्ध" : "Posted"}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendRed}`} />
          <span>{isHindi ? "कोई पोस्ट नहीं" : "No Post"}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendBlue}`} />
          <span>{isHindi ? "चयनित" : "Selected"}</span>
        </div>
      </div>
    </div>
  );
}
