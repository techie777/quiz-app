import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const adminCheck = await requireAdmin({ masterOnly: true });
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}_${randomString}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to filesystem
    await writeFile(filepath, buffer);

    // Return the URL that can be used to access the file
    const fileUrl = `/uploads/${filename}`;
    
    // Image uploaded successfully
    
    return NextResponse.json({ 
      success: true,
      url: fileUrl,
      filename: filename 
    });

  } catch (error) {
    // Log to monitoring service in production
    return NextResponse.json({ 
      error: "Failed to upload image", 
      details: error.message 
    }, { status: 500 });
  }
}
