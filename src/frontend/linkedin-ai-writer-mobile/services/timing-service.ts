/**
 * Service de créneaux de publication (heure locale de l'utilisateur).
 *
 * Objectif stratégique : aider à poster au MEILLEUR moment pour toucher
 * une bonne audience et sortir de la boucle LinkedIn.
 *
 * Fuseau horaire : on utilise l'heure LOCALE du téléphone, qui est fournie
 * AUTOMATIQUEMENT par le système via new Date(). Aucune config requise :
 * un téléphone réglé sur Paris donne l'heure de Paris, etc.
 * (Hypothèse retenue : l'audience de l'utilisateur est dans son propre fuseau.)
 *
 * Les créneaux sont adaptés au type de post (un conseil ne performe pas au
 * même moment qu'un storytelling).
 */

export interface TimeSlot {
  /** Libellé lisible, ex: "Mardi 08:30" */
  label: string;
  /** Date/heure exacte du prochain créneau (ISO) */
  iso: string;
  /** Jour de la semaine (0 = dimanche) */
  weekday: number;
  /** Heure (0-23) */
  hour: number;
}

/**
 * Créneaux performants par type de post, en heure LOCALE.
 * Format : [jourSemaine (0=dim, 1=lun...), heure, minute]
 */
const SLOTS_BY_TYPE: Record<string, [number, number, number][]> = {
  // Storytelling : capte mieux en milieu de journée (pauses).
  storytelling: [
    [2, 12, 30], // mardi 12h30
    [4, 12, 30], // jeudi 12h30
    [3, 18, 0], // mercredi 18h00
  ],
  // Performance / accroche : début de semaine, le matin (pic d'activité pro).
  performance: [
    [2, 8, 30], // mardi 8h30
    [3, 9, 0], // mercredi 9h00
    [4, 8, 30], // jeudi 8h30
  ],
  // Conseil / expertise : début de semaine, créneaux d'attention pro.
  conseil: [
    [2, 9, 0], // mardi 9h00
    [4, 10, 0], // jeudi 10h00
    [1, 11, 0], // lundi 11h00
  ],
  // Réponse à un commentaire : à publier vite, créneaux proches.
  reponse_commentaire: [
    [1, 12, 30],
    [3, 12, 30],
    [5, 9, 0],
  ],
};

// Créneaux par défaut si le type est inconnu.
const DEFAULT_SLOTS: [number, number, number][] = [
  [2, 9, 0], // mardi 9h00
  [3, 12, 30], // mercredi 12h30
  [4, 9, 0], // jeudi 9h00
];

/**
 * Calcule la prochaine occurrence d'un créneau (jour/heure) à partir de maintenant.
 * Tout est en heure LOCALE (Date locale du téléphone).
 */
function nextOccurrence(weekday: number, hour: number, minute: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);

  // Nombre de jours jusqu'au prochain "weekday".
  let daysAhead = (weekday - now.getDay() + 7) % 7;

  // Si c'est aujourd'hui mais l'heure est déjà passée, on prend la semaine suivante.
  if (daysAhead === 0 && result.getTime() <= now.getTime()) {
    daysAhead = 7;
  }
  result.setDate(now.getDate() + daysAhead);
  return result;
}

/**
 * Formate un créneau en libellé lisible (heure locale).
 */
function formatSlotLabel(date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    const label = formatter.format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return date.toLocaleString('fr-FR');
  }
}

/**
 * Retourne les meilleurs créneaux de publication pour un type de post,
 * en heure locale, triés du plus proche au plus lointain.
 */
export function getBestSlots(type?: string): TimeSlot[] {
  const slots = (type && SLOTS_BY_TYPE[type]) || DEFAULT_SLOTS;

  return slots
    .map(([weekday, hour, minute]) => {
      const date = nextOccurrence(weekday, hour, minute);
      return {
        label: formatSlotLabel(date),
        iso: date.toISOString(),
        weekday,
        hour,
      };
    })
    .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());
}

/**
 * Construit un créneau personnalisé à partir d'une date choisie par l'utilisateur.
 */
export function customSlot(date: Date): TimeSlot {
  return {
    label: formatSlotLabel(date),
    iso: date.toISOString(),
    weekday: date.getDay(),
    hour: date.getHours(),
  };
}
