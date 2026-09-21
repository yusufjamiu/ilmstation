import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OnboardShell({
  children,
  step,
  total,
  back,
  title,
  subtitle,
  wide,
}: {
  children: ReactNode;
  step?: number;
  total?: number;
  back?: string;
  title?: string;
  subtitle?: string;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-black">
          <span className="brutal-sm grid h-9 w-9 place-items-center rounded-r8 bg-yellow">
            <Sparkles size={18} strokeWidth={2.5} />
          </span>
          <span className="text-[18px]">IlmStation</span>
        </Link>
        {step && total ? (
          <div className="mono ml-auto text-[11px] font-bold text-ink2 uppercase">
            Step {step} / {total}
          </div>
        ) : null}
      </header>

      {step && total ? (
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div className="h-1.5 w-full overflow-hidden rounded-rf bg-field">
            <div
              className="h-full bg-green transition-[width] duration-500"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      <main className="mx-auto flex w-full flex-1 flex-col justify-center px-5 py-10 sm:px-8">
        <div className={cn("mx-auto w-full", wide ? "max-w-3xl" : "max-w-md")}>
          {back ? (
            <Link
              to={back}
              className="mb-5 inline-flex items-center gap-2 text-[13px] font-bold text-ink2 hover:text-ink"
            >
              <ArrowLeft size={16} /> Back
            </Link>
          ) : null}
          {title ? <h1 className="text-[38px] leading-[1.08] font-black sm:text-[44px]">{title}</h1> : null}
          {subtitle ? <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-ink2">{subtitle}</p> : null}
          <div className={title ? "mt-8" : ""}>{children}</div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[1200px] px-5 py-5 text-center text-[11px] font-bold text-muted uppercase">
        Seek · Learn · Grow
      </footer>
    </div>
  );
}
