"use client"

import { useEffect } from "react"
import { Crisp } from "crisp-sdk-web"

export const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("1e5d88ef-7fe1-4951-b3ae-8eb27d539ef7")
  }, [])

  return null
}

