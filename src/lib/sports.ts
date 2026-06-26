const sportLabels: Record<string, string> = {
  athletics: 'Atletismo',
  basketball: 'Basquete',
  chess: 'Xadrez',
  checkers: 'Damas',
  dodgeball: 'Queimada',
  football: 'Futebol',
  futsal: 'Futsal',
  handball: 'Handebol',
  running: 'Corrida',
  soccer: 'Futebol',
  swimming: 'Natação',
  'table tennis': 'Tênis de mesa',
  tennis: 'Tênis',
  volleyball: 'Vôlei',
  volley: 'Vôlei',
}

function normalizeSportKey(sport: string) {
  return sport.trim().replaceAll(/[-_]+/g, ' ').toLocaleLowerCase('en-US')
}

export function formatSport(sport: string | null | undefined) {
  if (!sport) return 'Esporte'

  const normalizedSport = normalizeSportKey(sport)
  return sportLabels[normalizedSport] ?? sport
}
