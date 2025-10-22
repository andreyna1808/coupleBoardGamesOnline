"use client";

import { useSearchParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import Header from "@/components/Header";
import CardsGame from "@/components/CardsGame";
import { SupabaseAdapter } from "../../lib/adapters/SupabaseAdapter";
import { useI18n } from "../../lib/i18n";

export default function CardsPage() {
  const { t, lang, getPack } = useI18n("pt");
  const params = useSearchParams();
  const roomCode = params.get("room");
  const { adapter, room, self, isReady } = useRoom(
    roomCode,
    (code) => new SupabaseAdapter(code)
  );
  const playersOrdered = room.players
    .slice()
    .sort((a, b) => a.joinedAt - b.joinedAt);
  const pack = getPack<any>();

  return (
    <>
      <Header />
      {!roomCode ? (
        <div className="text-sm opacity-80">
          Adicione <code>?room=XXXX</code> na URL via Home.
        </div>
      ) : adapter && self && isReady ? (
        <CardsGame
          adapter={adapter}
          self={self}
          players={playersOrdered}
          t={t}
          lang={lang}
          pack={pack}
        />
      ) : (
        <div className="text-sm opacity-80">{t("waiting")}</div>
      )}
    </>
  );
}
