import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Focusable from "./Focusable";
import { useFocusEngine } from "../hooks/useFocusEngine";

export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  useFocusEngine({
    enabled: open,
    onBack: onCancel,
  });

  useEffect(() => {
    if (!open) return;
    // pequeña espera para que el foco inicial se coloque
    const t = setTimeout(() => {
      const el = document.querySelector('[data-focus-id="confirm-yes"]');
      if (el && !el.getAttribute("data-focused")) {
        const first = document.querySelector('[data-focus-id="confirm-yes"]');
        if (first && first.focus) first.focus();
      }
    }, 80);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-8" data-testid="confirm-dialog">
      <div className="glass-strong rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-red-500/20 text-red-300" : "bg-amber-400/20 text-amber-300"}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-title text-lg text-white uppercase tracking-widest mb-1">
              {title || "Confirmar"}
            </h3>
            {message && <p className="text-sm text-slate-300 leading-relaxed">{message}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Focusable
            id="confirm-no"
            testId="confirm-no"
            onSelect={onCancel}
            className="h-11 px-5 rounded-full glass text-white font-mono tracking-widest uppercase text-xs"
          >
            {cancelLabel || "Cancelar"}
          </Focusable>
          <Focusable
            id="confirm-yes"
            testId="confirm-yes"
            onSelect={onConfirm}
            className={`h-11 px-5 rounded-full font-mono tracking-widest uppercase text-xs ${danger ? "bg-red-500 text-white" : "bg-amber-400 text-black"}`}
          >
            {confirmLabel || "Aceptar"}
          </Focusable>
        </div>
      </div>
    </div>
  );
}