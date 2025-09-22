// TODO: Add point or goal system
export const Sports = {
  Soccer: "Futebol",
  Volleyball: "Volleyball",
  Handball: "Handball",
} as {
  [key: string]: string
};

export const TeamType = {
  Feminine: 'Feminino',
  Masculine: 'Masculino'
}

export const MatchStatus: Record<
  string,
  {
    classes: string;
    text: string;
  }
> = {
  Scheduled: {
    classes: "bg-blue-600 text-white",
    text: "Agendado",
  },
  Delayed: {
    classes: "bg-yellow-600 text-white",
    text: "Atrasado",
  },
  Canceled: {
    classes: "bg-red-600 text-white",
    text: "Cancelado",
  },
  Started: {
    classes: "bg-green-600 text-white",
    text: "Em progresso",
  },
  Finished: {
    classes: "bg-gray-600 text-white",
    text: "Finalizado",
  },
};
