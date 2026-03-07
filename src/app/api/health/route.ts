import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/health — Pre-flight system check
// ---------------------------------------------------------------------------

interface HealthCheck {
  service: string;
  status: "green" | "yellow" | "red";
  latency: number;
  message: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await execute("SELECT 1");
    return {
      service: "Database",
      status: "green",
      latency: Date.now() - start,
      message: "Connected",
    };
  } catch (err) {
    return {
      service: "Database",
      status: "red",
      latency: Date.now() - start,
      message: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function checkOpenClaw(): Promise<HealthCheck> {
  const url = process.env.OPENCLAW_WEBHOOK_URL;
  if (!url) {
    return {
      service: "OpenClaw Webhook",
      status: "yellow",
      latency: 0,
      message: "OPENCLAW_WEBHOOK_URL not configured",
    };
  }
  const start = Date.now();
  try {
    const resp = await fetch(url, { method: "OPTIONS" });
    return {
      service: "OpenClaw Webhook",
      status: resp.ok || resp.status === 405 ? "green" : "yellow",
      latency: Date.now() - start,
      message: `${resp.status} ${resp.statusText}`,
    };
  } catch (err) {
    return {
      service: "OpenClaw Webhook",
      status: "red",
      latency: Date.now() - start,
      message: `Unreachable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function checkGHL(): Promise<HealthCheck> {
  const key = process.env.GHL_API_KEY || process.env.GHL_TOKEN;
  if (!key) {
    return {
      service: "GoHighLevel",
      status: "yellow",
      latency: 0,
      message: "GHL_API_KEY not configured",
    };
  }
  const start = Date.now();
  try {
    const resp = await fetch("https://rest.gohighlevel.com/v1/contacts/?limit=1", {
      headers: { Authorization: `Bearer ${key}` },
    });
    return {
      service: "GoHighLevel",
      status: resp.ok ? "green" : resp.status === 401 ? "red" : "yellow",
      latency: Date.now() - start,
      message: resp.ok ? "Authenticated" : `${resp.status} ${resp.statusText}`,
    };
  } catch (err) {
    return {
      service: "GoHighLevel",
      status: "red",
      latency: Date.now() - start,
      message: `Unreachable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function checkStripe(): Promise<HealthCheck> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return {
      service: "Stripe",
      status: "yellow",
      latency: 0,
      message: "STRIPE_SECRET_KEY not configured",
    };
  }
  const start = Date.now();
  try {
    const resp = await fetch("https://api.stripe.com/v1/products?limit=1", {
      headers: { Authorization: `Bearer ${key}` },
    });
    return {
      service: "Stripe",
      status: resp.ok ? "green" : "red",
      latency: Date.now() - start,
      message: resp.ok ? "Authenticated" : `${resp.status} ${resp.statusText}`,
    };
  } catch (err) {
    return {
      service: "Stripe",
      status: "red",
      latency: Date.now() - start,
      message: `Unreachable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function checkDrive(): HealthCheck {
  const folderId = process.env.GOOGLE_DRIVE_BRAIN_FOLDER_ID;
  return {
    service: "Google Drive",
    status: folderId ? "green" : "yellow",
    latency: 0,
    message: folderId ? `Folder ID configured: ${folderId.slice(0, 8)}...` : "GOOGLE_DRIVE_BRAIN_FOLDER_ID not set",
  };
}

async function checkSelfPing(): Promise<HealthCheck> {
  const baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000";
  const start = Date.now();
  try {
    const resp = await fetch(`${baseUrl}/api/demo-status`, { method: "GET" });
    return {
      service: "Mission Control",
      status: resp.ok ? "green" : "yellow",
      latency: Date.now() - start,
      message: resp.ok ? "Self-ping OK" : `${resp.status}`,
    };
  } catch (err) {
    return {
      service: "Mission Control",
      status: "red",
      latency: Date.now() - start,
      message: `Self-ping failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkOpenClaw(),
    checkGHL(),
    checkStripe(),
    Promise.resolve(checkDrive()),
    checkSelfPing(),
  ]);

  const allGreen = checks.every((c) => c.status === "green");
  const anyRed = checks.some((c) => c.status === "red");

  return NextResponse.json({
    overall: anyRed ? "red" : allGreen ? "green" : "yellow",
    checks,
    timestamp: new Date().toISOString(),
  });
}
