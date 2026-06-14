import * as React from "react";





const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={`w-full caption-bottom text-sm border-collapse ${className || ""}`}
      {...props}
    />
  </div>
));
Table.displayName = "Table";




const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={`[&_tr]:border-b border-border ${className || ""}`} {...props} />
));
TableHeader.displayName = "TableHeader";

/**
 * Table body section wrapper.
 */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={`[&_tr:last-child]:border-0 ${className || ""}`}
    {...props}
  />
));
TableBody.displayName = "TableBody";




const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={`border-t border-border bg-bg-subtle/50 font-medium [&_tr]:last-child:border-0 ${className || ""}`}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

/**
 * Row element wrapper. Sets hover background and standard h-12 (48px) heights.
 */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={`border-b border-border transition-colors hover:bg-bg-subtle data-[state=selected]:bg-brand-primary-light h-[48px] ${className || ""}`}
    {...props}
  />
));
TableRow.displayName = "TableRow";





const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={`h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-text-secondary sticky top-0 bg-bg-surface z-10 border-b border-border [&:has([role=checkbox])]:pr-0 ${className || ""}`}
    {...props}
  />
));
TableHead.displayName = "TableHead";

/**
 * Data cell element wrapper.
 */
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ""}`}
    {...props}
  />
));
TableCell.displayName = "TableCell";




const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={`mt-4 text-sm text-text-secondary ${className || ""}`}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
