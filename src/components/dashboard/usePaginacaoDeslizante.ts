"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefCallback, RefObject } from "react";

/**
 * Hook de paginação com "janela deslizante" para listas que vêm do banco.
 *
 * - Carrega uma página de cada vez (offset/limit) — nunca o catálogo inteiro.
 * - Ao rolar até o fim da caixa, o IntersectionObserver pede a próxima página.
 * - Linhas que já passaram do viewport são descartadas do DOM (somem) e um
 *   spacer no topo preserva a posição da rolagem; ao rolar de volta elas
 *   re-entram no DOM sem nova requisição.
 */

export type CarregarPagina<T> = (offset: number, limite: number) => Promise<T[]>;

const TAMANHO_PAGINA_PADRAO = 20;
const LIMITE_DOM_PADRAO = 60;
const ALTURA_PADRAO_LINHA = 42;
/** Folga (px) usada para mover a janela antes de "perder" o viewport. */
const OVERSAN = 320;

export interface OpcoesPaginacao<T> {
  /** Busca paginada reutilizável (ex.: Server Action `buscarMusicas`). */
  buscaPorPagina: CarregarPagina<T>;
  chaveDeItem: (item: T) => string | number;
  tamanhoPagina?: number;
  /** Quantidade máxima de linhas mantidas no DOM ao mesmo tempo. */
  limiteDom?: number;
  /** Altura estimada de uma linha ainda não medida (usada no spacer). */
  alturaPadraoLinha?: number;
  /** Qualquer mudança nesta string zera a lista e recarrega da página 1. */
  reiniciarAo?: string;
}

export interface PaginacaoDeslizante<T> {
  containerRef: RefObject<HTMLDivElement>;
  sentinelaRef: RefCallback<HTMLElement>;
  itensVisiveis: T[];
  topoAltura: number;
  fundoAltura: number;
  carregando: boolean;
  carregandoMais: boolean;
  temMais: boolean;
  erro: boolean;
  totalCarregado: number;
  roleiDaLista: boolean;
  refLinha: (item: T) => (elemento: HTMLElement | null) => void;
  voltarAoTopo: () => void;
  removerItem: (item: T) => number;
  restaurarItem: (item: T, indiceOriginal: number) => void;
}

export function usePaginacaoDeslizante<T>(opcoes: OpcoesPaginacao<T>): PaginacaoDeslizante<T> {
  const {
    buscaPorPagina,
    chaveDeItem,
    tamanhoPagina = TAMANHO_PAGINA_PADRAO,
    limiteDom = LIMITE_DOM_PADRAO,
    alturaPadraoLinha = ALTURA_PADRAO_LINHA,
    reiniciarAo = "",
  } = opcoes;

  const [itens, setItens] = useState<T[]>([]);
  const [inicio, setInicio] = useState(0);
  const [topoAltura, setTopoAltura] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMais, setTemMais] = useState(true);
  const [erro, setErro] = useState(false);
  const [roleiDaLista, setRoleiDaLista] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelaElementoRef = useRef<HTMLElement | null>(null);
  const sentinelaRef = useCallback((elemento: HTMLElement | null) => {
    sentinelaElementoRef.current = elemento;
  }, []);
  const alturasRef = useRef(new Map<string | number, number>());
  const itensRef = useRef<T[]>([]);
  const inicioRef = useRef(0);
  const topoRef = useRef(0);
  const carregandoRef = useRef(false);
  const geracaoRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const definirInicio = useCallback((valor: number) => {
    inicioRef.current = valor;
    setInicio(valor);
  }, []);

  const definirTopo = useCallback((valor: number) => {
    topoRef.current = valor;
    setTopoAltura(valor);
  }, []);

  const definirCarregandoMais = useCallback((valor: boolean) => {
    carregandoRef.current = valor;
    setCarregandoMais(valor);
  }, []);

  const alturaDe = useCallback(
    (item: T): number => alturasRef.current.get(chaveDeItem(item)) ?? alturaPadraoLinha,
    [chaveDeItem, alturaPadraoLinha]
  );

  const alturaDeRef = useRef(alturaDe);
  alturaDeRef.current = alturaDe;

  const fim = Math.min(inicio + limiteDom, itens.length);
  const itensVisiveis = itens.slice(inicio, fim);

  let fundoAltura = 0;
  for (let i = fim; i < itens.length; i++) fundoAltura += alturaDe(itens[i]);
