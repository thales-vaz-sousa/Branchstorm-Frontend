import type { FeedbackResult } from '@shared/models/feedback.model';
import type { HypothesisResult } from '@shared/models/hypothesis.model';
import type {
  LinkHistoryResult,
  LinkResult,
  LinkStatus,
  LinkTypeName,
  LinkValidationName,
} from '@shared/models/link.model';
import type { TeamResult } from '@shared/models/team.model';
import type { UserResult } from '@shared/models/user.model';
import { MOCK_DB_KEY } from './mock-mode';

export interface MockDatabase {
  users: UserResult[];
  teams: TeamResult[];
  links: LinkResult[];
  hypotheses: HypothesisResult[];
  feedbacks: FeedbackResult[];
}

let cache: MockDatabase | null = null;

export function getMockDatabase(): MockDatabase {
  if (cache) {
    return cache;
  }

  const raw = localStorage.getItem(MOCK_DB_KEY);

  if (raw) {
    try {
      cache = JSON.parse(raw) as MockDatabase;
      return cache;
    } catch {
      localStorage.removeItem(MOCK_DB_KEY);
    }
  }

  cache = seedDatabase();
  saveMockDatabase(cache);
  return cache;
}

export function saveMockDatabase(database: MockDatabase): void {
  cache = database;
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(database));
}

export function resetMockDatabase(): void {
  cache = null;
  localStorage.removeItem(MOCK_DB_KEY);
}

/** Conjunto fictício de demonstração: 40 problemas raiz com soluções, versões,
 * hipóteses e feedbacks. Nada aqui é dado real. */
interface DemoProblem {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly team: string;
  readonly author: string;
  readonly ageHours: number;
  readonly reason: string;
  /** [título, descrição, motivo, status] */
  readonly solutions: readonly (readonly [string, string, string, LinkStatus])[];
  /** [título, descrição, motivo, status, validação] — pendurada na 1ª solução */
  readonly version: readonly [string, string, string, LinkStatus, LinkValidationName];
  /** [descrição, critério de sucesso, resultado] */
  readonly hypothesis: readonly [string, string, 'Validated' | 'Refuted' | null];
  /** [autor, texto, nota] — no problema */
  readonly feedbacks: readonly (readonly [string, string, number])[];
}

