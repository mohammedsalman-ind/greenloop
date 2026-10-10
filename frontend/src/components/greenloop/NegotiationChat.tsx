import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { NegotiationMessage } from "@shared/domain/types";
import Button from "@/components/ui/button/Button";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn } from "@/utils";

interface Props {
  offerId: string;
  messages: NegotiationMessage[];
  currentRole: "provider" | "receiver";
  canChat: boolean;
}

export default function NegotiationChat({ offerId, messages, currentRole, canChat }: Props) {
  const { t, i18n } = useTranslation();
  const { sendNegotiationMessageAction } = useGreenLoopStore();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const sendingRef = useRef(false);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages.length]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = message.trim();
    if (!body || !canChat || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setFailed(false);
    try {
      if (await sendNegotiationMessageAction(offerId, body)) setMessage("");
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };
  const dates = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeStyle: "short" });

  return <section className="mt-6 rounded-lg border border-steel-200 bg-white p-5 dark:border-steel-800 dark:bg-gray-dark" aria-labelledby="chat-title">
    <h2 id="chat-title" className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{t("negotiation.chat")}</h2>
    <div ref={log} role="log" aria-label={t("negotiation.chat")} aria-live="polite" aria-relevant="additions" className="custom-scrollbar mt-4 flex max-h-96 min-h-40 flex-col gap-3 overflow-y-auto rounded-md bg-gray-50 p-3 sm:p-4 dark:bg-gray-900">
      {messages.length === 0 ? <p className="m-auto text-sm text-steel-500 dark:text-steel-400">{t("negotiation.noMessages")}</p> : messages.map(item => {
        const own = item.senderRole === currentRole;
        return <article key={item.id} className={cn("max-w-full rounded-lg px-4 py-3 sm:max-w-lg", own ? "self-end bg-loop-800 text-white dark:bg-loop-700" : "self-start border border-steel-200 bg-white text-ink-900 dark:border-steel-700 dark:bg-gray-dark dark:text-white")}>
          <p className="text-xs font-semibold">{item.senderName} · {t(`negotiation.roles.${item.senderRole}`)}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{item.body}</p>
          <time dateTime={item.createdAt} className={cn("mt-2 block text-xs", own ? "text-loop-100 dark:text-loop-100" : "text-steel-500 dark:text-steel-400")}>{dates.format(new Date(item.createdAt))}</time>
        </article>;
      })}
    </div>
    {canChat ? <form onSubmit={submit} className="mt-3 flex flex-col items-end gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="negotiation-message">{t("negotiation.messagePlaceholder")}</label>
      <textarea id="negotiation-message" rows={2} value={message} disabled={sending} onChange={event => setMessage(event.target.value)} maxLength={4000} placeholder={t("negotiation.messagePlaceholder")} className="min-w-0 w-full flex-1 resize-y rounded-md border border-steel-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-loop-600 focus:outline-none disabled:opacity-60 dark:border-steel-700 dark:bg-gray-900 dark:text-white" />
      <Button type="submit" size="sm" disabled={sending || !message.trim()}>{t(sending ? "negotiationChat.sending" : "negotiation.send")}</Button>
    </form> : <p className="mt-3 text-sm text-steel-500 dark:text-steel-400">{t("negotiationChat.closed")}</p>}
    {failed && <p role="alert" className="mt-2 text-sm text-error-600 dark:text-error-400">{t("negotiationChat.failed")}</p>}
  </section>;
}
