import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
} from "viem"

/**
 * Les refus du contrat (custom errors de CTFPlatform et des épreuves, celles
 * que l'ABI du site décode), en clair. Le nom technique reste affiché entre
 * parenthèses.
 */
const errorMessages: Record<string, string> = {
  // CTFPlatform : création
  TitleTooLong: "Le titre est trop long (100 octets au plus).",
  StartInPast: "L'heure de début est déjà passée.",
  InvalidDuration: "La durée doit être entre 1 h et 30 jours.",
  InvalidMaxPlayers: "Le nombre de joueurs doit être entre 1 et 200.",
  TicketPriceTooLow: "Le ticket doit coûter au moins 0,0001 ETH.",
  ZeroCashPrize: "Le cash prize ne peut pas être nul.",
  BondTooLow: "La caution est trop basse.",
  NoLevels: "Il faut au moins une épreuve.",
  TooManyLevels: "10 épreuves au plus.",
  FactoryNotContract: "Une des adresses d'épreuve n'est pas un contrat.",
  // CTFPlatform : commun
  CTFNotFound: "Ce CTF n'existe pas.",
  WrongPhase: "Ce n'est pas possible dans la phase actuelle du CTF.",
  WrongValue: "Le montant envoyé n'est pas le bon.",
  // Ticket, instances, réussites
  OrganizerCannotPlay: "L'organisateur ne peut pas jouer à son propre CTF.",
  AlreadyHasTicket: "Tu as déjà un ticket pour ce CTF.",
  CTFFull: "Ce CTF est complet.",
  NoTicket: "Il faut un ticket pour ce CTF.",
  InvalidLevel: "Cette épreuve n'existe pas.",
  InstanceAlreadyCreated: "Ton instance existe déjà.",
  InvalidInstance: "La factory n'a pas créé d'instance.",
  NoInstance: "Crée d'abord ton instance.",
  AlreadySolved: "Cette épreuve est déjà validée.",
  NotSolved: "Ton instance n'est pas encore exploitée.",
  // Fin, remboursements, retraits
  ContestationNotOver: "La fenêtre de contestation n'est pas finie.",
  NothingToRefund: "Il n'y a pas de ticket à rembourser.",
  NothingToWithdraw: "Il n'y a rien à retirer.",
  TransferFailed: "L'envoi de l'ETH a échoué.",
  // Litiges
  NotImplemented: "Cette fonction n'existe pas dans la version déployée.",
  ContestationOver: "La fenêtre de contestation est passée.",
  NotArbitrator: "Seul l'arbitre peut trancher.",
  DisputeAlreadyOpened: "Un litige est déjà ouvert pour ce CTF.",
  WrongDisputeBond: "Le montant de la caution et des frais n'est pas le bon.",
  UnknownDispute: "Ce litige n'existe pas.",
  InvalidRuling: "Décision invalide.",
  TimeoutNotReached: "Le délai de l'arbitre n'est pas encore écoulé.",
  // Épreuves (factories)
  OnlyPlatform: "Seule la plateforme peut créer une instance.",
  NotOrganizer: "Seul l'organisateur du Coffre peut faire ça.",
  NotBound: "Ce Coffre n'est pas encore lié au CTF par l'organisateur.",
  AlreadyBound: "Ce Coffre est déjà lié à un CTF.",
  InvalidCTF:
    "Ce Coffre ne peut pas être lié à ce CTF : CTF inexistant, organisé par un autre wallet, ou qui ne liste pas ce Coffre exactement une fois.",
  InsufficientFunds:
    "Le Coffre n'a pas assez d'ETH : il en faut places × 0,0001 ETH pour le lier, et 0,0001 ETH par nouvelle instance.",
  AlreadyHasInstance: "Tu as déjà un coffre (dans un autre CTF).",
  NotAPlayer: "Il faut un ticket pour le CTF auquel ce Coffre est lié.",
  CTFNotRunning: "Le CTF auquel ce Coffre est lié n'est pas en cours.",
  CTFNotOver:
    "Pas encore : attends la fin du CTF lié, et la clôture d'un éventuel litige.",
  NothingToRecover: "Il n'y a rien à récupérer.",
  ZeroAddress: "Adresse nulle.",
}

/**
 * Message lisible pour une transaction échouée. Un revert du contrat donne son
 * refus en clair, suivi du nom de la custom error (ex. « TicketPriceTooLow »).
 */
export function describeTxError(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk(
      (e) => e instanceof ContractFunctionRevertedError
    )
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName
      if (name)
        return errorMessages[name] ? `${errorMessages[name]} (${name})` : name
      if (reverted.reason) return reverted.reason
    }
    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return "Transaction refusée dans le wallet."
    }
    return error.shortMessage
  }
  return error instanceof Error ? error.message : "Erreur inconnue."
}

/** Étapes d'une transaction affichées à l'utilisateur. */
export type TxStatus = "idle" | "signing" | "confirming" | "success" | "error"
