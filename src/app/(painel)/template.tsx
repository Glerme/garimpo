/** Remonta a cada troca de tela: a página entra com um leve deslize. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="pagina-entra">{children}</div>;
}
