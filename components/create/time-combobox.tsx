"use client"

import { useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

/** Heures proposées dans la liste, tous les quarts d'heure. Toute autre minute se tape. */
const TIMES = Array.from({ length: 96 }, (_, i) => {
  const hours = String(Math.floor(i / 4)).padStart(2, "0")
  const minutes = String((i % 4) * 15).padStart(2, "0")
  return `${hours}:${minutes}`
})

/** « 9 », « 930 », « 0930 » ou « 9:30 » vers « 09:30 » ; `null` si ce n'est pas une heure. */
export function parseTime(value: string): string | null {
  const trimmed = value.trim()
  const colon = /^(\d{1,2}):(\d{1,2})$/.exec(trimmed)
  const digits = trimmed.replace(/\D/g, "")
  let hours: number
  let minutes: number
  if (colon) {
    hours = Number(colon[1])
    minutes = Number(colon[2])
  } else if (digits.length >= 1 && digits.length <= 2) {
    hours = Number(digits)
    minutes = 0
  } else if (digits.length === 3) {
    hours = Number(digits[0])
    minutes = Number(digits.slice(1))
  } else if (digits.length === 4) {
    hours = Number(digits.slice(0, 2))
    minutes = Number(digits.slice(2))
  } else {
    return null
  }
  if (hours > 23 || minutes > 59) return null
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

/** Pendant la frappe : les chiffres seuls, « 2:15 » dès le 3e, « 21:50 » au 4e. */
function formatWhileTyping(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  if (digits.length === 3) return `${digits[0]}:${digits.slice(1)}`
  return parseTime(digits) ?? digits
}

/**
 * Garde les heures qui commencent comme la saisie : « 9 » → 09:xx, « 14 » →
 * 14:xx (jamais 01:45), « 93 » → 09:30 / 09:45, « 183 » → 18:30 / 18:45.
 */
function matchesTime(item: string, query: string) {
  const digits = query.replace(/\D/g, "")
  if (!digits) return true
  const padded = item.replace(":", "")
  const hour = Number(padded.slice(0, 2))
  if (digits.length === 1)
    return padded.startsWith(digits) || hour === Number(digits)
  if (digits.length === 2 && Number(digits) <= 23)
    return hour === Number(digits)
  const unpadded = String(hour) + padded.slice(2)
  return padded.startsWith(digits) || unpadded.startsWith(digits)
}

/**
 * Heure de début en 24 h, à la minute près : on tape l'heure voulue
 * (« 1807 », « 18:07 ») ou on la choisit dans la liste des quarts d'heure.
 * Combobox shadcn (Base UI).
 */
export function TimeCombobox({
  value,
  invalid,
  disabled,
  onChange,
}: {
  /** Heure validée, « HH:mm ». */
  value: string
  invalid?: boolean
  disabled?: boolean
  onChange: (time: string) => void
}) {
  // Saisie en cours ; `null` quand le champ affiche simplement `value`.
  const [draft, setDraft] = useState<string | null>(null)
  const commit = (time: string) => {
    onChange(time)
    setDraft(null)
  }

  return (
    <Combobox
      items={TIMES}
      value={TIMES.includes(value) ? value : null}
      inputValue={draft ?? value}
      disabled={disabled}
      autoHighlight
      openOnInputClick
      // Sans saisie, toute la liste ; sinon les heures qui commencent pareil.
      filter={(item: string, query) =>
        draft === null ? true : matchesTime(item, query)
      }
      onValueChange={(next) => {
        if (typeof next === "string") commit(next)
      }}
      onInputValueChange={(next, details) => {
        // La liste réécrit le champ quand on choisit : seule la frappe compte.
        if (details.reason !== "input-change") return
        const typed = formatWhileTyping(next)
        setDraft(typed)
        if (/^\d{2}:\d{2}$/.test(typed)) onChange(typed)
      }}
    >
      <ComboboxInput
        aria-label="Heure de début"
        aria-invalid={invalid || undefined}
        placeholder="HH:mm"
        inputMode="numeric"
        maxLength={5}
        disabled={disabled}
        className="w-full tabular-nums sm:w-32"
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          // Entrée valide l'heure tapée sans envoyer le formulaire de création.
          // Si une heure de la liste est surlignée, le combobox la choisit.
          if (event.key === "Enter" && draft !== null) {
            const parsed = parseTime(draft)
            if (parsed && !TIMES.some((t) => matchesTime(t, draft))) {
              event.preventDefault()
              commit(parsed)
            }
          }
        }}
        onBlur={() => {
          if (draft === null) return
          const parsed = parseTime(draft)
          // Saisie incomplète ou impossible : on revient à la dernière heure valide.
          if (parsed) commit(parsed)
          else setDraft(null)
        }}
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {draft !== null && parseTime(draft)
            ? `${parseTime(draft)} : heure retenue.`
            : "Tape une heure, par exemple 18:07."}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item} className="tabular-nums">
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
