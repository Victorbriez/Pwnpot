"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CircleCheckIcon,
  CircleDashedIcon,
  ChevronDownIcon,
  CircleXIcon,
  PlusIcon,
  RocketIcon,
  XIcon,
} from "lucide-react"
import { isAddress, type Address } from "viem"
import { baseSepolia } from "viem/chains"
import { useConnection, useSwitchChain } from "wagmi"

import { StartDatePicker } from "@/components/create/start-date-picker"
import { VulnTag } from "@/components/ctf/vuln-tag"
import { TxStatusAlert } from "@/components/onchain/tx-status"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DataList, DataRow } from "@/components/site/data-list"
import {
  createStepLabels,
  useCreateCtf,
  vaultFunding,
  type CreateCtfState,
  type FactorySlot,
} from "@/hooks/use-create-ctf"
import {
  DURATION_PRESETS,
  DURATION_UNITS,
  MAX_PLAYERS,
  MAX_TITLE_BYTES,
  MIN_PLAYERS,
  nowSeconds,
  parseEth,
  validateCtfDraft,
  type CtfField,
  type DurationUnit,
} from "@/lib/ctf/params"
import { formatEth } from "@/lib/format"
import {
  isFactoryAvailable,
  knownFactories,
  knownFactoryAddress,
  testFactoryAddress,
  VAULT_SEED,
  type KnownFactory,
} from "@/lib/onchain/factories"
import { truncateAddress } from "@/lib/onchain/format"
import { cn } from "@/lib/utils"

type FactoryOption =
  | { kind: "known"; id: string; name: string; factory: KnownFactory }
  | { kind: "test"; id: string; name: string; address: Address }

// La factory de test (`pnpm chain:deploy`) n'existe qu'en local.
const factoryOptions: FactoryOption[] = [
  ...knownFactories.map((factory): FactoryOption => ({
    kind: "known",
    id: factory.id,
    name: factory.name,
    factory,
  })),
  ...(testFactoryAddress
    ? [
        {
          kind: "test",
          id: "test",
          name: "Factory de test",
          address: testFactoryAddress,
        } as const,
      ]
    : []),
]

/**
 * Ce qui part dans `createCTF`. Le Coffre n'a pas encore d'adresse : il est
 * déployé juste avant (hooks/use-create-ctf.ts).
 */
function optionSlot(option: FactoryOption, isDemo: boolean): FactorySlot {
  if (option.kind === "test") return option.address
  if (option.factory.perCtf && !isDemo) return "vault"
  return knownFactoryAddress(option.factory)
}

type Amounts = { cashPrize: string; ticketPrice: string; maxPlayers: string }

// Pré-remplis pour que le récap soit chiffré dès l'arrivée sur la page.
const defaultAmounts: Amounts = {
  cashPrize: "1",
  ticketPrice: "0.01",
  maxPlayers: "20",
}
const DEFAULT_TIME = "18:00"
/** Durée choisie : un préréglage (en secondes) ou `custom` pour la saisir. */
type DurationChoice = number | "custom"
const DEFAULT_DURATION: DurationChoice = 7 * DURATION_UNITS.days

const unitLabels: Record<DurationUnit, string> = {
  minutes: "minutes",
  hours: "heures",
  days: "jours",
}

function combine(day: Date | undefined, time: string): Date | undefined {
  if (!day || !/^\d{2}:\d{2}/.test(time)) return undefined
  const [hours = 0, minutes = 0] = time.split(":").map(Number)
  const start = new Date(day)
  start.setHours(hours, minutes, 0, 0)
  return start
}

