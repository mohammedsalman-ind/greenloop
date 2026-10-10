import PageMeta from "@/components/common/PageMeta";
import { useAuth } from "@/context/AuthContext.helpers";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { formatStamp, materialTypeLabel } from "@/utils";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export default function NegotiationInbox() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { dataset } = useGreenLoopStore();
  const role = user?.activeWorkspace === "receiver" ? "receiver" : "provider";
  const readIds = new Set(dataset.readEventIds ?? []);
  const conversations = (dataset.negotiations ?? []).flatMap(conversation => {
    const offer = dataset.offers?.find(item => item.id === conversation.offerId);
    if (!offer) return [];
    const demand = dataset.demands.find(item => item.id === offer.demandId);
    const material = dataset.materials.find(item => item.id === offer.passportId);
    const last = conversation.messages.at(-1);
    const unread = dataset.events.filter(event => event.kind === "negotiation.message_sent" && event.subjectIds[0] === offer.id && event.actor.kind === (role === "receiver" ? "contractor" : "receiver") && !readIds.has(event.id)).length;
    return [{ conversation, offer, demand, material, last, unread, at: last?.createdAt ?? offer.createdAt }];
  }).sort((a, b) => b.at.localeCompare(a.at));

  return <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
    <PageMeta title={`${t("negotiationChat.open")} | GreenLoop`} description={t("negotiationInbox.subtitle")} />
    <h1 className="font-archivo text-2xl font-bold text-ink-900 sm:text-3xl dark:text-white">{t("negotiationChat.open")}</h1>
    <p className="mt-2 text-sm text-steel-600 dark:text-steel-300">{t("negotiationInbox.subtitle")}</p>
    {conversations.length === 0 ? <div className="mt-6 rounded-xl border border-steel-200 bg-white p-6 dark:border-steel-700 dark:bg-gray-dark">
      <p className="text-sm text-steel-600 dark:text-steel-300">{t("negotiationInbox.empty")}</p>
      <Link className="mt-3 inline-block text-sm font-semibold text-loop-700 underline dark:text-loop-300" to={role === "receiver" ? "/app/receiver/providers" : "/app/market-demand"}>{t("negotiationInbox.viewOffers")}</Link>
    </div> : <ul className="mt-6 space-y-3">
      {conversations.map(({ conversation, offer, demand, material, last, unread, at }) => <li key={offer.id}>
        <Link to={`/app/negotiations/${encodeURIComponent(offer.id)}`} className="block rounded-xl border border-steel-200 bg-white p-4 transition hover:border-loop-500 hover:bg-loop-50 focus-visible:outline-loop-600 sm:p-5 dark:border-steel-700 dark:bg-gray-dark dark:hover:border-loop-500 dark:hover:bg-loop-900/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-archivo text-lg font-semibold text-ink-900 dark:text-white">{materialTypeLabel(material?.type ?? demand?.materialType ?? "")} · {offer.offeredQuantityT.toFixed(1)} t</h2>
            <div className="flex flex-wrap items-center gap-2">
              {unread > 0 && <span className="rounded-full bg-loop-700 px-2.5 py-1 text-xs font-semibold text-white dark:bg-loop-600">{t("negotiationInbox.unread", { count: unread })}</span>}
              <span className="rounded-full bg-steel-100 px-3 py-1 text-xs text-steel-700 dark:bg-steel-800 dark:text-steel-200">{t(`negotiation.status.${conversation.status}`)}</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-steel-500 dark:text-steel-400">{demand?.location} · {offer.id}</p>
          <p className="mt-3 line-clamp-2 break-words text-sm text-ink-900 dark:text-white">{last ? `${last.senderName}: ${last.body}` : t("negotiation.noMessages")}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-steel-500 dark:text-steel-400">
            <time dateTime={at}>{formatStamp(at)}</time>
            <span className="font-semibold text-loop-700 dark:text-loop-300">{t("negotiationInbox.openConversation")}</span>
          </div>
        </Link>
      </li>)}
    </ul>}
  </main>;
}
