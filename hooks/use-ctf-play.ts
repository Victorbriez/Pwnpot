"use client"

import { useState } from "react"
import { parseEventLogs, type Address, type TransactionReceipt } from "viem"
import { useConnection } from "wagmi"

import type { Role } from "@/components/dispute/dispute-card"
import { useChainNow } from "@/hooks/use-chain-now"
import { useCtf } from "@/hooks/use-ctfs"
import { useDispute, type Dispute } from "@/hooks/use-dispute"
import { useMyCredits } from "@/hooks/use-my-credits"
import { usePlatformEvents } from "@/hooks/use-platform-events"
import { usePlatformTx, type PlatformTx } from "@/hooks/use-platform-tx"
import { usePlayerState } from "@/hooks/use-player-state"
import { useVaultStates, type VaultState } from "@/hooks/use-vault-factories"
import { podiumShares } from "@/lib/ctf/gains"
import { rankSolves, type LeaderboardEntry } from "@/lib/ctf/leaderboard"
import {
  organizerNextStep,
  playerNextStep,
  type NextStep,
} from "@/lib/ctf/next-step"
import type { Ctf, Vuln } from "@/lib/ctf/types"
import { ctfChallenges, leaderboard, withMyScore } from "@/lib/mock/ctf-detail"
import { ctfs as demoCtfs } from "@/lib/mock/explore"
import { myOrganized, myParticipations } from "@/lib/mock/my-ctfs"
import { ctfPlatformAbi, ctfPlatformAddress } from "@/lib/onchain/ctf-platform"
import { knownFactoryById, VAULT_SEED } from "@/lib/onchain/factories"

export type PlayAction =
  | { kind: "ticket" | "finalize" | "refund" }
  | { kind: "instance" | "submit"; level: number }
  | { kind: "bind" | "recover"; factory: Address }

export type PlayChallenge = {
  key: string
  name: string
  vuln?: Vuln
  /** Adresse de la factory : en mode contrat seulement. */
  factory?: Address
  /** Coffre reconnu à son code : Sourcify ne le connaît pas. */
  matchedByCode?: boolean
  /** Ce que le joueur doit obtenir, pour les épreuves connues. */
  goal?: string
  /** Pourquoi l'instance ne peut pas encore être créée (Coffre non lié). */
  blocked?: string
  done: boolean
  instance?: Address
}

/** Un Coffre du CTF, vu par son organisateur. */
export type OrganizerVault = VaultState & {
  /** Assez de fonds pour `bind` : `maxPlayers × SEED`. */
  funded: boolean
  needed: bigint
  canBind: boolean
  canRecover: boolean
}

/** Tout ce que la page d'un CTF affiche, en démo comme avec le contrat. */
export type CtfPlayModel = {
  ctf: Ctf
  challenges: PlayChallenge[]
  players: number
  pool: bigint
  /** Parts du podium selon le nombre de gagnants actuel (3 si aucun). */
  shares: bigint[]
  board: LeaderboardEntry[]
  myRank: number | null
  solvedCount: number
  hasTicket: boolean
  isOrganizer: boolean
  /** Sélecteur joueur / organisateur : démo seulement. */
  role?: { value: Role; set: (role: Role) => void }
  /** Litige simulé : démo seulement (le contrat ne gère pas encore les litiges). */
  dispute?: Dispute
  /** Coffres du CTF, pour l'organisateur (mode contrat). */
  vaults: OrganizerVault[]
  step: NextStep
  canBuy: boolean
  canFinalize: boolean
  canRefund: boolean
  needsWallet: boolean
  tx: PlatformTx
  action?: PlayAction
  buyTicket: () => void
  createInstance: (level: number) => void
  submit: (level: number) => void
  finalize: () => void
  claimRefund: () => void
  bindVault: (factory: Address) => void
  recoverVault: (factory: Address) => void
}

export type CtfPlayState =
  | { status: "ready"; model: CtfPlayModel }
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; error: Error }

function demoInstance(ctfId: number, level: number): Address {
  return `0x${`${ctfId}${level}`.padStart(4, "0").repeat(10)}`
}

