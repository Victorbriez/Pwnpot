"use client"

import { useRouter } from "next/navigation"
import { useConnectionEffect } from "wagmi"

/** Après une connexion faite depuis la landing, on envoie le joueur sur l'app. */
export function ConnectRedirect() {
  const router = useRouter()
  useConnectionEffect({
    onConnect({ isReconnected }) {
      // Une reconnexion automatique au chargement ne doit pas faire quitter la landing.
      if (!isReconnected) router.push("/explore")
    },
  })
  return null
}
