import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

interface Card {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly to: string;
}

const cards: readonly Card[] = [
  {
    icon: '◎',
    title: 'Visão do produto',
    description:
      'Entenda o problema que o Branchstorm resolve e como as ideias evoluem do problema à solução final.',
    to: '/docs/intro',
  },
  {
    icon: '☑',
    title: 'Requisitos RF01–RF11',
    description:
      'A cobertura funcional completa: pessoas, equipes, árvore, hipóteses, validação, feedback e final.',
    to: '/docs/requisitos',
  },
  {
    icon: '⌘',
    title: 'Arquitetura',
    description:
      'Microsserviços .NET, gateway, bancos SQLite independentes e as integrações entre serviços.',
    to: '/docs/arquitetura',
  },
  {
    icon: '◈',
    title: 'Frontend em camadas',
    description:
      'Como o Angular replica a separação Controller → Service → Repository do backend.',
    to: '/docs/frontend',
  },
  {
    icon: '⇄',
    title: 'Contrato da API',
    description:
      'Endpoints, códigos, enums e os cuidados de compatibilidade entre requests e results.',
    to: '/docs/api',
  },
  {
    icon: '▶',
    title: 'Como executar',
    description:
      'Suba o frontend em modo demonstração ou conecte aos serviços reais com um comando.',
    to: '/docs/execucao',
  },
];

const steps = [
  'Registre o problema raiz',
  'Proponha soluções e versões',
  'Teste hipóteses e colete feedback',
  'Selecione o caminho e marque a solução final',
] as const;

function Hero(): ReactNode {
  return (
    <header className="bs-hero">
      <div className="bs-hero__inner">
        <div>
          <span className="bs-hero__eyebrow">Documentação técnica</span>
          <h1>
            Um brainstorm
            <br />
            que se ramifica.
          </h1>
          <p>
            O Branchstorm transforma cada problema em uma árvore de soluções e versões. Pessoas
            colaboram, testam hipóteses, avaliam caminhos e registram por que cada ramo foi
            escolhido ou descartado.
          </p>
          <div className="bs-hero__actions">
            <Link className="bs-btn bs-btn--primary" to="/docs/intro">
              Começar pela visão geral →
            </Link>
            <Link className="bs-btn bs-btn--ghost" to="/docs/requisitos">
              Ver requisitos
            </Link>
          </div>
        </div>

        <aside className="bs-hero__panel" aria-label="Fluxo do produto">
          <span className="bs-hero__panel-title">Do problema à decisão</span>
          <div className="bs-hero__flow">
            {steps.map((step, index) => (
              <div className="bs-hero__step" key={step}>
                <span>{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title="Documentação"
      description={siteConfig.tagline}
    >
      <Hero />

      <main>
        <section className="bs-section">
          <div className="bs-section__head">
            <span className="bs-section__eyebrow">Explore</span>
            <h2>Tudo o que você precisa para entender e rodar o projeto</h2>
            <p>
              Documentação do produto, da arquitetura distribuída e do frontend Angular — escrita
              para quem vai avaliar, manter ou evoluir o Branchstorm.
            </p>
          </div>

          <div className="bs-cards">
            {cards.map((card) => (
              <Link className="bs-card" to={card.to} key={card.title}>
                <span className="bs-card__icon" aria-hidden="true">
                  {card.icon}
                </span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="bs-band">
          <div className="bs-section">
            <div className="bs-section__head">
              <span className="bs-section__eyebrow">Projeto</span>
              <h2>Feito para mapear ideias em equipe</h2>
              <p>
                Projeto final da disciplina de Arquitetura de Software (Sistemas Distribuídos —
                microsserviços) do Centro Universitário SATC.
              </p>
            </div>

            <div className="bs-facts">
              <div className="bs-fact">
                <strong>11</strong>
                <span>requisitos funcionais cobertos</span>
              </div>
              <div className="bs-fact">
                <strong>5</strong>
                <span>microsserviços + gateway</span>
              </div>
              <div className="bs-fact">
                <strong>100%</strong>
                <span>dos fluxos navegáveis em modo demo</span>
              </div>
              <div className="bs-fact">
                <strong>1</strong>
                <span>árvore com todo o histórico preservado</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
