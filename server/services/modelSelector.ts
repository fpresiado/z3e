let selectedModel: string = "";
let availableModels: string[] = [];

export const modelSelector = {
  async initializeModels(lmStudioUrl: string): Promise<void> {
    try {
      const models = await this.fetchAvailableModels(lmStudioUrl);
      if (models.length > 0) {
        availableModels = models;
        // Prefer Mistral if available, otherwise use first model
        const mistral = models.find((m: string) => m.includes("mistral-nemo"));
        selectedModel = mistral || models[0];
        console.log(`[ModelSelector] Initialized with: ${selectedModel}`);
      }
    } catch (error) {
      console.error("[ModelSelector] Initialization error:", error);
    }
  },

  setModel(model: string) {
    selectedModel = model;
    console.log(`[ModelSelector] SWITCHED TO: ${model}`);
  },

  getModel(): string {
    if (!selectedModel) {
      console.warn("[ModelSelector] No model selected, using fallback");
      return availableModels[0] || "qwen2.5-14b_uncensored_instruct";
    }
    console.log(`[ModelSelector] CURRENT MODEL: ${selectedModel}`);
    return selectedModel;
  },

  async fetchAvailableModels(lmStudioUrl: string): Promise<string[]> {
    try {
      const response = await fetch(`${lmStudioUrl}/v1/models`);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        const models = data.data.map((m: any) => m.id);
        console.log(`[ModelSelector] Found models: ${models.join(", ")}`);
        return models;
      }
      return [];
    } catch (error) {
      console.error("[ModelSelector] Error fetching models:", error);
      return [];
    }
  },
};
