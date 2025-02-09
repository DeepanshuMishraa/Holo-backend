import { z } from "zod";


export const createCharecterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(255),
  avatar: z.string().min(1),
  story: z.string().min(1),
  personality: z.string().min(1),
})


export const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(255),
  avatar: z.string().min(1),
  story: z.string().min(1),
  personality: z.string().min(1),
})

export const createConversationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  characterId: z.string().min(1)
});

export const sendMessageSchema = z.object({
  content: z.string().min(1),
  conversationId: z.string().min(1)
});