// Carrega a primeira página sempre que a busca/filtro mudar.
  useEffect(() => {
    const geracao = ++geracaoRef.current;
    itensRef.current = [];
    setItens([]);
    alturasRef.current = new Map();
    definirInicio(0);
    definirTopo(0);
    setTemMais(true);
    setErro(false);
    setRoleiDaLista(false);
    definirCarregandoMais(false);
    setCarregando(true);
    containerRef.current?.scrollTo({ top: 0 });

    let ativo = true;
    const timer = setTimeout(async () => {
      try {
        const resultado = await buscaPorPagina(0, tamanhoPagina + 1);
        if (!ativo || geracao !== geracaoRef.current) return;
        itensRef.current = resultado.slice(0, tamanhoPagina);
        setItens(itensRef.current);
        setTemMais(resultado.length > tamanhoPagina);
      } catch {
        if (ativo && geracao === geracaoRef.current) setErro(true);
      } finally {
        if (ativo && geracao === geracaoRef.current) setCarregando(false);
      }
    }, 0);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [reiniciarAo, buscaPorPagina, tamanhoPagina, definirInicio, definirTopo, definirCarregandoMais]);

  const carregarMais = useCallback(async () => {
    if (carregandoRef.current || !temMais) return;
    const geracao = geracaoRef.current;
    definirCarregandoMais(true);
    try {
      const resultado = await buscaPorPagina(itensRef.current.length, tamanhoPagina + 1);
      if (geracao !== geracaoRef.current) return;
      const pagina = resultado.slice(0, tamanhoPagina);
      const vistos = new Set(itensRef.current.map(chaveDeItem));
      const novos = pagina.filter((item) => !vistos.has(chaveDeItem(item)));
      itensRef.current = [...itensRef.current, ...novos];
      setItens(itensRef.current);
      setTemMais(resultado.length > tamanhoPagina);
    } catch {
      if (geracao === geracaoRef.current) setErro(true);
    } finally {
      if (geracao === geracaoRef.current) definirCarregandoMais(false);
    }
  }, [buscaPorPagina, tamanhoPagina, temMais, chaveDeItem, definirCarregandoMais]);
// Move a janela conforme o scroll: descarta linhas acima e reconquista ao subir.
  const deslizarJanela = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;

    const atual = itensRef.current;
    let novoInicio = inicioRef.current;
    let novaTopo = topoRef.current;

    // Desce: linhas que já passaram (com folga) do viewport saem do DOM.
    while (novoInicio < atual.length) {
      const h = alturaDeRef.current(atual[novoInicio]);
      if (novaTopo + h > scrollTop - OVERSAN) break;
      novaTopo += h;
      novoInicio++;
    }

    // Sobe: ao voltar, as linhas re-entram no DOM.
    while (novoInicio > 0) {
      const h = alturaDeRef.current(atual[novoInicio - 1]);
      if (novaTopo - h <= scrollTop - OVERSAN) break;
      novaTopo -= h;
      novoInicio--;
    }

    if (novoInicio !== inicioRef.current) definirInicio(novoInicio);
    if (novaTopo !== topoRef.current) definirTopo(novaTopo);
  }, [definirInicio, definirTopo]);
const aoRolar = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rolou = container.scrollTop > 80;
    setRoleiDaLista((atual) => (atual === rolou ? atual : rolou));

    // Fallback para navegadores/layouts em que a sentinela pode ficar coberta
    // pela borda da caixa: antecipa a próxima página perto do final.
    const distanciaDoFim = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanciaDoFim < 180 && temMais && !carregandoRef.current) {
      void carregarMais();
    }

    if (frameRef.current != null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      deslizarJanela();
    });
  }, [carregarMais, deslizarJanela, temMais]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      container.removeEventListener("scroll", aoRolar);
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [aoRolar]);

  // Infinite scroll: quando a sentinela (fim da lista) aparece, busca a próxima página.
  useEffect(() => {
    const container = containerRef.current;
    const sentinela = sentinelaElementoRef.current;
    if (!container || !sentinela) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || carregando) return;
        const chegouNoFim = inicioRef.current + limiteDom >= itensRef.current.length;
        if (chegouNoFim && temMais && !carregandoRef.current) carregarMais();
      },
      { root: container, rootMargin: "220px 0px" }
    );
    observer.observe(sentinela);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarMais, temMais, limiteDom, carregando]);

  const refLinha = useCallback(
    (item: T) => (elemento: HTMLElement | null) => {
      if (!elemento) return;
      const alturaReal = elemento.getBoundingClientRect().height;
      if (alturaReal <= 0) return;
      // Em layouts com row-gap (ex.: grade do tbody no mobile), a "vaga" de cada
      // linha inclui o gap — sem isso o spacer desincroniza ao descartar linhas.
      const pai = elemento.parentElement;
      const gap = pai ? Number.parseFloat(getComputedStyle(pai).rowGap) || 0 : 0;
      alturasRef.current.set(chaveDeItem(item), alturaReal + gap);
    },
    [chaveDeItem]
  );

  const voltarAoTopo = useCallback(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const removerItem = useCallback(
    (item: T) => {
      const chave = chaveDeItem(item);
      const indice = itensRef.current.findIndex((atual) => chaveDeItem(atual) === chave);
      if (indice === -1) return -1;

      const proximos = itensRef.current.filter((_, itemIndice) => itemIndice !== indice);
      itensRef.current = proximos;
      setItens(proximos);

      if (indice < inicioRef.current) {
        const novoInicio = Math.max(0, inicioRef.current - 1);
        definirInicio(novoInicio);
        definirTopo(Math.max(0, topoRef.current - alturaDeRef.current(item)));
      }
      return indice;
    },
    [chaveDeItem, definirInicio, definirTopo]
  );

  const restaurarItem = useCallback(
    (item: T, indiceOriginal: number) => {
      if (itensRef.current.some((atual) => chaveDeItem(atual) === chaveDeItem(item))) return;
      const indice = Math.min(Math.max(0, indiceOriginal), itensRef.current.length);
      const proximos = [...itensRef.current];
      proximos.splice(indice, 0, item);
      itensRef.current = proximos;
      setItens(proximos);
    },
    [chaveDeItem]
  );

  return {
    containerRef,
    sentinelaRef,
    itensVisiveis,
    topoAltura,
    fundoAltura,
    carregando,
    carregandoMais,
    temMais,
    erro,
    totalCarregado: itens.length,
    roleiDaLista,
    refLinha,
    voltarAoTopo,
    removerItem,
    restaurarItem,
  };
}
