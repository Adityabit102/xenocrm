"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Shield, Key, Camera, Loader2, Check } from "lucide-react";

export default function ProfilePage() {
    const { data: session } = useSession();
    const userName = session?.user?.name || "Demo Marketer";
    const userEmail = session?.user?.email || "demo@xenocrm.com";
    const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [uploadSuccess, setUploadSuccess] = React.useState(false);
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        /* Preview immediately */
        const reader = new FileReader();
        reader.onload = () => setAvatarUrl(reader.result as string);
        reader.readAsDataURL(file);

        /* Upload */
        setUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        try {
            const formData = new FormData();
            formData.append("avatar", file);

            const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) {
                setUploadError(data.error || "Upload failed.");
                setAvatarUrl(null);
            } else {
                setAvatarUrl(data.avatarUrl + `?t=${Date.now()}`);
                setUploadSuccess(true);
                setTimeout(() => setUploadSuccess(false), 2500);
            }
        } catch {
            setUploadError("Network error. Please try again.");
            setAvatarUrl(null);
        } finally {
            setUploading(false);
            /* Reset input so same file can be re-selected */
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const inputStyle: React.CSSProperties = {
        padding: "10px 14px", background: "rgba(255,255,255,0.03)",
        border: "1px solid #1A2035", borderRadius: 8,
        fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#EDF0FF",
    };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 0" }}>

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#EDF0FF", margin: 0 }}>
                    My Profile
                </h1>
                <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#7B82A0", marginTop: 6 }}>
                    Manage your personal information and account preferences.
                </p>
            </div>

            {/* Avatar Card */}
            <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 16, padding: "28px 32px", marginBottom: 20, display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />

                    {/* Avatar circle */}
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(91,95,239,0.2)", border: "2px solid rgba(192,193,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#c0c1ff", overflow: "hidden", position: "relative" }}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            userInitials
                        )}
                        {uploading && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Loader2 style={{ width: 20, height: 20, color: "#c0c1ff", animation: "spin 1s linear infinite" }} />
                            </div>
                        )}
                    </div>

                    {/* Camera button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: uploadSuccess ? "#00e293" : "#5B5FEF", border: "2px solid #13151F", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer", transition: "background 0.2s" }}
                        title="Upload profile photo"
                    >
                        {uploadSuccess
                            ? <Check style={{ width: 11, height: 11, color: "#003921" }} />
                            : <Camera style={{ width: 11, height: 11, color: "#fff" }} />}
                    </button>
                </div>

                <div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#EDF0FF" }}>
                        {userName}
                    </div>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: "#7B82A0", marginTop: 4 }}>
                        {userEmail}
                    </div>
                    <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: "rgba(0,226,147,0.08)", border: "1px solid rgba(0,226,147,0.2)" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e293" }} />
                        <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#00e293", fontWeight: 600 }}>Active Account</span>
                    </div>

                    {/* Upload feedback */}
                    {uploadError && (
                        <div style={{ marginTop: 8, fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#FF4D6A" }}>
                            ⛔ {uploadError}
                        </div>
                    )}
                    {uploadSuccess && (
                        <div style={{ marginTop: 8, fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#00e293" }}>
                            ✓ Profile photo updated!
                        </div>
                    )}
                    {!uploadError && !uploadSuccess && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{ display: "block", marginTop: 8, background: "none", border: "none", color: "#7B82A0", fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: 2 }}
                        >
                            {uploading ? "Uploading..." : "Change profile photo"}
                        </button>
                    )}
                </div>
            </div>

            {/* Personal Information */}
            <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 16, padding: "28px 32px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                    <User style={{ width: 16, height: 16, color: "#5B5FEF" }} />
                    <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#EDF0FF" }}>Personal Information</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {[
                        { label: "First Name", value: userName.split(" ")[0] },
                        { label: "Last Name", value: userName.split(" ")[1] || "" },
                        { label: "Email Address", value: userEmail },
                        { label: "Role", value: "Marketing Manager" },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {label}
                            </div>
                            <div style={inputStyle}>{value || "—"}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security */}
            <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 16, padding: "28px 32px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                    <Shield style={{ width: 16, height: 16, color: "#5B5FEF" }} />
                    <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#EDF0FF" }}>Security</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                        { label: "Password", value: "••••••••••••", icon: Key },
                        { label: "Two-Factor Authentication", value: "Not enabled", icon: Shield },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid #1A2035", borderRadius: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <Icon style={{ width: 15, height: 15, color: "#7B82A0" }} />
                                <div>
                                    <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#EDF0FF", fontWeight: 600 }}>{label}</div>
                                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.68rem", color: "#7B82A0", marginTop: 2 }}>{value}</div>
                                </div>
                            </div>
                            <button style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(91,95,239,0.12)", border: "1px solid rgba(91,95,239,0.25)", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#c0c1ff", cursor: "pointer", fontWeight: 600 }}>
                                Update
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Email Preferences */}
            <div style={{ background: "#13151F", border: "1px solid #1A2035", borderRadius: 16, padding: "28px 32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                    <Mail style={{ width: 16, height: 16, color: "#5B5FEF" }} />
                    <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#EDF0FF" }}>Email Preferences</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                        { label: "Campaign completion alerts", enabled: true },
                        { label: "Weekly performance digest", enabled: true },
                        { label: "System maintenance notices", enabled: false },
                        { label: "New feature announcements", enabled: true },
                    ].map(({ label, enabled }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#c6c5d7" }}>{label}</span>
                            <div style={{ width: 36, height: 20, borderRadius: 10, background: enabled ? "rgba(0,226,147,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${enabled ? "rgba(0,226,147,0.3)" : "#1A2035"}`, display: "flex", alignItems: "center", padding: "0 3px", cursor: "pointer", justifyContent: enabled ? "flex-end" : "flex-start" }}>
                                <div style={{ width: 14, height: 14, borderRadius: "50%", background: enabled ? "#00e293" : "#7B82A0" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}