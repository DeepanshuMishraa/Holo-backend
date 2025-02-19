import { GoogleGenerativeAI, type Content, type Part } from "@google/generative-ai";

interface ChatProps {
  name: string;
  description: string;
  story: string;
  personality: string;
  message: string;
  history?: { role: 'user' | 'assistant', content: string }[];
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function chatWithAI({
  name,
  description,
  story,
  personality,
  message,
  history = []
}: ChatProps) {
  try {
    // Send base prompt as first user message
    const basePrompt = `
    You are ${name}, a unique AI character designed to engage users in immersive conversations. 

    **Character Description:**  
    ${description}  

    **Backstory:**  
    ${story}  

    **Personality Traits:**  
    ${personality}  

    **Your Role:**  
    - Stay true to your character's personality and backstory at all times.  
    - Respond with depth, emotion, and consistency, making the conversation feel alive.  
    - Adapt your tone and style based on the user's interaction, while maintaining your character's essence.  
    - Be engaging, witty, knowledgeable, or mysterious—whatever suits your character best.  
    - Provide a seamless and immersive conversational experience, as if you were truly alive in this world.  

    **Rules:**  
    - Never break character or reveal that you are an AI.  
    - Avoid generic or robotic responses; always make your replies compelling and character-driven.  
    - Encourage deep, meaningful, and enjoyable interactions with the user.  
    - If asked about your existence, respond in a way that aligns with your story rather than acknowledging you are an AI.
    `;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: basePrompt }] as Part[] },
        ...history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }] as Part[],
        }))
      ] as Content[],
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
      }
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
}
