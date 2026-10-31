import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Star, BadgeCheck, ThumbsUp, Flag, MessageSquare, ImagePlus, X, Ruler, Wind, MoveHorizontal,
  WashingMachine, Truck, Shirt, ShieldCheck, ChevronDown, Send, Trash2, Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ---------- Types ---------- */
export type Fit = "small" | "true" | "large";
export type Level = "good" | "bad";
type Reply = { id: string; author: string; authorId?: string; isAdmin: boolean; text: string; date: string };
export type Review = {
  id: string;
  name: string;
  authorId?: string;
  verified: boolean;
  rating: number;
  date: string;
  title?: string;
  comment?: string;
  helpful: number;
  images: string[];
  fit?: Fit;
  fabric: { breathability?: number; stretch?: number; durability?: number };
  bio: { height?: string; weight?: string; size?: string };
  material?: Level;
  color?: Level;
  shipper: string[];
  replies: Reply[];
  /** Shop-admin announcement: no rating, never counted in scores. */
  announcement?: boolean;
};

const FIT_LABEL: Record<Fit, string> = { small: "Too Small", true: "True to Size", large: "Too Large" };
const SHIPPER_TAGS = [
  "Friendly", "Professional", "Meticulous", "Shipped quickly", "Product not damaged", "Well packaged", "On-time delivery",
];
const REPORT_REASONS = [
  { id: "spam", label: "Spam or advertising" },
  { id: "fake", label: "Fake or misleading review" },
  { id: "language", label: "Inappropriate or offensive language" },
  { id: "offtopic", label: "Not about this product" },
  { id: "personal", label: "Contains personal information" },
  { id: "images", label: "Inappropriate images" },
  { id: "competitor", label: "Competitor promotion" },
  { id: "other", label: "Other" },
];

const SEED: Review[] = [
  {
    id: "r1", name: "Minh Anh", verified: true, rating: 5, date: "2026-10-22",
    title: "Perfect for long runs", comment: "Super light and dries in minutes. Wore it for a 21k and no chafing at all.",
    helpful: 14, images: [], fit: "true", fabric: { breathability: 5, stretch: 4, durability: 5 },
    bio: { height: "172", weight: "64", size: "M" }, material: "good", color: "good",
    shipper: ["Friendly", "Shipped quickly", "Product not damaged"],
    replies: [{ id: "x1", author: "Store Team", isAdmin: true, text: "Thanks for running with us! 🏃", date: "2026-10-23" }],
  },
  {
    id: "r2", name: "Daniel K.", verified: true, rating: 4, date: "2026-10-15",
    title: "Runs a bit small", comment: "Great fabric but I'd size up if you're between sizes.",
    helpful: 9, images: [], fit: "small", fabric: { breathability: 4, stretch: 3, durability: 4 },
    bio: { height: "183", weight: "80", size: "L" }, material: "good", color: "good",
    shipper: ["Professional"], replies: [],
  },
  {
    id: "r3", name: "Thu Trang", verified: false, rating: 3, date: "2026-09-30",
    helpful: 2, images: [], fit: "large", fabric: {}, bio: { size: "S" }, color: "bad", shipper: [], replies: [],
  },
];

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ---------- Small pieces ---------- */
function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-star text-star" : "text-border fill-border"} />
      ))}
    </div>
  );
}

function StarInput({ value, onChange, size = 28, label }: { value: number; onChange: (v: number) => void; size?: number; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} aria-label={`${i} star`} onMouseEnter={() => setHover(i)}
          onClick={() => onChange(value === i && size < 24 ? 0 : i)} className="transition-transform hover:scale-110">
          <Star style={{ width: size, height: size }}
            className={i <= (hover || value) ? "fill-star text-star" : "fill-transparent text-input"} />
        </button>
      ))}
    </div>
  );
}

