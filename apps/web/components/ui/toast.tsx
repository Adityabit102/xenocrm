import { toast as hotToast, Toaster as HotToaster } from "react-hot-toast";








export const toast = {
  success: (message: string) =>
    hotToast.success(message, {
      duration: 4000,
      style: {
        borderLeft: "4px solid var(--color-success)",
        background: "var(--color-bg-surface)",
        color: "var(--color-text-primary)",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(99, 86, 70,0.08)",
        fontSize: "14px",
        fontWeight: 500
      }
    }),
    
  error: (message: string) =>
    hotToast.error(message, {
      duration: 4000,
      style: {
        borderLeft: "4px solid var(--color-error)",
        background: "var(--color-bg-surface)",
        color: "var(--color-text-primary)",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(99, 86, 70,0.08)",
        fontSize: "14px",
        fontWeight: 500
      }
    }),
    
  warning: (message: string) =>
    hotToast(message, {
      duration: 4000,
      icon: "⚠️",
      style: {
        borderLeft: "4px solid var(--color-warning)",
        background: "var(--color-bg-surface)",
        color: "var(--color-text-primary)",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(99, 86, 70,0.08)",
        fontSize: "14px",
        fontWeight: 500
      }
    }),
    
  info: (message: string) =>
    hotToast(message, {
      duration: 4000,
      icon: "ℹ️",
      style: {
        borderLeft: "4px solid var(--color-info)",
        background: "var(--color-bg-surface)",
        color: "var(--color-text-primary)",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(99, 86, 70,0.08)",
        fontSize: "14px",
        fontWeight: 500
      }
    }),
    
  custom: hotToast
};





export const Toaster = HotToaster;
