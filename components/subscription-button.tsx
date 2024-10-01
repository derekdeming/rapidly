"use client"

import { Button } from "@/components/ui/button"
import axios from "axios"
import { Loader2, Zap } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"

interface SubscriptionButtonProps {
  isPro: boolean
}

export const SubscriptionButton = ({ isPro = false }: SubscriptionButtonProps) => {
  const [loading, setLoading] = useState(false)


  const onClick = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/stripe")
      window.location.href = response.data.url
    } catch (error) {
      toast.error("Something went wrong")
      console.log("BILLING_ERROR", error)
    }
    finally {
      setLoading(false)
    }
  }


  return <Button disabled={loading} variant={isPro ? "default" : "premium"} onClick={onClick}>
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {isPro ? "Manage Subscription" : "Upgrade"} {!isPro && <Zap className="w-4 h-4 ml-2 fill-white" />}
  </Button>

}
