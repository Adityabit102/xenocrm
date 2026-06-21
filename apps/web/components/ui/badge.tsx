import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors select-none border",
  {
    variants: {
      variant: {
        
        queued:     "bg-status-warn/10    text-status-warn    border-status-warn/20",
        sent:       "bg-status-info/10   text-status-info    border-status-info/20",
        delivered:  "bg-secondary-fixed-dim/10 text-secondary-fixed-dim border-secondary-fixed-dim/20",
        failed:     "bg-status-danger/10 text-status-danger  border-status-danger/20",
        opened:     "bg-status-info/10   text-status-info    border-status-info/20",
        read:       "bg-tertiary/10      text-tertiary       border-tertiary/20",
        clicked:    "bg-tertiary/15      text-tertiary       border-tertiary/25",
        attributed: "bg-secondary-fixed-dim/10 text-secondary-fixed-dim border-secondary-fixed-dim/20",

        
        whatsapp:   "bg-[#2FA56F]/10 text-[#2FA56F] border-[#2FA56F]/20",
        sms:        "bg-surface-container-high text-text-secondary border-border-mid",
        email:      "bg-status-info/10 text-status-info border-status-info/20",
        rcs:        "bg-status-danger/10 text-status-danger border-status-danger/20",

        default:    "bg-surface-container-high text-text-secondary border-border-mid",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}

export { Badge, badgeVariants };
