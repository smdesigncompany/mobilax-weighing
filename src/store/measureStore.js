import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

// Centralised store. Components subscribe via selectors so a change to
// `weight` does not re-render components that only read `barcode`.
export const useMeasureStore = create((set) => ({
  measure: null,
  status: 'idle', // 'idle' | 'measuring' | 'ready' | 'error'
  connection: 'disconnected', // 'connecting' | 'connected' | 'disconnected'
  error: null,

  setMeasure: (measure) => set({ measure, status: 'ready', error: null }),
  setStatus: (status) => set({ status }),
  setConnection: (connection) => set({ connection }),
  setError: (error) => set({ error, status: 'error' }),
  reset: () => set({ measure: null, status: 'idle', error: null }),
}));

// Stable selectors — defined once, referenced by hooks below to keep
// reference equality across renders.
const selBarcode = (s) => s.measure?.barcode ?? '';
const selCodeSource = (s) => s.measure?.codeSource ?? null;
const selWeight = (s) => s.measure?.weight ?? null;
const selDims = (s) => ({ len: s.measure?.len ?? null, width: s.measure?.width ?? null, height: s.measure?.height ?? null });
const selVol = (s) => s.measure?.vol ?? null;
const selStatus = (s) => s.status;
const selConnection = (s) => s.connection;
const selDatetime = (s) => s.measure?.datetime ?? null;

export const useBarcode = () => useMeasureStore(selBarcode);
export const useCodeSource = () => useMeasureStore(selCodeSource);
export const useWeight = () => useMeasureStore(selWeight);
export const useDims = () => useMeasureStore(selDims, shallow);
export const useVol = () => useMeasureStore(selVol);
export const useStatus = () => useMeasureStore(selStatus);
export const useConnection = () => useMeasureStore(selConnection);
export const useDatetime = () => useMeasureStore(selDatetime);

// Snapshot getter for non-reactive consumers (QR generation on demand)
export const getMeasureSnapshot = () => useMeasureStore.getState().measure;
