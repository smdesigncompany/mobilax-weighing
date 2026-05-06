import { memo, useState } from 'react';
import { Button } from '../atoms/Button';
import { getApiBase, setApiBase } from '../services/config';

function SettingsButtonImpl() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(getApiBase() || '');

  const save = () => {
    setApiBase(value.trim());
    location.reload();
  };

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>Réglages</Button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[480px] max-w-[90vw]">
            <h2 className="text-lg font-semibold text-brand-900 mb-4">Réglages</h2>
            <label className="text-xs uppercase tracking-wider text-slate-500 font-medium">URL de l'API</label>
            <input
              type="url"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              placeholder="https://api.mobilax.app"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Laisser vide pour utiliser le serveur local (mode dev).
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const SettingsButton = memo(SettingsButtonImpl);
