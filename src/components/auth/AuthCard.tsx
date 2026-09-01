import type { ReactNode } from "react";

type AuthCardProps = {
  /** Lado do painel do formulário dentro do card. */
  formSide?: "left" | "right";
  /** Conteúdo do painel vitrine (logo, título, CTA). */
  showcase?: ReactNode;
  /** Conteúdo do painel do formulário. */
  children: ReactNode;
  /** Formulários em duas colunas (cadastro) pedem mais largura. */
  wide?: boolean;
};

/**
 * Card grande arredondado dividido em dois painéis: formulário (navy sólido)
 * e vitrine (gradiente com feixes de luz), como no design do projeto antigo.
 */
export function AuthCard({ formSide = "left", showcase, children, wide = false }: AuthCardProps) {
  const formPanel = (
    <section className={`af-panel relative flex items-center justify-center px-6 py-12 sm:px-10 sm:py-14 ${showcase ? "lg:w-[46%] lg:shrink-0" : "w-full"}`}>
      <div className={`w-full ${wide ? "max-w-xl" : "max-w-md"}`}>{children}</div>
    </section>
  );

  return (
    <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-[color:var(--af-border)] shadow-[0_40px_120px_-30px_rgba(2,6,23,0.9)] lg:flex-row">
      {!showcase ? formPanel : formSide === "left" ? (
        <>
          {formPanel}
          {showcase}
        </>
      ) : (
        <>
          {showcase}
          {formPanel}
        </>
      )}
    </div>
  );
}
