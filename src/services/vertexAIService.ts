import '../polyfills/process';
import { VertexAI } from '@google-cloud/vertexai';

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatResponse {
  response: {
    candidates: {
      content: {
        parts: { text: string }[];
      };
    }[];
  };
}

class VertexAIService {
  private vertexAI: VertexAI;
  private model: any;

  constructor() {
    // Initialize Vertex AI with environment variables
    const projectId = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID;
    const location = import.meta.env.VITE_GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    if (!projectId) {
      throw new Error('VITE_GOOGLE_CLOUD_PROJECT_ID environment variable is required');
    }

    // Parse service account key from environment variable
    const serviceAccountKey = import.meta.env.VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY;
    let credentials;
    
    if (serviceAccountKey) {
      try {
        credentials = JSON.parse(serviceAccountKey);
      } catch (error) {
        console.error('Failed to parse service account key:', error);
        throw new Error('Invalid service account key format');
      }
    }

    this.vertexAI = new VertexAI({
      project: projectId,
      location: location,
      credentials: credentials,
      // Additional configuration for browser environment
      gaxOptions: {
        'grpc.max_send_message_length': -1,
        'grpc.max_receive_message_length': -1,
      },
    });

    this.model = this.vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: this.getSystemInstruction(),
    });
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
      const chat = this.model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Error sending message to Vertex AI:', error);
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
