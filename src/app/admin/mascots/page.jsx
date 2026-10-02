"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Upload,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw,
  FolderSync,
  Layers,
  Info,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const STATES_INFO = [
  {
    key: "idle",
    label: "1. Idle (शांतिपूर्ण उपस्थिति)",
    desc: "Calm breathing & attentive ready posture. Loops continuously.",
    isLoop: true,
  },
  {
    key: "thinking",
    label: "2. Thinking (सोचते हुए)",
    desc: "Head tilt, examining options as timer ticks down. Plays once or loops during low time.",
    isLoop: false,
  },
  {
    key: "correct",
    label: "3. Correct (शाबाशी & ताली)",
    desc: "Clapping, enthusiastic thumbs up, joyful praise. Plays once on correct answer.",
    isLoop: false,
  },
  {
    key: "wrong",
    label: "4. Wrong (सहानुभूति & सीख)",
    desc: "Gentle head shake & encouraging nod. Empathetic and warm, not mocking.",
    isLoop: false,
  },
  {
    key: "celebrate",
    label: "5. Celebrate (धमाकेदार जश्न)",
    desc: "High cheer, victory jump, celebrations on 5-question streaks & high scores.",
    isLoop: false,
  },
  {
    key: "talking",
    label: "6. Talking (स्पष्टीकरण वाचन)",
    desc: "Active speech mouth movement & gestures while reading explanation audio. Loops while speaking.",
    isLoop: true,
  },
];

const DEFAULT_CATEGORIES = [
  { key: "science", label: "Science, Tech & Space", defaultMascot: "dr_cosmo" },
  { key: "bollywood", label: "Bollywood, Cinema & Pop", defaultMascot: "filmy_raj" },
  { key: "sports", label: "Sports & Speed Mock Tests", defaultMascot: "coach_vikram" },
  { key: "kids", label: "Kids GK & Primary School", defaultMascot: "didi" },
  { key: "polity", label: "Polity, History & Govt Exams", defaultMascot: "sharma_sir" },
  { key: "default", label: "All Other Categories (Default)", defaultMascot: "sharma_sir" },
];

