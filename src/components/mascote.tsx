"use client";

import { validateAvatar, type AvatarDefinition } from "open-bot-avatar";
import { mountAvatar, type MountedAvatar } from "open-bot-avatar/dom";
import { useEffect, useRef } from "react";

import definicao from "../../marca/mascote.json";

/**
 * O mascote do Garimpo: uma bateia de ouro com olhos, feita com o Open Bot
 * Avatar (github.com/DominikScholz/open-bot-avatar). Pisca, olha para o
 * mouse e muda de humor conforme o que o sistema está fazendo.
 */

const validada = validateAvatar(definicao);
const BATEIA = (validada.ok ? validada.value : definicao) as AvatarDefinition;
export const OURO = "#e9b43c";

export type EstadoMascote = "idle" | "thinking" | "working" | "waiting" | "blocked" | "done";

export function Mascote({
  tamanho = 48,
  estado = "idle",
  humor = "neutral",
  seguir = true,
  ladrilho = false,
  className = "",
}: {
  tamanho?: number;
  estado?: EstadoMascote;
  humor?: "neutral" | "happy";
  seguir?: boolean;
  /** Dentro do quadrado grafite, como na logo. */
  ladrilho?: boolean;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const avatar = useRef<MountedAvatar | null>(null);

  useEffect(() => {
    if (!host.current) return;
    avatar.current = mountAvatar(host.current, { definition: BATEIA, color: OURO, eyeColor: "#151515", followPointer: seguir, state: estado, mood: humor, depth: 7, label: "" });
    return () => {
      avatar.current?.destroy();
      avatar.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    avatar.current?.update({ state: estado, mood: humor, followPointer: seguir });
  }, [estado, humor, seguir]);

  const miolo = <div ref={host} style={{ width: ladrilho ? tamanho * 0.86 : tamanho, aspectRatio: "1" }} aria-hidden />;
  if (!ladrilho) return <span className={`inline-grid shrink-0 place-items-center ${className}`}>{miolo}</span>;
  return (
    <span
      className={`inline-grid shrink-0 place-items-center bg-[linear-gradient(135deg,#2b313b,#0f1217)] ${className}`}
      style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.26 }}
    >
      {miolo}
    </span>
  );
}
