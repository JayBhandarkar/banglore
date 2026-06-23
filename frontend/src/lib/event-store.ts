import { useEffect, useSyncExternalStore } from "react";
import type { EventData, PredictionResult } from "./types";
import { DEFAULT_EVENT, generatePrediction } from "./mock-data";

interface State {
  event: EventData | null;
  prediction: PredictionResult | null;
}

const STORAGE_KEY = "trafficos:state:v1";

let state: State = { event: null, prediction: null };
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (e) {
    console.error("Error loading eventStore:", e);
  }
}
function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error saving eventStore:", e);
  }
}
function emit() {
  listeners.forEach((l) => l());
}

export const eventStore = {
  get: () => state,
  setEvent(event: EventData) {
    state = { event, prediction: generatePrediction(event) };
    persist();
    emit();
  },
  setPrediction(event: EventData, prediction: PredictionResult) {
    state = { event, prediction };
    persist();
    emit();
  },
  reset() {
    state = { event: null, prediction: null };
    persist();
    emit();
  },
  ensureDemo() {
    if (!state.event) {
      state = { event: DEFAULT_EVENT, prediction: generatePrediction(DEFAULT_EVENT) };
      persist();
      emit();
    }
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

let loaded = false;
const SERVER_SNAPSHOT = { event: null, prediction: null };

export function useEventState() {
  useEffect(() => {
    if (!loaded) {
      load();
      loaded = true;
      emit();
    }
  }, []);
  return useSyncExternalStore(
    eventStore.subscribe,
    () => state,
    () => SERVER_SNAPSHOT,
  );
}
