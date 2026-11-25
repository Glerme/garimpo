import {
  Activity,
  BadgeDollarSign,
  BookOpen,
  Bot,
  Brain,
  CircleDollarSign,
  Clock,
  Compass,
  CreditCard,
  FileCode2,
  Flame,
  Gauge,
  GitBranch,
  Handshake,
  Inbox,
  KeyRound,
  Kanban,
  LayoutTemplate,
  Link2,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Plug,
  Plus,
  QrCode,
  Radar,
  RefreshCw,
  Repeat,
  Search,
  Send,
  Settings2,
  Shield,
  ShieldBan,
  Sparkles,
  Star,
  Target,
  Ticket,
  Upload,
  UserRound,
  Users,
  Wallet,
  Webhook,
  Workflow,
  type LucideIcon,
} from "lucide-react";

const MAPA = {
  visao: Gauge,
  esteira: Kanban,
  rastro: Radar,
  conversas: MessagesSquare,
  previas: LayoutTemplate,
  skills: Brain,
  lista: ShieldBan,
  cobrancas: Wallet,
  conexoes: Plug,
  chaves: KeyRound,
  conta: Settings2,
  mais: Plus,
  busca: Search,
  mapa: MapPin,
  estrela: Star,
  enviar: Send,
  mensagem: MessageCircle,
  entrada: Inbox,
  relogio: Clock,
  dinheiro: CircleDollarSign,
  cobrar: BadgeDollarSign,
  cartao: CreditCard,
  qr: QrCode,
  email: Mail,
  github: GitBranch,
  upload: Upload,
  recarregar: RefreshCw,
  link: Link2,
  webhook: Webhook,
  usuario: UserRound,
  usuarios: Users,
  cadeado: Lock,
  escudo: Shield,
  livro: BookOpen,
  robo: Bot,
  alvo: Target,
  chama: Flame,
  aperto: Handshake,
  repetir: Repeat,
  bussola: Compass,
  fluxo: Workflow,
  brilho: Sparkles,
  atividade: Activity,
  codigo: FileCode2,
  pedagio: Ticket,
} satisfies Record<string, LucideIcon>;

export type NomeIcone = keyof typeof MAPA;

export function Icone({ nome, className = "h-4 w-4", strokeWidth = 1.8 }: { nome: NomeIcone; className?: string; strokeWidth?: number }) {
  const C = MAPA[nome];
  return <C className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/** Ícone de uma skill pelo assunto dela. */
export function iconeDaSkill(slug: string, descricao = ""): NomeIcone {
  const t = slug.toLowerCase();
  void descricao;
  if (/operador|api|garimpo/.test(t)) return "robo";
  if (/prospec|fria|abordag/.test(t)) return "alvo";
  if (/pesquisa|dossi|lead/.test(t)) return "busca";
  if (/negocia|fechamento|whatsapp/.test(t)) return "aperto";
  if (/obje/.test(t)) return "escudo";
  if (/follow|reconquist|cad[eê]ncia/.test(t)) return "repetir";
  if (/lista.negra|governan/.test(t)) return "lista";
  if (/psicolog|perfil/.test(t)) return "bussola";
  if (/arquitet|24.?7|opera/.test(t)) return "fluxo";
  return "livro";
}
