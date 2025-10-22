"use client";

import { useEffect, useMemo, useState } from "react";
import { Lang } from "../../lib/i18n";
import { Player } from "@/hooks/type";

interface CardsState {
  round: number;
  themeKey: string;
  selfAnswers: Record<string, number[]>;
  guessAnswers: Record<string, number[]>;
  revealed: boolean[];
  scores: Record<string, number>;
}

type Theme = {
  key: string;
  label: Record<Lang, string>;
  questions: { q: Record<Lang, string>; options: string[] }[];
};

const fallbackThemes: Theme[] = [
  {
    key: "rom",
    label: { es: "Romántico", pt: "Romântico", en: "Romantic" },
    questions: [
      {
        q: {
          es: "Primero que noté en ti",
          pt: "Primeira coisa que reparei em você",
          en: "First thing I noticed about you",
        },
        options: [
          "Ojos/Eyes/Olhos",
          "Sonrisa/Smile/Sorriso",
          "Boca/Mouth/Boca",
          "Cuerpo/Body/Corpo",
        ],
      },
    ],
  },
];

export default function CardsGame({
  adapter,
  self,
  players,
  t,
  lang,
  pack,
}: {
  adapter: {
    send: (m: any) => void;
    onMessage: (fn: (m: any) => void) => () => void;
  };
  self: Player;
  players: Player[];
  t: (k: string) => string;
  lang: Lang;
  pack: any; // deve conter CARD_THEMES opcionalmente
}) {
  const THEMES: Theme[] = (pack.CARD_THEMES as Theme[]) || fallbackThemes;

  const [state, setState] = useState<CardsState>(() => ({
    round: 0,
    themeKey: THEMES[0].key,
    selfAnswers: {},
    guessAnswers: {},
    revealed: Array(10).fill(false),
    scores: {},
  }));

  const theme = THEMES.find((x) => x.key === state.themeKey) || THEMES[0];
  const qList = useMemo(() => {
    const arr = [] as typeof theme.questions;
    for (let i = 0; i < 10; i++)
      arr.push(theme.questions[i % theme.questions.length]);
    return arr;
  }, [theme]);

  useEffect(() => {
    const unsub = adapter.onMessage((msg: any) => {
      if (msg.type === "cards:state") setState(msg.payload);
    });
    return () => unsub();
  }, [adapter]);

  function pushState(next: CardsState) {
    setState(next);
    adapter.send({ type: "cards:state", payload: next });
  }

  function chooseTheme(key: string) {
    pushState({
      round: 0,
      themeKey: key,
      selfAnswers: {},
      guessAnswers: {},
      revealed: Array(10).fill(false),
      scores: {},
    });
  }

  const currentQ = qList[state.round];
  const options = currentQ.options.map((opt) => {
    const parts = opt.split("/");
    if (lang === "pt") return parts[2] || parts[0];
    if (lang === "en") return parts[1] || parts[0];
    return parts[0];
  });
  const qText = currentQ.q[lang];

  const [selMine, setSelMine] = useState<number | null>(null);
  const [selGuess, setSelGuess] = useState<number | null>(null);
  useEffect(() => {
    setSelMine(null);
    setSelGuess(null);
  }, [state.round, state.themeKey]);

  function submitRound() {
    if (selMine === null || selGuess === null) return;
    const draft: CardsState = JSON.parse(JSON.stringify(state));
    draft.selfAnswers[self.id] = draft.selfAnswers[self.id] || [];
    draft.guessAnswers[self.id] = draft.guessAnswers[self.id] || [];
    draft.selfAnswers[self.id][state.round] = selMine;
    draft.guessAnswers[self.id][state.round] = selGuess;
    pushState(draft);
  }

  function revealAndScore() {
    const bothAnswered = players.every(
      (p) =>
        state.selfAnswers[p.id]?.[state.round] !== undefined &&
        state.guessAnswers[p.id]?.[state.round] !== undefined
    );
    if (!bothAnswered) return;
    const draft: CardsState = JSON.parse(JSON.stringify(state));
    draft.revealed[state.round] = true;
    players.forEach((p) => {
      const other = players.find((x) => x.id !== p.id)!;
      const myGuessForOther = draft.guessAnswers[p.id]?.[state.round];
      const othersChoice = draft.selfAnswers[other.id]?.[state.round];
      if (
        myGuessForOther !== undefined &&
        othersChoice !== undefined &&
        myGuessForOther === othersChoice
      ) {
        draft.scores[p.id] = (draft.scores[p.id] || 0) + 1;
      }
    });
    draft.round = Math.min(9, draft.round + 1);
    pushState(draft);
  }

  const finished = state.round >= 10;
  const winner = finished
    ? players
        .slice()
        .sort(
          (a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)
        )[0]
    : null;

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {THEMES.map((th) => (
            <button
              key={th.key}
              onClick={() => chooseTheme(th.key)}
              className={`px-3 py-1 rounded-full border ${
                state.themeKey === th.key
                  ? "bg-rose-600 text-white border-rose-600"
                  : "border-rose-200 text-rose-700 bg-rose-50"
              }`}
            >
              {th.label[lang]}
            </button>
          ))}
        </div>

        {!finished ? (
          <div className="bg-white/70 border rounded-2xl p-5">
            <div className="text-sm opacity-70 mb-2">
              {t("rounds")}: {state.round + 1}/10
            </div>
            <div className="text-xl font-semibold mb-4">{qText}</div>

            <div className="grid sm:grid-cols-2 gap-3">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelMine(i)}
                  className={`p-3 rounded-xl border text-left ${
                    selMine === i
                      ? "border-rose-600 bg-rose-50"
                      : "border-rose-200 bg-white"
                  }`}
                >
                  <div className="text-xs opacity-60 mb-1">{t("you")}</div>
                  <div className="font-medium">{opt}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelGuess(i)}
                  className={`p-3 rounded-xl border text-left ${
                    selGuess === i
                      ? "border-fuchsia-600 bg-fuchsia-50"
                      : "border-fuchsia-200 bg-white"
                  }`}
                >
                  <div className="text-xs opacity-60 mb-1">{t("partner")}</div>
                  <div className="font-medium">{opt}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={submitRound}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white"
              >
                {t("submit")}
              </button>
              <button
                onClick={revealAndScore}
                className="px-4 py-2 rounded-xl border border-rose-300"
              >
                {t("reveal")}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/70 border rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold mb-2">
              {t("winner")}: {winner?.name}
            </div>
            <div className="opacity-70">
              {players.map((p) => (
                <div key={p.id}>
                  {p.name}: {state.scores[p.id] || 0} pts
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                pushState({
                  round: 0,
                  themeKey: state.themeKey,
                  selfAnswers: {},
                  guessAnswers: {},
                  revealed: Array(10).fill(false),
                  scores: {},
                })
              }
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white"
            >
              {t("restart")}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/60 backdrop-blur rounded-2xl p-4 border border-rose-100 shadow-sm">
        <h3 className="font-semibold mb-2">{t("players")}</h3>
        <ul className="space-y-2">
          {players.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  i === 0 ? "bg-rose-500" : "bg-fuchsia-500"
                }`}
              ></span>
              <span className="font-medium">
                {p.name || (i === 0 ? t("you") : t("partner"))}
              </span>
              <span className="ml-auto text-xs opacity-60">
                {state.scores[p.id] || 0} pts
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-center text-xs opacity-70 border-t pt-3">
          {t("ads")}
        </div>
      </div>
    </div>
  );
}
