import * as React from "react";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  
  live?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, live, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-xl pb-lg border-b border-border-subtle select-none">
      <div className="flex flex-col min-w-0">
        <h1 className="font-headline-h1 text-headline-h1 text-text-primary tracking-tight leading-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="font-body-md text-body-md text-text-secondary mt-1 flex items-center gap-2 max-w-2xl">
            {live && (
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed-dim opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-fixed-dim" />
              </span>
            )}
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-md flex-shrink-0 sm:ml-auto flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
