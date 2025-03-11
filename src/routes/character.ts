import { Hono } from "hono";
import { createCharecterSchema, updateCharacterSchema } from "../types/types";
import { zValidator } from '@hono/zod-validator'
import { db } from "../lib/db";
import type { AuthHonoEnv } from "../lib/middleware";
import { requireAuth } from "../lib/middleware";

export const characterRouter = new Hono<AuthHonoEnv>();

characterRouter.post("/create", requireAuth, zValidator("json", createCharecterSchema), async (c) => {
  const user = c.get("user");
  if (!user) throw new Error("User not found");

  try {
    const data = c.req.valid("json");

    const character = await db.character.create({
      data: {
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        userId: user.id,
        story: data.story,
        personality: data.personality
      }
    });

    return c.json({
      message: "Character created successfully",
      character
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

characterRouter.get("/bulk", requireAuth, async (c) => {
  try {
    const character = await db.character.findMany();
    if (character.length === 0) {
      return c.json({
        message: "No characters found",
      }, 404);
    }

    return c.json({
      character
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

characterRouter.get("/characters", async (c) => {
  try {
    const characters = await db.character.findMany();
    return c.json({
      characters
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

characterRouter.get("/search", async (c) => {
  try {
    const { q } = c.req.query();
    const characters = await db.character.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { personality: { contains: q, mode: 'insensitive' } },
        ]
      }
    });

    return c.json({
      characters
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

characterRouter.get("/:id", requireAuth, async (c) => {
  try {
    const { id } = c.req.param();
    const character = await db.character.findUnique({
      where: {
        id: id
      }
    });

    if (!character) {
      return c.json({
        message: "Character not found",
      }, 404);
    }

    return c.json({
      character
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

characterRouter.put("/:id", requireAuth, zValidator("json", updateCharacterSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get("user");
    if (!user) throw new Error("User not found");

    const character = await db.character.findUnique({
      where: {
        id: id,
        userId: user.id
      }
    });

    if (!character) {
      return c.json({
        message: "Character not found",
      }, 404);
    }

    const data = c.req.valid("json");

    const updatedCharacter = await db.character.update({
      where: {
        id: id,
        userId: user.id
      },
      data: {
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        story: data.story,
        personality: data.personality
      }
    });

    return c.json({
      message: "Character updated successfully",
      updatedCharacter
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

characterRouter.delete("/:id", requireAuth, async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get("user");
    if (!user) throw new Error("User not found");

    const character = await db.character.findUnique({
      where: {
        id: id,
        userId: user.id
      }
    });

    if (!character) {
      return c.json({
        message: "Character not found",
      }, 404);
    }

    await db.character.delete({
      where: {
        id: id,
        userId: user.id
      }
    });

    return c.json({
      message: "Character deleted successfully",
    }, 200);
  } catch (error) {
    console.log(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

characterRouter.get("/search", async (c) => {
  try {
    const { q } = c.req.query();

    if (!q) {
      return c.json({ characters: [] });
    }

    const characters = await db.character.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { personality: { contains: q, mode: 'insensitive' } },
        ]
      },
      take: 5 // Limit results
    });

    return c.json({ characters });
  } catch (error) {
    console.error(error);
    return c.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

