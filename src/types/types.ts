import { z } from "zod";


export const createCharecterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  avatar: z.string().min(1),
})


export const updateCharacterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  avatar: z.string().min(1),
})
