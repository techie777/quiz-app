import { NextResponse } from "next/server";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

const MANIFEST_PATH = join(process.cwd(), "public", "mascots", "manifest.json");

const VALID_CHARACTERS = ["sharma_sir", "coach_vikram", "filmy_raj", "dr_cosmo", "didi"];
const VALID_STATES = ["idle", "thinking", "correct", "wrong", "celebrate", "talking"];

function normalizeCharacterId(raw) {
  if (!raw) return "sharma_sir";
  const cleaned = raw.toLowerCase().trim().replace(/-/g, "_");
  if (cleaned === "sharma_sir" || cleaned === "sharmasir") return "sharma_sir";
  if (cleaned === "coach_vikram" || cleaned === "coachvikram") return "coach_vikram";
  if (cleaned === "filmy_raj" || cleaned === "filmyraj") return "filmy_raj";
  if (cleaned === "dr_cosmo" || cleaned === "drcosmo") return "dr_cosmo";
  if (cleaned === "didi") return "didi";
  return cleaned;
}

export async function POST(request) {
  try {
    const adminCheck = await requireAdmin({ masterOnly: false });
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const rawChar = formData.get("character");
    const rawState = formData.get("state");

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const character = normalizeCharacterId(rawChar);
    const state = (rawState || "").toLowerCase().trim();

    if (!VALID_CHARACTERS.includes(character)) {
      return NextResponse.json(
        { error: `Invalid character: '${rawChar}'. Allowed: ${VALID_CHARACTERS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!VALID_STATES.includes(state)) {
      return NextResponse.json(
        { error: `Invalid state: '${rawState}'. Allowed: ${VALID_STATES.join(", ")}` },
        { status: 400 }
      );
    }

    // Determine extension: prefer .webm for alpha transparency, allow .mp4
    let ext = ".webm";
    const filenameLower = (file.name || "").toLowerCase();
    if (filenameLower.endsWith(".mp4") || file.type.includes("mp4")) {
      ext = ".mp4";
    } else if (filenameLower.endsWith(".mov") || file.type.includes("quicktime")) {
      ext = ".mp4";
    }

    // Maximum file size: 25MB (ample for short 2-5 second expression loops)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Video file size must be less than 25MB" }, { status: 400 });
    }

    // Target folder: public/mascots/{character}/
    const targetDir = join(process.cwd(), "public", "mascots", character);
    await mkdir(targetDir, { recursive: true });

    const filename = `${state}${ext}`;
    const filePath = join(targetDir, filename);

    // Write file to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const publicUrl = `/mascots/${character}/${filename}`;

    // Update public/mascots/manifest.json
    try {
      let manifest = {};
      if (existsSync(MANIFEST_PATH)) {
        const raw = await readFile(MANIFEST_PATH, "utf-8");
        manifest = JSON.parse(raw);
      }

      if (!manifest[character]) {
        manifest[character] = { id: character, states: {} };
      }
      if (!manifest[character].states) {
        manifest[character].states = {};
      }
      if (!manifest[character].states[state]) {
        manifest[character].states[state] = {
          loop: state === "idle" || state === "talking",
        };
      }

      manifest[character].states[state].hasVideo = true;
      if (ext === ".webm") {
        manifest[character].states[state].webm = publicUrl;
      } else {
        manifest[character].states[state].mp4 = publicUrl;
      }
      manifest[character].states[state].videoUrl = publicUrl;

      await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
    } catch (manifestErr) {
      console.warn("Could not update manifest.json after video upload:", manifestErr);
    }

    return NextResponse.json({
      success: true,
      message: `Expression video '${state}' for ${character} uploaded successfully!`,
      character,
      state,
      fileUrl: publicUrl,
    });
  } catch (error) {
    console.error("Mascot video upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const adminCheck = await requireAdmin({ masterOnly: false });
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const rawChar = searchParams.get("character");
    const rawState = searchParams.get("state");

    const character = normalizeCharacterId(rawChar);
    const state = (rawState || "").toLowerCase().trim();

    if (!VALID_CHARACTERS.includes(character) || !VALID_STATES.includes(state)) {
      return NextResponse.json({ error: "Invalid character or state specified" }, { status: 400 });
    }

    // Delete .webm and .mp4 if they exist
    const webmPath = join(process.cwd(), "public", "mascots", character, `${state}.webm`);
    const mp4Path = join(process.cwd(), "public", "mascots", character, `${state}.mp4`);

    if (existsSync(webmPath)) {
      try { await unlink(webmPath); } catch {}
    }
    if (existsSync(mp4Path)) {
      try { await unlink(mp4Path); } catch {}
    }

    // Update manifest
    try {
      if (existsSync(MANIFEST_PATH)) {
        const raw = await readFile(MANIFEST_PATH, "utf-8");
        const manifest = JSON.parse(raw);
        if (manifest[character]?.states?.[state]) {
          manifest[character].states[state].hasVideo = false;
          delete manifest[character].states[state].videoUrl;
          await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
        }
      }
    } catch (e) {
      console.warn("Error updating manifest on delete:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Removed video for ${character} (${state}). Reverted to static poster fallback.`,
    });
  } catch (error) {
    console.error("Mascot video delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
