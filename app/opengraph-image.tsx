import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const alt =
  "Pwnpot : trouve la faille, vide le contrat, garde la cagnotte."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Les variables CSS ne passent pas dans ImageResponse : valeurs du thème
// sombre de app/globals.css, recopiées ici.
const color = {
  background: "#0a0b10",
  card: "#11131a",
  border: "#1c1f2b",
  foreground: "#e8eaf2",
  muted: "#8a8fa3",
  primary: "#7356ff",
  primaryText: "#a794ff",
  success: "#34d399",
  successText: "#6ee7b7",
}

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo.png"))
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: color.background,
        backgroundImage: `radial-gradient(circle at 92% 0%, ${color.primary}55 0%, transparent 45%), radial-gradient(circle at 0% 100%, ${color.primary}22 0%, transparent 40%)`,
        color: color.foreground,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- image décorative, le nom suit */}
          <img src={logoSrc} width={64} height={64} />
          <span style={{ fontSize: 40, letterSpacing: -1 }}>Pwnpot</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            borderRadius: 999,
            border: `1px solid ${color.border}`,
            background: color.card,
            fontSize: 24,
            color: color.muted,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: color.success,
            }}
          />
          Base Sepolia
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 88,
          lineHeight: 1.02,
          letterSpacing: -4,
        }}
      >
        <span>Trouve la faille.</span>
        <span>Vide le contrat.</span>
        <span style={{ color: color.primaryText }}>Garde la cagnotte.</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 28px",
          borderRadius: 20,
          border: `1px solid ${color.border}`,
          background: color.card,
          fontSize: 26,
        }}
      >
        <span style={{ color: color.muted }}>
          CTF smart contracts · réussite vérifiée on-chain
        </span>
        <span style={{ color: color.successText }}>+0,72 ETH</span>
      </div>
    </div>,
    size
  )
}
