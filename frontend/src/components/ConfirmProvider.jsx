import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Aceptar",
    cancelLabel: "Cancelar",
    danger: false,
  });
  const resolverRef = useRef(null);

  const confirm = useCallback((opts) => {
    const o = typeof opts === "string" ? { message: opts } : (opts || {});
    setState({
      open: true,
      title: o.title || "Confirmar",
      message: o.message || "",
      confirmLabel: o.confirmLabel || "Aceptar",
      cancelLabel: o.cancelLabel || "Cancelar",
      danger: !!o.danger,
    });
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const finish = (result) => {
    const r = resolverRef.current;
    resolverRef.current = null;
    setState((s) => ({ ...s, open: false }));
    if (r) r(result);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        danger={state.danger}
        onConfirm={() => finish(true)}
        onCancel={() => finish(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return ctx;
}