"use client";

import { useState, useEffect } from "react";

interface BusinessData {
  name: string;
  niche: string;
  targetAudience: string;
  mainOffer: string;
}

export default function BusinessSetup() {
  const [business, setBusiness] = useState<BusinessData>({
    name: "",
    niche: "",
    targetAudience: "",
    mainOffer: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current business data
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await fetch("/api/demo");
        if (res.ok) {
          const data = await res.json();
          if (data.business?.name) {
            setBusiness({
              name: data.business.name || "",
              niche: data.business.niche || "",
              targetAudience: data.business.targetAudience || "",
              mainOffer: data.business.mainOffer || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch business data:", error);
      }
    };
    fetchBusiness();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_business",
          data: business,
        }),
      });
    } catch (error) {
      console.error("Failed to save business data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B0F19",
      padding: 24,
    }}>
      <div style={{
        maxWidth: 600,
        margin: "0 auto",
      }}>
        <div style={{
          marginBottom: 32,
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: 2,
            color: "#8A8F98",
            fontFamily: "'Orbitron', monospace",
            marginBottom: 8,
          }}>
            CONFIGURATION
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#F5F7FA",
            margin: 0,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            Business Setup
          </h1>
        </div>

        <div style={{
          background: "linear-gradient(180deg, #111624 0%, #0D1117 100%)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 24,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#8A8F98",
                marginBottom: 8,
              }}>
                Business Name
              </label>
              <input
                type="text"
                value={business.name}
                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                placeholder="e.g., Viral Growth Agency"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#F5F7FA",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#8A8F98",
                marginBottom: 8,
              }}>
                Niche / Industry
              </label>
              <input
                type="text"
                value={business.niche}
                onChange={(e) => setBusiness({ ...business, niche: e.target.value })}
                placeholder="e.g., Digital Marketing"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#F5F7FA",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#8A8F98",
                marginBottom: 8,
              }}>
                Target Audience
              </label>
              <input
                type="text"
                value={business.targetAudience}
                onChange={(e) => setBusiness({ ...business, targetAudience: e.target.value })}
                placeholder="e.g., SaaS founders doing $1M+ ARR"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#F5F7FA",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#8A8F98",
                marginBottom: 8,
              }}>
                Main Offer
              </label>
              <textarea
                value={business.mainOffer}
                onChange={(e) => setBusiness({ ...business, mainOffer: e.target.value })}
                placeholder="Describe your main offer..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#F5F7FA",
                  fontSize: 14,
                  resize: "none",
                }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: "14px 24px",
                background: "linear-gradient(135deg, #2F80FF, #7B61FF)",
                borderRadius: 8,
                border: "none",
                color: "#FFF",
                fontSize: 14,
                fontWeight: 600,
                cursor: isSaving ? "wait" : "pointer",
                marginTop: 8,
              }}
            >
              {isSaving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
