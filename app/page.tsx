"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  Clock,
  Pencil,
  X,
  Plus,
  Minus,
  Moon,
  Sun,
  Search,
  Package,
  AlertCircle,
  Check,
  Trash2,
  Sparkles,
  BarChart3,
  Camera,
  ImagePlus,
  ImageOff,
  ClipboardList,
  Truck,
  Undo2,
  MapPin,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SizeEntry {
  id?: string;
  size: number;
  quantity: number;
}

interface Shoe {
  id: string;
  name: string;
  supplier: string;
  color: string;
  cost_price: number;
  price: number;
  image: string;
  sizes: SizeEntry[];
}

type ModalMode = "sell" | "edit" | "add" | null;
type ActiveTab = "inventory" | "pending" | "completed";

interface PendingOrder {
  id: string;
  order_number: string;
  shoe_id: string;
  shoe_name: string;
  shoe_supplier: string;
  shoe_color: string;
  shoe_image: string;
  shoe_cost_price: number;
  shoe_price: number;
  size: number;
  quantity: number;
  total_price: number;
  buyer_name: string;
  buyer_phone: string;
  governorate: string;
  notes: string;
  created_at: string;
}

interface CompletedOrder extends PendingOrder {
  completed_at: string | null;
  returned_at: string | null;
  return_reason: string;
}

const GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "النجف", "كركوك", "كربلاء",
  "دهوك", "السليمانية", "بابل", "الأنبار", "ديالى", "صلاح الدين",
  "واسط", "ميسان", "ذي قار", "المثنى", "القادسية",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avail = (s: SizeEntry) => s.quantity;
const totalAvail = (shoe: Shoe) =>
  shoe.sizes.reduce((n, s) => n + avail(s), 0);
const fmt = (n: number) => n.toLocaleString("ar-DZ") + " د.ج";

// ─── Mock Data (معطّل — البيانات تأتي من قاعدة البيانات) ──────────────────────

/* const INITIAL_SHOES: Shoe[] = [ ... ]; */
const INITIAL_SHOES: Shoe[] = [];

// ─── Size Chip ────────────────────────────────────────────────────────────────

