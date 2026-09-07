import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: { default: "bg-teal-700 text-white shadow-sm hover:bg-teal-800", secondary: "border border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50", ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900", destructive: "bg-rose-600 text-white hover:bg-rose-700", soft: "bg-teal-50 text-teal-800 hover:bg-teal-100" },
    size: { default: "h-10 px-4 py-2", sm: "h-8 rounded-lg px-3 text-xs", lg: "h-12 px-5" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />);
Button.displayName = "Button";
export { Button, buttonVariants };
