import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 whitespace-normal rounded-sm border-2 border-transparent text-center text-sm font-semibold leading-tight cursor-pointer transition-[transform,box-shadow,background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-foreground bg-primary text-primary-foreground shadow-brutal hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none",
        destructive: "border-foreground bg-destructive text-destructive-foreground shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        outline:
          "border-foreground bg-background text-foreground shadow-brutal-sm hover:bg-accent active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        secondary: "border-foreground bg-secondary text-secondary-foreground shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 py-1.5 text-xs",
        lg: "min-h-10 rounded-md px-5 py-2 sm:px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
