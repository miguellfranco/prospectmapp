// Catálogo de nichos e sub-nichos (dores principais) do EbookAI.
// O usuário também pode digitar um nicho/dor personalizada no wizard.

export interface Niche {
  id: string
  label: string
  suggestedPrice: number
  subNiches: string[]
}

export const NICHES: Niche[] = [
  {
    id: 'emagrecimento',
    label: 'Emagrecimento',
    suggestedPrice: 27.9,
    subNiches: [
      'Controlar compulsão por doces à noite',
      'Emagrecer depois dos 40',
      'Emagrecer na menopausa',
      'Emagrecer sem abrir mão do almoço em família',
      'Emagrecer sem tempo livre',
      'Emagrecer trabalhando o dia todo sentada',
      'Mulheres pós-parto sem tempo para academia',
      'Perder 5kg sem dieta restritiva',
      'Perder barriga após cesárea',
      'Secar barriga em casa com treinos curtos',
      'Voltar ao peso depois da gravidez',
    ],
  },
  {
    id: 'financas',
    label: 'Finanças',
    suggestedPrice: 29.9,
    subNiches: [
      'Sair das dívidas ganhando pouco',
      'Organizar as finanças do casal sem brigas',
      'Primeira reserva de emergência em 6 meses',
      'Parar de gastar por impulso no cartão',
      'Investir do zero com pouco dinheiro',
      'Controlar as contas de casa em uma planilha simples',
    ],
  },
  {
    id: 'renda-extra',
    label: 'Renda Extra Online',
    suggestedPrice: 37.9,
    subNiches: [
      'Primeira renda extra na internet sem aparecer',
      'Vender doces por encomenda pelo WhatsApp',
      'Renda extra para mães que ficam em casa',
      'Transformar um hobby em renda no fim de semana',
      'Revender produtos sem estoque',
    ],
  },
  {
    id: 'relacionamento',
    label: 'Relacionamento',
    suggestedPrice: 27.9,
    subNiches: [
      'Reacender o casamento depois dos filhos',
      'Superar o término e voltar a ter autoestima',
      'Comunicação sem brigas no relacionamento',
      'Reconquistar a confiança depois de uma crise',
      'Sair de um relacionamento que faz mal',
    ],
  },
  {
    id: 'marketing-digital',
    label: 'Marketing Digital',
    suggestedPrice: 47.9,
    subNiches: [
      'Primeiros 1.000 seguidores do zero',
      'Vender todos os dias pelo Instagram sem impulsionar',
      'Criar conteúdo que engaja sem aparecer',
      'Primeira venda como afiliado em 30 dias',
      'Anúncios locais para pequenos negócios',
    ],
  },
  {
    id: 'saude-mental',
    label: 'Saúde Mental',
    suggestedPrice: 27.9,
    subNiches: [
      'Controlar a ansiedade no dia a dia sem remédios',
      'Vencer a procrastinação e destravar a rotina',
      'Dormir melhor em 21 dias',
      'Reduzir o estresse do trabalho',
      'Autoestima para recomeçar depois dos 40',
    ],
  },
  {
    id: 'culinaria',
    label: 'Culinária',
    suggestedPrice: 24.9,
    subNiches: [
      'Marmitas saudáveis para a semana em 2 horas',
      'Receitas low carb para quem não sabe cozinhar',
      'Doces gourmet para vender',
      'Jantar rápido em 20 minutos para a família',
      'Pães caseiros sem sova para iniciantes',
    ],
  },
  {
    id: 'air-fryer',
    label: 'Air Fryer Gourmet',
    suggestedPrice: 24.9,
    subNiches: [
      'Receitas fit na air fryer para a semana toda',
      'Jantares completos só na air fryer',
      'Doces e sobremesas na air fryer',
      'Receitas de air fryer para emagrecer sem sofrer',
      'Air fryer para quem mora sozinho',
    ],
  },
  {
    id: 'fitness',
    label: 'Fitness',
    suggestedPrice: 29.9,
    subNiches: [
      'Treinos de 20 minutos em casa sem equipamento',
      'Ganhar massa magra treinando 3x por semana',
      'Voltar a treinar depois dos 35 sem lesão',
      'Definir o corpo sem academia',
      'Mobilidade e alongamento para quem trabalha sentado',
    ],
  },
  {
    id: 'desenvolvimento-pessoal',
    label: 'Desenvolvimento Pessoal',
    suggestedPrice: 29.9,
    subNiches: [
      'Rotina matinal para pessoas sem disciplina',
      'Foco profundo em tempos de celular',
      'Organizar a vida em 30 dias',
      'Criar hábitos que realmente ficam',
      'Vencer a autossabotagem',
    ],
  },
  {
    id: 'educacao',
    label: 'Educação',
    suggestedPrice: 27.9,
    subNiches: [
      'Alfabetização em casa para crianças de 4 a 6 anos',
      'Ajudar o filho com dificuldade em matemática',
      'Rotina de estudos para concursos com pouco tempo',
      'Ensinar o filho a ler com jogos e brincadeiras',
      'Estudar para o ENEM trabalhando',
    ],
  },
  {
    id: 'religiao',
    label: 'Religião e Fé',
    suggestedPrice: 24.9,
    subNiches: [
      'Devocional diário de 15 minutos para mulheres',
      'Fortalecer a fé em tempos difíceis',
      'Oração em família com crianças pequenas',
      'Estudo bíblico para iniciantes',
      'Jejum e propósito para a vida espiritual',
    ],
  },
  {
    id: 'carreira',
    label: 'Carreira',
    suggestedPrice: 34.9,
    subNiches: [
      'Recolocação profissional depois dos 40',
      'Currículo e LinkedIn que chamam recrutador',
      'Primeira liderança: deixar de ser só executor',
      'Transição de carreira para a área de tecnologia',
      'Se destacar no trabalho sem puxar saco',
    ],
  },
  {
    id: 'idiomas',
    label: 'Idiomas',
    suggestedPrice: 29.9,
    subNiches: [
      'Inglês para viagem em 90 dias',
      'Destravar a conversação em inglês sozinho',
      'Inglês para entrevistas de emprego',
      'Espanhol básico para trabalho e viagem',
      'Aprender idioma estudando 15 minutos por dia',
    ],
  },
  {
    id: 'maternidade',
    label: 'Maternidade Solo',
    suggestedPrice: 27.9,
    subNiches: [
      'Rotina organizada criando filhos sozinha',
      'Educar sem gritar: disciplina positiva na prática',
      'Renda e maternidade: trabalhar de casa com filhos',
      'Autocuidado para mães sem tempo',
      'Desfralde sem traumas',
    ],
  },
  {
    id: 'pets',
    label: 'Adestramento de Pets',
    suggestedPrice: 27.9,
    subNiches: [
      'Adestrar o cão em casa em 15 minutos por dia',
      'Parar o xixi fora do lugar',
      'Cachorro que late demais: silêncio sem castigo',
      'Ansiedade de separação em cães',
      'Filhote educado desde a primeira semana',
    ],
  },
  {
    id: 'organizacao',
    label: 'Organização Doméstica',
    suggestedPrice: 24.9,
    subNiches: [
      'Casa organizada com rotina de 30 minutos por dia',
      'Destralhar a casa em 21 dias',
      'Rotina de limpeza para quem trabalha fora',
      'Organizar guarda-roupa de vez',
      'Casa organizada com crianças pequenas',
    ],
  },
  {
    id: 'idosos',
    label: 'Memória para Idosos',
    suggestedPrice: 24.9,
    subNiches: [
      'Exercícios diários para memória depois dos 60',
      'Jogos e atividades para manter o cérebro ativo',
      'Rotina de estimulação para prevenir esquecimento',
      'Memória e foco para a terceira idade',
    ],
  },
  {
    id: 'milhas',
    label: 'Milhas Aéreas',
    suggestedPrice: 34.9,
    subNiches: [
      'Primeira viagem grátis com milhas em 12 meses',
      'Acumular milhas gastando o que já gasta',
      'Vender milhas com segurança',
      'Milhas para quem ganha até 3 salários',
    ],
  },
  {
    id: 'viagem',
    label: 'Viagem Low Cost',
    suggestedPrice: 27.9,
    subNiches: [
      'Viajar pelo Brasil gastando pouco',
      'Planejar a primeira viagem internacional barata',
      'Mochilão econômico pela América do Sul',
      'Viagem em família sem estourar o orçamento',
    ],
  },
  {
    id: 'skincare',
    label: 'Skincare Masculino',
    suggestedPrice: 24.9,
    subNiches: [
      'Rotina de skincare masculina em 5 minutos',
      'Acabar com a oleosidade e espinhas',
      'Cuidados com barba e pele sem complicação',
      'Antienvelhecimento para homens 35+',
    ],
  },
]

export function findNiche(id: string): Niche | undefined {
  return NICHES.find((n) => n.id === id)
}

export function suggestPrice(nicheIdOrLabel: string): number {
  const byId = findNiche(nicheIdOrLabel)
  if (byId) return byId.suggestedPrice
  const byLabel = NICHES.find((n) => n.label.toLowerCase() === nicheIdOrLabel.toLowerCase())
  return byLabel?.suggestedPrice ?? 29.9
}

export const LANDING_PRIMARY_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669', '#dc2626', '#ea580c', '#db2777', '#f59e0b',
]

export const LANDING_SECONDARY_COLORS = [
  '#05050b', '#0b1220', '#130b1e', '#0a1410', '#140b0b', '#101014', '#1a1a2e', '#ffffff',
]
