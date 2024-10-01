'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSecretModal } from '@/hooks/use-secret-modal';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export const SecretModal = () => {
  const router = useRouter();
  const secretModal = useSecretModal();
  const [loading, setLoading] = useState<boolean>(false)
  const [key, setKey] = useState<string>(secretModal.key || "")
  const [value, setValue] = useState<string>("")

  useEffect(() => {
    setKey(secretModal.key || "")
  }, [secretModal.key])


  const onAdd = async () => {
    if (!key || !value) return

    try {
      setLoading(true)
      if (secretModal.isNew) {
        await axios.post("/api/secret", { key, value })
        toast.success("Secret added!")
      }
      else {
        await axios.put("/api/secret", { key, value })
        toast.success("Secret updated!")
      }
    } catch (error) {
      toast.error("Something went wrong")
      console.log(error, "SECRET_ERROR")
    }
    finally {
      setLoading(false)
      secretModal.onClose()
      router.refresh()
    }
  }

  return (
    <Dialog open={secretModal.isOpen} onOpenChange={secretModal.onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex justify-center items-center flex-col gap-y-4 pb-2">
            <div className="flex items-center gap-x-2 font-bold py-1">
              {secretModal.isNew ? "Add New Secret" : "Edit Secret"}
            </div>
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-2 text-zinc-900 font-medium">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="key">Key</Label>
              <Input
                type="text"
                disabled={!!secretModal.key}
                placeholder={secretModal.key || "key"}
                onChange={(event) => setKey(event.target.value)}
              />
              <Label htmlFor="secret">Secret</Label>
              <Input
                type="password"
                placeholder="secret"
                onChange={(event) => setValue(event.target.value)}
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={loading}
            onClick={onAdd}
            size="lg" className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {secretModal.isNew ? "Add" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
