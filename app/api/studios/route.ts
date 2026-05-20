import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface LiveStudio {
  username: string;
  name: string;
  image: string | null;
  district: "LABEL_ROW" | "DOWNTOWN_PRIME" | "INDIE_BLOCKS";
  level: number;
  avgScore: number;
  songCount: number;
  totalSold: number;
}

const LIVE_DISTRICTS = new Set(["LABEL_ROW", "DOWNTOWN_PRIME", "INDIE_BLOCKS"]);

function isLiveStudio(entry: unknown): entry is LiveStudio {
  if (!entry || typeof entry !== "object") return false;

  const candidate = entry as Record<string, unknown>;
  return (
    typeof candidate.username === "string" &&
    typeof candidate.name === "string" &&
    LIVE_DISTRICTS.has(candidate.district as string) &&
    typeof candidate.level === "number" &&
    typeof candidate.avgScore === "number" &&
    typeof candidate.songCount === "number" &&
    typeof candidate.totalSold === "number"
  );
}

export async function GET() {
  const emsApiUrl = process.env.EMS_API_URL;
  if (!emsApiUrl) {
    return NextResponse.json({ studios: [], source: "unconfigured" });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(`${emsApiUrl}/api/city/data`, {
      next: { revalidate: 60 },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("[ems-3d] city data fetch failed:", res.status);
      return NextResponse.json({ studios: [], source: "upstream-error" });
    }

    const data = await res.json();
    const buildingEntries: unknown[] = Array.isArray(data.buildings) ? data.buildings : [];
    const studios = buildingEntries
          .filter(isLiveStudio)
          .map((entry) => ({
            username: entry.username,
            name: entry.name,
            image: typeof entry.image === "string" ? entry.image : null,
            district: entry.district,
            level: entry.level,
            avgScore: entry.avgScore,
            songCount: entry.songCount,
            totalSold: entry.totalSold,
          }));

    return NextResponse.json({ studios, source: "live" });
  } catch (err) {
    console.error("[ems-3d] city data error:", err);
    return NextResponse.json({ studios: [], source: "upstream-error" });
  } finally {
    clearTimeout(timeoutId);
  }
}