export default function AdminMascotsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("videos"); // 'videos' | 'settings' | 'categories'
  const [selectedCharId, setSelectedCharId] = useState("sharma_sir");

  // Uploading state: tracking which character_state is uploading
  const [uploadingKey, setUploadingKey] = useState(null);
  const [playingPreviewKey, setPlayingPreviewKey] = useState(null);

  // Settings draft state
  const [settingsDraft, setSettingsDraft] = useState({
    mascotsEnabled: true,
    mascotSpeechDefault: true,
    mascotVideoPreference: "auto",
    mascotCategoryMappings: {},
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mascots");
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.settings) {
          setSettingsDraft({
            mascotsEnabled: json.settings.mascotsEnabled !== false,
            mascotSpeechDefault: json.settings.mascotSpeechDefault !== false,
            mascotVideoPreference: json.settings.mascotVideoPreference || "auto",
            mascotCategoryMappings: json.settings.mascotCategoryMappings || {},
          });
        }
      } else {
        toast.error(json.error || "Failed to load mascot data");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error loading mascot data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (charId, stateName, file) => {
    if (!file) return;

    const key = `${charId}_${stateName}`;
    setUploadingKey(key);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("character", charId);
    formData.append("state", stateName);

    try {
      const res = await fetch("/api/admin/mascots/upload", {
        method: "POST",
        body: formData,
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast.success(`Uploaded ${stateName} video for ${charId}!`);
        await loadData();
      } else {
        toast.error(resJson.error || "Upload failed");
      }
    } catch (e) {
      console.error("Upload error:", e);
      toast.error("Upload failed due to network error");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDeleteVideo = async (charId, stateName) => {
    if (!confirm(`Revert ${charId} (${stateName}) back to static poster image?`)) return;

    try {
      const res = await fetch(`/api/admin/mascots/upload?character=${charId}&state=${stateName}`, {
        method: "DELETE",
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast.success(resJson.message);
        await loadData();
      } else {
        toast.error(resJson.error || "Delete failed");
      }
    } catch (e) {
      toast.error("Error removing video");
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/mascots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsDraft),
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast.success("Mascot settings saved successfully!");
      } else {
        toast.error(resJson.error || "Failed to save settings");
      }
    } catch (e) {
      toast.error("Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const selectedCharacter = data?.characters?.find((c) => c.id === selectedCharId) || data?.characters?.[0];

  const countVideosForChar = (char) => {
    if (!char || !char.states) return 0;
    return Object.values(char.states).filter((s) => s.hasVideo).length;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Mascot Hosts & Video Expressions Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Upload transparent short expression videos (.webm / .mp4) for each mascot character, configure app-wide speech & video defaults, and assign category hosts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <ShieldCheck size={14} />
            <span>{savingSettings ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Characters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Characters</span>
            <Layers size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">5 Mascots</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sharma, Vikram, Raj, Cosmo, Didi</div>
        </div>

        {/* Video Expressions Uploaded */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Video Clips</span>
            <Video size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {data?.stats?.uploadedVideos ?? 0} / {data?.stats?.totalExpressions ?? 25}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${data?.stats?.videoCompletionPercent ?? 0}%` }}
            />
          </div>
        </div>

        {/* Mascot Feature Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Host Status</span>
            <Sparkles size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {settingsDraft.mascotsEnabled ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={20} /> Active
              </span>
            ) : (
              <span className="text-slate-400">Disabled</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Displayed on quizzes & explanations</div>
        </div>

        {/* TTS Speech Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Voice / TTS</span>
            <Volume2 size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {settingsDraft.mascotSpeechDefault ? (
              <span className="text-amber-600 dark:text-amber-400">Autoplay ON</span>
            ) : (
              <span className="text-slate-400">Muted Default</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Hindi (hi-IN) Primary + Indian English</div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("videos")}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "videos"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Video size={16} />
          <span>Expression Videos Studio (25 Clips)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "settings"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Settings size={16} />
          <span>Mascot & TTS Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "categories"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FolderSync size={16} />
          <span>Category Host Assignments</span>
        </button>
      </div>

      {/* TAB 1: EXPRESSION VIDEOS STUDIO */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          {/* Character Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {data?.characters?.map((char) => {
              const videoCount = countVideosForChar(char);
              const isSelected = selectedCharId === char.id;
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setSelectedCharId(char.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{char.icon}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        videoCount > 0
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {videoCount} / 6 Videos
                    </span>
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                      {char.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {char.nameHi} • {char.subject}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Character Detail Banner */}
          {selectedCharacter && (
            <div
              className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border"
              style={{
                backgroundColor: `${selectedCharacter.color}10`,
                borderColor: `${selectedCharacter.color}35`,
              }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                  style={{ backgroundColor: `${selectedCharacter.color}25` }}
                >
                  {selectedCharacter.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedCharacter.name} ({selectedCharacter.nameHi})
                    </h2>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: selectedCharacter.color }}
                    >
                      {selectedCharacter.subject}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {selectedCharacter.tagline} • Upload transparent short videos for the 6 expression states below.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Transparent .webm or .mp4 supported</span>
              </div>
            </div>
          )}

          {/* 6 Expression Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STATES_INFO.map((stateInfo) => {
              const stateData = selectedCharacter?.states?.[stateInfo.key] || {};
              const hasVideo = stateData.hasVideo;
              const isUploading = uploadingKey === `${selectedCharacter?.id}_${stateInfo.key}`;
              const isPreviewPlaying = playingPreviewKey === `${selectedCharacter?.id}_${stateInfo.key}`;

              return (
                <div
                  key={stateInfo.key}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3"
                >
                  {/* Top Row: State Label & Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {stateInfo.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {stateInfo.desc}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        hasVideo
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {hasVideo ? "🎬 Video Active" : "🖼️ Static Poster"}
                    </span>
                  </div>

                  {/* Visual Preview Stage with checkered transparent background */}
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80">
                    {/* Checkerboard Pattern for transparent videos */}
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        backgroundImage:
                          "radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#94a3b8 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 8px 8px",
                      }}
                    />

                    {/* Media Display */}
                    {hasVideo && stateData.videoUrl ? (
                      <video
                        key={stateData.videoUrl}
                        src={stateData.videoUrl}
                        autoPlay
                        loop={stateInfo.isLoop}
                        muted
                        playsInline
                        className="relative z-10 max-h-full max-w-full object-contain filter drop-shadow(0 4px 8px rgba(0,0,0,0.15))"
                      />
                    ) : (
                      <img
                        src={stateData.posterUrl || `/mascots/${selectedCharacter?.id}/${stateInfo.key}.webp`}
                        alt={stateInfo.label}
                        className="relative z-10 max-h-full max-w-full object-contain filter drop-shadow(0 4px 8px rgba(0,0,0,0.15))"
                        onError={(e) => {
                          e.currentTarget.src = `/assets/characters/${selectedCharacter?.slug}/idle.webp`;
                        }}
                      />
                    )}

                    {/* Format Indicator Pill */}
                    <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono">
                      {hasVideo ? stateData.videoUrl?.split(".").pop()?.toUpperCase() : "WEBP POSTER"}
                    </div>

                    {/* Loop indicator */}
                    {stateInfo.isLoop && (
                      <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md bg-indigo-600/80 backdrop-blur-sm text-white text-[10px] font-bold">
                        LOOP
                      </div>
                    )}
                  </div>

                  {/* Actions & Upload Controls */}
                  <div className="space-y-2 pt-1">
                    {/* File upload input hidden, triggered by button */}
                    <div className="flex items-center gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="video/webm,video/mp4,video/quicktime"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(selectedCharacter?.id, stateInfo.key, file);
                            }
                          }}
                          className="hidden"
                        />
                        <span
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isUploading
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                              : hasVideo
                              ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 active:scale-95"
                          }`}
                        >
                          <Upload size={14} className={isUploading ? "animate-bounce" : ""} />
                          <span>
                            {isUploading
                              ? "Uploading Video..."
                              : hasVideo
                              ? "Replace Video (.webm/.mp4)"
                              : "Upload Expression Video"}
                          </span>
                        </span>
                      </label>

                      {/* Delete button if video exists */}
                      {hasVideo && (
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(selectedCharacter?.id, stateInfo.key)}
                          title="Revert to static poster image"
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                      <span>Rec: 1-3 sec transparent .webm</span>
                      <span>Max: 25 MB</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-3xl space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              App-Wide Mascot & TTS Audio Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              These settings control how mascots behave across quiz pages, timers, and explanation dialogs.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Mascot Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Enable Mascot Feature App-Wide
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  When enabled, animated mascots host quiz questions, react to answers, and explain solutions.
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsDraft.mascotsEnabled}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({ ...prev, mascotsEnabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* Speech Autoplay Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Autoplay Explanation Speech (Hindi TTS)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  When enabled, the mascot speaks the solution automatically when the explanation popup opens.
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsDraft.mascotSpeechDefault}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({ ...prev, mascotSpeechDefault: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* Video Playback Preference */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Video Playback Preference
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select how the mascot player chooses between video clips and CSS-animated posters.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {[
                  {
                    value: "auto",
                    label: "Auto (Recommended)",
                    desc: "Transparent WebM video on supported devices, automatic poster fallback on iOS/slow 2G.",
                  },
                  {
                    value: "video_preferred",
                    label: "Video Preferred",
                    desc: "Always attempt video first across all supported states.",
                  },
                  {
                    value: "static_only",
                    label: "Static Posters Only",
                    desc: "Save bandwidth. Always use CSS life animations on static posters.",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setSettingsDraft((prev) => ({ ...prev, mascotVideoPreference: opt.value }))
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settingsDraft.mascotVideoPreference === opt.value
                        ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {savingSettings ? "Saving Settings..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORY MAPPINGS */}
      {activeTab === "categories" && (
        <div className="max-w-3xl space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Category-to-Mascot Host Assignment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assign which character acts as the host and tutor for each quiz topic or category.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {DEFAULT_CATEGORIES.map((cat) => {
              const currentMascot =
                settingsDraft.mascotCategoryMappings?.[cat.key] || cat.defaultMascot;

              return (
                <div
                  key={cat.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {cat.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Slug key: <code className="text-indigo-600 dark:text-indigo-400 font-mono">{cat.key}</code>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={currentMascot}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setSettingsDraft((prev) => ({
                          ...prev,
                          mascotCategoryMappings: {
                            ...prev.mascotCategoryMappings,
                            [cat.key]: newVal,
                          },
                        }));
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="sharma_sir">👨‍🏫 Sharma Sir (Polity & History)</option>
                      <option value="coach_vikram">🏃 Coach Vikram (Mock Tests & Sports)</option>
                      <option value="filmy_raj">🎬 Filmy Raj (Bollywood & Pop)</option>
                      <option value="dr_cosmo">🔬 Dr. Cosmo (Science & Tech)</option>
                      <option value="didi">👩‍🏫 Didi (Kids & School)</option>
                    </select>
                  </div>
                </div>
              );
            })}

            <div className="pt-3">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {savingSettings ? "Saving Mappings..." : "Save Category Mappings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
