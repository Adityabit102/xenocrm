import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-label-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-container text-on-primary-container hover:bg-primary-container/90 shadow-glow-indigo/10 hover:shadow-glow-indigo",
        secondary:
          "bg-surface-container-high border border-border-mid text-text-primary hover:text-primary hover:border-primary/50 hover:bg-surface-container-highest",
        ghost:
          "bg-transparent text-primary hover:bg-primary-container/10",
        danger:
          "bg-status-danger/10 text-status-danger border border-status-danger/30 hover:bg-status-danger hover:text-white",
        ai:
          "bg-gradient-to-r from-tertiary-container via-primary-container to-tertiary text-on-primary-container shadow-md hover:brightness-110 animate-shimmer bg-[length:200%_auto]",
        mint:
          "bg-secondary-fixed-dim text-on-secondary-fixed hover:shadow-glow-mint hover:brightness-105",
        outline:
          "border border-border-mid bg-transparent text-text-secondary hover:border-primary hover:text-primary",
      },
      size: {
        sm:      "h-8  px-3  text-[12px] rounded-lg  gap-1.5",
        default: "h-9  px-4  text-[13px] rounded-lg  gap-2",
        lg:      "h-11 px-6  text-[15px] rounded-xl  gap-2.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => (
    <button
      className={buttonVariants({ variant, size, className })}
      ref={ref}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {size !== "sm" && <span>Loading...</span>}
        </>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
