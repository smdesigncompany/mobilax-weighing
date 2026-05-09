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
        <div className="fixed inset-0 bg-steel-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="surface-panel rounded-lg p-6 w-[480px] max-w-[90vw]">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.16em] mb-5">
              Réglages
            </h2>
            <label className="text-[10px] uppercase tracking-[0.18em] text-steel-300 font-semibold">
              URL de l'API
            </label>
            <input
              type="url"
              className="mt-2 w-full px-3 py-2 bg-steel-900 border border-steel-600 focus:border-accent-500 focus:outline-none rounded-md text-sm font-mono text-steel-100"
              placeholder="https://api.mobilax.app"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <p className="text-xs text-steel-300 mt-2">
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