function SizeChip({
  size,
  available,
  selected,
  onClick,
}: {
  size: number;
  available: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  const isEmpty = available === 0;
  return (
    <button
      onClick={onClick}
      disabled={isEmpty}
      className={[
        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none",
        selected
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
          : isEmpty
            ? "opacity-30 cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border cursor-pointer active:scale-95",
      ].join(" ")}
    >
      <span>{size}</span>
      <span
        className={[
          "text-[10px] font-bold px-1.5 py-0.5 rounded-lg leading-none",
          selected
            ? "bg-white/20 text-white"
            : available <= 2
              ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        ].join(" ")}
      >
        {available}
      </span>
    </button>
  );
}

// ─── Qty Stepper ──────────────────────────────────────────────────────────────

function QtyStepper({
  value,
  min = 1,
  max,
  onChange,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 rounded-xl bg-secondary hover:bg-muted border border-border flex items-center justify-center transition-colors disabled:opacity-30 active:scale-95"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-10 text-center text-2xl font-bold tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 rounded-xl bg-secondary hover:bg-muted border border-border flex items-center justify-center transition-colors disabled:opacity-30 active:scale-95"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Action Modal (Sell / Reserve / Return) ───────────────────────────────────

function ActionModal({
  shoe,
  mode,
  onConfirm,
}: {
  shoe: Shoe;
  mode: "sell";
  onConfirm: (sizeIdx: number, qty: number, buyerName?: string, governorate?: string) => void;
}) {
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [governorate, setGovernorate] = useState("");

  const displaySizes = shoe.sizes.filter((s) => avail(s) > 0);

  const entry = selIdx !== null ? shoe.sizes[selIdx] : null;
  const maxQty = entry ? avail(entry) : 1;

  const cfgMap = {
    sell: {
      icon: <ShoppingCart className="w-4 h-4" />,
      label: "تأكيد البيع",
      cls: "bg-primary hover:bg-primary-hover text-primary-foreground",
    },
  };
  const cfg = cfgMap[mode];

  const selectSize = (globalIdx: number) => {
    setSelIdx(globalIdx);
    setQty(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          المقاسات المتاحة
        </p>
        {displaySizes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            لا توجد مقاسات متاحة
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {displaySizes.map((s) => {
              const globalIdx = shoe.sizes.indexOf(s);
              return (
                <SizeChip
                  key={s.size}
                  size={s.size}
                  available={avail(s)}
                  selected={selIdx === globalIdx}
                  onClick={() => selectSize(globalIdx)}
                />
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selIdx !== null && entry && (
          <motion.div
            key="qty-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-secondary border border-border">
                <span className="text-xs text-muted-foreground">
                  الكمية المتاحة
                </span>
                <span className="text-sm font-bold">{avail(entry)} قطعة</span>
              </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                الكمية
              </p>
              <QtyStepper value={qty} max={maxQty} onChange={setQty} />
            </div>

            <div className="border-t border-border pt-5 space-y-3">
              {mode === "sell" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      اسم المشتري
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="أدخل اسم المشتري"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      المحافظة
                      <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="">اختر المحافظة</option>
                      {GOVERNORATES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    الإجمالي
                  </span>
                  <span className="text-xl font-bold">
                    {fmt(shoe.price * qty)}
                  </span>
                </div>
              <button
                onClick={() => onConfirm(selIdx, qty, buyerName, governorate)}
                disabled={mode === "sell" && (!buyerName.trim() || !governorate)}
                className={[
                  "w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]",
                  mode === "sell" && (!buyerName.trim() || !governorate)
                    ? "opacity-40 cursor-not-allowed"
                    : cfg.cls,
                ].join(" ")}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  shoe,
  mode,
  onSave,
  saving,
}: {
  shoe: Shoe;
  mode: "add" | "edit";
  onSave: (updated: Shoe) => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<Shoe>({
    ...shoe,
    sizes: shoe.sizes.map((s) => ({ ...s })),
  });
  const [errors, setErrors] = useState<{ image?: string }>({});
  const [imgPreview, setImgPreview] = useState<string>(shoe.image);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const field = (key: keyof Shoe, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key as keyof typeof errors]: undefined }));
  };

  const [uploading, setUploading] = useState(false);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const localPreview = URL.createObjectURL(file);
    setImgPreview(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setImgPreview(url);
        setForm((f) => ({ ...f, image: url }));
        setErrors((er) => ({ ...er, image: undefined }));
      } else {
        setErrors((er) => ({ ...er, image: "فشل رفع الصورة" }));
      }
    } catch {
      setErrors((er) => ({ ...er, image: "خطأ في رفع الصورة" }));
    }
    setUploading(false);
  };

  const clearImage = () => {
    setImgPreview("");
    setForm((f) => ({ ...f, image: "" }));
  };

  const setSize = (i: number, key: keyof SizeEntry, val: number) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((s, idx) =>
        idx === i ? { ...s, [key]: Math.max(0, val) } : s,
      ),
    }));

  const addSize = () => {
    const next =
      form.sizes.length > 0
        ? Math.max(...form.sizes.map((s) => s.size)) + 1
        : 38;
    setForm((f) => ({
      ...f,
      sizes: [...f.sizes, { size: next, quantity: 0 }],
    }));
  };

  const removeSize = (i: number) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.filter((_, idx) => idx !== i),
    }));

  const handleSave = () => {
    const errs: typeof errors = {};
    if (!imgPreview) errs.image = "الصورة مطلوبة";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(form);
  };

  const inputCls = (hasErr?: boolean) =>
    [
      "w-full px-4 py-3 rounded-xl bg-card border text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-muted-foreground",
      hasErr
        ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
        : "border-border focus:ring-primary/20 focus:border-primary",
    ].join(" ");

  return (
    <div className="space-y-5">
      {/* ── Image ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            الصورة <span className="text-destructive">*</span>
          </label>
          {imgPreview && (
            <button
              onClick={clearImage}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
            >
              <ImageOff className="w-3 h-3" /> حذف
            </button>
          )}
        </div>

        {imgPreview ? (
          <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[16/7]">
            <img
              src={imgPreview}
              alt="معاينة"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-black/50 backdrop-blur-sm text-white text-xs font-bold hover:bg-black/70 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" /> تغيير بالكاميرا
              </button>
              <button
                onClick={() => galleryRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-black/50 backdrop-blur-sm text-white text-xs font-bold hover:bg-black/70 transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" /> من الاستوديو
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2.5 py-6 rounded-2xl border-2 border-dashed border-border bg-secondary hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">الكاميرا</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  التقط صورة الآن
                </p>
              </div>
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2.5 py-6 rounded-2xl border-2 border-dashed border-border bg-secondary hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <ImagePlus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">
                  استوديو الصور
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  اختر من جهازك
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageFile}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFile}
        />
        {errors.image && (
          <p className="text-[11px] text-destructive mt-2">{errors.image}</p>
        )}
      </div>

      {/* ── Sizes ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-muted-foreground">
            المقاسات والكميات
          </label>
          <button
            onClick={addSize}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:opacity-75 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة مقاس
          </button>
        </div>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          <AnimatePresence initial={false}>
            {form.sizes.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      المقاس
                    </p>
                    <input
                      type="number"
                      value={s.size}
                      onChange={(e) =>
                        setSize(i, "size", Number(e.target.value))
                      }
                      className="w-full bg-transparent text-sm font-bold focus:outline-none"
                    />
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      الكمية
                    </p>
                    <input
                      type="number"
                      value={s.quantity}
                      onChange={(e) =>
                        setSize(i, "quantity", Number(e.target.value))
                      }
                      className="w-full bg-transparent text-sm font-bold focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => removeSize(i)}
                    className="w-7 h-7 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors text-muted-foreground"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          {saving ? "جاري الحفظ..." : uploading ? "جاري رفع الصورة..." : "حفظ التعديلات"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function ModalShell({
  title,
  subtitle,
  accent,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ scale: 0.94, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="relative z-10 w-full max-w-[680px] bg-card rounded-[20px] border border-border shadow-2xl shadow-black/20 overflow-hidden"
      >
        <div
          className={[
            "flex items-start justify-between px-8 pt-8 pb-4",
            accent ? `border-b border-border` : "",
          ].join(" ")}
        >
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary hover:bg-muted border border-border flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-8 pb-8 pt-2 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
  colorCls,
  gradientCls,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  colorCls: string;
  gradientCls: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "group/btn relative flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl",
        "text-[10px] font-bold transition-all duration-200",
        "disabled:opacity-25 disabled:cursor-not-allowed disabled:scale-100",
        "active:scale-95 hover:scale-105",
        gradientCls,
        colorCls,
      ].join(" ")}
    >
      <div className="transition-transform duration-200 group-hover/btn:scale-110 group-active/btn:scale-90">
        {icon}
      </div>
      <span className="leading-none">{label}</span>
    </button>
  );
}

// ─── Shoe Card ────────────────────────────────────────────────────────────────

function ShoeCard({
  shoe,
  onAction,
  onDelete,
}: {
  shoe: Shoe;
  onAction: (mode: ModalMode) => void;
  onDelete: (id: string) => void;
}) {
  const total = totalAvail(shoe);
  const isOut = total === 0;
  const availSizes = shoe.sizes.filter((s) => avail(s) > 0);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={[
        "group relative rounded-2xl overflow-hidden flex flex-col",
        "bg-card border border-border",
        "shadow-sm hover:shadow-md transition-all duration-200",
        isOut ? "opacity-50 grayscale-[0.6]" : "",
      ].join(" ")}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={shoe.image}
          alt={`${shoe.supplier} ${shoe.name}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {isOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[3px]">
            <span className="px-5 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs font-bold rounded-full tracking-widest uppercase shadow-xl">
              نفد المخزون
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <span className="px-3 py-1.5 bg-white/90 dark:bg-black/60 backdrop-blur-md text-gray-900 dark:text-white text-[11px] font-extrabold rounded-xl shadow-lg border border-white/20">
            {shoe.supplier}
          </span>
        </div>

        {/* Price tag */}
        <div className="absolute bottom-3 left-3">
          <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
            <p className="text-white text-sm font-extrabold tabular-nums leading-none">
              {shoe.price.toLocaleString()}
            </p>
            <p className="text-white/60 text-[9px] font-bold leading-none mt-0.5">
              د.ج
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3.5 flex-1">
        {/* Name + Price (desktop) */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-extrabold text-[15px] leading-snug truncate text-gray-900 dark:text-white">
              {shoe.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" />
              {shoe.color}
            </p>
          </div>
          <div className="text-right shrink-0 hidden">
            <p className="font-bold text-base leading-tight tabular-nums">
              {shoe.price.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              د.ج
            </p>
          </div>
        </div>

        {/* Sizes */}
        {availSizes.length > 0 ? (
          <div className="flex items-stretch gap-1.5">
            {availSizes.map((s) => {
              const q = avail(s);
              const isLow = q <= 2;
              return (
                <div
                  key={s.size}
                  className={[
                    "flex-1 flex flex-col items-center py-2.5 gap-1.5 min-w-0 rounded-xl transition-all duration-200",
                    "border",
                    isLow
                      ? "bg-warning/5 border-warning/20"
                      : "bg-secondary/30 border-border",
                  ].join(" ")}
                >
                  <span className="text-[12px] font-bold text-muted-foreground leading-none tabular-nums">
                    {s.size}
                  </span>
                  <span
                    className={[
                      "text-sm font-extrabold leading-none tabular-nums",
                      isLow
                        ? "text-warning"
                        : "text-foreground",
                    ].join(" ")}
                  >
                    {q}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-xs text-muted-foreground">
              لا توجد مقاسات متاحة
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mt-auto pt-1">
          <ActionBtn
            icon={<ShoppingCart className="w-4 h-4" />}
            label="بيع"
            onClick={() => onAction("sell")}
            disabled={isOut}
            gradientCls="bg-primary/10 dark:bg-primary/15 border border-primary/20 hover:bg-primary/20"
            colorCls="text-primary"
          />
          <ActionBtn
            icon={<Pencil className="w-4 h-4" />}
            label="تعديل"
            onClick={() => onAction("edit")}
            gradientCls="bg-muted border border-border hover:bg-muted/80"
            colorCls="text-muted-foreground"
          />
          <ActionBtn
            icon={<Trash2 className="w-4 h-4" />}
            label="حذف"
            onClick={() => onDelete(shoe.id)}
            gradientCls="bg-destructive/10 dark:bg-destructive/15 border border-destructive/20 hover:bg-destructive/20"
            colorCls="text-destructive"
          />
        </div>
      </div>
    </motion.article>
  );
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────

function StatsStrip({ shoes }: { shoes: Shoe[] }) {
  const allAvail = shoes.reduce((n, s) => n + totalAvail(s), 0);
  const outCount = shoes.filter((s) => totalAvail(s) === 0).length;
  const totalValue = shoes.reduce(
    (n, s) => n + s.price * s.sizes.reduce((a, sz) => a + sz.quantity, 0),
    0,
  );

  const stats = [
    {
      label: "إجمالي المتاح",
      value: allAvail + " قطعة",
      icon: <Package className="w-4 h-4" />,
      bg: "bg-success/10 dark:bg-success/15",
      fg: "text-success",
    },
    {
      label: "نفد المخزون",
      value: outCount + " صنف",
      icon: <AlertCircle className="w-4 h-4" />,
      bg: "bg-destructive/10 dark:bg-destructive/15",
      fg: "text-destructive",
    },
    {
      label: "قيمة المخزون",
      value: (totalValue / 1000).toFixed(0) + "k د.ج",
      icon: <BarChart3 className="w-4 h-4" />,
      bg: "bg-muted dark:bg-muted",
      fg: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-card border border-border rounded-2xl px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-2.5 sm:gap-3 shadow-sm"
        >
          <div
            className={[
              "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0",
              s.bg,
              s.fg,
            ].join(" ")}
          >
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm sm:text-lg font-extrabold leading-none tabular-nums">
              {s.value}
            </p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-tight">
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-3.5 bg-foreground text-background rounded-2xl shadow-2xl text-sm font-bold whitespace-nowrap"
    >
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-white" />
      </div>
      {message}
    </motion.div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "out">("all");
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("inventory");
  const [orderSearch, setOrderSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── جلب البيانات من قاعدة البيانات ──
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [shoesRes, pendingRes, completedRes] = await Promise.all([
        fetch("/api/shoes"),
        fetch("/api/pending-orders"),
        fetch("/api/completed-orders"),
      ]);
      if (shoesRes.ok) setShoes(await shoesRes.json());
      if (pendingRes.ok) setPendingOrders(await pendingRes.json());
      if (completedRes.ok) setCompletedOrders(await completedRes.json());
    } catch (e) {
      console.error("Failed to fetch data:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, []);

  const activeShoe = shoes.find((s) => s.id === activeId) ?? null;

  const openModal = (id: string, mode: ModalMode) => {
    setActiveId(id);
    setModalMode(mode);
  };

  const closeModal = () => {
    setActiveId(null);
    setModalMode(null);
  };

  const handleConfirm = async (sizeIdx: number, qty: number, buyerName?: string, governorate?: string) => {
    if (!activeId || !modalMode || modalMode === "edit") return;

    if (modalMode === "sell") {
      const shoe = shoes.find((s) => s.id === activeId);
      if (!shoe) return;
      const sizeEntry = shoe.sizes[sizeIdx];

      try {
        const res = await fetch("/api/pending-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shoe_id: shoe.id,
            shoe_name: shoe.name,
            shoe_supplier: shoe.supplier,
            shoe_color: shoe.color,
            shoe_image: shoe.image,
            shoe_cost_price: shoe.cost_price,
            shoe_price: shoe.price,
            size: sizeEntry.size,
            quantity: qty,
            total_price: shoe.price * qty,
            buyer_name: buyerName!.trim(),
            buyer_phone: "",
            governorate: governorate!,
            notes: "",
          }),
        });
        if (res.ok) {
          await fetchAll();
          showToast(`تم بيع ${qty} قطعة - معلق`);
        }
      } catch (e) {
        console.error("Sell error:", e);
      }
    }
    closeModal();
  };

  const handleSave = async (updated: Shoe) => {
    const isNew = updated.id.startsWith("new_");
    setSaving(true);

    try {
      const res = await fetch(isNew ? "/api/shoes" : `/api/shoes/${updated.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shoe: {
            name: updated.name,
            supplier: updated.supplier,
            color: updated.color,
            cost_price: updated.cost_price,
            price: updated.price,
            image: updated.image,
          },
          sizes: updated.sizes,
        }),
      });
      if (res.ok) {
        await fetchAll();
        showToast(isNew ? "تم إضافة الحذاء بنجاح" : "تم حفظ التعديلات بنجاح");
        closeModal();
      } else {
        const err = await res.json();
        showToast(err.error || "حدث خطأ أثناء الحفظ");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم");
    }
    setSaving(false);
  };

  const handleDelete = async (shoeId: string) => {
    if (!window.confirm("هل تريد حذف هذا الحذاء؟")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/shoes/${shoeId}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));

      if (res.ok) {
        await fetchAll();
        showToast("تم حذف الحذاء بنجاح");
      } else {
        showToast(payload.error || "تعذر حذف الحذاء");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم");
    }
    setSaving(false);
  };

  const handleAddShoe = () => {
    const tempId = "new_" + Date.now();
    const newShoe: Shoe = {
      id: tempId,
      name: "",
      supplier: "",
      color: "",
      cost_price: 0,
      price: 0,
      image: "",
      sizes: [{ size: 40, quantity: 0 }],
    };
    setShoes((p) => [newShoe, ...p]);
    openModal(tempId, "add");
  };

  const handleDeliverOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/pending-orders/${orderId}?action=deliver`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAll();
        showToast(`تم تسليم الطلب بنجاح`);
      }
    } catch (e) {
      console.error("Deliver error:", e);
    }
  };

  const handleReturnOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/pending-orders/${orderId}?action=return`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAll();
        showToast(`تم إرجاع الطلب للمخزن`);
      }
    } catch (e) {
      console.error("Return error:", e);
    }
  };

  const filtered = shoes
    .filter((s) => {
      if (filter === "available") return totalAvail(s) > 0;
      if (filter === "out") return totalAvail(s) === 0;
      return true;
    })
    .filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.supplier.toLowerCase().includes(search.toLowerCase()) ||
        s.color.toLowerCase().includes(search.toLowerCase()),
    );

  const modalTitles: Record<string, string> = {
    sell: "بيع حذاء",
    add: "إضافة حذاء",
    edit: "تعديل حذاء",
  };

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "available", label: "متاح" },
    { key: "out", label: "نفد" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-extrabold leading-none tracking-tight">
                StepTrack
              </p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                إدارة المخزون
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs mx-auto relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="w-full pr-9 pl-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 mr-auto shrink-0">
            <button
              onClick={() => setDark((d) => !d)}
              className="w-9 h-9 rounded-xl bg-secondary border border-border hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="تبديل الوضع"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleAddShoe}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">إضافة حذاء</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <>
            <StatsStrip shoes={shoes} />

            <div className="flex items-center gap-2">
              {filterBtns.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={[
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                    filter === f.key
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-secondary text-muted-foreground hover:text-foreground border border-border",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-xs text-muted-foreground mr-2">
                {filtered.length} صنف
              </span>
            </div>

            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full flex flex-col items-center justify-center py-28 text-muted-foreground"
                  >
                    <Package className="w-14 h-14 mb-4 opacity-20" />
                    <p className="font-bold text-base">لا توجد نتائج</p>
                    <p className="text-sm mt-1 opacity-60">
                      جرّب البحث بكلمات مختلفة
                    </p>
                  </motion.div>
                ) : (
                  filtered.map((shoe) => (
                    <ShoeCard
                      key={shoe.id}
                      shoe={shoe}
                      onAction={(m) => openModal(shoe.id, m)}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* Pending Orders Tab */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">الطلبات المعلقة</h2>
                <p className="text-[11px] text-muted-foreground">{pendingOrders.length} طلب</p>
              </div>
            </div>

            {pendingOrders.length > 0 && (
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الولاية..."
                  className="w-full pr-9 pl-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground shadow-sm"
                />
              </div>
            )}

            {(() => {
              const filtered = pendingOrders.filter((o) => {
                if (!orderSearch.trim()) return true;
                const q = orderSearch.toLowerCase();
                return (
                  o.buyer_name.toLowerCase().includes(q) ||
                  o.governorate.toLowerCase().includes(q) ||
                  o.shoe_name.toLowerCase().includes(q) ||
                  o.shoe_supplier.toLowerCase().includes(q)
                );
              });

              return filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 text-muted-foreground">
                  <Package className="w-14 h-14 mb-4 opacity-15" />
                  <p className="font-bold text-sm">
                    {orderSearch.trim() ? "لا توجد نتائج بحث" : "لا توجد طلبات معلقة"}
                  </p>
                  <p className="text-xs mt-1 opacity-60">
                    {orderSearch.trim() ? "جرّب كلمات مختلفة" : "سيظهر هنا الطلبات عند البيع"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, x: -30 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="group relative rounded-2xl overflow-hidden border bg-card border-border shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="p-4">
                          <div className="flex gap-3">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0 border border-gray-200/50 dark:border-white/5">
                              <img src={order.shoe_image} alt={order.shoe_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{order.shoe_name}</h4>
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 shrink-0">{order.shoe_supplier}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
                                  {order.shoe_color}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">المقاس {order.size}</span>
                                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{order.quantity} × {order.shoe_price.toLocaleString()} د.ج</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-muted border border-border">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-extrabold shrink-0">
                              {order.buyer_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-foreground truncate">{order.buyer_name}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {order.governorate}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/40 dark:border-white/[0.04]">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleDateString("ar-DZ")}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-base font-extrabold text-gray-900 dark:text-white tabular-nums">{order.total_price.toLocaleString()}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">د.ج</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleDeliverOrder(order.id)}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success text-success-foreground text-xs font-bold hover:opacity-90 active:scale-[0.97] transition-all duration-200"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              تم التسليم
                            </button>
                            <button
                              onClick={() => handleReturnOrder(order.id)}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 active:scale-[0.97] transition-all duration-200"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              إرجاع للمخزن
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              );
            })()}
          </div>
        )}

        {/* Completed Orders Tab */}
        {activeTab === "completed" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-success/10 dark:bg-success/15 flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-bold">الطلبات المكتملة</h2>
                <p className="text-[11px] text-muted-foreground">{completedOrders.length} طلب</p>
              </div>
            </div>

            {completedOrders.length > 0 && (
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الولاية..."
                  className="w-full pr-9 pl-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground shadow-sm"
                />
              </div>
            )}

            {(() => {
              const filtered = completedOrders.filter((o) => {
                if (!orderSearch.trim()) return true;
                const q = orderSearch.toLowerCase();
                return (
                  o.buyer_name.toLowerCase().includes(q) ||
                  o.governorate.toLowerCase().includes(q) ||
                  o.shoe_name.toLowerCase().includes(q) ||
                  o.shoe_supplier.toLowerCase().includes(q)
                );
              });

              return filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 text-muted-foreground">
                  <Package className="w-14 h-14 mb-4 opacity-15" />
                  <p className="font-bold text-sm">
                    {orderSearch.trim() ? "لا توجد نتائج بحث" : "لا توجد طلبات مكتملة"}
                  </p>
                  <p className="text-xs mt-1 opacity-60">
                    {orderSearch.trim() ? "جرّب كلمات مختلفة" : "ستظهر الطلبات المكتملة هنا"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, x: -30 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="group relative rounded-2xl overflow-hidden border bg-card border-border shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="p-4">
                          <div className="flex gap-3">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0 border border-gray-200/50 dark:border-white/5">
                              <img src={order.shoe_image} alt={order.shoe_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{order.shoe_name}</h4>
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 shrink-0">{order.shoe_supplier}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
                                  {order.shoe_color}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">المقاس {order.size}</span>
                                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{order.quantity} × {order.shoe_price.toLocaleString()} د.ج</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-muted border border-border">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-extrabold shrink-0">
                              {order.buyer_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-foreground truncate">{order.buyer_name}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {order.governorate}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/40 dark:border-white/[0.04]">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Check className="w-3 h-3 text-emerald-500" />
                              {order.completed_at ? new Date(order.completed_at).toLocaleDateString("ar-DZ") : ""}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-base font-extrabold text-gray-900 dark:text-white tabular-nums">{order.total_price.toLocaleString()}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">د.ج</span>
                            </div>
                          </div>

                          {order.returned_at ? (
                            <div className="flex items-center gap-1.5 mt-3 pt-2">
                              <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                                <Undo2 className="w-3 h-3 text-destructive-foreground" />
                              </div>
                              <span className="text-[11px] font-bold text-destructive">أُرجع{order.return_reason ? ` — ${order.return_reason}` : ""}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-3 pt-2">
                              <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                                <Check className="w-3 h-3 text-success-foreground" />
                              </div>
                              <span className="text-[11px] font-bold text-success">تم التسليم بنجاح</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* ── Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/80 dark:bg-card/80 backdrop-blur-2xl border-t border-border">
        <div className="max-w-lg mx-auto flex items-stretch">
          <button
            onClick={() => setActiveTab("inventory")}
            className={[
              "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 relative",
              activeTab === "inventory"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {activeTab === "inventory" && (
              <motion.div
                layoutId="bottomTab"
                className="absolute top-0 inset-x-8 h-[3px] rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <div className={[
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
              activeTab === "inventory"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted",
            ].join(" ")}>
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold leading-none">المخزون</span>
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={[
              "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 relative",
              activeTab === "pending"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {activeTab === "pending" && (
              <motion.div
                layoutId="bottomTab"
                className="absolute top-0 inset-x-8 h-[3px] rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <div className="relative">
              <div className={[
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                activeTab === "pending"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted",
              ].join(" ")}>
                <ClipboardList className="w-4 h-4" />
              </div>
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold leading-none">معلق</span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={[
              "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 relative",
              activeTab === "completed"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {activeTab === "completed" && (
              <motion.div
                layoutId="bottomTab"
                className="absolute top-0 inset-x-8 h-[3px] rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <div className={[
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
              activeTab === "completed"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted",
            ].join(" ")}>
              <Check className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold leading-none">مكتمل</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {modalMode && activeShoe && (
          <ModalShell
            key="modal"
            title={modalTitles[modalMode]}
            subtitle={modalMode === "add" ? undefined : `${activeShoe.supplier} ${activeShoe.name} · ${activeShoe.color}`}
            onClose={closeModal}
          >
            {modalMode === "edit" || modalMode === "add" ? (
              <EditModal shoe={activeShoe} mode={modalMode === "add" ? "add" : "edit"} onSave={handleSave} saving={saving} />
            ) : (
              <ActionModal
                shoe={activeShoe}
                mode={modalMode}
                onConfirm={handleConfirm}
              />
            )}
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast} />}
      </AnimatePresence>
    </div>
  );
}