function useDemoCtfPlay(ctfId: number): CtfPlayState {
  const ctf = demoCtfs.find((item) => item.id === ctfId)
  const participation = myParticipations.find((p) => p.ctf.id === ctfId)
  const organized = myOrganized.find((o) => o.ctf.id === ctfId)
  const tx = usePlatformTx()

  const [hasTicket, setHasTicket] = useState(participation !== undefined)
  const [solved, setSolved] = useState<number[]>(
    Array.from({ length: participation?.solved ?? 0 }, (_, i) => i)
  )
  const [instances, setInstances] = useState<Record<number, Address>>({})
  const [players, setPlayers] = useState(ctf?.players ?? 0)
  const [action, setAction] = useState<PlayAction>()
  // En démo, on peut jouer le litige d'un côté ou de l'autre.
  const [role, setRole] = useState<Role>(organized ? "organizer" : "player")
  const isOrganizer = role === "organizer"
  const playerHas = !isOrganizer && hasTicket

  const dispute = useDispute(ctf ?? demoCtfs[0], tx, {
    hasTicket: playerHas,
    isOrganizer,
  })

  if (!ctf) return { status: "missing" }

  // Le litige fait avancer la phase : on affiche l'état à jour.
  const live: Ctf = dispute
    ? { ...ctf, status: dispute.status, remaining: dispute.state.remaining }
    : ctf

  const board = withMyScore(leaderboard(ctf), {
    score: solved.length,
    rank: participation?.rank ?? null,
  })
  const myRank = board.find((entry) => entry.isMe)?.rank ?? null
  const pool = ctf.cashPrize + ctf.ticketPrice * BigInt(players)
  const winners = Math.min(3, board.length)

  const step = isOrganizer
    ? organizerNextStep({ ctf: live, owed: organized?.owed ?? BigInt(0) })
    : playerNextStep({
        ctf: live,
        solved: solved.length,
        rank: myRank,
        voted: dispute?.state.myVote !== undefined,
        owed: participation?.owed ?? BigInt(0),
      })

  return {
    status: "ready",
    model: {
      ctf: live,
      challenges: ctfChallenges(ctf).map((factory, level) => ({
        key: factory.id,
        name: factory.name,
        vuln: factory.vuln,
        goal: factory.goal,
        done: solved.includes(level),
        instance: instances[level],
      })),
      players,
      pool,
      shares: podiumShares(pool, winners || 3),
      board,
      myRank,
      solvedCount: solved.length,
      hasTicket: playerHas,
      isOrganizer,
      role: { value: role, set: setRole },
      dispute,
      vaults: [],
      step,
      canBuy:
        !isOrganizer &&
        !hasTicket &&
        (live.status === "open" || live.status === "running") &&
        players < ctf.maxPlayers,
      canFinalize: false,
      canRefund: false,
      needsWallet: false,
      tx,
      action,
      buyTicket: () => {
        setAction({ kind: "ticket" })
        tx.send(
          {
            functionName: "buyTicket",
            args: [BigInt(ctf.id)],
            value: ctf.ticketPrice,
          },
          {
            onSuccess: () => {
              setHasTicket(true)
              setPlayers((n) => n + 1)
            },
          }
        )
      },
      createInstance: (level) => {
        setAction({ kind: "instance", level })
        tx.send(
          {
            functionName: "createInstance",
            args: [BigInt(ctf.id), BigInt(level)],
          },
          {
            onSuccess: (receipt?: TransactionReceipt) => {
              const instance = receipt
                ? parseEventLogs({
                    abi: ctfPlatformAbi,
                    eventName: "InstanceCreated",
                    logs: receipt.logs,
                  })[0]?.args.instance
                : demoInstance(ctf.id, level)
              if (instance)
                setInstances((prev) => ({ ...prev, [level]: instance }))
            },
          }
        )
      },
      submit: (level) => {
        setAction({ kind: "submit", level })
        tx.send(
          { functionName: "submit", args: [BigInt(ctf.id), BigInt(level)] },
          { onSuccess: () => setSolved((prev) => [...prev, level]) }
        )
      },
      finalize: () => {},
      claimRefund: () => {},
      bindVault: () => {},
      recoverVault: () => {},
    },
  }
}

