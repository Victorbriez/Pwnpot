// État de départ des litiges dans les mocks :
// - CTF 3 (Origin Story) : litige ouvert, vote en cours, quorum atteint ;
// - CTF 5 (Double Dip) : fenêtre de contestation ouverte, pas de litige ;
// - CTF 6 (Hello Ethernaut) : finalisé sans litige.
import type { DisputeState } from "@/lib/ctf/dispute"
import type { Ctf } from "@/lib/mock/explore"

export function initialDispute(ctf: Ctf): DisputeState | undefined {
  const base = { remaining: ctf.remaining, cheatVotes: 0, fairVotes: 0 }
  switch (ctf.status) {
    case "contestation":
      return { ...base, phase: "contestation", opened: false }
    case "voting":
      return {
        ...base,
        phase: "voting",
        opened: true,
        cheatVotes: 14,
        fairVotes: 9,
      }
    case "appeal":
      return {
        ...base,
        phase: "appealWindow",
        opened: true,
        cheatVotes: 30,
        fairVotes: 12,
      }
    case "finalized":
      return { ...base, phase: "finalized", opened: false }
    case "cheated":
      return {
        ...base,
        phase: "cheated",
        opened: true,
        cheatVotes: 30,
        fairVotes: 12,
      }
    default:
      return undefined
  }
}

/** CTF qui ont un litige ou une fenêtre de contestation, avec son état. */
export function disputeRows(list: Ctf[]) {
  return list.flatMap((ctf) => {
    const dispute = initialDispute(ctf)
    return dispute ? [{ ctf, dispute }] : []
  })
}

export type DisputeRow = ReturnType<typeof disputeRows>[number]

/** Litige ouvert : vote, fenêtre d'appel ou appel chez l'arbitre. */
export function isDisputeInProgress({ dispute }: DisputeRow) {
  return (
    dispute.phase === "voting" ||
    dispute.phase === "appealWindow" ||
    dispute.phase === "appealed"
  )
}
