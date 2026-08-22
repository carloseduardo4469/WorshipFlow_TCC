import Image from "next/image";
import Link from "next/link";
import logo from "@/app/icon.png";

type ShowcaseProps = {
  /** Título serifado grande (pode conter <br /> para quebras). */
  title: React.ReactNode;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
};

/**
 * Painel vitrine do card: gradiente roxo→ciano→navy, grade, três feixes de
 * luz verticais, logo circular grande, título serifado e botão pill.
 */
export function Showcase({ title, subtitle, ctaHref, ctaLabel }: ShowcaseProps) {
  return (
    <aside className="af-showcase relative flex items-center justify-center overflow-hidden px-8 py-16 lg:flex-1 lg:py-12">
      <div aria-hidden className="af-gridlines pointer-events-none absolute inset-0" />

      {/* Feixes de luz: dourado, ciano e violeta */}
      <div aria-hidden className="af-beam left-[16%] w-9 bg-[#e8a33d]" />
      <div aria-hidden className="af-beam left-1/2 w-7 -translate-x-1/2 bg-[#39c6f4]" />
      <div aria-hidden className="af-beam left-[78%] w-9 bg-[#8b5cf6]" />

      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        <div className="relative mb-8 h-28 w-28 overflow-hidden rounded-full shadow-[0_0_70px_rgba(56,189,248,0.28)] ring-1 ring-white/15">
          <Image src={logo} alt="" fill sizes="112px" className="object-cover" priority />
        </div>

        <h2 className="font-serif text-5xl font-black leading-[1.02] text-white sm:text-6xl">
          {title}
        </h2>

        <p className="mt-5 max-w-md text-[15px] font-semibold leading-relaxed text-slate-200/90">
          {subtitle}
        </p>

        <Link
          href={ctaHref}
          className="mt-8 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-amber/70 hover:bg-white/10"
        >
          {ctaLabel}
        </Link>
      </div>
    </aside>
  );
}
