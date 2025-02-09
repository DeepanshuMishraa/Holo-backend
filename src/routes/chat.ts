import { Hono } from "hono";
import { getUser } from "../lib/auth";
import { db } from "../lib/db";
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { chatWithAI } from "../lib/ai";
import { createConversationSchema, sendMessageSchema } from "../types/types";

export const chatRouter = new Hono();



chatRouter.post("/conversation", getUser, zValidator("json", createConversationSchema), async (c) => {
  const user = c.var.user;

  if (!user) {
    return c.json({
      message: "Unauthorized",
    }, 401);
  }

  try {
    const data = c.req.valid("json");

    const character = await db.character.findFirst({
      where: {
        id: data.characterId,
        userId: user.id
      }
    });

    if (!character) {
      return c.json({
        message: "Character not found or unauthorized",
      }, 404);
    }

    const conversation = await db.conversation.create({
      data: {
        name: data.name,
        description: data.description,
        characterId: data.characterId,
      }
    });

    return c.json({
      message: "Conversation created successfully",
      conversation
    }, 201);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

chatRouter.get("/conversations", getUser, async (c) => {
  const user = c.var.user;

  try {
    const conversations = await db.conversation.findMany({
      where: {
        character: {
          userId: user.id
        }
      },
      include: {
        character: true,
        message: {
          orderBy: {
            id: 'desc'
          },
          take: 1
        }
      }
    });

    return c.json({
      conversations
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

chatRouter.get("/conversation/:id", getUser, async (c) => {
  const user = c.var.user;
  const { id } = c.req.param();

  try {
    const conversation = await db.conversation.findFirst({
      where: {
        id,
        character: {
          userId: user.id
        }
      },
      include: {
        character: true,
        message: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    if (!conversation) {
      return c.json({
        message: "Conversation not found",
      }, 404);
    }

    return c.json({
      conversation
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

chatRouter.post("/message", getUser, zValidator("json", sendMessageSchema), async (c) => {
  const user = c.var.user;

  try {
    const data = c.req.valid("json");

    // Get the conversation and verify it belongs to the user
    const conversation = await db.conversation.findFirst({
      where: {
        id: data.conversationId,
        character: {
          userId: user.id
        }
      },
      include: {
        character: true
      }
    });

    if (!conversation) {
      return c.json({
        message: "Conversation not found or unauthorized",
      }, 404);
    }

    // Store the user's message
    const userMessage = await db.message.create({
      data: {
        content: data.content,
        role: "user",
        conversationId: data.conversationId
      }
    });

    const aiResponse = await chatWithAI({
      name: conversation.character.name,
      description: conversation.character.description || "",
      story: conversation.character.story,
      personality: conversation.character.personality,
      message: data.content
    });
    const aiMessage = await db.message.create({
      data: {
        content: aiResponse,
        role: "assistant",
        conversationId: data.conversationId
      }
    });

    return c.json({
      messages: [userMessage, aiMessage]
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
