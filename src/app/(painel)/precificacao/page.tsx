import { CalculadoraPreco } from "@/components/calculadora-preco";
import { Cabecalho } from "@/components/ui";
import { precificacaoReferencia } from "@/lib/precificacao-referencia";

export const metadata = { title: "Precificação" };

export default async function Precificacao() {
  const referencia = await precificacaoReferencia();
  return (
    <>
      <Cabecalho sobre="Dinheiro" titulo="Precificação" sub="Quanto cobrar por um site para não trabalhar de graça, e quantos sites por mês fecham a sua meta." />
      <CalculadoraPreco referencia={referencia} />
    </>
  );
}
