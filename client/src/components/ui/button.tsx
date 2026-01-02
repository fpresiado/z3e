import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "secondary" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", disabled, children, ...props }, ref) => {
    const baseStyles =
      "font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variantStyles = {
      default: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400",
      destructive: "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400",
      secondary: "bg-gray-200 text-black hover:bg-gray-300 disabled:bg-gray-100",
      ghost: "bg-transparent text-black hover:bg-gray-100 disabled:opacity-50",
      outline: "border border-gray-300 bg-transparent text-black hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800 disabled:opacity-50",
    };
    const sizeStyles = {
      default: "px-4 py-2 text-base",
      sm: "px-3 py-1 text-sm",
      lg: "px-6 py-3 text-lg",
      icon: "w-10 h-10 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
