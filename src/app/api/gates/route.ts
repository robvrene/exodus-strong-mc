import { NextResponse } from "next/server";
import { getGates } from "@/lib/notion";

export const revalidate = 900;

export async function GET() {
  try {
    const gates = await getGates();
    return NextResponse.json(gates, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