function useChainCtfPlay(ctfId: number): CtfPlayState {
  const { address } = useConnection()
  const { ctf, isLoading, error } = useCtf(ctfId)
  const levels = ctf?.challenges ?? 0
  const state = usePlayerState(ctfId, levels)
  const solves = usePlatformEvents("LevelSolved", { ctfId: BigInt(ctfId) })
  const credits = useMyCredits()
  const now = useChainNow()
  const tx = usePlatformTx()
  const [action, setAction] = useState<PlayAction>()
  const vaultFactories = (ctf?.chain?.levels ?? [])
    .filter((level) => level.info.id === "vault")
    .map((level) => level.factory)
  const vaultStates = useVaultStates(vaultFactories)

  if (error) return { status: "error", error }
  if (isLoading) return { status: "loading" }
  if (!ctf || !ctf.chain) return { status: "missing" }

  const ranking = rankSolves(
    (solves.data ?? []).map((log) => ({
      player: log.args.player,
      timestamp: log.args.timestamp,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })),
    address
  )
  const myRank = ranking.find((entry) => entry.isMe)?.rank ?? null
  const isOrganizer =
    !!address && address.toLowerCase() === ctf.organizer.toLowerCase()
  const winners = state.podium.length
  const owedHere = credits.byCtf.get(ctfId) ?? BigInt(0)

  const step = isOrganizer
    ? organizerNextStep({ ctf, owed: owedHere })
    : playerNextStep({
        ctf,
        solved: state.score,
        rank: myRank,
        voted: false,
        owed: owedHere,
      })

  const id = BigInt(ctfId)
  const vaultOf = (factory: Address) =>
    vaultStates.find((v) => v.factory.toLowerCase() === factory.toLowerCase())
  // Phases où `recover` est permis une fois le Coffre lié (Vault.sol).
  const over =
    ctf.status === "contestation" ||
    ctf.status === "finalized" ||
    ctf.status === "cheated"
  const needed = BigInt(ctf.maxPlayers) * VAULT_SEED
  const vaults: OrganizerVault[] = isOrganizer
    ? vaultStates.map((vault) => {
        const funded = vault.balance >= needed
        return {
          ...vault,
          funded,
          needed,
          canBind:
            !vault.bound &&
            funded &&
            (ctf.status === "open" || ctf.status === "running"),
          canRecover: vault.balance > BigInt(0) && (!vault.bound || over),
        }
      })
    : []

  const run = (next: PlayAction, call: Parameters<PlatformTx["send"]>[0]) => {
    setAction(next)
    tx.send(call)
  }

  return {
    status: "ready",
    model: {
      ctf,
      challenges: ctf.chain.levels.map((level, index) => {
        const { info } = level
        const vault = info.id === "vault" ? vaultOf(level.factory) : undefined
        const linked =
          vault && vault.bound && vault.ctfId === id ? true : !vault
        return {
          key: `${index}-${level.factory}`,
          name: info.name,
          vuln: info.vuln,
          goal: info.id ? knownFactoryById(info.id).goal : undefined,
          matchedByCode: info.matchedByCode,
          blocked: linked
            ? undefined
            : "Ce Coffre n'est pas encore lié au CTF par l'organisateur : impossible de créer l'instance pour l'instant.",
          factory: level.factory,
          done: state.solved[index] ?? false,
          instance: state.instances[index],
        }
      }),
      players: ctf.players,
      pool: ctf.prizePool,
      shares: podiumShares(ctf.prizePool, winners || 3),
      board: ranking.slice(0, 10),
      myRank,
      solvedCount: state.score,
      hasTicket: state.hasTicket,
      isOrganizer,
      vaults,
      step,
      canBuy:
        !isOrganizer &&
        !state.hasTicket &&
        (ctf.status === "open" || ctf.status === "running") &&
        ctf.players < ctf.maxPlayers,
      canFinalize:
        ctf.status === "contestation" && now >= ctf.chain.contestationEnd,
      canRefund:
        ctf.status === "finalized" &&
        winners === 0 &&
        state.hasTicket &&
        !state.refunded,
      needsWallet: !address,
      tx,
      action,
      buyTicket: () =>
        run(
          { kind: "ticket" },
          { functionName: "buyTicket", args: [id], value: ctf.ticketPrice }
        ),
      createInstance: (level) =>
        run(
          { kind: "instance", level },
          { functionName: "createInstance", args: [id, BigInt(level)] }
        ),
      submit: (level) =>
        run(
          { kind: "submit", level },
          { functionName: "submit", args: [id, BigInt(level)] }
        ),
      finalize: () =>
        run({ kind: "finalize" }, { functionName: "finalize", args: [id] }),
      claimRefund: () =>
        run({ kind: "refund" }, { functionName: "claimRefund", args: [id] }),
      bindVault: (factory) =>
        run(
          { kind: "bind", factory },
          { to: factory, functionName: "bind", args: [id] }
        ),
      recoverVault: (factory) =>
        run(
          { kind: "recover", factory },
          { to: factory, functionName: "recover" }
        ),
    },
  }
}

/** Démo ou contrat : fixé au build par `NEXT_PUBLIC_CTF_PLATFORM_ADDRESS`. */
export const useCtfPlay =
  ctfPlatformAddress === undefined ? useDemoCtfPlay : useChainCtfPlay
