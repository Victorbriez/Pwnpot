"use client"

import { useState } from "react"
import { format, startOfToday } from "date-fns"
import { fr as frFormat } from "date-fns/locale"
import { CalendarIcon, Clock3Icon } from "lucide-react"
import { fr } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/** Heures proposées, toutes les 30 min, toujours en 24 h. */
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0")
  return `${hours}:${i % 2 === 0 ? "00" : "30"}`
})

/** Jour + heure de début, en heure locale. */
export function StartDatePicker({
  id,
  day,
  time,
  invalid,
  disabled,
  onDayChange,
  onTimeChange,
}: {
  id: string
  day: Date | undefined
  time: string
  invalid?: boolean
  disabled?: boolean
  onDayChange: (day: Date | undefined) => void
  onTimeChange: (time: string) => void
}) {
  const [open, setOpen] = useState(false)
  // Calculé à l'ouverture, pas pendant le rendu : les jours passés sont grisés.
  const [today, setToday] = useState<Date>()

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setToday(startOfToday())
          setOpen(next)
        }}
      >
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              disabled={disabled}
              aria-invalid={invalid || undefined}
              data-empty={!day}
              className="flex-1 justify-start font-normal data-[empty=true]:text-muted-foreground"
            />
          }
        >
          <CalendarIcon data-icon="inline-start" />
          {day ? (
            <span className="first-letter:uppercase">
              {format(day, "EEEE d MMMM yyyy", { locale: frFormat })}
            </span>
          ) : (
            "Choisir une date"
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={fr}
            selected={day}
            defaultMonth={day ?? today}
            disabled={today ? { before: today } : undefined}
            onSelect={(next) => {
              onDayChange(next)
              if (next) setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <Select
        value={time}
        disabled={disabled}
        onValueChange={(value) => {
          if (typeof value === "string") onTimeChange(value)
        }}
      >
        <SelectTrigger
          aria-label="Heure de début"
          aria-invalid={invalid || undefined}
          className="w-full sm:w-28"
        >
          <Clock3Icon className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {TIMES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
