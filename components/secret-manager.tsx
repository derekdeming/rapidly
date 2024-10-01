"use client"

import { Button } from "./ui/button"
import { Edit, Plus } from "lucide-react"
import { useSecretModal } from "@/hooks/use-secret-modal"
import { useEffect, useState } from "react"

interface SecretsManagerProps {
  secrets: string[]
}

const SecretsManager = ({ secrets }: SecretsManagerProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const secretModal = useSecretModal();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div>
      {secrets.map((secret) => (
        <div key={secret} className="flex flex-wrap gap-x-1 gap-y-4">
          <Button
            onClick={() => secretModal.onOpen({ _isNew: false, _key: secret })}
            variant="ghost"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <div key={secret} className="flex items-center gap-x-2">
            <p className="text-lg uppercase font-mono">{secret}</p>
            <p className="text-zinc-400 text-sm">••••••••</p>
          </div>
        </div>
      ))}
      <Button className="mt-4" onClick={() => secretModal.onOpen({ _isNew: true })}>
        Add Secret
        <Plus className="2-4 h-4 ml-2 fill-black" />
      </Button>
    </div>
  )
}

export default SecretsManager
