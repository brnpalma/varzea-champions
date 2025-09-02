
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Dices, Home, ShieldCheck, Star, Trophy, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: <Home className="h-8 w-8 text-primary" />,
    title: "Gestão de Partidas",
    description: "Organize seus jogos, defina datas, horários e acompanhe a confirmação de presença em tempo real.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Cadastro de Jogadores",
    description: "Mantenha uma lista atualizada de todos os membros do seu grupo, com foto, nome e avaliação.",
  },
  {
    icon: <Dices className="h-8 w-8 text-primary" />,
    title: "Sorteador Inteligente",
    description: "Crie times equilibrados com um clique, baseado na avaliação (estrelas) de cada jogador.",
  },
  {
    icon: <Trophy className="h-8 w-8 text-primary" />,
    title: "Ranking e Artilharia",
    description: "Motive seus jogadores com um ranking de artilheiros e de melhores avaliados da temporada.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: "Controle Financeiro",
    description: "Gerencie mensalidades e pagamentos avulsos de forma simples e transparente para todos.",
  },
  {
    icon: <Star className="h-8 w-8 text-primary" />,
    title: "Avaliação de Jogadores",
    description: "Defina o nível de cada jogador com um sistema de estrelas, usado para equilibrar as equipes.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Image src="/logo-transp.png" alt="Várzea Champions Logo" width={40} height={40} />
            <span className="text-xl font-bold">Várzea Champions</span>
          </div>
          <Button asChild>
            <Link href="/login">Acessar App</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Seu time amador com gestão de Champions League. <span className="text-primary">Simples e compartilhada.</span>
            </h1>
            <p className="mt-4 md:mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
              Chega de planilhas e grupos de WhatsApp confusos. Organize jogos, sorteie times, controle a artilharia e gerencie seu time em um só lugar.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/login">Comece a Usar de Graça</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold">Tudo que seu Grupo Precisa</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Deixe a organização com a gente e foque no que realmente importa: o futebol.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="flex flex-col items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <Card className="bg-primary text-primary-foreground text-center p-8 md:p-12 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold">
                Pronto para Elevar o Nível da sua Pelada?
              </h2>
              <p className="mt-4 max-w-2xl mx-auto">
                Crie sua conta de gestor agora e convide seus jogadores. É rápido, fácil e gratuito para começar.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/login">Quero Organizar meu Time</Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Várzea Champions Manager. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
