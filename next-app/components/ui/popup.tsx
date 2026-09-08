import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PopupVariant = "success" | "error" | "warning" | "info";

type PopupProps = {
  variant: PopupVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
};

const variantConfig: Record<PopupVariant, { icon: typeof Info; iconClass: string; panelClass: string }> = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-600", panelClass: "border-emerald-100 bg-emerald-50" },
  error: { icon: XCircle, iconClass: "text-rose-600", panelClass: "border-rose-100 bg-rose-50" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-600", panelClass: "border-amber-100 bg-amber-50" },
  info: { icon: Info, iconClass: "text-sky-600", panelClass: "border-sky-100 bg-sky-50" },
};

export function Popup({
  variant,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onClose,
  onConfirm,
}: PopupProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const isConfirmation = Boolean(onConfirm);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirmation) onClose();
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        aria-describedby="popup-message"
      >
        <div className={`flex items-start gap-3 border-b p-5 ${config.panelClass}`}>
          <Icon size={22} className={`mt-0.5 shrink-0 ${config.iconClass}`} />
          <div className="min-w-0 flex-1">
            <h2 id="popup-title" className="font-display text-base font-bold text-slate-950">
              {title}
            </h2>
            <p id="popup-message" className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {message}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:bg-white/70 hover:text-slate-700"
            onClick={onClose}
            aria-label="Đóng thông báo"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          {isConfirmation && (
            <Button type="button" variant="secondary" onClick={onClose}>
              {cancelLabel ?? "Hủy"}
            </Button>
          )}
          <Button
            type="button"
            variant={isConfirmation ? "default" : "secondary"}
            onClick={onConfirm ?? onClose}
          >
            {confirmLabel ?? "Đóng"}
          </Button>
        </div>
      </div>
    </div>
  );
}
