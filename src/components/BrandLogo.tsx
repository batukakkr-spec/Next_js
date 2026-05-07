import Image from "next/image";
import brandMark from "@/assets/xuchtrack-logo.png";
import { cn } from "@/lib/utils";

type BrandLogoSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<
  BrandLogoSize,
  {
    wrapper: string;
    panel: string;
    icon: string;
    title: string;
    subtitle: string;
    line: string;
  }
> = {
  sm: {
    wrapper: "gap-3",
    panel: "h-11 w-11",
    icon: "h-7 w-7",
    title: "text-lg tracking-[0.18em]",
    subtitle: "text-[9px] tracking-[0.34em]",
    line: "w-10",
  },
  md: {
    wrapper: "gap-3.5",
    panel: "h-14 w-14",
    icon: "h-9 w-9",
    title: "text-2xl tracking-[0.2em]",
    subtitle: "text-[10px] tracking-[0.42em]",
    line: "w-14",
  },
  lg: {
    wrapper: "gap-4",
    panel: "h-16 w-16",
    icon: "h-10 w-10",
    title: "text-[2rem] tracking-[0.24em]",
    subtitle: "text-[11px] tracking-[0.48em]",
    line: "w-20",
  },
};

export function BrandLogo({
  size = "md",
  showSubtitle = true,
  className,
}: {
  size?: BrandLogoSize;
  showSubtitle?: boolean;
  className?: string;
}) {
  const styles = SIZE_STYLES[size];

  return (
    <div className={cn("inline-flex items-center", styles.wrapper, className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden border border-primary/35 bg-[linear-gradient(135deg,oklch(0.09_0.03_255/0.98),oklch(0.13_0.05_250/0.95))] shadow-[0_0_0_1px_oklch(0.88_0.22_215/0.12),0_0_28px_oklch(0.50_0.22_240/0.24)]",
          styles.panel,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.88_0.22_215/0.22),transparent_55%),radial-gradient(circle_at_75%_70%,oklch(0.62_0.28_290/0.18),transparent_52%)]" />
        <div className="absolute inset-[1px] border border-primary/20" />
        <Image
          src={brandMark}
          alt="XuchTrack mark"
          width={40}
          height={40}
          sizes="(max-width: 768px) 28px, 40px"
          className={cn(
            "relative z-10 mx-auto mt-1 object-contain drop-shadow-[0_0_18px_oklch(0.88_0.22_215/0.55)]",
            styles.icon,
          )}
        />
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            "glow-text font-black leading-none text-foreground [text-shadow:0_0_8px_oklch(0.92_0.22_215/0.75)]",
            styles.title,
          )}
        >
          XuchTrack
        </p>
        {showSubtitle ? (
          <div className="mt-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 bg-primary-glow [clip-path:polygon(0_0,100%_50%,0_100%)]" />
            <span className={cn("system-label text-primary-glow/90", styles.subtitle)}>
              HUNTER SYSTEM V2
            </span>
            <span
              className={cn(
                "h-px shrink-0 bg-gradient-to-r from-primary-glow/65 to-transparent",
                styles.line,
              )}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
