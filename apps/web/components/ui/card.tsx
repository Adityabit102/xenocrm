import * as React from "react";





const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }
>(({ className, hoverable = true, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-[12px] border border-border bg-bg-surface text-text-primary shadow-[0_1px_3px_rgba(99, 86, 70,0.06)] transition-all duration-200 ${
      hoverable ? "hover:shadow-[0_4px_12px_rgba(99, 86, 70,0.08),0_1px_3px_rgba(99, 86, 70,0.04)]" : ""
    } ${className || ""}`}
    {...props}
  />
));
Card.displayName = "Card";

/**
 * Header section of Card, containing Title and Description.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 px-6 pt-5 pb-3 ${className || ""}`}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";




const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * Description subtitle for card header block.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-text-secondary ${className || ""}`}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";




const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`px-6 py-4 pt-0 ${className || ""}`} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * Footer actions bar inside a card.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center px-6 pb-5 pt-3 ${className || ""}`}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
