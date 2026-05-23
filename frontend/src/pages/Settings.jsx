import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Bell,
  Camera,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Shield,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import AppInnerLayout from "@/components/AppInnerLayout";
import { useToast } from "@/hooks/use-toast";
import { useLogout, useRevokeSessions, useUpdatePassword, useUpdateProfile, useUser } from "@/hooks/use-auth";

const SECTIONS = [
  { id: "profile", label: "Profile", description: "Identity, email, bio, and avatar", Icon: User, accent: "from-cyan-400 to-sky-500" },
  { id: "notifications", label: "Notifications", description: "Travel alerts and product updates", Icon: Bell, accent: "from-amber-300 to-yellow-500" },
  { id: "security", label: "Security", description: "Password and active sessions", Icon: Shield, accent: "from-violet-400 to-fuchsia-500" },
];

const NOTIFICATION_ITEMS = [
  { key: "trips", title: "Trip updates", description: "Receive alerts about saved itineraries and plan changes." },
  { key: "tips", title: "AI travel tips", description: "Get personalized destination suggestions and planning ideas." },
  { key: "newsletter", title: "Newsletter", description: "Monthly travel inspiration and destination stories." },
  { key: "updates", title: "Product updates", description: "New features, improvements, and account notices." },
];

function SectionButton({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
        active
          ? "border-cyan-400/35 bg-white/10 shadow-[0_16px_40px_rgba(6,182,212,0.12)]"
          : "border-white/8 bg-white/[0.025] hover:border-white/16 hover:bg-white/[0.05]"
      }`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} shadow-lg`}>
        <item.Icon className="h-4 w-4 text-slate-950" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-black ${active ? "text-white" : "text-white/78"}`}>{item.label}</p>
        <p className="mt-0.5 text-xs text-white/42">{item.description}</p>
      </div>
      <ChevronRight className={`h-4 w-4 transition-transform ${active ? "translate-x-0 text-cyan-300" : "text-white/30 group-hover:translate-x-0.5"}`} />
    </button>
  );
}

function ToggleRow({ title, description, checked, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/45">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-7 w-14 shrink-0 rounded-full border transition-all ${
          checked ? "border-cyan-300/30 bg-cyan-400" : "border-white/12 bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg transition-all ${
            checked ? "left-8" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { data: user, isLoading } = useUser();
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const revokeSessions = useRevokeSessions();
  const logout = useLogout();
  const { toast } = useToast();
  const [, nav] = useLocation();
  const fileInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState("profile");
  const [form, setForm] = useState({ username: "", email: "", bio: "", profilePicture: "" });
  const [notifications, setNotifications] = useState({
    trips: true,
    tips: false,
    newsletter: true,
    updates: true,
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) nav("/auth");
  }, [isLoading, nav, user]);

  useEffect(() => {
    if (!user) return;
    setForm({
      username: user.username || "",
      email: user.email || "",
      bio: user.preferences?.bio || "",
      profilePicture: user.profilePicture || "",
    });
    setNotifications({
      trips: user.preferences?.notifications?.trips ?? true,
      tips: user.preferences?.notifications?.tips ?? false,
      newsletter: user.preferences?.notifications?.newsletter ?? true,
      updates: user.preferences?.notifications?.updates ?? true,
    });
  }, [user]);

  const accountName = useMemo(() => user?.username || "Traveller", [user]);
  const isProfileSaving = updateProfile.isPending || avatarBusy;

  const persistProfile = async (payload, successTitle, successDescription) => {
    try {
      await updateProfile.mutateAsync(payload);
      setProfileSaved(true);
      toast({ title: successTitle, description: successDescription, variant: "success" });
      window.setTimeout(() => setProfileSaved(false), 1800);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.message || "We couldn't save your account changes.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleProfileSave = async () => {
    if (!form.username.trim() || !form.email.trim()) {
      toast({
        title: "Missing details",
        description: "Display name and email are required.",
        variant: "destructive",
      });
      return;
    }

    await persistProfile(
      {
        username: form.username.trim(),
        email: form.email.trim(),
        profilePicture: form.profilePicture || "",
        preferences: {
          ...(user?.preferences || {}),
          bio: form.bio.trim(),
          notifications,
        },
      },
      "Profile updated",
      "Your account details are now synced with the backend."
    );
  };

  const handleNotificationsSave = async () => {
    await persistProfile(
      {
        username: form.username.trim() || user?.username || "",
        email: form.email.trim() || user?.email || "",
        profilePicture: form.profilePicture || "",
        preferences: {
          ...(user?.preferences || {}),
          bio: form.bio.trim(),
          notifications,
        },
      },
      "Preferences saved",
      "Notification settings have been updated."
    );
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image file.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please upload an image under 3 MB.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    setAvatarBusy(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result);
        reader.onerror = () => reject(new Error("Unable to read the selected image."));
        reader.readAsDataURL(file);
      });

      if (typeof dataUrl !== "string") {
        throw new Error("Invalid image data.");
      }

      setForm((prev) => ({ ...prev, profilePicture: dataUrl }));
      await persistProfile(
        {
          username: form.username.trim() || user?.username || "",
          email: form.email.trim() || user?.email || "",
          profilePicture: dataUrl,
          preferences: {
            ...(user?.preferences || {}),
            bio: form.bio.trim(),
            notifications,
          },
        },
        "Profile photo updated",
        "Your new profile image is now live across the website."
      );
    } catch (error) {
      toast({ title: "Upload failed", description: error.message || "Could not update your profile image.", variant: "destructive" });
    } finally {
      setAvatarBusy(false);
      event.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true);
    try {
      setForm((prev) => ({ ...prev, profilePicture: "" }));
      await persistProfile(
        {
          username: form.username.trim() || user?.username || "",
          email: form.email.trim() || user?.email || "",
          profilePicture: "",
          preferences: {
            ...(user?.preferences || {}),
            bio: form.bio.trim(),
            notifications,
          },
        },
        "Profile photo removed",
        "Your account avatar has been cleared."
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      toast({ title: "Missing fields", description: "Please complete all password fields.", variant: "destructive" });
      return;
    }
    if (passwords.next.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast({ title: "Passwords do not match", description: "Re-enter the new password correctly.", variant: "destructive" });
      return;
    }

    try {
      await updatePassword.mutateAsync({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      toast({ title: "Password updated", description: "Your new password is active now.", variant: "success" });
    } catch (error) {
      toast({ title: "Password update failed", description: error.message || "Could not change your password.", variant: "destructive" });
    }
  };

  const handleRevokeSessions = async () => {
    try {
      await revokeSessions.mutateAsync();
      toast({ title: "Sessions revoked", description: "All other active sessions have been signed out.", variant: "success" });
    } catch (error) {
      toast({ title: "Action failed", description: error.message || "Could not revoke other sessions.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      nav("/auth");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111c]">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          Loading account center...
        </div>
      </div>
    );
  }

  return (
    <AppInnerLayout>
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_bottom,rgba(250,204,21,0.08),transparent_26%),linear-gradient(180deg,#07111d_0%,#091726_52%,#08121d_100%)]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-400/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Account Center
          </div>
          <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-black tracking-[-0.06em] text-white">Settings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">
            Manage your identity, preferences, profile image, security, and account session controls in one fully connected place.
          </p>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,31,0.86),rgba(8,14,24,0.92))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
          >
            <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
              <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-500 shadow-[0_18px_40px_rgba(34,211,238,0.22)]">
                {form.profilePicture ? (
                  <img
                    src={form.profilePicture}
                    alt={accountName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-slate-950">
                    {accountName.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarBusy}
                  className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 text-white transition hover:bg-slate-900"
                >
                  {avatarBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-black tracking-tight text-white">{accountName}</h2>
                <p className="mt-1 break-all text-sm text-white/45">{user.email}</p>
              </div>

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/18 bg-cyan-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-400/16 disabled:opacity-60"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarBusy || !form.profilePicture}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/60 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Remove Photo
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {SECTIONS.map((item) => (
                <SectionButton
                  key={item.id}
                  item={item}
                  active={activeSection === item.id}
                  onClick={() => setActiveSection(item.id)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/18 bg-red-500/8 px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/14"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,31,0.86),rgba(8,14,24,0.94))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-7"
          >
            {activeSection === "profile" && (
              <div className="space-y-7">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200/72">Profile</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Identity & presentation</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/46">
                    Update the account details shown across your dashboard, saved trips, and navigation profile areas.
                  </p>
                </div>

                <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-white/38">Display Name</label>
                      <input
                        value={form.username}
                        onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/45 focus:bg-white/[0.06]"
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-white/38">Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/45 focus:bg-white/[0.06]"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-white/38">Bio</label>
                      <textarea
                        rows={5}
                        value={form.bio}
                        onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition focus:border-cyan-300/45 focus:bg-white/[0.06]"
                        placeholder="Tell Rihla AI a little about your travel style..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleProfileSave}
                        disabled={isProfileSaving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-110 disabled:opacity-60"
                      >
                        {isProfileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : profileSaved ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        {isProfileSaving ? "Saving..." : profileSaved ? "Saved" : "Save Changes"}
                      </button>
                    </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-7">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-200/72">Notifications</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Preference controls</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/46">
                    Choose what Rihla AI should send to your account experience and keep the preferences stored in your backend profile.
                  </p>
                </div>

                <div className="grid gap-4">
                  {NOTIFICATION_ITEMS.map((item) => (
                    <ToggleRow
                      key={item.key}
                      title={item.title}
                      description={item.description}
                      checked={notifications[item.key]}
                      onToggle={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleNotificationsSave}
                  disabled={updateProfile.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-500 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-110 disabled:opacity-60"
                >
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  Save Preferences
                </button>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-7">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-200/72">Security</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Password & sessions</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/46">
                    Update your password and revoke other active sessions using the real backend account APIs.
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                  <div className="grid gap-4">
                    {[
                      { key: "current", label: "Current Password" },
                      { key: "next", label: "New Password" },
                      { key: "confirm", label: "Confirm New Password" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-white/38">{field.label}</label>
                        <div className="relative">
                          <input
                            type={showPasswords[field.key] ? "text" : "password"}
                            value={passwords[field.key]}
                            onChange={(e) => setPasswords((prev) => ({ ...prev, [field.key]: e.target.value }))}
                            className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 pr-12 text-sm font-semibold text-white outline-none transition focus:border-violet-300/45 focus:bg-white/[0.06]"
                            placeholder={field.label}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/75"
                          >
                            {showPasswords[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handlePasswordUpdate}
                      disabled={updatePassword.isPending}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-400 to-fuchsia-500 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:brightness-110 disabled:opacity-60"
                    >
                      {updatePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={handleRevokeSessions}
                      disabled={revokeSessions.isPending}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
                    >
                      {revokeSessions.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                      Revoke Other Sessions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </AppInnerLayout>
  );
}
