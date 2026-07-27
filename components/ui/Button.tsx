import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-teal-700 text-white hover:bg-teal-800 focus-visible:outline-teal-700",
        variant === "secondary" &&
          "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:outline-teal-700",
        variant === "ghost" &&
          "text-zinc-700 hover:bg-zinc-100 focus-visible:outline-teal-700",
        className
      )}
      {...props}
    />
  );
}
