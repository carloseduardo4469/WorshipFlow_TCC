"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Bell, BellRing, CheckCheck, Loader2, X } from "lucide-react";
import { ativarPush, desativarPush, listarNotificacoes, marcarNotificacoesLidas } from "@/lib/actions/notifications";
import { useDialogA11y } from "@/components/ui/useDialogA11y";
import type { NotificationItem } from "@/lib/notifications/events";
import logo from "@/app/icon.webp";

const NotificationContext = createContext({ unread: 0, open: () => {} });
export function NotificationBell() {
  const { unread, open } = useContext(NotificationContext);
  return <button type="button" onClick={open} className="db-icon-button wf-notification-bell" aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`} aria-haspopup="dialog">
    <Bell size={19} />{unread > 0 && <span className="wf-notification-count" aria-hidden>{unread > 9 ? "9+" : unread}</span>}
  </button>;
}

type PushSupport = "checking" | "supported" | "install" | "unsupported";
function subscribeBrowserStatus(callback: () => void) {
  window.addEventListener("focus", callback);
  document.addEventListener("visibilitychange", callback);
  return () => { window.removeEventListener("focus", callback); document.removeEventListener("visibilitychange", callback); };
}
function getPushSupport(): PushSupport {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
  return ios && !standalone ? "install" : window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window ? "supported" : "unsupported";
}
function keyBytes(value: string) {
  const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
async function readyWorker() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("O aparelho ainda está preparando as notificações. Tente novamente.")), 15000); }),
    ]);
  } finally { clearTimeout(timer); }
}
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const support = useSyncExternalStore(subscribeBrowserStatus, getPushSupport, (): PushSupport => "checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const loading = useRef(false);
  const dialogRef = useDialogA11y(open, () => setOpen(false));
  const refresh = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const result = await listarNotificacoes();
      if (result.error || !result.items) throw new Error(result.error);
      if ("Notification" in window) setPermission(Notification.permission);
      setItems(result.items); setUnread(result.unread); setPublicKey(result.publicKey);
      const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration("/") : undefined;
      const subscription = registration && "pushManager" in registration ? await registration.pushManager.getSubscription() : null;
      setEnabled(result.enabled && Boolean(subscription) && Notification.permission === "granted");
      setError("");
    } catch { setError("Não foi possível carregar seus avisos. Tente novamente."); }
    finally { loading.current = false; setLoaded(true); }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const update = () => { if (document.visibilityState === "visible") { void refresh(); if ("Notification" in window) setPermission(Notification.permission); } };
    const message = (event: MessageEvent) => { if (event.data?.type === "WF_NOTIFICATION") update(); };
    const timer = setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    navigator.serviceWorker?.addEventListener("message", message);
    return () => { clearTimeout(initial); clearInterval(timer); document.removeEventListener("visibilitychange", update); navigator.serviceWorker?.removeEventListener("message", message); };
  }, [refresh]);

  async function togglePush() {
    if (busy) return;
    setBusy(true); setFeedback("");
    try {
      if (enabled) {
        const result = await desativarPush();
        if (result.error) throw new Error(result.error);
        const registration = await navigator.serviceWorker.getRegistration("/");
        await (await registration?.pushManager.getSubscription())?.unsubscribe();
        setEnabled(false); setFeedback("Notificações neste aparelho desativadas. Seus avisos continuam aqui.");
      } else {
        if (!publicKey || support !== "supported") return;
        // Pedido de permissão diretamente no gesto da pessoa (obrigatório no iOS).
        const granted = await Notification.requestPermission();
        setPermission(granted);
        if (granted !== "granted") { setFeedback("Você pode ativar as notificações quando quiser nas permissões do navegador."); return; }
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const registration = await readyWorker();
        let subscription = await registration.pushManager.getSubscription();
        const desiredKey = keyBytes(publicKey);
        if (subscription?.options.applicationServerKey && Array.from(new Uint8Array(subscription.options.applicationServerKey)).join() !== Array.from(desiredKey).join()) {
          await subscription.unsubscribe(); subscription = null;
        }
        subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: desiredKey });
        const result = await ativarPush(subscription.toJSON());
        if (result.error) throw new Error(result.error);
        setEnabled(true); setFeedback("Tudo pronto! Você receberá os avisos das suas escalas neste aparelho.");
      }
    } catch (error) {
      setFeedback(error instanceof DOMException
        ? "O navegador não conseguiu ativar os avisos. Verifique sua conexão e as permissões de notificações."
        : error instanceof Error ? error.message : "Não foi possível atualizar as notificações.");
    }
    finally { setBusy(false); }
  }
  async function markRead(ids: string[]) {
    try {
      const result = await marcarNotificacoesLidas(ids);
      if (result.error) throw new Error(result.error);
      await refresh();
    } catch { setFeedback("Não foi possível marcar os avisos como lidos."); }
  }

  return <NotificationContext.Provider value={{ unread, open: () => { setOpen(true); void refresh(); } }}>
    {children}
    {open && createPortal(<div className="wf-notification-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="wf-notification-title" tabIndex={-1} className="db-member-modal wf-notification-panel">
        <header className="wf-notification-header">
          <Image src={logo} alt="WorshipFlow" width={44} height={44} className="rounded-full" />
          <div className="min-w-0 flex-1"><p className="db-label text-amber-300">WorshipFlow</p><h2 id="wf-notification-title" className="db-title text-xl">Suas notificações</h2></div>
          <button type="button" className="db-icon-button" aria-label="Fechar notificações" onClick={() => setOpen(false)}><X size={19} /></button>
        </header>
        <div className="wf-notification-settings">
          <div className="flex items-center gap-2 font-semibold"><BellRing size={17} /><span>{enabled ? "Avisos no celular ativados" : "Acompanhe suas escalas"}</span></div>
          <p className="mt-2 text-sm">Receba a data, sua função e as mudanças na equipe, mesmo com o site fechado.</p>
          {support === "install" ? <p className="mt-3 text-sm">No iPhone, adicione o WorshipFlow à Tela de Início pelo menu de compartilhamento. Abra pelo ícone e ative os avisos aqui (iOS 16.4 ou superior).</p>
            : support === "unsupported" ? <p className="mt-3 text-sm">Este navegador não oferece notificações neste dispositivo. Seus avisos continuam disponíveis nesta central.</p>
            : permission === "denied" ? <p className="mt-3 text-sm">As notificações estão bloqueadas. Libere o WorshipFlow nas configurações de notificações do navegador ou do celular.</p>
            : publicKey && support === "supported" ? <button type="button" onClick={() => void togglePush()} disabled={busy} className="db-btn-sm mt-3">{busy && <Loader2 size={14} className="animate-spin" />}{enabled ? "Desativar neste aparelho" : "Ativar neste aparelho"}</button>
            : loaded && !error ? <p className="mt-3 text-sm">Os avisos no celular ainda não estão disponíveis. Você pode acompanhar as novidades por aqui.</p> : null}
        </div>
        {feedback && <p role="status" className="wf-notification-feedback">{feedback}</p>}
        <div className="flex items-center justify-between gap-3 px-5 py-3"><span className="db-label">Recentes {unread > 0 && `· ${unread} não lidas`}</span>
          {items.some((item) => !item.read_at) && <button type="button" onClick={() => void markRead(items.filter((item) => !item.read_at).map((item) => item.id))} className="db-btn-sm text-xs"><CheckCheck size={14} />Marcar como lidas</button>}
        </div>
        <div className="wf-notification-list">
          {error ? <div role="status" className="p-5 text-sm"><p>{error}</p><button onClick={() => void refresh()} className="db-btn-sm mt-3">Tentar novamente</button></div>
            : !loaded ? <p className="p-6 text-sm" role="status">Carregando avisos...</p>
            : items.length === 0 ? <div className="px-6 py-10 text-center"><Bell size={28} className="mx-auto mb-3 opacity-50" /><p className="font-semibold">Tudo em dia</p><p className="mt-2 text-sm opacity-70">Suas próximas escalas e alterações aparecerão aqui.</p></div>
            : <ul>{items.map((item) => <li key={item.id}>
              <Link href="/dashboard/escalas" onClick={() => { if (!item.read_at) void markRead([item.id]); setOpen(false); }} className={`wf-notification-item ${!item.read_at ? "wf-notification-unread" : ""}`}>
                <Image src={logo} alt="" width={34} height={34} className="mt-1 h-[34px] w-[34px] shrink-0 rounded-full" />
                <div className="min-w-0"><strong className="text-sm">{item.titulo}</strong>{!item.read_at && <span className="sr-only"> — Não lida</span>}<p className="mt-1 text-sm leading-relaxed opacity-80">{item.mensagem}</p><time dateTime={item.created_at} className="mt-2 block text-xs opacity-60">{new Date(item.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</time></div>
              </Link>
            </li>)}</ul>}
        </div>
      </section>
    </div>, document.body)}
  </NotificationContext.Provider>;
}
