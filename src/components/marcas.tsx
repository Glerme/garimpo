import { siX, siDocker, siGithub, siGooglemaps, siMercadopago, siMeta, siPix, siPostgresql, siResend, siStripe, siSupabase, siVercel, siWhatsapp, siClaude, siN8n, type SimpleIcon } from "simple-icons";

/** Ícones das marcas (Simple Icons, CC0). Sem ícone oficial: sigla num quadrado. */
const ICONES: Record<string, SimpleIcon> = {
  mercadopago: siMercadopago,
  stripe: siStripe,
  pix_manual: siPix,
  pix: siPix,
  baileys: siWhatsapp,
  whatsapp: siWhatsapp,
  meta: siMeta,
  rastro: siGooglemaps,
  maps: siGooglemaps,
  resend: siResend,
  supabase: siSupabase,
  vercel: siVercel,
  github: siGithub,
  docker: siDocker,
  postgres: siPostgresql,
  claude: siClaude,
  n8n: siN8n,
  x: siX,
};

const SIGLAS: Record<string, { sigla: string; cor: string }> = {
  mamaevireidev: { sigla: "mvd", cor: "#1677d4" },
  asaas: { sigla: "as", cor: "#0030b9" },
  evolution: { sigla: "Ev", cor: "#0e7490" },
  zapi: { sigla: "Z", cor: "#1f2937" },
};

/** Ladrilho branco com o símbolo da marca na cor dela. */
export function LogoMarca({ id, tamanho = 40, titulo }: { id: string; tamanho?: number; titulo?: string }) {
  const ic = ICONES[id];
  const raio = Math.round(tamanho * 0.28);
  if (!ic) {
    const s = SIGLAS[id] ?? { sigla: id.slice(0, 2), cor: "#475467" };
    return (
      <span title={titulo} aria-hidden={!titulo} className="display grid shrink-0 place-items-center font-semibold text-white" style={{ width: tamanho, height: tamanho, borderRadius: raio, background: s.cor, fontSize: tamanho * 0.36 }}>
        {s.sigla}
      </span>
    );
  }
  const cor = ic.hex === "000000" || ic.hex === "191919" || ic.hex === "181717" ? "var(--tinta)" : `#${ic.hex}`;
  return (
    <span title={titulo ?? ic.title} className="grid shrink-0 place-items-center bg-superficie shadow-[inset_0_0_0_1px_var(--linha),var(--sombra)]" style={{ width: tamanho, height: tamanho, borderRadius: raio }}>
      <svg viewBox="0 0 24 24" width={tamanho * 0.52} height={tamanho * 0.52} fill={cor} role="img" aria-label={ic.title}>
        <path d={ic.path} />
      </svg>
    </span>
  );
}
