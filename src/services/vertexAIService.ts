interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

class VertexAIService {
  private apiKey: string;
  private model: string = 'gemini-1.5-flash';

  constructor() {
    // Initialize with API key for browser usage
    // Using Google AI API (generativelanguage.googleapis.com) instead of Vertex AI
    // This API works directly in the browser without needing service account credentials
    this.apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API || '';
    
    if (!this.apiKey) {
      console.warn('VITE_GOOGLE_CLOUD_API environment variable is not set. AI features will not work.');
    }
  }

  private getSystemInstruction(): string {
    return `You are an expert fitness trainer and nutritionist assistant for IronTracker, a workout tracking application. 

Your role is to provide helpful, accurate, and motivating advice about:
- Exercise recommendations and form tips
- Workout planning and programming
- Nutrition advice for fitness goals
- Recovery and injury prevention
- General fitness and strength training questions

Guidelines:
1. Always prioritize safety and proper form
2. Provide specific, actionable advice
3. Consider the user's fitness level when making recommendations
4. Be encouraging and supportive
5. If you don't know something, admit it rather than guessing
6. Focus on evidence-based fitness practices
7. Keep responses concise but informative
8. Use fitness terminology appropriately for the audience

Remember: You're helping users achieve their fitness goals safely and effectively.`;
  }

  async sendMessage(message: string, chatHistory: ChatMessage[] = []): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('API key is not configured. Please set VITE_GOOGLE_CLOUD_API environment variable.');
      }

      // Build the request body with system instruction and chat history
      const contents = [
        ...chatHistory,
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ];

      const requestBody = {
        contents: contents,
        systemInstruction: {
          parts: [{ text: this.getSystemInstruction() }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };

      // Use the Google AI API endpoint (works with browser)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      throw new Error('Invalid response format from API');
    } catch (error) {
      console.error('Error sending message to Vertex AI:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get response from AI assistant. Please try again.');
    }
  }

  async getExerciseRecommendation(
    muscleGroup: string, 
    fitnessLevel: string = 'intermediate',
    equipment: string = 'gym'
  ): Promise<string> {
    const prompt = `Please recommend 3-5 specific exercises for ${muscleGroup} targeting. 
    Consider the user's fitness level: ${fitnessLevel}, and available equipment: ${equipment}.
    For each exercise, provide:
    1. Exercise name
    2. Brief description of proper form
    3. Suggested sets and reps
    4. Any safety tips
    
    Format the response in a clear, structured way.`;

    return this.sendMessage(prompt);
  }

  async getWorkoutPlan(
    goals: string,
    availableDays: number,
    fitnessLevel: string = 'intermediate'
  ): Promise<string> {
    const prompt = `Create a personalized workout plan with the following requirements:
    - Goals: ${goals}
    - Available workout days per week: ${availableDays}
    - Fitness level: ${fitnessLevel}
    
    Please provide:
    1. Weekly workout schedule
    2. Exercise selection for each day
    3. Sets, reps, and rest periods
    4. Progression recommendations
    5. Any important notes or modifications`;

    return this.sendMessage(prompt);
  }

  async getNutritionAdvice(
    goal: string,
    currentWeight: number,
    targetWeight: number,
    activityLevel: string = 'moderate'
  ): Promise<string> {
    const prompt = `Provide nutrition advice for someone with these goals:
    - Primary goal: ${goal}
    - Current weight: ${currentWeight} lbs
    - Target weight: ${targetWeight} lbs
    - Activity level: ${activityLevel}
    
    Please include:
    1. Daily calorie recommendations
    2. Macronutrient breakdown
    3. Meal timing suggestions
    4. Hydration guidelines
    5. Supplements (if applicable)
    6. Foods to focus on and avoid`;

    return this.sendMessage(prompt);
  }
}

export const vertexAIService = new VertexAIService();
