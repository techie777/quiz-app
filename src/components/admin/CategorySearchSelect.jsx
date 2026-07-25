"use client";

import Select from "react-select";

export default function CategorySearchSelect({
  categories = [],
  value = "",
  onChange,
  placeholder = "🔍 Search quiz category...",
  isClearable = false,
  isDisabled = false,
  includeAllOption = false,
  allLabel = "📁 All Categories",
  emptyLabel = "-- Select Quiz Category --",
}) {
  const options = [];

  if (includeAllOption) {
    options.push({ value: "all", label: allLabel });
  } else if (emptyLabel) {
    options.push({ value: "", label: emptyLabel });
  }

  categories.forEach((c) => {
    const qCountText = c.questionCount !== undefined ? ` (${c.questionCount} Questions)` : "";
    options.push({
      value: c.id,
      label: `${c.emoji || "📖"} ${c.topic}${qCountText}`,
      topic: c.topic,
    });
  });

  const selectedOption = options.find((opt) => opt.value === (value || "")) || (emptyLabel ? options[0] : null);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: "12px",
      borderColor: state.isFocused ? "#6366f1" : "var(--card-border, #cbd5e1)",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.15)" : "none",
      minHeight: "44px",
      background: "var(--bg-primary, #ffffff)",
      cursor: "pointer",
      "&:hover": {
        borderColor: "#6366f1",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "14px",
      overflow: "hidden",
      boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
      zIndex: 99999,
      background: "var(--bg-primary, #ffffff)",
      border: "1px solid var(--card-border, #e2e8f0)",
    }),
    menuList: (base) => ({
      ...base,
      padding: "6px",
      maxHeight: "260px",
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: "8px",
      margin: "2px 0",
      padding: "10px 14px",
      fontSize: "0.9rem",
      fontWeight: state.isSelected ? "700" : "500",
      backgroundColor: state.isSelected
        ? "#6366f1"
        : state.isFocused
        ? "rgba(99, 102, 241, 0.08)"
        : "transparent",
      color: state.isSelected ? "#ffffff" : "var(--text-primary, #1e293b)",
      cursor: "pointer",
      ":active": {
        backgroundColor: "rgba(99, 102, 241, 0.2)",
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--text-primary, #1e293b)",
      fontWeight: 600,
      fontSize: "0.9rem",
    }),
    input: (base) => ({
      ...base,
      color: "var(--text-primary, #1e293b)",
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--text-muted, #94a3b8)",
      fontSize: "0.9rem",
    }),
  };

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : "")}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      isSearchable={true}
      styles={customStyles}
    />
  );
}
