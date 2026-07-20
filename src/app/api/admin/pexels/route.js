import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const page = searchParams.get("page") || 1;

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Pexels API key not configured. Add PEXELS_API_KEY to your .env file." }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&page=${page}&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Pexels API error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      photos: data.photos.map((p) => ({
        id: p.id,
        url: p.src.large, // large size for preview
        thumb: p.src.medium, // medium for thumbnail
        original: p.src.original,
        photographer: p.photographer,
        alt: p.alt,
      })),
      total_results: data.total_results,
      next_page: data.next_page,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch from Pexels" }, { status: 500 });
  }
}
