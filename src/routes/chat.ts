import { Hono } from "hono";
import { db } from "../lib/db";
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { chatWithAI } from "../lib/ai";
import { createConversationSchema, sendMessageSchema } from "../types/types";
import type { AuthHonoEnv } from "../lib/middleware";
import { requireAuth } from "../lib/middleware";

export const chatRouter = new Hono<AuthHonoEnv>();

chatRouter.post("/conversation", requireAuth, zValidator("json", createConversationSchema), async (c) => {
  const user = c.get("user");
  if (!user) throw new Error("User not found");

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

chatRouter.get("/conversations", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) throw new Error("User not found");

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

chatRouter.get("/conversation/:id", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) throw new Error("User not found");
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

chatRouter.post("/message", requireAuth, zValidator("json", sendMessageSchema), async (c) => {
  const user = c.get("user");
  if (!user) throw new Error("User not found");

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

    // Get AI response
    let aiResponseText = "";
    for await (const chunk of await chatWithAI({
      name: conversation.character.name,
      description: conversation.character.description || "",
      story: conversation.character.story,
      personality: conversation.character.personality,
      message: data.content
    })) {
      aiResponseText += chunk;
    }

    // Store AI message
    const aiMessage = await db.message.create({
      data: {
        content: aiResponseText,
        role: "assistant",
        conversationId: data.conversationId
      }
    });

    return c.json({
      aiResponseText
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

chatRouter.get("/:characterId/messages", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) throw new Error("User not found");
  const { characterId } = c.req.param();

  try {
    let conversation = await db.conversation.findFirst({
      where: {
        characterId,
        character: {
          userId: user.id
        }
      },
      include: {
        message: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    if (!conversation) {
      // Create a new conversation if none exists
      const character = await db.character.findFirst({
        where: {
          id: characterId,
          userId: user.id
        }
      });

      if (!character) {
        return c.json({
          message: "Character not found or unauthorized",
        }, 404);
      }

      conversation = await db.conversation.create({
        data: {
          name: `Chat with ${character.name}`,
          description: `Conversation with ${character.name}`,
          characterId,
        },
        include: {
          message: true
        }
      });
    }

    return c.json({
      messages: conversation.message
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

chatRouter.post("/:characterId/send", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) throw new Error("User not found");
  const { characterId } = c.req.param();

  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return c.json({
        message: "Invalid message content",
      }, 400);
    }

    // Get or create conversation
    let conversation = await db.conversation.findFirst({
      where: {
        characterId,
        character: {
          userId: user.id
        }
      },
      include: {
        character: true
      }
    });

    if (!conversation) {
      const character = await db.character.findFirst({
        where: {
          id: characterId,
          userId: user.id
        }
      });

      if (!character) {
        return c.json({
          message: "Character not found or unauthorized",
        }, 404);
      }

      conversation = await db.conversation.create({
        data: {
          name: `Chat with ${character.name}`,
          description: `Conversation with ${character.name}`,
          characterId,
        },
        include: {
          character: true
        }
      });
    }

    // Get previous messages for context
    const previousMessages = await db.message.findMany({
      where: {
        conversationId: conversation.id
      },
      orderBy: {
        id: 'asc'
      },
      take: 10 // Limit to last 10 messages for context
    });

    await db.message.create({
      data: {
        content,
        role: "user",
        conversationId: conversation.id
      }
    });

    try {
      const response = await chatWithAI({
        name: conversation.character.name,
        description: conversation.character.description || "",
        story: conversation.character.story,
        personality: conversation.character.personality,
        message: content,
        history: previousMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      });

      await db.message.create({
        data: {
          content: response,
          role: "assistant",
          conversationId: conversation.id
        }
      });

      // Return just the text content instead of a JSON object
      return new Response(response, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });

    } catch (error) {
      console.error("Route Error:", error);
      return c.json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }

  } catch (error) {
    console.error("Route Error:", error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
