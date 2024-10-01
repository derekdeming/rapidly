import { create } from 'zustand';

interface useSecretModalState {
  isOpen: boolean;
  isNew: boolean;
  key?: string;
  onOpen: ({ _isNew, _key }: { _isNew: boolean, _key?: string }) => void;
  onClose: () => void;
}

export const useSecretModal = create<useSecretModalState>((set) => ({
  isOpen: false,
  isNew: true,
  onOpen: ({ _isNew, _key }) => set({ isOpen: true, isNew: _isNew, key: _key }),
  onClose: () => set({ isOpen: false }),
}));