function Segmented<T extends string>({ options, value, onChange }: { options: { v: T; l: string }[]; value: T | undefined; onChange: (v: T | undefined) => void }) {
  return (
    <div className="inline-flex w-full rounded-md border border-input bg-muted p-1">
      {options.map((o) => (
        <button type="button" key={o.v} onClick={() => onChange(value === o.v ? undefined : o.v)}
          className={cn("flex-1 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
            value === o.v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      tone === "good" && "border-success/30 bg-success/10 text-success",
      tone === "bad" && "border-destructive/30 bg-destructive/10 text-destructive",
      tone === "neutral" && "border-border bg-muted text-foreground")}>
      {children}
    </span>
  );
}

function SectionLabel({ icon, children, hint }: { icon?: ReactNode; children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
      {icon}{children}{hint && <span className="font-normal normal-case tracking-normal text-muted-foreground">{hint}</span>}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20";

function FitScale({ fit }: { fit: Fit }) {
  const pos = ({ small: "0%", true: "50%", large: "100%" } as Record<Fit, string>)[fit];
  return (
    <div className="w-full max-w-xs">
      <div className="relative h-1.5 rounded-full bg-accent">
        <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow" style={{ left: pos }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>Small</span><span>True</span><span>Large</span>
      </div>
    </div>
  );
}

/* ---------- Summary ---------- */
function Summary({ reviews: all, onWrite, writeLabel, filter, setFilter }: { reviews: Review[]; onWrite: () => void; writeLabel?: string | undefined; filter: number; setFilter: (n: number) => void }) {
  const reviews = all.filter((r) => !r.announcement);
  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const counts = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => r.rating === s).length);
  const fitVotes = reviews.filter((r) => r.fit);
  const fitPct = (f: Fit) => (fitVotes.length ? Math.round((fitVotes.filter((r) => r.fit === f).length / fitVotes.length) * 100) : 0);
  const fitTop = (["small", "true", "large"] as Fit[]).reduce((a, b) => (fitPct(b) > fitPct(a) ? b : a), "true" as Fit);

  return (
    <div className="grid gap-8 rounded-xl border border-border bg-card p-6 md:grid-cols-[220px_1fr_260px] md:p-8">
      <div>
        <div className="font-display text-6xl font-extrabold leading-none tracking-tight">{avg.toFixed(1)}</div>
        <div className="mt-2"><Stars value={avg} size={18} /></div>
        <p className="mt-2 text-sm text-muted-foreground">Based on {total} review{total !== 1 && "s"}</p>
        <button onClick={onWrite} className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground transition hover:opacity-90">
          {writeLabel ?? "Write a review"}
        </button>
      </div>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((s, i) => {
          const pct = total ? Math.round(((counts[i] ?? 0) / total) * 100) : 0;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? 0 : s)}
              className={cn("flex w-full items-center gap-3 rounded px-1 py-0.5 text-sm transition hover:bg-muted", filter === s && "bg-muted")}>
              <span className="w-6 font-semibold">{s}★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-accent">
                <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-10 text-right text-muted-foreground">{pct}%</span>
            </button>
          );
        })}
      </div>
      <div className="md:border-l md:border-border md:pl-8">
        <SectionLabel icon={<Ruler className="h-3.5 w-3.5" />}>How it fits</SectionLabel>
        {fitVotes.length ? (
          <>
            <p className="font-display text-2xl font-bold uppercase">{FIT_LABEL[fitTop]}</p>
            <p className="mb-3 text-xs text-muted-foreground">{fitVotes.length} fit vote{fitVotes.length !== 1 && "s"}</p>
            <div className="space-y-1.5">
              {(["small", "true", "large"] as Fit[]).map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground">{FIT_LABEL[f]}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
                    <span className="block h-full bg-primary" style={{ width: `${fitPct(f)}%` }} />
                  </span>
                  <span className="w-8 text-right font-medium">{fitPct(f)}%</span>
                </div>
              ))}
            </div>
          </>
        ) : <p className="text-sm text-muted-foreground">No fit feedback yet.</p>}
      </div>
    </div>
  );
}

/* ---------- Form ---------- */
type FormState = Omit<Review, "id" | "date" | "helpful" | "replies" | "verified" | "authorId">;
const emptyForm = (): FormState => ({ name: "", rating: 0, title: "", comment: "", images: [], fabric: {}, bio: {}, shipper: [] });

