import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MANIFEST_PATH = join(process.cwd(), "public", "mascots", "manifest.json");

const CHARACTERS_META = [
  {
    id: "sharma_sir",
    slug: "sharma-sir",
    name: "Sharma Sir",
    nameHi: "शर्मा सर",
    subject: "इतिहास & राजनीति",
    tagline: "इतिहास और संविधान के पक्के गुरु",
    color: "#2F4B7C",
    icon: "👨‍🏫",
  },
  {
    id: "coach_vikram",
    slug: "coach-vikram",
    name: "Coach Vikram",
    nameHi: "कोच विक्रम",
    subject: "मॉक टेस्ट & खेल",
    tagline: "स्पीड और एक्यूरेसी के उस्ताद",
    color: "#D85A30",
    icon: "🏃",
  },
  {
    id: "filmy_raj",
    slug: "filmy-raj",
    name: "Filmy Raj",
    nameHi: "फिल्मी राज",
    subject: "मनोरंजन & सिनेमा",
    tagline: "फिल्मी ज्ञान के सुपरस्टार",
    color: "#B83280",
    icon: "🎬",
  },
  {
    id: "dr_cosmo",
    slug: "dr-cosmo",
    name: "Dr Cosmo",
    nameHi: "डॉ. कॉस्मो",
    subject: "विज्ञान & स्पेस",
    tagline: "तथ्यों और प्रयोगों के वैज्ञानिक",
    color: "#10B981",
    icon: "🔬",
  },
  {
    id: "didi",
    slug: "didi",
    name: "Didi",
    nameHi: "दीदी",
    subject: "बाल ज्ञान & सामान्य अध्ययन",
    tagline: "सरल और रोचक ज्ञान मार्गदर्शक",
    color: "#1D9E75",
    icon: "👩‍🏫",
  },
];

const STATES = ["idle", "thinking", "correct", "wrong", "celebrate", "talking"];

export async function GET() {
  try {
    const adminCheck = await requireAdmin({ masterOnly: false });
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    // Read manifest.json
    let manifest = {};
    if (existsSync(MANIFEST_PATH)) {
      try {
        const raw = await readFile(MANIFEST_PATH, "utf-8");
        manifest = JSON.parse(raw);
      } catch (e) {
        console.error("Error reading manifest.json:", e);
      }
    }

    // Fetch mascot settings from database
    let mascotSettings = {
      mascotsEnabled: true,
      mascotSpeechDefault: true,
      mascotVideoPreference: "auto",
      mascotCategoryMappings: {
        science: "dr_cosmo",
        bollywood: "filmy_raj",
        sports: "coach_vikram",
        kids: "didi",
        polity: "sharma_sir",
        history: "sharma_sir",
        default: "sharma_sir",
      },
    };

    try {
      const settingKeys = [
        "mascotsEnabled",
        "mascotSpeechDefault",
        "mascotVideoPreference",
        "mascotCategoryMappings",
      ];
      const rows = await prisma.setting.findMany({
        where: { key: { in: settingKeys } },
      });
      rows.forEach((r) => {
        if (r.key === "mascotsEnabled") mascotSettings.mascotsEnabled = r.value !== "false";
        if (r.key === "mascotSpeechDefault") mascotSettings.mascotSpeechDefault = r.value !== "false";
        if (r.key === "mascotVideoPreference") mascotSettings.mascotVideoPreference = r.value || "auto";
        if (r.key === "mascotCategoryMappings") {
          try {
            mascotSettings.mascotCategoryMappings = JSON.parse(r.value);
          } catch {}
        }
      });
    } catch (e) {
      console.warn("Could not query DB settings for mascots, using defaults:", e.message);
    }

    // Analyze status for each character and state
    let totalExpressions = 0;
    let uploadedVideos = 0;
    let staticPosters = 0;

    const characters = CHARACTERS_META.map((meta) => {
      const charManifest = manifest[meta.id] || manifest[meta.slug] || {};
      const charStates = charManifest.states || {};

      const statesData = {};
      STATES.forEach((stateName) => {
        totalExpressions++;
        const stateConfig = charStates[stateName] || {};

        // Check if actual video file exists on disk
        const webmDiskPath = join(process.cwd(), "public", "mascots", meta.id, `${stateName}.webm`);
        const mp4DiskPath = join(process.cwd(), "public", "mascots", meta.id, `${stateName}.mp4`);
        const posterDiskPath = join(process.cwd(), "public", "mascots", meta.id, `${stateName}.webp`);

        const hasWebm = existsSync(webmDiskPath);
        const hasMp4 = existsSync(mp4DiskPath);
        const hasVideo = hasWebm || hasMp4 || stateConfig.hasVideo === true;

        if (hasVideo) {
          uploadedVideos++;
        } else {
          staticPosters++;
        }

        statesData[stateName] = {
          name: stateName,
          hasVideo,
          videoUrl: hasWebm
            ? `/mascots/${meta.id}/${stateName}.webm`
            : hasMp4
            ? `/mascots/${meta.id}/${stateName}.mp4`
            : stateConfig.webm || null,
          posterUrl: existsSync(posterDiskPath)
            ? `/mascots/${meta.id}/${stateName}.webp`
            : stateConfig.poster || `/assets/characters/${meta.slug}/idle.webp`,
          loop: stateName === "idle" || stateName === "talking",
        };
      });

      return {
        ...meta,
        states: statesData,
      };
    });

    return NextResponse.json({
      success: true,
      settings: mascotSettings,
      characters,
      stats: {
        totalCharacters: CHARACTERS_META.length,
        totalExpressions,
        uploadedVideos,
        staticPosters,
        videoCompletionPercent: Math.round((uploadedVideos / totalExpressions) * 100),
      },
    });
  } catch (error) {
    console.error("Admin Mascot GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminCheck = await requireAdmin({ masterOnly: false });
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const { mascotsEnabled, mascotSpeechDefault, mascotVideoPreference, mascotCategoryMappings } = body;

    const updates = [];
    if (mascotsEnabled !== undefined) {
      updates.push({ key: "mascotsEnabled", value: String(mascotsEnabled) });
    }
    if (mascotSpeechDefault !== undefined) {
      updates.push({ key: "mascotSpeechDefault", value: String(mascotSpeechDefault) });
    }
    if (mascotVideoPreference !== undefined) {
      updates.push({ key: "mascotVideoPreference", value: String(mascotVideoPreference) });
    }
    if (mascotCategoryMappings !== undefined) {
      updates.push({
        key: "mascotCategoryMappings",
        value: typeof mascotCategoryMappings === "object" ? JSON.stringify(mascotCategoryMappings) : mascotCategoryMappings,
      });
    }

    for (const item of updates) {
      const existing = await prisma.setting.findUnique({ where: { key: item.key } });
      if (existing) {
        await prisma.setting.update({ where: { key: item.key }, data: { value: item.value } });
      } else {
        await prisma.setting.create({ data: { key: item.key, value: item.value } });
      }
    }

    return NextResponse.json({ success: true, message: "Mascot settings saved successfully" });
  } catch (error) {
    console.error("Admin Mascot POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