export function CreateCtfForm() {
  const tx = useCreateCtf()
  const { isConnected, chainId } = useConnection()
  const switchChain = useSwitchChain()

  const [title, setTitle] = useState("")
  const [amounts, setAmounts] = useState<Amounts>(defaultAmounts)
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState<Address[]>([])
  const [customInput, setCustomInput] = useState("")
  const [day, setDay] = useState<Date>()
  const [time, setTime] = useState(DEFAULT_TIME)
  const [duration, setDuration] = useState<DurationChoice>(DEFAULT_DURATION)
  const [customAmount, setCustomAmount] = useState("2")
  const [customUnit, setCustomUnit] = useState<DurationUnit>("hours")
  const [touched, setTouched] = useState<Partial<Record<CtfField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [startError, setStartError] = useState<string>()

  // L'ordre des factories donne l'index des épreuves dans le CTF.
  const slots: FactorySlot[] = [
    ...factoryOptions
      .filter((f) => selected.includes(f.id))
      .map((f) => optionSlot(f, tx.isDemo)),
    ...custom,
  ]
  // Pour la validation, le Coffre à déployer garde une adresse fictive.
  const vaultPlaceholder = knownFactoryAddress(knownFactories[0])
  const factories: Address[] = slots.map((slot) =>
    slot === "vault" ? vaultPlaceholder : slot
  )
  const withVault = slots.includes("vault")
  const draft = {
    title,
    ...amounts,
    factories,
    start: combine(day, time),
    durationSeconds:
      duration !== "custom"
        ? duration
        : /^\d+$/.test(customAmount.trim())
          ? Number(customAmount.trim()) * DURATION_UNITS[customUnit]
          : undefined,
  }
  const { errors, bond, end } = validateCtfDraft(draft)

  // Récap : calculé dès que les montants sont valides, même sans date.
  const cashPrize = parseEth(amounts.cashPrize)
  const ticketPrice = parseEth(amounts.ticketPrice)
  const maxPlayers = /^\d+$/.test(amounts.maxPlayers.trim())
    ? BigInt(amounts.maxPlayers.trim())
    : undefined
  const funding =
    withVault && maxPlayers !== undefined ? vaultFunding(maxPlayers) : undefined
  const total =
    cashPrize !== null && bond !== undefined && (!withVault || funding)
      ? cashPrize + bond + (funding ?? BigInt(0))
      : undefined

  const busy = tx.status === "signing" || tx.status === "confirming"
  // Une fois une transaction confirmée, les paramètres ne bougent plus : une
  // nouvelle tentative reprend là où la création s'est arrêtée.
  const locked = busy || tx.status === "success" || tx.started
  const wrongChain = isConnected && chainId !== baseSepolia.id
  const needsWallet = !tx.isDemo && !isConnected

  const errorFor = (field: CtfField) =>
    field === "start" && startError
      ? startError
      : submitted || touched[field]
        ? errors[field]
        : undefined
  const touch = (field: CtfField) =>
    setTouched((prev) => ({ ...prev, [field]: true }))
  const setAmount = (field: keyof Amounts) => (value: string) =>
    setAmounts((prev) => ({ ...prev, [field]: value }))

  const toggleFactory = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
    touch("factories")
  }

  const customValue = customInput.trim()
  const customValid = isAddress(customValue)
  const customInvalid = customValue !== "" && !customValid
  const addCustom = () => {
    if (!customValid) return
    setCustom((prev) => [...prev, customValue])
    setCustomInput("")
    touch("factories")
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    const checked = validateCtfDraft(draft, { now: nowSeconds() })
    setStartError(checked.errors.start)
    if (!checked.params || needsWallet || wrongChain) return
    tx.submit(checked.params, slots)
  }

  const handleReset = () => {
    tx.reset()
    setTitle("")
    setAmounts(defaultAmounts)
    setSelected([])
    setCustom([])
    setDay(undefined)
    setTime(DEFAULT_TIME)
    setDuration(DEFAULT_DURATION)
    setCustomAmount("2")
    setCustomUnit("hours")
    setTouched({})
    setSubmitted(false)
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
    >
      <Card>
        <CardContent>
          <FieldGroup>
            <FieldSet disabled={locked}>
              <FieldLegend>1. Nom</FieldLegend>
              <Field data-invalid={!!errorFor("title") || undefined}>
                <FieldLabel htmlFor="ctf-title">Titre du CTF</FieldLabel>
                <Input
                  id="ctf-title"
                  value={title}
                  placeholder="Reentrancy Rumble"
                  aria-invalid={!!errorFor("title") || undefined}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => touch("title")}
                />
                {errorFor("title") ? (
                  <FieldError>{errorFor("title")}</FieldError>
                ) : (
                  <FieldDescription>
                    Affiché sur Explorer. {MAX_TITLE_BYTES} octets au plus.
                  </FieldDescription>
                )}
              </Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet disabled={locked}>
              <FieldLegend>2. Épreuves</FieldLegend>
              <FieldDescription>
                Chaque joueur exploite sa propre instance de chaque épreuve.
              </FieldDescription>
              <FieldGroup
                data-slot="checkbox-group"
                className="grid sm:grid-cols-3"
              >
                {factoryOptions.map((factory) => {
                  const unavailable =
                    factory.kind === "known" &&
                    !tx.isDemo &&
                    !isFactoryAvailable(factory.factory)
                  const id = `factory-${factory.id}`
                  return (
                    <FieldLabel key={factory.id} htmlFor={id}>
                      <Field
                        orientation="horizontal"
                        data-disabled={unavailable || undefined}
                      >
                        <FieldContent className="gap-2">
                          <FieldTitle>{factory.name}</FieldTitle>
                          {factory.kind === "known" ? (
                            <VulnTag vuln={factory.factory.vuln} />
                          ) : (
                            <Badge variant="muted" className="h-6 px-2.5">
                              Sans exploit
                            </Badge>
                          )}
                        </FieldContent>
                        <Checkbox
                          id={id}
                          checked={selected.includes(factory.id)}
                          disabled={unavailable}
                          onCheckedChange={(checked) =>
                            toggleFactory(factory.id, checked)
                          }
                        />
                      </Field>
                    </FieldLabel>
                  )
                })}
              </FieldGroup>

              <Collapsible defaultOpen={custom.length > 0}>
                <CollapsibleTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="group/trigger -ml-2 text-muted-foreground"
                    />
                  }
                >
                  Utiliser ma propre factory
                  <ChevronDownIcon
                    data-icon="inline-end"
                    className="transition-transform group-data-panel-open/trigger:rotate-180"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-3 pt-2">
                  <Field data-invalid={customInvalid || undefined}>
                    <FieldLabel htmlFor="custom-factory" className="sr-only">
                      Adresse de la factory
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="custom-factory"
                        placeholder="Adresse de la factory (0x…)"
                        spellCheck={false}
                        autoComplete="off"
                        className="font-mono"
                        value={customInput}
                        aria-invalid={customInvalid || undefined}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addCustom()
                          }
                        }}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          disabled={!customValid}
                          onClick={addCustom}
                        >
                          <PlusIcon data-icon="inline-start" />
                          Ajouter
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {customInvalid ? (
                      <FieldError>Adresse invalide.</FieldError>
                    ) : (
                      <FieldDescription>
                        Les joueurs verront si son code source est vérifié avant
                        d&apos;acheter un ticket.
                      </FieldDescription>
                    )}
                  </Field>
                  {custom.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {custom.map((address) => (
                        <Badge
                          key={address}
                          variant="outline"
                          className="h-7 pr-1 font-mono"
                        >
                          {truncateAddress(address)}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Retirer ${address}`}
                            onClick={() =>
                              setCustom((prev) =>
                                prev.filter((a) => a !== address)
                              )
                            }
                          >
                            <XIcon />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
              {selected.includes("vault") && (
                <FieldDescription>
                  Le Coffre est déployé pour ton CTF : tu y déposes{" "}
                  {formatEth(VAULT_SEED)} par joueur, que chaque joueur peut
                  vider. Trois transactions à signer : déployer le Coffre,
                  publier le CTF, puis le lier au CTF. Après la fin, tu
                  récupères ce qui reste depuis la page du CTF.
                </FieldDescription>
              )}
              <FieldError>{errorFor("factories")}</FieldError>
            </FieldSet>

            <FieldSeparator />

            <FieldSet disabled={locked}>
              <FieldLegend>3. Cagnotte</FieldLegend>
              <FieldDescription>
                Le podium se partage le cash prize et les tickets vendus (60 /
                30 / 10 %).
              </FieldDescription>
              <FieldGroup className="grid sm:grid-cols-3">
                <AmountField
                  id="cash-prize"
                  label="Cash prize"
                  suffix="ETH"
                  inputMode="decimal"
                  value={amounts.cashPrize}
                  error={errorFor("cashPrize")}
                  onChange={setAmount("cashPrize")}
                  onBlur={() => touch("cashPrize")}
                />
                <AmountField
                  id="ticket-price"
                  label="Prix du ticket"
                  suffix="ETH"
                  inputMode="decimal"
                  value={amounts.ticketPrice}
                  error={errorFor("ticketPrice")}
                  description="Minimum 0,0001 ETH."
                  onChange={setAmount("ticketPrice")}
                  onBlur={() => touch("ticketPrice")}
                />
                <AmountField
                  id="max-players"
                  label="Joueurs max"
                  suffix="joueurs"
                  inputMode="numeric"
                  value={amounts.maxPlayers}
                  error={errorFor("maxPlayers")}
                  description={`De ${MIN_PLAYERS} à ${MAX_PLAYERS}.`}
                  onChange={setAmount("maxPlayers")}
                  onBlur={() => touch("maxPlayers")}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet disabled={locked}>
              <FieldLegend>4. Dates</FieldLegend>
              <FieldGroup>
                <Field data-invalid={!!errorFor("start") || undefined}>
                  <FieldLabel htmlFor="start-date">Début</FieldLabel>
                  <StartDatePicker
                    id="start-date"
                    day={day}
                    time={time}
                    disabled={locked}
                    invalid={!!errorFor("start")}
                    onDayChange={(next) => {
                      setDay(next)
                      setStartError(undefined)
                      touch("start")
                    }}
                    onTimeChange={(next) => {
                      setTime(next)
                      setStartError(undefined)
                    }}
                  />
                  <FieldError>{errorFor("start")}</FieldError>
                </Field>
                <Field data-invalid={!!errorFor("duration") || undefined}>
                  <FieldLabel id="duration-label">Durée</FieldLabel>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <ToggleGroup
                      aria-labelledby="duration-label"
                      variant="outline"
                      spacing={0}
                      disabled={locked}
                      className="flex-wrap"
                      value={[String(duration)]}
                      onValueChange={(value) => {
                        const next = value[0]
                        if (!next) return
                        setDuration(next === "custom" ? "custom" : Number(next))
                        touch("duration")
                      }}
                    >
                      {DURATION_PRESETS.map((preset) => (
                        <ToggleGroupItem
                          key={preset.seconds}
                          value={String(preset.seconds)}
                        >
                          {preset.label}
                        </ToggleGroupItem>
                      ))}
                      <ToggleGroupItem value="custom">Autre</ToggleGroupItem>
                    </ToggleGroup>
                    {duration === "custom" && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          aria-label="Durée personnalisée"
                          aria-invalid={!!errorFor("duration") || undefined}
                          disabled={locked}
                          value={customAmount}
                          onChange={(event) =>
                            setCustomAmount(event.target.value)
                          }
                          onBlur={() => touch("duration")}
                          className="w-24 tabular-nums"
                        />
                        <Select
                          value={customUnit}
                          disabled={locked}
                          onValueChange={(value) => {
                            if (value) setCustomUnit(value as DurationUnit)
                          }}
                        >
                          <SelectTrigger
                            aria-label="Unité de la durée"
                            className="w-32"
                          >
                            <SelectValue>
                              {(value: DurationUnit) => unitLabels[value]}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {(
                                Object.keys(unitLabels) as DurationUnit[]
                              ).map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unitLabels[unit]}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <FieldError>{errorFor("duration")}</FieldError>
                </Field>
              </FieldGroup>
              <FieldDescription>
                {end
                  ? `Fin le ${format(end, "EEEE d MMMM 'à' HH:mm", { locale: fr })}, puis 48 h pour contester un résultat.`
                  : "De 1 h à 30 jours. Après la fin, 48 h sont réservées pour contester un résultat."}
              </FieldDescription>
            </FieldSet>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-20">
        <CardHeader>
          <CardDescription>Tu envoies</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {total !== undefined ? formatEth(total) : "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DataList>
            <DataRow label="Cash prize">
              {cashPrize !== null ? formatEth(cashPrize) : "—"}
            </DataRow>
            <DataRow
              label="Caution"
              hint={
                cashPrize !== null && ticketPrice !== null && bond !== undefined
                  ? `${formatEth(cashPrize, { unit: false })} + ${amounts.maxPlayers} × ${formatEth(ticketPrice)}`
                  : "cash prize + joueurs max × ticket"
              }
            >
              {bond !== undefined ? formatEth(bond) : "—"}
            </DataRow>
            {withVault && (
              <DataRow
                label="Fonds du Coffre"
                hint={`${amounts.maxPlayers} × ${formatEth(VAULT_SEED)}`}
              >
                {funding !== undefined ? formatEth(funding) : "—"}
              </DataRow>
            )}
          </DataList>
          <Separator />
          <p className="text-sm text-muted-foreground">
            La caution est calculée pour toi : elle couvre ce qu&apos;un
            organisateur tricheur pourrait récupérer. Elle t&apos;est rendue à
            la fin, sauf si la triche est confirmée.
          </p>
          {tx.steps.length > 1 && tx.status !== "idle" && (
            <CreateSteps tx={tx} />
          )}
          <TxStatusAlert
            status={tx.status}
            hash={tx.hash}
            error={tx.error}
            isDemo={tx.isDemo}
          />
          {tx.vault && tx.status === "error" && (
            <p className="text-sm text-muted-foreground">
              Ton Coffre est déployé ({truncateAddress(tx.vault)}). Relance pour
              reprendre à l&apos;étape qui a échoué ; ses fonds restent
              récupérables tant qu&apos;il n&apos;est pas lié.
            </p>
          )}
        </CardContent>
        <CardFooter>
          {tx.status === "success" ? (
            <div className="flex w-full flex-col gap-2">
              <Link
                href="/organize"
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
              >
                Voir mes CTF organisés
              </Link>
              {tx.ctfId !== undefined && (
                <Link
                  href={`/ctf/${tx.ctfId}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full"
                  )}
                >
                  Ouvrir le CTF
                </Link>
              )}
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={handleReset}
              >
                Créer un autre CTF
              </Button>
            </div>
          ) : needsWallet ? (
            <ConnectWallet
              label="Connecter un wallet"
              className="w-full justify-center"
            />
          ) : wrongChain ? (
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={switchChain.isPending}
              onClick={() => switchChain.mutate({ chainId: baseSepolia.id })}
            >
              Passer sur Base Sepolia
            </Button>
          ) : (
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RocketIcon data-icon="inline-start" />
              )}
              {tx.started ? "Reprendre la création" : "Publier le CTF"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  )
}

