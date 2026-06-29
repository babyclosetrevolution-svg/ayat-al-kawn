import type { ButtonHTMLAttributes, ReactNode } from "react";
import { GLASS_BUTTON } from "../styles";

/**
 * GlassIconButton — small floating circular control used for panel launchers,
 * pins and dismissals. All floating controls in the app share this base so
 * the visual language stays unified.
 */
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  active?: boolean;
  children: ReactNode;
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-9 w-9 text-[0.7rem]",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export function GlassIconButton({
  size = "md",
  active,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={`${GLASS_BUTTON} ${SIZES[size]} ${
        active ? "border-white/40 text-white bg-white/10" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
