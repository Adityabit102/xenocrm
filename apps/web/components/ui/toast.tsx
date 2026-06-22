import { toast as hotToast, Toaster as HotToaster } from "react-hot-toast";








export const toast = {
  success: (message: string) =>
    hotToast.success(message, {
      duration: 4000,
      style: {
        borderLeft: "4px solid #4E9B8A",
        background: "#FFFFFF", border: "1px solid #E5DBC9",
        color: "#38322E",
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
        borderLeft: "4px solid #CC6B6B",
        background: "#FFFFFF", border: "1px solid #E5DBC9",
        color: "#38322E",
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
        borderLeft: "4px solid #C9954E",
        background: "#FFFFFF", border: "1px solid #E5DBC9",
        color: "#38322E",
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
        borderLeft: "4px solid #3E8A9E",
        background: "#FFFFFF", border: "1px solid #E5DBC9",
        color: "#38322E",
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