const DEMO_PROBLEMS: readonly DemoProblem[] = [
  {
    slug: 'life-back',
    title: 'LIFE BACK — Dinheiro e oportunidades esquecidas',
    description:
      'Pessoas deixam de aproveitar dinheiro, reembolsos, garantias, benefícios e oportunidades porque não sabem que existem ou esquecem de solicitá-los.',
    team: 'team-vida',
    author: 'user-luisa',
    ageHours: 24 * 41,
    reason: 'Relatos recorrentes de reembolsos perdidos por prazo vencido.',
    solutions: [
      ['Carteira única de garantias e reembolsos', 'Centraliza garantias, notas e prazos em um só lugar com alertas antes do vencimento.', 'Resolve o esquecimento sem depender de memória.', 'Selected'],
      ['Lembretes de prazos por e-mail', 'Envia avisos automáticos quando um prazo se aproxima.', 'Simples de implantar, mas não organiza os documentos.', 'Discarded'],
    ],
    version: ['Versão MVP só com garantias de eletrodomésticos', 'Começa pelas garantias mais comuns e expande depois.', 'Escopo menor valida o hábito antes de crescer.', 'Selected', 'Validated'],
    hypothesis: ['Centralizar garantias aumenta o aproveitamento de reembolsos.', 'Pelo menos 40% dos usuários solicitam um reembolso em 90 dias.', 'Validated'],
    feedbacks: [
      ['user-ana', 'Problema muito presente no dia a dia, fácil de entender.', 5],
      ['user-igor', 'Falta pensar em quem não guarda nota fiscal.', 3],
    ],
  },
  {
    slug: 'life-cost',
    title: 'LIFE COST — O custo real do estilo de vida',
    description:
      'Pessoas têm dificuldade para identificar quanto realmente gastam, considerando assinaturas, tarifas, juros, manutenções e pequenas despesas recorrentes.',
    team: 'team-vida',
    author: 'user-marina',
    ageHours: 24 * 38,
    reason: 'Assinaturas esquecidas aparecem como surpresa no extrato.',
    solutions: [
      ['Extrato consolidado de gastos recorrentes', 'Lista todas as despesas fixas e variáveis em uma visão única mensal.', 'Mostra o total real sem exigir planilha manual.', 'Open'],
      ['Classificação automática por categoria', 'Categoriza transações importadas e aponta as maiores fontes de gasto.', 'Automatizar reduz o abandono, mas exige integração bancária.', 'Selected'],
    ],
    version: ['Versão só com assinaturas e tarifas', 'Começa pelos gastos fixos, mais fáceis de identificar.', 'Escopo enxuto gera valor rápido.', 'Selected', 'NotTested'],
    hypothesis: ['Ver o total de gastos recorrentes reduz assinaturas esquecidas.', 'Queda de pelo menos 15% em assinaturas não utilizadas em 60 dias.', null],
    feedbacks: [['user-igor', 'Boa ideia, mas privacidade dos dados é um ponto sensível.', 4]],
  },
  {
    slug: 'price-of-time',
    title: 'PRICE OF TIME — O preço do tempo desperdiçado',
    description:
      'Pessoas não percebem quanto tempo e dinheiro perdem em esperas, burocracias, deslocamentos e atividades repetitivas.',
    team: 'team-vida',
    author: 'user-igor',
    ageHours: 24 * 36,
    reason: 'Entrevistas mostram filas de 40 minutos tratadas como "normais".',
    solutions: [
      ['Mapa de esperas e filas', 'Registra tempos de espera em serviços frequentados e sugere alternativas.', 'Dados reais mudam o comportamento de quem espera.', 'Open'],
      ['Agendamento inteligente de serviços', 'Agenda horários de menor movimento automaticamente.', 'Neutraliza a espera, mas não expõe o custo do tempo perdido.', 'Discarded'],
    ],
    version: ['Versão piloto em unidades de saúde', 'Testa em um único tipo de serviço antes de expandir.', 'Limita o esforço de coleta de dados.', 'Open', 'NotTested'],
    hypothesis: ['Mostrar o tempo médio de espera reduz a tolerância a filas longas.', 'Pelo menos 30% dos usuários mudam de horário após ver os dados.', 'Refuted'],
    feedbacks: [['user-beatriz', 'Interessante, mas os dados de espera precisam ser confiáveis.', 3]],
  },
  {
    slug: 'care-reminder',
    title: 'CARE REMINDER — Manutenção preventiva da vida cotidiana',
    description:
      'Pessoas esquecem manutenções importantes em veículos, equipamentos e residências, causando despesas maiores no futuro.',
    team: 'team-vida',
    author: 'user-rafael',
    ageHours: 24 * 33,
    reason: 'Uma revisão esquecida virou um conserto dez vezes mais caro.',
    solutions: [
      ['Calendário de manutenção por item', 'Cada bem tem um calendário de revisões com alertas programados.', 'Simples e direto, funciona sem sensores.', 'Selected'],
      ['Alertas baseados em uso real', 'Calcula a próxima manutenção pelo uso informado pelo dono.', 'Mais preciso, mas exige atualização manual constante.', 'Open'],
    ],
    version: ['Versão com revisão de veículos primeiro', 'Começa pelo item de maior custo de manutenção.', 'Prioriza onde o prejuízo do esquecimento é maior.', 'Selected', 'Validated'],
    hypothesis: ['Alertas de revisão reduzem manutenções atrasadas.', 'Atrasos caem pela metade em 6 meses.', 'Validated'],
    feedbacks: [['user-luisa', 'Já perdi dinheiro com isso, então aprovo a relevância.', 5]],
  },
  {
    slug: 'never-lost',
    title: 'NEVER LOST — Informações de objetos pessoais',
    description:
      'Quando um produto é perdido, roubado ou precisa de manutenção, seus proprietários frequentemente não possuem notas fiscais, números de série, garantias ou histórico organizados.',
    team: 'team-vida',
    author: 'user-beatriz',
    ageHours: 24 * 30,
    reason: 'Sem número de série, um seguro negou a indenização.',
    solutions: [
      ['Cofre digital de notas e séries', 'Guarda fotos de notas, séries e garantias com busca rápida.', 'Resolve o acesso imediato quando algo acontece.', 'Selected'],
      ['Foto automática na compra', 'Captura nota e etiqueta no ato da compra via aplicativo.', 'Reduz o esforço, mas depende de lembrar de fotografar.', 'Open'],
    ],
    version: ['Versão só com eletroeletrônicos', 'Começa pelos itens de maior valor.', 'Foco no que mais gera prejuízo.', 'Open', 'NotTested'],
    hypothesis: ['Ter os dados organizados acelera o atendimento de garantias.', 'Tempo de solicitação cai para menos de 10 minutos.', null],
    feedbacks: [
      ['user-marina', 'Faltou pensar em quem compra online e perde o e-mail da nota.', 4],
      ['user-pedro', 'Problema real, mas o cadastro inicial pode afastar.', 3],
    ],
  },
  {
    slug: 'borrowed',
    title: 'BORROWED — Empréstimo de objetos entre pessoas',
    description:
      'Muitas pessoas compram objetos que utilizam poucas vezes, enquanto outras possuem esses mesmos objetos parados em casa.',
    team: 'team-social',
    author: 'user-ana',
    ageHours: 24 * 27,
    reason: 'Uma furadeira usada por 13 minutos custou uma fortuna.',
    solutions: [
      ['Rede de empréstimo entre vizinhos', 'Mapa de objetos disponíveis para empréstimo na vizinhança.', 'Confiança local reduz o custo de aquisição.', 'Open'],
      ['Aluguel de objetos por dia', 'Plataforma de aluguel com caução e avaliação.', 'Monetiza o que está parado, mas cria burocracia.', 'Discarded'],
    ],
    version: ['Versão restrita a condomínios', 'Começa onde a confiança já existe.', 'Reduz risco de danos e calote.', 'Open', 'NotTested'],
    hypothesis: ['Vizinhos aderem a uma rede de empréstimo se houver reputação.', 'Pelo menos 20% dos moradores emprestam algo no primeiro mês.', 'Refuted'],
    feedbacks: [['user-rafael', 'A ideia é boa, mas dano ao objeto é um risco real.', 3]],
  },
  {
    slug: 'missed',
    title: 'MISSED — Obrigações esquecidas',
    description:
      'Solicitações, compromissos, cobranças, inscrições e oportunidades acabam esquecidos ou sem acompanhamento até perderem sua utilidade.',
    team: 'team-vida',
    author: 'user-luisa',
    ageHours: 24 * 24,
    reason: 'Uma inscrição gratuita foi perdida por esquecimento.',
    solutions: [
      ['Caixa de entrada única de obrigações', 'Consolida prazos e pendências de várias fontes em um só painel.', 'Nada se perde entre aplicativos diferentes.', 'Selected'],
      ['Resumo semanal de pendências', 'Envia um resumo com tudo que vence na semana.', 'Simples, mas não resolve a organização de origem.', 'Open'],
    ],
    version: ['Versão com prazos manuais primeiro', 'Usuário cadastra os prazos sem integrações.', 'Valida o hábito antes de automatizar.', 'Selected', 'Validated'],
    hypothesis: ['Um painel único reduz prazos perdidos.', 'Nenhum prazo esquecido em 90 dias de uso.', 'Validated'],
    feedbacks: [['user-beatriz', 'Eu esqueci uma cobrança e paguei juros à toa. Faz sentido.', 5]],
  },
  {
    slug: 'refill',
    title: 'REFILL — Reposição inteligente de produtos',
    description:
      'Pessoas e famílias compram produtos tarde demais ou em excesso porque não acompanham adequadamente seu consumo.',
    team: 'team-vida',
    author: 'user-marina',
    ageHours: 24 * 21,
    reason: 'Compras por impulso no mercado geram desperdício.',
    solutions: [
      ['Alerta de reposição por consumo', 'Aprende o ritmo de consumo e avisa antes de acabar.', 'Evita tanto a falta quanto o excesso.', 'Open'],
      ['Assinatura de itens essenciais', 'Reposição automática de produtos de uso recorrente.', 'Prática, mas tira o controle da família.', 'Discarded'],
    ],
    version: ['Versão só para itens de limpeza', 'Começa por uma categoria com consumo previsível.', 'Testa a previsão antes de expandir.', 'Open', 'NotTested'],
    hypothesis: ['Alertas de reposição reduzem compras por impulso.', 'Compras mensais caem 20% em 3 meses.', null],
    feedbacks: [['user-ana', 'Interessante, mas prever consumo de cada casa é difícil.', 3]],
  },
  {
    slug: 'fair-price',
    title: 'FAIR PRICE — Transparência em orçamentos',
    description:
      'Consumidores não sabem avaliar se o preço de um serviço é justo, se existem cobranças excessivas ou se determinado orçamento está incompleto.',
    team: 'team-social',
    author: 'user-igor',
    ageHours: 24 * 19,
    reason: 'Três orçamentos do mesmo serviço variaram em 300%.',
    solutions: [
      ['Comparador de orçamentos padronizado', 'Mesmo escopo descrito para vários fornecedores, comparando item a item.', 'Torna a comparação justa e visível.', 'Selected'],
      ['Banco de preços de referência', 'Mostra quanto outros pagaram pelo mesmo serviço na região.', 'Dá contexto, mas não padroniza o que é comparado.', 'Open'],
    ],
    version: ['Versão para serviços de manutenção predial', 'Começa por um tipo de serviço com muitos orçamentos.', 'Escopo específico gera dados comparáveis.', 'Selected', 'Validated'],
    hypothesis: ['Orçamentos padronizados reduzem o preço médio contratado.', 'Economia média de pelo menos 20% em 10 contratações.', 'Validated'],
    feedbacks: [
      ['user-luisa', 'Já caí em orçamento incompleto, aprovo.', 5],
      ['user-thales', 'Precisa garantir que fornecedores não manipulem os dados.', 4],
    ],
  },
  {
    slug: 'before-you-buy',
    title: 'BEFORE YOU BUY — Custos escondidos de compras',
    description:
      'Consumidores avaliam apenas o preço inicial de produtos, sem considerar manutenção, consumo de energia, peças, durabilidade e outros custos futuros.',
    team: 'team-social',
    author: 'user-rafael',
    ageHours: 24 * 17,
    reason: 'Um aparelho barato custou o dobro em manutenção no ano seguinte.',
    solutions: [
      ['Calculadora de custo total de posse', 'Soma preço, energia, peças e manutenção estimada em 3 anos.', 'Muda a decisão no momento da compra.', 'Open'],
      ['Ficha de custos futuros por produto', 'Ficha pública com custos conhecidos por modelo.', 'Depende de dados de muitos produtos.', 'Discarded'],
    ],
    version: ['Versão só para eletrodomésticos', 'Categoria com custos de energia mais relevantes.', 'Dados mais fáceis de estimar.', 'Open', 'NotTested'],
    hypothesis: ['Mostrar o custo total muda a escolha do produto.', 'Pelo menos 30% escolhem modelo diferente após o cálculo.', 'Refuted'],
    feedbacks: [['user-marina', 'Boa, mas estimativas de manutenção podem ser chutadas.', 3]],
  },
  {
    slug: 'price-memory',
    title: 'PRICE MEMORY — Histórico real de preços',
    description:
      'Consumidores não conseguem identificar facilmente se uma promoção representa uma redução verdadeira ou apenas uma alteração temporária no preço.',
    team: 'team-social',
    author: 'user-beatriz',
    ageHours: 24 * 15,
    reason: '"Promoção" que na verdade era o preço normal de sempre.',
    solutions: [
      ['Histórico de preços por produto', 'Gráfico com o preço dos últimos meses para cada produto.', 'Expõe promoções falsas de imediato.', 'Selected'],
      ['Alerta de queda real de preço', 'Avisa apenas quando o preço cai abaixo da média histórica.', 'Menos ruído, mas não mostra o contexto completo.', 'Open'],
    ],
    version: ['Versão para supermercados', 'Começa por uma categoria de compra frequente.', 'Dados de preço mais disponíveis.', 'Selected', 'Validated'],
    hypothesis: ['Histórico de preços reduz compras em "promoções" falsas.', 'Tempo médio de decisão de compra diminui e compras por impulso caem.', 'Validated'],
    feedbacks: [['user-ana', 'Todo mundo já caiu nessa. Relevante.', 5]],
  },
  {
    slug: 'safe-deal',
    title: 'SAFE DEAL — Segurança em negociações',
    description:
      'Pessoas realizam compras, vendas e contratações entre particulares sem conseguir avaliar adequadamente os riscos de golpes e fraudes.',
    team: 'team-social',
    author: 'user-luisa',
    ageHours: 24 * 13,
    reason: 'Golpes em anúncios usam confiança e pressa das vítimas.',
    solutions: [
      ['Checklist de segurança em negociações', 'Guia passo a passo para validar vendedor, pagamento e entrega.', 'Educa no momento de risco, sem bloquear a negociação.', 'Open'],
      ['Canal de denúncia integrado', 'Denúncias validadas alimentam um alerta público de golpes.', 'Ajuda depois do golpe, não previne o primeiro.', 'Discarded'],
    ],
    version: ['Versão para compra de eletrônicos usados', 'Categoria com mais golpes relatados.', 'Foco no maior risco.', 'Open', 'NotTested'],
    hypothesis: ['Um checklist reduz a exposição a golpes.', 'Usuários que seguem o checklist relatam menos tentativas concluídas.', null],
    feedbacks: [['user-igor', 'Útil, mas checklist longo ninguém lê na hora.', 3]],
  },
  {
    slug: 'my-rights',
    title: 'MY RIGHTS — Conhecimento dos direitos do consumidor',
    description:
      'Muitas pessoas não sabem quais são seus direitos, quais procedimentos seguir e onde buscar ajuda quando enfrentam cobranças indevidas, produtos defeituosos ou serviços não prestados.',
    team: 'team-social',
    author: 'user-ana',
    ageHours: 24 * 11,
    reason: 'Cobrança indevida resolvida só depois de meses por falta de informação.',
    solutions: [
      ['Guia prático de direitos do consumidor', 'Explica direitos e procedimentos em linguagem simples, por situação.', 'Informação acionável resolve a maioria dos casos.', 'Selected'],
      ['Modelo de reclamação pronto', 'Gera o texto da reclamação com os dados do caso.', 'Facilita, mas não ensina o direito por trás.', 'Open'],
    ],
    version: ['Versão só para cobranças indevidas', 'Situação mais comum e com procedimento claro.', 'Escopo que dá para cobrir bem.', 'Selected', 'Validated'],
    hypothesis: ['Guia em linguagem simples aumenta a resolução de reclamações.', 'Pelo menos 50% dos usuários concluem a reclamação.', 'Validated'],
    feedbacks: [['user-beatriz', 'Informação clara muda o jogo para quem não sabe por onde começar.', 5]],
  },
  {
    slug: 'rent-check',
    title: 'RENT CHECK — Segurança na relação de aluguel',
    description:
      'Inquilinos têm dificuldade para acompanhar contratos, reajustes, obrigações, problemas no imóvel e registros de entrada e saída.',
    team: 'team-social',
    author: 'user-marina',
    ageHours: 24 * 9,
    reason: 'Desconto de caução por danos que já existiam na entrada.',
    solutions: [
      ['Checklist digital de entrada e saída', 'Fotos e registros datados do estado do imóvel na entrada e na saída.', 'Cria prova objetiva contra descontos indevidos.', 'Selected'],
      ['Linha do tempo do contrato', 'Acompanha reajustes, vencimentos e obrigações do contrato.', 'Organiza o contrato, mas não resolve disputas de estado do imóvel.', 'Open'],
    ],
    version: ['Versão só com fotos datadas', 'Começa pelo registro fotográfico, sem formulários longos.', 'Adoção rápida por baixo esforço.', 'Selected', 'Validated'],
    hypothesis: ['Registro fotográfico reduz disputas de caução.', 'Disputas caem pela metade em um ano de uso.', 'Validated'],
    feedbacks: [['user-rafael', 'Já passei por isso e é desgastante. Boa ideia.', 5]],
  },
  {
    slug: 'return-window',
    title: 'RETURN WINDOW — Prazos de devolução e garantia',
    description:
      'Consumidores perdem prazos de devolução, troca e acionamento de garantias por falta de organização e acompanhamento.',
    team: 'team-social',
    author: 'user-igor',
    ageHours: 24 * 7,
    reason: 'Um produto defeituoso ficou guardado até a garantia vencer.',
    solutions: [
      ['Contador de prazos de devolução', 'Conta os dias restantes de devolução e garantia por compra.', 'Alerta antes de perder o prazo.', 'Open'],
      ['Aviso de garantia por produto', 'Lembrete quando a garantia está prestes a vencer.', 'Simples, mas não cobre trocas e devoluções.', 'Discarded'],
    ],
    version: ['Versão para compras online', 'Prazos de arrependimento são mais curtos e frequentes.', 'Foco no maior risco de perda.', 'Open', 'NotTested'],
    hypothesis: ['Contadores de prazo reduzem garantias perdidas.', 'Nenhuma garantia vencida sem uso em 6 meses.', null],
    feedbacks: [['user-luisa', 'Simples e útil, mas depende de cadastrar cada compra.', 4]],
  },
  {
    slug: 'small-print',
    title: 'SMALL PRINT — Condições escondidas em contratos',
    description:
      'Pessoas aceitam contratos e termos de serviço sem compreender completamente renovações automáticas, multas, limitações e obrigações futuras.',
    team: 'team-social',
    author: 'user-beatriz',
    ageHours: 24 * 5,
    reason: 'Renovação automática com multa descoberta tarde demais.',
    solutions: [
      ['Resumo em linguagem simples de contratos', 'Extrai multas, renovações e obrigações em formato claro.', 'Muda a decisão antes da assinatura.', 'Selected'],
      ['Destaque de multas e renovações', 'Marca automaticamente as cláusulas críticas do documento.', 'Rápido, mas pode perder contexto.', 'Open'],
    ],
    version: ['Versão para contratos de academia e streaming', 'Categorias com mais reclamações de renovação.', 'Cláusulas mais padronizadas.', 'Selected', 'Validated'],
    hypothesis: ['Resumos claros reduzem assinaturas não desejadas.', 'Reclamações por renovação caem 30% entre usuários.', 'Validated'],
    feedbacks: [
      ['user-thales', 'Muito relevante, mas resumir contrato exige cuidado jurídico.', 4],
      ['user-ana', 'Eu teria evitado uma multa com isso.', 5],
    ],
  },
  {
    slug: 'open-door',
    title: 'OPEN DOOR — Descoberta de oportunidades',
    description:
      'Pessoas deixam de participar de cursos gratuitos, bolsas, programas de capacitação, benefícios e oportunidades porque não sabem que são elegíveis ou não conseguem encontrá-los.',
    team: 'team-tech',
    author: 'user-rafael',
    ageHours: 24 * 40,
    reason: 'Bolsa gratuita encerrada sem que nenhum elegível soubesse.',
    solutions: [
      ['Buscador de cursos e bolsas gratuitas', 'Lista oportunidades com filtros de elegibilidade e prazo.', 'Reúne o que está espalhado em vários sites.', 'Selected'],
      ['Alerta de elegibilidade', 'Avisa quando o perfil da pessoa bate com uma oportunidade.', 'Personaliza, mas exige cadastro detalhado.', 'Open'],
    ],
    version: ['Versão só para bolsas de estudo', 'Categoria com mais demanda e prazos curtos.', 'Elegibilidade mais fácil de verificar.', 'Selected', 'Validated'],
    hypothesis: ['Um buscador único aumenta inscrições em oportunidades gratuitas.', 'Pelo menos 2 inscrições por usuário em 90 dias.', 'Validated'],
    feedbacks: [['user-beatriz', 'Oportunidade importante e pouco visível.', 5]],
  },
  {
    slug: 'accessible-now',
    title: 'ACCESSIBLE NOW — Acessibilidade em espaços públicos',
    description:
      'Pessoas com necessidades de acessibilidade têm dificuldade para descobrir se estabelecimentos e locais públicos oferecem condições adequadas de acesso.',
    team: 'team-tech',
    author: 'user-marina',
    ageHours: 24 * 37,
    reason: 'Local anunciado como acessível sem rampa na entrada.',
    solutions: [
      ['Mapa de acessibilidade de locais', 'Locais com informações verificadas de acesso, banheiro e estacionamento.', 'Informação confiável evita idas frustradas.', 'Open'],
      ['Selo de verificação presencial', 'Voluntários confirmam as condições no local.', 'Mais confiável, mas escala devagar.', 'Discarded'],
    ],
    version: ['Versão piloto em uma cidade', 'Começa por um território limitado.', 'Qualidade dos dados antes de quantidade.', 'Open', 'NotTested'],
    hypothesis: ['Informações verificadas de acesso reduzem idas frustradas.', 'Relatos de frustração caem pela metade em 6 meses.', 'Refuted'],
    feedbacks: [['user-luisa', 'Tema essencial, mas manter os dados atualizados é o desafio.', 4]],
  },
  {
    slug: 'skill-proof',
    title: 'SKILL PROOF — Comprovação de habilidades',
    description:
      'Pessoas possuem conhecimentos práticos, mas encontram dificuldades para demonstrá-los porque não têm certificados ou experiência profissional formal.',
    team: 'team-tech',
    author: 'user-thales',
    ageHours: 24 * 34,
    reason: 'Profissionais qualificados perdem vagas por falta de certificado.',
    solutions: [
      ['Portfólio de projetos práticos', 'Mostra projetos reais com evidências e depoimentos.', 'Prova na prática, sem depender de diploma.', 'Selected'],
      ['Prova prática certificada', 'Avaliação prática com certificado ao final.', 'Gera um selo formal, mas exige estrutura de avaliação.', 'Open'],
    ],
    version: ['Versão para área de tecnologia', 'Projetos são facilmente demonstráveis.', 'Portfólio natural da área.', 'Selected', 'Validated'],
    hypothesis: ['Portfólios práticos aumentam chamadas para entrevistas.', 'Pelo menos 30% mais entrevistas em 3 meses.', 'Validated'],
    feedbacks: [['user-igor', 'Faz sentido para quem aprendeu fazendo.', 4]],
  },
  {
    slug: 'local-rescue',
    title: 'LOCAL RESCUE — Ajuda local em situações de necessidade',
    description:
      'Pessoas que precisam de ajuda com urgência têm dificuldade para encontrar recursos, serviços e pessoas disponíveis na própria comunidade.',
    team: 'team-tech',
    author: 'user-ana',
    ageHours: 24 * 31,
    reason: 'Família precisou de ajuda e não sabia a quem recorrer no bairro.',
    solutions: [
      ['Rede local de ajuda urgente', 'Mapa de pessoas e serviços dispostos a ajudar na comunidade.', 'Resposta rápida com quem está perto.', 'Open'],
      ['Banco de horas da comunidade', 'Troca de favores registrada em horas.', 'Cria reciprocidade, mas é mais lento para urgências.', 'Discarded'],
    ],
    version: ['Versão por bairro', 'Começa em um bairro com rede ativa.', 'Confiança local é o pré-requisito.', 'Open', 'NotTested'],
    hypothesis: ['Uma rede local reduz o tempo de resposta a pedidos de ajuda.', 'Tempo médio de resposta abaixo de 2 horas.', null],
    feedbacks: [['user-beatriz', 'Bonita na teoria, mas segurança dos envolvidos importa.', 3]],
  },
  {
    slug: 'second-chance',
    title: 'SECOND CHANCE — Reaproveitamento de recursos',
    description:
      'Objetos, equipamentos e materiais são descartados mesmo quando ainda poderiam ser utilizados por outras pessoas ou organizações.',
    team: 'team-tech',
    author: 'user-luisa',
    ageHours: 24 * 28,
    reason: 'Equipamentos em bom estado foram para o lixo em uma empresa.',
    solutions: [
      ['Plataforma de doação de objetos', 'Conecta quem descarta com quem precisa, com logística simples.', 'Dá destino útil ao que seria lixo.', 'Selected'],
      ['Ponto de troca entre vizinhos', 'Prateleira comunitária para doar e retirar objetos.', 'Simples e local, mas escala limitada.', 'Open'],
    ],
    version: ['Versão para equipamentos de informática', 'Categoria com maior volume de descarte útil.', 'Valor claro para quem recebe.', 'Selected', 'Validated'],
    hypothesis: ['Doações organizadas aumentam o reaproveitamento.', 'Pelo menos 100 objetos reaproveitados por mês.', 'Validated'],
    feedbacks: [['user-marina', 'Sustentabilidade com utilidade prática.', 5]],
  },
  {
    slug: 'lost-found',
    title: 'LOST & FOUND — Recuperação de objetos perdidos',
    description:
      'Pessoas perdem objetos em locais públicos e têm dificuldade para encontrar quem os localizou ou identificar itens encontrados que lhes pertencem.',
    team: 'team-tech',
    author: 'user-igor',
    ageHours: 24 * 25,
    reason: 'Mochila encontrada em um parque nunca chegou ao dono.',
    solutions: [
      ['Achados e perdidos digital', 'Cadastro de itens encontrados e perdidos por local.', 'Conecta quem achou com quem perdeu.', 'Open'],
      ['Etiqueta com QR em objetos', 'QR no objeto leva a um contato de devolução.', 'Funciona mesmo sem cadastro prévio do achador.', 'Discarded'],
    ],
    version: ['Versão piloto em escolas', 'Ambiente com muitos objetos perdidos.', 'Comunidade fechada facilita devolução.', 'Open', 'NotTested'],
    hypothesis: ['Um cadastro digital aumenta a recuperação de objetos.', 'Taxa de recuperação acima de 40% em 6 meses.', 'Refuted'],
    feedbacks: [['user-rafael', 'Ideia simples, mas depende de muita gente colaborando.', 3]],
  },
  {
    slug: 'shadow-work',
    title: 'SHADOW WORK — Trabalho invisível',
    description:
      'Atividades importantes realizadas diariamente pelas pessoas não são reconhecidas, contabilizadas ou consideradas no planejamento de trabalho.',
    team: 'team-branchstorm',
    author: 'user-pedro',
    ageHours: 24 * 22,
    reason: 'Reuniões e suporte diários nunca entram na estimativa de capacidade.',
    solutions: [
      ['Registro de tarefas invisíveis', 'Aponta e quantifica o trabalho não planejado do dia a dia.', 'Torna visível o que hoje é invisível.', 'Selected'],
      ['Cálculo de carga de trabalho real', 'Soma planejado e invisível para dimensionar equipes.', 'Ajuda no planejamento, mas não reconhece o indivíduo.', 'Open'],
    ],
    version: ['Versão para equipes de suporte', 'Área com mais trabalho invisível.', 'Impacto mais visível.', 'Selected', 'Validated'],
    hypothesis: ['Registrar o trabalho invisível muda o planejamento de capacidade.', 'Estimativas ficam 20% mais precisas em um trimestre.', 'Validated'],
    feedbacks: [['user-ana', 'Quem vive isso reconhece na hora.', 5]],
  },
  {
    slug: 'human-bottleneck',
    title: 'HUMAN BOTTLENECK — Dependência excessiva de pessoas',
    description:
      'Determinadas atividades dependem exclusivamente de uma pessoa, tornando processos vulneráveis quando ela está ausente ou deixa uma organização.',
    team: 'team-branchstorm',
    author: 'user-matheus',
    ageHours: 24 * 20,
    reason: 'Um processo inteiro parou por uma semana de férias.',
    solutions: [
      ['Mapa de dependências críticas', 'Identifica atividades com apenas uma pessoa capaz de executá-las.', 'Expõe o risco antes da ausência acontecer.', 'Open'],
      ['Plano de backup por função', 'Treina uma segunda pessoa para cada atividade crítica.', 'Resolve o risco, mas exige tempo de treinamento.', 'Discarded'],
    ],
    version: ['Versão só para processos mensais', 'Atividades críticas com periodicidade conhecida.', 'Escopo gerenciável.', 'Open', 'NotTested'],
    hypothesis: ['Mapear dependências reduz paradas por ausência.', 'Nenhuma parada por ausência em 6 meses.', null],
    feedbacks: [['user-thales', 'Toda organização tem isso e ignora.', 4]],
  },
  {
    slug: 'lost-context',
    title: 'LOST CONTEXT — Perda de contexto em solicitações',
    description:
      'Informações importantes desaparecem quando uma solicitação passa de uma pessoa, setor ou equipe para outra, obrigando todos a repetir explicações.',
    team: 'team-branchstorm',
    author: 'user-thales',
    ageHours: 24 * 18,
    reason: 'Cliente repetiu a mesma explicação em 5 atendimentos.',
    solutions: [
      ['Ficha única de solicitações', 'Histórico completo da solicitação acompanha cada transferência.', 'Ninguém precisa recomeçar do zero.', 'Selected'],
      ['Resumo automático de histórico', 'Gera um resumo do que já foi feito e dito.', 'Rápido, mas pode perder nuances.', 'Open'],
    ],
    version: ['Versão para suporte ao cliente', 'Área com mais transferências.', 'Impacto imediato no atendimento.', 'Selected', 'Validated'],
    hypothesis: ['Histórico único reduz o tempo de atendimento.', 'Tempo médio de atendimento cai 25% em 3 meses.', 'Validated'],
    feedbacks: [
      ['user-matheus', 'Já cansei de repetir explicações. Relevante.', 5],
      ['user-ana', 'Precisa cuidar da privacidade do histórico.', 4],
    ],
  },
  {
    slug: 'fair-share',
    title: 'FAIR SHARE — Distribuição desigual de responsabilidades',
    description:
      'Tarefas, despesas e responsabilidades são distribuídas de maneira desequilibrada, sobrecarregando algumas pessoas enquanto outras possuem capacidade disponível.',
    team: 'team-branchstorm',
    author: 'user-ana',
    ageHours: 24 * 16,
    reason: 'As mesmas pessoas acumulam tarefas enquanto outras ficam ociosas.',
    solutions: [
      ['Rodízio transparente de tarefas', 'Distribuição visível e rotativa de tarefas e despesas.', 'Transparência muda o comportamento.', 'Open'],
      ['Quadro de responsabilidades visível', 'Mostra quem é responsável por cada frente.', 'Clareza ajuda, mas não garante equilíbrio.', 'Discarded'],
    ],
    version: ['Versão para tarefas domésticas compartilhadas', 'Contexto com desequilíbrio mais comum.', 'Teste fácil em casa.', 'Open', 'NotTested'],
    hypothesis: ['Transparência na distribuição reduz a sobrecarga percebida.', 'Percepção de justiça sobe em pesquisa com o grupo.', 'Refuted'],
    feedbacks: [['user-pedro', 'Tema sensível, mas a transparência ajuda.', 4]],
  },
  {
    slug: 'empty-slot',
    title: 'EMPTY SLOT — Recursos e horários ociosos',
    description:
      'Horários, espaços, equipamentos e recursos disponíveis deixam de ser aproveitados mesmo quando existem pessoas precisando deles.',
    team: 'team-branchstorm',
    author: 'user-beatriz',
    ageHours: 24 * 14,
    reason: 'Salas da escola vazias à tarde enquanto turmas esperam por espaço.',
    solutions: [
      ['Agenda pública de espaços ociosos', 'Mostra horários livres de salas e equipamentos para reserva.', 'Reduz ociosidade com informação simples.', 'Selected'],
      ['Lista de espera inteligente', 'Preenche cancelamentos automaticamente.', 'Otimiza, mas não resolve a falta de visibilidade inicial.', 'Open'],
    ],
    version: ['Versão para salas de aula', 'Recurso com demanda alta e agenda simples.', 'Piloto fácil de medir.', 'Selected', 'Validated'],
    hypothesis: ['Visibilidade de horários ociosos aumenta o aproveitamento.', 'Aproveitamento sobe para acima de 80% em um bimestre.', 'Validated'],
    feedbacks: [['user-luisa', 'Escola com sala vazia e aluno sem aula é absurdo.', 5]],
  },
  {
    slug: 'last-mile',
    title: 'LAST MILE — Processos que nunca terminam',
    description:
      'Atividades chegam muito perto da conclusão, mas ficam paradas aguardando uma assinatura, confirmação, autorização ou última etapa.',
    team: 'team-branchstorm',
    author: 'user-igor',
    ageHours: 24 * 12,
    reason: 'Documentos aguardando uma assinatura por semanas.',
    solutions: [
      ['Painel de pendências finais', 'Mostra tudo que está aguardando a última etapa e há quanto tempo.', 'Pressão pela visibilidade destrava.', 'Open'],
      ['Lembrete de assinaturas e autorizações', 'Avisa quem precisa assinar antes do prazo.', 'Simples, mas não mostra o panorama.', 'Discarded'],
    ],
    version: ['Versão para aprovações de documentos', 'Etapa final mais comum nas organizações.', 'Escopo bem definido.', 'Open', 'NotTested'],
    hypothesis: ['Visibilidade das pendências finais acelera conclusões.', 'Tempo médio da última etapa cai pela metade.', null],
    feedbacks: [['user-thales', 'Todo mundo já sofreu com documento parado.', 4]],
  },
  {
    slug: 'quiet-failure',
    title: 'QUIET FAILURE — Falhas silenciosas',
    description:
      'Sistemas e processos apresentam sinais graduais de deterioração, mas os responsáveis só percebem quando ocorre uma falha grave.',
    team: 'team-tech',
    author: 'user-thales',
    ageHours: 24 * 10,
    reason: 'Um serviço degradou por 3 meses antes de cair de vez.',
    solutions: [
      ['Monitores de sinais de deterioração', 'Acompanha tendências de erro, latência e uso até o limite.', 'Avisa antes da falha grave.', 'Selected'],
      ['Alertas graduais por tendência', 'Dispara alertas quando a tendência de piora se confirma.', 'Menos ruído, mas exige baseline confiável.', 'Open'],
    ],
    version: ['Versão para APIs críticas', 'Começa pelos serviços de maior impacto.', 'Prioriza onde a falha custa mais.', 'Selected', 'Validated'],
    hypothesis: ['Monitorar tendências reduz falhas graves.', 'Falhas graves caem 40% em 6 meses.', 'Validated'],
    feedbacks: [['user-matheus', 'Quem opera sistema sabe que isso acontece sempre.', 5]],
  },
  {
    slug: 'repeat-error',
    title: 'REPEAT ERROR — Erros recorrentes',
    description:
      'Organizações corrigem repetidamente os mesmos erros sem identificar e resolver suas causas fundamentais.',
    team: 'team-tech',
    author: 'user-matheus',
    ageHours: 24 * 8,
    reason: 'O mesmo bug crítico voltou 4 vezes em um ano.',
    solutions: [
      ['Banco de erros recorrentes', 'Registra cada erro com causa raiz e correção aplicada.', 'Evita repetir a mesma correção superficial.', 'Open'],
      ['Post-mortem padronizado', 'Análise estruturada após cada incidente.', 'Qualidade alta, mas esforço alto por incidente.', 'Discarded'],
    ],
    version: ['Versão só para bugs de produção', 'Foco nos erros que mais custam.', 'ROI claro.', 'Open', 'NotTested'],
    hypothesis: ['Registrar a causa raiz reduz recorrência.', 'Recorrência cai para menos de 10% em 6 meses.', 'Refuted'],
    feedbacks: [['user-pedro', 'Banco de erros só funciona se for rápido de consultar.', 3]],
  },
  {
    slug: 'traceback',
    title: 'TRACEBACK — Reconstrução da origem de problemas',
    description:
      'Quando acontece uma falha, as equipes têm dificuldade para reconstruir a sequência de acontecimentos, alterações e decisões que a causaram.',
    team: 'team-tech',
    author: 'user-igor',
    ageHours: 24 * 6,
    reason: 'Uma investigação levou 2 dias só para montar a linha do tempo.',
    solutions: [
      ['Linha do tempo de incidentes', 'Reúne alterações, deploys e decisões em uma cronologia.', 'Investigar vira consultar, não montar quebra-cabeça.', 'Selected'],
      ['Registro de decisões por mudança', 'Cada mudança carrega o motivo e o autor.', 'Ajuda na origem, mas não mostra o efeito no tempo.', 'Open'],
    ],
    version: ['Versão integrada ao pipeline de deploy', 'Deploys são a causa mais comum.', 'Dados já existem no pipeline.', 'Selected', 'Validated'],
    hypothesis: ['Cronologias de incidentes reduzem o tempo de investigação.', 'Tempo médio de investigação cai 50% em 3 meses.', 'Validated'],
    feedbacks: [['user-thales', 'Ferramenta de investigação que eu usaria todo dia.', 5]],
  },
  {
    slug: 'change-impact-radar',
    title: 'CHANGE IMPACT RADAR — Impacto de mudanças',
    description:
      'Pequenas modificações em sistemas podem afetar outras funcionalidades, serviços e integrações sem que os responsáveis percebam antecipadamente.',
    team: 'team-tech',
    author: 'user-beatriz',
    ageHours: 24 * 4,
    reason: 'Uma mudança pequena quebrou um serviço que ninguém lembrou.',
    solutions: [
      ['Mapa de impacto de mudanças', 'Mostra o que pode ser afetado antes de aplicar uma alteração.', 'Previne a quebra surpresa.', 'Open'],
      ['Simulação de dependências', 'Testa a mudança em ambiente isolado antes de publicar.', 'Seguro, mas caro para cada mudança.', 'Discarded'],
    ],
    version: ['Versão para APIs compartilhadas', 'Impacto cruzado mais comum.', 'Escopo com mais risco.', 'Open', 'NotTested'],
    hypothesis: ['Ver o impacto antes reduz regressões.', 'Regressões por mudança caem 30% em 6 meses.', null],
    feedbacks: [['user-ana', 'Interessante, mas manter o mapa atualizado é difícil.', 3]],
  },
  {
    slug: 'api-afterlife',
    title: 'API AFTERLIFE — Dependências de APIs abandonadas',
    description:
      'Sistemas continuam dependendo de APIs antigas ou descontinuadas, mesmo quando seus responsáveis acreditam que elas não são mais utilizadas.',
    team: 'team-tech',
    author: 'user-rafael',
    ageHours: 24 * 3,
    reason: 'Uma API desligada derrubou um fluxo que "não usava mais nada".',
    solutions: [
      ['Inventário de chamadas de API', 'Lista quem chama cada endpoint e com que frequência.', 'Mostra o uso real, não o presumido.', 'Selected'],
      ['Alerta de uso de endpoints legados', 'Avisa quando código chama uma API marcada como antiga.', 'Ajuda no código, mas não mostra o panorama.', 'Open'],
    ],
    version: ['Versão com análise de logs', 'Usa logs existentes, sem instrumentação nova.', 'Dados reais desde o primeiro dia.', 'Selected', 'Validated'],
    hypothesis: ['Inventariar chamadas revela dependências esquecidas.', 'Pelo menos 20% das APIs "abandonadas" são removidas ou migradas.', 'Validated'],
    feedbacks: [['user-matheus', 'Toda base antiga tem isso escondido.', 4]],
  },
  {
    slug: 'data-contract-rescue',
    title: 'DATA CONTRACT RESCUE — Incompatibilidade de dados',
    description:
      'Sistemas trocam informações utilizando formatos aparentemente compatíveis, mas interpretam os dados com significados diferentes, causando inconsistências.',
    team: 'team-tech',
    author: 'user-ana',
    ageHours: 24 * 2,
    reason: 'Um campo "data" significava coisas diferentes em dois sistemas.',
    solutions: [
      ['Contratos de dados versionados', 'Define e versiona o significado de cada campo trocado.', 'Elimina a ambiguidade na origem.', 'Open'],
      ['Validação de significado em troca', 'Confere se o valor faz sentido no sistema receptor.', 'Detecta o erro, mas não define o contrato.', 'Discarded'],
    ],
    version: ['Versão para integrações financeiras', 'Inconsistências com maior custo.', 'Prioridade pelo impacto.', 'Open', 'NotTested'],
    hypothesis: ['Contratos versionados reduzem inconsistências de dados.', 'Inconsistências caem 60% em 6 meses.', 'Refuted'],
    feedbacks: [['user-igor', 'Problema real, mas contrato bom exige disciplina dos dois lados.', 4]],
  },
  {
    slug: 'architecture-drift',
    title: 'ARCHITECTURE DRIFT — Distanciamento entre projeto e implementação',
    description:
      'A arquitetura documentada deixa de representar a estrutura real do software conforme novas funcionalidades e alterações são implementadas.',
    team: 'team-tech',
    author: 'user-pedro',
    ageHours: 24 * 1,
    reason: 'O diagrama dizia uma coisa, o código fazia outra há anos.',
    solutions: [
      ['Comparador arquitetura x código', 'Mostra onde a implementação divergiu do desenho documentado.', 'Torna o desvio visível e acionável.', 'Selected'],
      ['Relatório de desvios por módulo', 'Lista módulos com maior divergência do desenho.', 'Prioriza onde corrigir, sem comparar em detalhe.', 'Open'],
    ],
    version: ['Versão só para dependências entre módulos', 'Divergência mais comum e mais fácil de detectar.', 'Começa pelo essencial.', 'Selected', 'Validated'],
    hypothesis: ['Visualizar desvios reduz o distanciamento arquitetural.', 'Divergências críticas caem 40% em 2 trimestres.', 'Validated'],
    feedbacks: [['user-thales', 'Documentação morta é um problema universal.', 5]],
  },
  {
    slug: 'migration-intelligence',
    title: 'MIGRATION INTELLIGENCE — Modernização de sistemas legados',
    description:
      'Empresas possuem sistemas antigos com muitas dependências e têm dificuldade para planejar migrações graduais sem interromper suas operações.',
    team: 'team-tech',
    author: 'user-marina',
    ageHours: 19,
    reason: 'Migração tentada de uma vez parou a operação por dias.',
    solutions: [
      ['Plano de migração por fases', 'Divide a migração em etapas independentes e reversíveis.', 'Reduz o risco de parar tudo de uma vez.', 'Open'],
      ['Mapa de dependências legadas', 'Mostra o que depende de cada parte do sistema antigo.', 'Ajuda a planejar, mas não entrega o plano.', 'Discarded'],
    ],
    version: ['Versão para sistemas de gestão interna', 'Escopo com fronteiras mais claras.', 'Piloto de migração mais seguro.', 'Open', 'NotTested'],
    hypothesis: ['Migração por fases reduz interrupções.', 'Zero interrupções não planejadas em 12 meses.', null],
    feedbacks: [['user-beatriz', 'Tema caro e urgente, mas poucas empresas admitem.', 4]],
  },
  {
    slug: 'dependency-trap',
    title: 'DEPENDENCY TRAP — Dependências perigosas',
    description:
      'Sistemas, processos e operações possuem dependências críticas que não são conhecidas ou documentadas adequadamente.',
    team: 'team-tech',
    author: 'user-luisa',
    ageHours: 15,
    reason: 'Uma biblioteca sem manutenção travou uma entrega inteira.',
    solutions: [
      ['Grago de dependências críticas', 'Visualiza dependências e o impacto de cada uma.', 'Mostra onde está o risco concentrado.', 'Selected'],
      ['Alertas de risco por dependência', 'Avisa sobre abandono ou vulnerabilidades.', 'Mantenha o risco visível no dia a dia.', 'Open'],
    ],
    version: ['Versão para dependências de código', 'Risco mais fácil de mapear.', 'Começa pelo técnico.', 'Selected', 'Validated'],
    hypothesis: ['Mapear dependências reduz surpresas em entregas.', 'Entregas atrasadas por dependência caem pela metade.', 'Validated'],
    feedbacks: [['user-matheus', 'Já perdi uma entrega por causa disso.', 5]],
  },
  {
    slug: 'future-bill',
    title: 'FUTURE BILL — Custos futuros escondidos',
    description:
      'Decisões aparentemente econômicas no presente geram custos elevados de manutenção, operação e substituição no futuro.',
    team: 'team-tech',
    author: 'user-thales',
    ageHours: 11,
    reason: 'A opção mais barata virou a mais cara em 2 anos.',
    solutions: [
      ['Estimativa de custo futuro de decisões', 'Projeta manutenção e operação em 3 anos para cada opção.', 'Muda a decisão no momento da escolha.', 'Open'],
      ['Comparativo de custo total de arquitetura', 'Compara arquiteturas pelo custo total, não pelo inicial.', 'Útil, mas exige dados de operação.', 'Discarded'],
    ],
    version: ['Versão para escolhas de infraestrutura', 'Custos futuros mais mensuráveis.', 'Decisões com maior impacto.', 'Open', 'NotTested'],
    hypothesis: ['Projetar custos futuros muda escolhas tecnológicas.', 'Pelo menos 30% das decisões mudam após a estimativa.', 'Refuted'],
    feedbacks: [['user-ana', 'Boa intenção, mas prever custo futuro é chutável.', 3]],
  },
  {
    slug: 'capacity-zero',
    title: 'CAPACITY ZERO — Capacidade desperdiçada',
    description:
      'Empresas e organizações possuem recursos, equipamentos, espaços e profissionais subutilizados, enquanto outras necessidades continuam sem atendimento.',
    team: 'team-branchstorm',
    author: 'user-ana',
    ageHours: 8,
    reason: 'Salas e equipamentos parados com fila de espera ao lado.',
    solutions: [
      ['Mapa de capacidade ociosa', 'Mostra recursos subutilizados e demandas não atendidas lado a lado.', 'Expõe o desperdício em uma visão só.', 'Selected'],
      ['Bolsão de recursos entre unidades', 'Compartilha recursos entre unidades da organização.', 'Reduz ociosidade, mas exige logística.', 'Open'],
    ],
    version: ['Versão para espaços físicos', 'Capacidade ociosa mais visível.', 'Piloto fácil de medir.', 'Selected', 'Validated'],
    hypothesis: ['Visibilidade da ociosidade aumenta o aproveitamento.', 'Aproveitamento sobe 25% em um trimestre.', 'Validated'],
    feedbacks: [['user-pedro', 'Desperdício que ninguém mede.', 4]],
  },
  {
    slug: 'unfinished',
    title: 'UNFINISHED — Projetos abandonados',
    description:
      'Projetos interrompidos acumulam funcionalidades, pesquisas, documentos e investimentos que poderiam ser aproveitados em novas iniciativas.',
    team: 'team-branchstorm',
    author: 'user-igor',
    ageHours: 5,
    reason: 'Pesquisas de anos pararam em gavetas e foram refeitas.',
    solutions: [
      ['Catálogo de projetos interrompidos', 'Indexa o que foi feito, por que parou e o que pode ser reaproveitado.', 'Evita refazer pesquisa já concluída.', 'Open'],
      ['Reativação guiada de projetos', 'Roteiro para retomar um projeto interrompido.', 'Facilita a retomada, mas não cataloga o acervo.', 'Discarded'],
    ],
    version: ['Versão para pesquisas e documentos', 'Acervo mais fácil de indexar.', 'Valor imediato.', 'Open', 'NotTested'],
    hypothesis: ['Catalogar projetos interrompidos evita retrabalho.', 'Pelo menos 30% das novas iniciativas reaproveitam algo catalogado.', null],
    feedbacks: [['user-beatriz', 'Toda empresa tem esse cemitério de projetos.', 4]],
  },
];

