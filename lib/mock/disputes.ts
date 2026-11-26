// État de départ des litiges dans les mocks :
// - CTF 3 (Origin Story) : litige ouvert, chez l'arbitre ;
// - CTF 5 (Double Dip) : fenêtre de contestation ouverte, pas de litige ;
// - CTF 6 (Hello Ethernaut) : finalisé sans litige.
import type { DisputeState } from "@/lib/ctf/dispute"
import { type Ctf } from "@/lib/ctf/types"

export function initialDispute(ctf: Ctf): DisputeState | undefined {
  const base = { remaining: ctf.remaining }
  switch (ctf.status) {
    case "contestation":
      return { ...base, phase: "contestation", opened: false }
    case "voting":
    case "appeal":
      return { ...base, phase: "appealed", opened: true }
    case "finalized":
      return { ...base, phase: "finalized", opened: false }
    case "cheated":
      return { ...base, phase: "cheated", opened: true, decision: "ruling" }
    default:
      return undefined
  }
}
