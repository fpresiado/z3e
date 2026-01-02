/**
 * CPU Worker for parallel LLM inference
 * Handles CPU-based inference tasks to offload from GPU
 */

let cpuEnabled = false;
let cpuWorkerPool: any[] = [];
const MAX_CPU_WORKERS = 2; // Conservative for Threadripper

export const cpuWorker = {
  isEnabled(): boolean {
    return cpuEnabled;
  },

  enable() {
    cpuEnabled = true;
    console.log(`[CPUWorker] ENABLED - ${MAX_CPU_WORKERS} parallel workers`);
  },

  disable() {
    cpuEnabled = false;
    console.log(`[CPUWorker] DISABLED`);
  },

  getWorkerCount(): number {
    return MAX_CPU_WORKERS;
  },

  getStatus() {
    return {
      enabled: cpuEnabled,
      maxWorkers: MAX_CPU_WORKERS,
      activeWorkers: cpuWorkerPool.length,
    };
  },
};