function seedDatabase(): MockDatabase {
  const now = Date.now();
  const minutesAgo = (minutes: number): string => new Date(now - minutes * 60_000).toISOString();

  const users: UserResult[] = [
    { code: 'user-pedro', name: 'Pedro Pavei', email: 'pedro@branchstorm.tech' },
    { code: 'user-matheus', name: 'Matheus Cechinel', email: 'matheus@branchstorm.tech' },
    { code: 'user-thales', name: 'Thales Vaz', email: 'thales@branchstorm.tech' },
    { code: 'user-ana', name: 'Ana Souza', email: 'ana@branchstorm.tech' },
    { code: 'user-luisa', name: 'Luísa Prado', email: 'luisa@branchstorm.tech' },
    { code: 'user-rafael', name: 'Rafael Mendes', email: 'rafael@branchstorm.tech' },
    { code: 'user-marina', name: 'Marina Duarte', email: 'marina@branchstorm.tech' },
    { code: 'user-igor', name: 'Igor Santos', email: 'igor@branchstorm.tech' },
    { code: 'user-beatriz', name: 'Beatriz Lima', email: 'beatriz@branchstorm.tech' },
  ];

  const teams: TeamResult[] = [
    {
      code: 'team-branchstorm',
      name: 'Branchstorm',
      members: [
        { teamCode: 'team-branchstorm', userCode: 'user-pedro', role: 0 },
        { teamCode: 'team-branchstorm', userCode: 'user-matheus', role: 1 },
        { teamCode: 'team-branchstorm', userCode: 'user-thales', role: 2 },
        { teamCode: 'team-branchstorm', userCode: 'user-ana', role: 3 },
      ],
    },
    {
      code: 'team-satc',
      name: 'SATC Inovação',
      members: [
        { teamCode: 'team-satc', userCode: 'user-ana', role: 1 },
        { teamCode: 'team-satc', userCode: 'user-pedro', role: 2 },
      ],
    },
    {
      code: 'team-vida',
      name: 'Vida & Casa',
      members: [
        { teamCode: 'team-vida', userCode: 'user-luisa', role: 1 },
        { teamCode: 'team-vida', userCode: 'user-marina', role: 0 },
        { teamCode: 'team-vida', userCode: 'user-rafael', role: 2 },
        { teamCode: 'team-vida', userCode: 'user-igor', role: 3 },
        { teamCode: 'team-vida', userCode: 'user-beatriz', role: 2 },
      ],
    },
    {
      code: 'team-social',
      name: 'Impacto Social',
      members: [
        { teamCode: 'team-social', userCode: 'user-beatriz', role: 1 },
        { teamCode: 'team-social', userCode: 'user-igor', role: 0 },
        { teamCode: 'team-social', userCode: 'user-luisa', role: 2 },
        { teamCode: 'team-social', userCode: 'user-ana', role: 3 },
      ],
    },
    {
      code: 'team-tech',
      name: 'Tech Lab',
      members: [
        { teamCode: 'team-tech', userCode: 'user-thales', role: 0 },
        { teamCode: 'team-tech', userCode: 'user-rafael', role: 1 },
        { teamCode: 'team-tech', userCode: 'user-marina', role: 2 },
        { teamCode: 'team-tech', userCode: 'user-matheus', role: 2 },
      ],
    },
  ];

  const links: LinkResult[] = [];
  const hypotheses: HypothesisResult[] = [];
  const feedbacks: FeedbackResult[] = [];

  for (const problem of DEMO_PROBLEMS) {
    const rootCode = `demo-${problem.slug}`;
    const created = minutesAgo(problem.ageHours * 60);
    const rootStatus: LinkStatus = problem.solutions.some((s) => s[3] === 'Selected')
      ? 'Selected'
      : 'Open';

    links.push(
      seedLink({
        code: rootCode,
        fatherCode: null,
        type: 'Problem',
        title: problem.title,
        description: problem.description,
        status: rootStatus,
        validation: 'NotTested',
        autorCode: problem.author,
        teamCode: problem.team,
        reason: problem.reason,
        creationDate: created,
      }),
    );

    const solutionCodes: string[] = [];

    problem.solutions.forEach(([title, description, reason, status], index) => {
      const code = `${rootCode}-sol-${index + 1}`;
      solutionCodes.push(code);
      links.push(
        seedLink({
          code,
          fatherCode: rootCode,
          type: 'Solution',
          title,
          description,
          status,
          validation: 'NotTested',
          autorCode: problem.author,
          teamCode: problem.team,
          reason,
          creationDate: minutesAgo(problem.ageHours * 60 - (index + 1) * 37),
        }),
      );
    });

    const [vTitle, vDescription, vReason, vStatus, vValidation] = problem.version;
    const versionCode = `${rootCode}-ver-1`;
    links.push(
      seedLink({
        code: versionCode,
        fatherCode: solutionCodes[0]!,
        type: 'Version',
        title: vTitle,
        description: vDescription,
        status: vStatus,
        validation: vValidation,
        autorCode: problem.author,
        teamCode: problem.team,
        reason: vReason,
        creationDate: minutesAgo(Math.max(30, problem.ageHours * 60 - 120)),
      }),
    );

    // Uma solução final em alguns problemas (a versão vira Final).
    if (vValidation === 'Validated' && problem.solutions[0]![3] === 'Selected') {
      const finalCode = `${rootCode}-final`;
      links.push(
        seedLink({
          code: finalCode,
          fatherCode: versionCode,
          type: 'Version',
          title: `Solução final: ${vTitle.toLowerCase()}`,
          description: vDescription,
          status: 'Final',
          validation: 'Validated',
          autorCode: problem.author,
          teamCode: problem.team,
          reason: 'Hipótese validada e feedback positivo dos avaliadores.',
          creationDate: minutesAgo(Math.max(20, problem.ageHours * 60 - 240)),
        }),
      );
    }

    const [hypDescription, hypCriteria, hypResult] = problem.hypothesis;
    hypotheses.push({
      code: `hyp-${problem.slug}`,
      linkCode: versionCode,
      description: hypDescription,
      successCriteria: hypCriteria,
      result: hypResult,
      creationDate: minutesAgo(Math.max(15, problem.ageHours * 60 - 90)),
    });

    problem.feedbacks.forEach(([autorCode, test, rating], index) => {
      feedbacks.push({
        code: `fb-${problem.slug}-${index + 1}`,
        linkCode: rootCode,
        autorCode,
        test,
        rating,
        creationDate: minutesAgo(Math.max(10, problem.ageHours * 60 - (index + 1) * 53)),
      });
    });
  }

  return { users, teams, links, hypotheses, feedbacks };
}

function seedLink(
  input: Omit<LinkResult, 'history'> & { readonly history?: readonly LinkHistoryResult[] },
): LinkResult {
  return {
    ...input,
    history: input.history ?? [
      {
        code: `hist-${input.code}-created`,
        linkCode: input.code,
        event: `Created as ${input.type}`,
        creationDate: input.creationDate,
      },
    ],
  };
}

export function linkStatus(value: string): LinkStatus {
  if (value === 'Open' || value === 'Selected' || value === 'Discarded' || value === 'Final') {
    return value;
  }

  return 'Open';
}

export function linkTypeName(value: number): LinkTypeName {
  if (value === 1) {
    return 'Solution';
  }

  if (value === 2) {
    return 'Version';
  }

  return 'Problem';
}

export function linkValidationName(value: number): LinkValidationName {
  if (value === 1) {
    return 'Validated';
  }

  if (value === 2) {
    return 'Refuted';
  }

  return 'NotTested';
}