/** Avancement des transactions quand le CTF a un Coffre. */
function CreateSteps({ tx }: { tx: CreateCtfState }) {
  return (
    <ol className="flex flex-col gap-2 text-sm">
      {tx.steps.map((step, index) => {
        const done = tx.done.includes(step)
        const current = !done && tx.current === step
        const failed = current && tx.status === "error"
        return (
          <li
            key={step}
            className={cn(
              "flex items-center gap-2",
              !done && !current && "text-muted-foreground"
            )}
          >
            {done ? (
              <CircleCheckIcon className="size-4 text-success-text" />
            ) : failed ? (
              <CircleXIcon className="size-4 text-destructive" />
            ) : current ? (
              <Spinner className="size-4" />
            ) : (
              <CircleDashedIcon className="size-4" />
            )}
            {index + 1}. {createStepLabels[step]}
          </li>
        )
      })}
    </ol>
  )
}

function AmountField({
  id,
  label,
  suffix,
  inputMode,
  value,
  error,
  description,
  onChange,
  onBlur,
}: {
  id: string
  label: string
  suffix: string
  inputMode: "decimal" | "numeric"
  value: string
  error?: string
  description?: string
  onChange: (value: string) => void
  onBlur: () => void
}) {
  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          aria-invalid={!!error || undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      {error ? (
        <FieldError>{error}</FieldError>
      ) : (
        description && <FieldDescription>{description}</FieldDescription>
      )}
    </Field>
  )
}
