import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm ${className}`}
      {...props}
    />
  ),
);

Card.displayName = "Card";