function ReviewForm({ onSubmit, onCancel, signedInName, defaultName = "" }: { onSubmit: (f: FormState) => void; onCancel: () => void; signedInName?: string | undefined; defaultName?: string }) {
  const [f, setF] = useState<FormState>(() => ({ ...emptyForm(), name: defaultName }));
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const imgs = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (imgs.length < files.length) toast.error("Only images are allowed — videos and other files were skipped.");
    const room = 6 - f.images.length;
    if (imgs.length > room) toast.error("You can attach up to 6 photos.");
    imgs.slice(0, room).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setF((p) => ({ ...p, images: [...p.images, reader.result as string].slice(0, 6) }));
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.rating) return setErr("Please select an overall star rating.");
    onSubmit(f);
  };

  const fabricRows: { k: keyof Review["fabric"]; l: string; icon: ReactNode }[] = [
    { k: "breathability", l: "Breathability", icon: <Wind className="h-4 w-4" /> },
    { k: "stretch", l: "Stretchability", icon: <MoveHorizontal className="h-4 w-4" /> },
    { k: "durability", l: "Durability after washing", icon: <WashingMachine className="h-4 w-4" /> },
  ];
  const materialOpts: { v: Level; l: string }[] = [{ v: "good", l: "High quality" }, { v: "bad", l: "Low quality" }];
  const colorOpts: { v: Level; l: string }[] = [{ v: "good", l: "Accurate" }, { v: "bad", l: "Not as pictured" }];

  return (
    <form onSubmit={submit} className="space-y-7 rounded-xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide">Write a review</h3>
          <p className="text-sm text-muted-foreground">Only the star rating is required. Everything else helps other athletes choose.</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close" className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
      </div>

      <div>
        <SectionLabel>Overall rating <span className="text-destructive">*</span></SectionLabel>
        <StarInput value={f.rating} onChange={(v) => { set("rating", v); setErr(""); }} label="Overall rating" />
        {err && <p className="mt-1 text-sm text-destructive">{err}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionLabel icon={<Ruler className="h-3.5 w-3.5" />} hint="(optional)">Fit</SectionLabel>
          <Segmented<Fit> options={[{ v: "small" as Fit, l: "Too Small" }, { v: "true" as Fit, l: "True to Size" }, { v: "large" as Fit, l: "Too Large" }]}
            value={f.fit} onChange={(v) => set("fit", v)} />
        </div>
        <div>
          <SectionLabel icon={<Shirt className="h-3.5 w-3.5" />} hint="(optional)">Your stats</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            <input className={inputCls} inputMode="numeric" placeholder="Height cm" value={f.bio.height ?? ""} onChange={(e) => set("bio", { ...f.bio, height: e.target.value.replace(/[^\d.]/g, "") })} />
            <input className={inputCls} inputMode="numeric" placeholder="Weight kg" value={f.bio.weight ?? ""} onChange={(e) => set("bio", { ...f.bio, weight: e.target.value.replace(/[^\d.]/g, "") })} />
            <input className={inputCls} placeholder="Size e.g. M" value={f.bio.size ?? ""} onChange={(e) => set("bio", { ...f.bio, size: e.target.value })} />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel hint="(optional — tap again to clear)">Fabric performance</SectionLabel>
        <div className="divide-y divide-border rounded-md border border-border">
          {fabricRows.map((r) => (
            <div key={r.k} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm">{r.icon}{r.l}</span>
              <StarInput size={20} label={r.l} value={f.fabric[r.k] ?? 0} onChange={(v) => set("fabric", { ...f.fabric, [r.k]: v || undefined })} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionLabel hint="(optional)">Material quality</SectionLabel>
          <Segmented<Level> options={materialOpts} value={f.material} onChange={(v) => set("material", v)} />
        </div>
        <div>
          <SectionLabel hint="(optional)">Color vs. photos</SectionLabel>
          <Segmented<Level> options={colorOpts} value={f.color} onChange={(v) => set("color", v)} />
        </div>
      </div>

      <div>
        <SectionLabel icon={<Truck className="h-3.5 w-3.5" />} hint="(optional)">Shipper & delivery</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {SHIPPER_TAGS.map((t) => {
            const on = f.shipper.includes(t);
            return (
              <button type="button" key={t} onClick={() => set("shipper", on ? f.shipper.filter((x) => x !== t) : [...f.shipper, t])}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium transition",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground hover:border-ring hover:text-foreground")}>
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4">
        <SectionLabel hint="(optional)">Your review</SectionLabel>
        {signedInName
          ? <p className="text-xs text-muted-foreground">Posting as <span className="font-semibold text-foreground">{signedInName}</span></p>
          : <input className={inputCls} placeholder="Display name (defaults to Anonymous)" maxLength={40} value={f.name} onChange={(e) => set("name", e.target.value)} />}
        <input className={inputCls} placeholder="Review title" value={f.title} onChange={(e) => set("title", e.target.value)} />
        <textarea className={cn(inputCls, "min-h-28")} placeholder="Tell us about your experience…" value={f.comment} onChange={(e) => set("comment", e.target.value)} />
      </div>

      <div>
        <SectionLabel icon={<ImagePlus className="h-3.5 w-3.5" />} hint="(optional, images only, up to 6)">Photos</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {f.images.map((src, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-md border border-border">
              <img src={src} alt={`Attachment ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => set("images", f.images.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-primary/80 p-0.5 text-primary-foreground opacity-0 transition group-hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {f.images.length < 6 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-input text-muted-foreground transition hover:border-ring hover:text-foreground">
              <ImagePlus className="h-5 w-5" /><span className="text-[10px] font-semibold uppercase">Add</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
        <button type="submit" className="rounded-md bg-primary px-6 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90">Submit review</button>
      </div>
    </form>
  );
}

/* ---------- Card ---------- */
function ReviewCard({ r, onHelpful, onReply, onReport, onDeleteReview, onDeleteReply, isAdminMode, viewerId, viewerName }: {
  r: Review; onHelpful: (delta: number) => void; onReply: (text: string, name: string) => void; onReport: () => void;
  onDeleteReview: () => void; onDeleteReply: (id: string) => void; isAdminMode: boolean; viewerId: string; viewerName: string;
}) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [voted, setVoted] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fabric = [
    ["Breathability", r.fabric.breathability], ["Stretch", r.fabric.stretch], ["Wash durability", r.fabric.durability],
  ].filter(([, v]) => v) as [string, number][];
  const bio = [r.bio.height && `${r.bio.height} cm`, r.bio.weight && `${r.bio.weight} kg`, r.bio.size && `Bought ${r.bio.size}`].filter(Boolean);
  const hasMetrics = r.fit || fabric.length || bio.length || r.material || r.color || r.shipper.length;

  return (
    <article className={cn("border-b border-border py-7 last:border-0", r.announcement && "-mx-4 rounded-lg border border-admin/20 bg-accent px-4")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
            {r.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{r.name}</span>
              {r.announcement && <span className="inline-flex items-center gap-1 rounded-sm bg-admin px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-admin-foreground"><ShieldCheck className="h-3 w-3" />Shop Admin</span>}
              {r.verified && !r.announcement && <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><BadgeCheck className="h-3.5 w-3.5" />Verified buyer</span>}
            </div>
            <div className="mt-0.5 flex items-center gap-2">{r.announcement ? <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Megaphone className="h-3.5 w-3.5" />Announcement</span> : <Stars value={r.rating} size={14} />}<span className="text-xs text-muted-foreground">{fmtDate(r.date)}</span></div>
          </div>
        </div>
        {bio.length > 0 && <div className="flex flex-wrap gap-1.5">{bio.map((b) => <Chip key={b as string}>{b}</Chip>)}</div>}
      </div>

      {r.title && <h4 className="mt-4 font-semibold">{r.title}</h4>}
      {r.comment && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>}

      {r.images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {r.images.map((src, i) => (
            <button key={i} onClick={() => setLightbox(src)} className="h-20 w-20 overflow-hidden rounded-md border border-border transition hover:opacity-80">
              <img src={src} alt={`Review photo ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {hasMetrics ? (
        <div className="mt-4 grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2">
          {r.fit && (
            <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fit · <span className="text-foreground">{FIT_LABEL[r.fit]}</span></p><FitScale fit={r.fit} /></div>
          )}
          {fabric.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fabric performance</p>
              {fabric.map(([l, v]) => <div key={l} className="flex items-center justify-between text-xs"><span>{l}</span><Stars value={v} size={12} /></div>)}
            </div>
          )}
          {(r.material || r.color) && (
            <div className="flex flex-wrap gap-1.5">
              {r.material && <Chip tone={r.material}>Material: {r.material === "good" ? "High quality" : "Low quality"}</Chip>}
              {r.color && <Chip tone={r.color}>Color: {r.color === "good" ? "Accurate" : "Not as pictured"}</Chip>}
            </div>
          )}
          {r.shipper.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
              {r.shipper.map((s) => <Chip key={s}>{s}</Chip>)}
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span>Was this helpful?</span>
        <button aria-pressed={voted} title={voted ? "Tap again to undo" : undefined}
          onClick={() => { onHelpful(voted ? -1 : 1); setVoted(!voted); }}
          className={cn("inline-flex items-center gap-1 rounded border border-border px-2 py-1 font-medium transition hover:bg-muted", voted && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}>
          <ThumbsUp className={cn("h-3.5 w-3.5", voted && "fill-current")} />Yes ({r.helpful})
        </button>
        <button onClick={() => setReplying((v) => !v)} className="inline-flex items-center gap-1 hover:text-foreground"><MessageSquare className="h-3.5 w-3.5" />Reply</button>
        <button onClick={onReport} className="inline-flex items-center gap-1 hover:text-destructive"><Flag className="h-3.5 w-3.5" />Report</button>
        {(r.authorId === viewerId || isAdminMode) && (
          <button onClick={() => { if (confirm("Delete this review? This can't be undone.")) onDeleteReview(); }} className="inline-flex items-center gap-1 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" />Delete</button>
        )}
      </div>

      {(r.replies.length > 0 || replying) && (
        <div className="mt-4 space-y-3 border-l-2 border-border pl-4 sm:ml-12">
          {r.replies.map((rep) => (
            <div key={rep.id} className={cn("rounded-md p-3", rep.isAdmin ? "border border-admin/20 bg-accent" : "bg-muted/60")}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{rep.author}</span>
                {rep.authorId === viewerId && !rep.isAdmin && <span className="text-xs text-muted-foreground">(you)</span>}
                {rep.isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded bg-admin px-1.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-widest text-admin-foreground">
                    <ShieldCheck className="h-3 w-3" />Shop Admin
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{fmtDate(rep.date)}</span>
                {(rep.authorId === viewerId || isAdminMode) && (
                  <button aria-label="Delete reply" onClick={() => { if (confirm("Delete this reply? This can't be undone.")) onDeleteReply(rep.id); }}
                    className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{rep.text}</p>
            </div>
          ))}
          {replying && (
            <form className="space-y-2" onSubmit={(e) => {
              e.preventDefault();
              const n = (isAdminMode ? "Store Team" : viewerName || nameDraft).trim();
              if (!n) { toast.error("Please enter a display name."); return; }
              if (!text.trim()) return;
              onReply(text.trim(), n); setText(""); setReplying(false);
            }}>
              {!isAdminMode && !viewerName && (
                <input className={inputCls} placeholder="Your display name" maxLength={40} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
              )}
              {!isAdminMode && viewerName && <p className="text-xs text-muted-foreground">Replying as <span className="font-semibold text-foreground">{viewerName}</span></p>}
              <div className="flex gap-2">
                <input autoFocus className={inputCls} placeholder={isAdminMode ? "Reply as Shop Admin…" : "Write a reply…"} value={text} onChange={(e) => setText(e.target.value)} />
                <button type="submit" aria-label="Send reply" className="rounded-md bg-primary px-3 text-primary-foreground hover:opacity-90"><Send className="h-4 w-4" /></button>
              </div>
            </form>
          )}
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">Review photo</DialogTitle>
          {lightbox && <img src={lightbox} alt="Review photo enlarged" className="max-h-[80vh] w-full rounded object-contain" />}
        </DialogContent>
      </Dialog>
    </article>
  );
}

/* ---------- Report modal ---------- */
function ReportDialog({ review, onClose }: { review: Review | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const close = () => { setReason(""); setDetails(""); onClose(); };
  const send = async () => {
    if (!review || !reason) return;
    setSending(true);
    const payload = { reviewId: review.id, reason, details, reportedAt: new Date().toISOString() };
    await new Promise((r) => setTimeout(r, 800)); // simulated Shop Admin API
    console.info("[Shop Admin] report received", payload);
    setSending(false);
    toast.success("Report sent to Shop Admin. Thanks for keeping reviews honest.");
    close();
  };
  return (
    <Dialog open={!!review} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide">Report review</DialogTitle>
          <DialogDescription>Tell the Shop Admin team what's wrong with this review.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <label key={r.id} className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition",
              reason === r.id ? "border-primary bg-muted" : "border-border hover:bg-muted")}>
              <input type="radio" name="reason" className="accent-primary" checked={reason === r.id} onChange={() => setReason(r.id)} />
              {r.label}
            </label>
          ))}
          <textarea className={cn(inputCls, "mt-2 min-h-20")} placeholder="Additional details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        <DialogFooter>
          <button onClick={close} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          <button disabled={!reason || sending} onClick={send}
            className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition disabled:opacity-40">
            {sending ? "Sending…" : "Submit report"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Announcement form (admins only) ---------- */
function AnnouncementForm({ onSubmit, onCancel }: { onSubmit: (title: string, text: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  return (
    <form className="space-y-3 rounded-lg border border-admin/20 bg-card p-6 shadow-sm"
      onSubmit={(e) => { e.preventDefault(); if (!text.trim()) { toast.error("Write a message first."); return; } onSubmit(title.trim(), text.trim()); }}>
      <div className="flex items-center gap-2"><Megaphone className="h-5 w-5" /><h3 className="font-display text-xl font-bold uppercase tracking-wide">Post an announcement</h3></div>
      <p className="text-sm text-muted-foreground">Shown at the top with a Shop Admin badge. No rating — it won't affect the score.</p>
      <input className={inputCls} placeholder="Title (optional)" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea autoFocus className={cn(inputCls, "min-h-24")} placeholder="e.g. Restock of size M arriving next week…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Post</button>
      </div>
    </form>
  );
}

/* ---------- Storage ---------- */
/**
 * Where reviews are saved. Swap in your own (e.g. Supabase) on the live site.
 * `load` returns null when nothing is saved yet (seed reviews are shown instead).
 */
export type ReviewStore = {
  load: () => Promise<Review[] | null>;
  save: (reviews: Review[]) => Promise<void>;
};

export const localReviewStore = (key: string): ReviewStore => ({
  load: async () => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as Review[]) : null; } catch { return null; }
  },
  save: async (reviews) => { localStorage.setItem(key, JSON.stringify(reviews)); },
});

/* ---------- Main ---------- */
export type ReviewUser = { id: string; name: string; isAdmin?: boolean };

/**
 * Pass `currentUser` from your login system (e.g. { id: user.id, name: profile.username }).
 * When signed in, their username is used automatically. Guests are asked for a display name once.
 */
export function ProductReviews({ initialReviews = SEED, currentUser = null, productId = "demo-product", store }: {
  initialReviews?: Review[]; currentUser?: ReviewUser | null; productId?: string; store?: ReviewStore;
}) {
  const [reviews, setReviewsState] = useState<Review[]>(initialReviews);
  const storeRef = useRef<ReviewStore | null>(null);
  const loaded = useRef(false);
  useEffect(() => {
    const st = store ?? localReviewStore(`product-reviews:${productId}`);
    storeRef.current = st;
    loaded.current = false;
    st.load().then((saved) => { if (saved) setReviewsState(saved); loaded.current = true; })
      .catch(() => { loaded.current = true; });
  }, [store, productId]);
  const setReviews = (fn: (p: Review[]) => Review[]) => setReviewsState((p) => {
    const next = fn(p);
    if (loaded.current) storeRef.current?.save(next).catch(() => toast.error("Couldn't save — your change may be lost on refresh."));
    return next;
  });
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState<"recent" | "high" | "low" | "helpful">("recent");
  const [filter, setFilter] = useState(0);
  const [photosOnly, setPhotosOnly] = useState(false);
  const [sizeFilter, setSizeFilter] = useState("");
  const [reporting, setReporting] = useState<Review | null>(null);
  const adminMode = !!currentUser?.isAdmin;
  const [guestId] = useState(() => "guest-" + uid());
  const [guestName, setGuestName] = useState("");
  const viewerId = currentUser?.id ?? guestId;
  const viewerName = currentUser?.name ?? guestName;

  const visible = useMemo(() => {
    const list = reviews.filter((r) => r.announcement ? (!filter && !sizeFilter && (!photosOnly || r.images.length > 0)) :
      (!filter || r.rating === filter) &&
      (!photosOnly || r.images.length > 0) &&
      (!sizeFilter || (r.bio.size ?? "").trim().toUpperCase() === sizeFilter));
    return list.sort((a, b) => Number(!!b.announcement) - Number(!!a.announcement) ||
      (sort === "high" ? b.rating - a.rating : sort === "low" ? a.rating - b.rating
        : sort === "helpful" ? b.helpful - a.helpful : b.date.localeCompare(a.date)));
  }, [reviews, sort, filter, photosOnly, sizeFilter]);
  const sizes = useMemo(() => {
    const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    const set = Array.from(new Set(reviews.map((r) => (r.bio.size ?? "").trim().toUpperCase()).filter(Boolean)));
    return set.sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
  }, [reviews]);

  const update = (id: string, fn: (r: Review) => Review) => setReviews((p) => p.map((r) => (r.id === id ? fn(r) : r)));

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 font-sans text-foreground" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-heading" className="font-display text-3xl font-extrabold uppercase tracking-wide">Reviews</h2>
      </div>

      <Summary reviews={reviews} writeLabel={adminMode ? "Post announcement" : undefined} onWrite={() => setShowForm(true)} filter={filter} setFilter={setFilter} />

      {showForm && adminMode && (
        <AnnouncementForm onCancel={() => setShowForm(false)} onSubmit={(title, text) => {
          setReviews((p) => [{ id: uid(), name: "Store Team", authorId: viewerId, verified: false, rating: 0, date: today(), title, comment: text,
            helpful: 0, images: [], fabric: {}, bio: {}, shipper: [], replies: [], announcement: true }, ...p]);
          setShowForm(false); toast.success("Announcement posted.");
        }} />
      )}
      {showForm && !adminMode && (
        <ReviewForm signedInName={currentUser?.name} defaultName={guestName} onCancel={() => setShowForm(false)} onSubmit={(f) => {
          const name = currentUser?.name || f.name.trim() || "Anonymous";
          if (!currentUser && f.name.trim()) setGuestName(f.name.trim());
          setReviews((p) => [{ ...f, name, authorId: viewerId, id: uid(), date: today(), helpful: 0, verified: true, replies: [] }, ...p]);
          setShowForm(false); setSort("recent"); setFilter(0);
          toast.success("Thanks! Your review is live.");
        }} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-1.5">
          {[0, 5, 4, 3, 2, 1].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition",
                filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
              {s ? `${s}★` : "All"}
            </button>
          ))}
          <button onClick={() => setPhotosOnly((v) => !v)}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition",
              photosOnly ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
            With photos
          </button>
          <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} aria-label="Filter by size"
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground outline-none focus:border-ring">
            <option value="">All sizes</option>
            {sizes.map((s) => <option key={s} value={s}>Size {s}</option>)}
          </select>
        </div>
        <div className="relative">
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
            className="appearance-none rounded-md border border-input bg-card py-1.5 pl-3 pr-8 text-sm font-medium outline-none focus:border-ring">
            <option value="recent">Most recent</option>
            <option value="high">Highest rating</option>
            <option value="low">Lowest rating</option>
            <option value="helpful">Most helpful</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div>
        {visible.length ? visible.map((r) => (
          <ReviewCard key={r.id} r={r} isAdminMode={adminMode} viewerId={viewerId} viewerName={viewerName}
            onHelpful={(delta) => update(r.id, (x) => ({ ...x, helpful: Math.max(0, x.helpful + delta) }))}
            onReport={() => setReporting(r)}
            onDeleteReview={() => { setReviews((p) => p.filter((x) => x.id !== r.id)); toast.success("Review deleted."); }}
            onDeleteReply={(rid) => { update(r.id, (x) => ({ ...x, replies: x.replies.filter((y) => y.id !== rid) })); toast.success("Reply deleted."); }}
            onReply={(text, name) => {
              if (!currentUser && !adminMode) setGuestName(name);
              update(r.id, (x) => ({
                ...x, replies: [...x.replies, { id: uid(), text, date: today(), isAdmin: adminMode, authorId: viewerId, author: adminMode ? "Store Team" : name }],
              }));
            }} />
        )) : <p className="py-12 text-center text-sm text-muted-foreground">No reviews match this filter.</p>}
      </div>

      <ReportDialog review={reporting} onClose={() => setReporting(null)} />
    </section>
  );
}

export default ProductReviews;
