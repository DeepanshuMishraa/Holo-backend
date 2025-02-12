import { Hono } from "hono";
import { getUser } from "../lib/auth";
import { createCharecterSchema, updateCharacterSchema } from "../types/types";
import { zValidator } from '@hono/zod-validator'
import { db } from "../lib/db";


export const characterRouter = new Hono();

characterRouter.post("/create", getUser, zValidator("json", createCharecterSchema), async (c) => {
  const user = c.var.user;

  if (!user) {
    return c.json({
      message: "Unauthorized",
    }, 401);
  }

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
})


characterRouter.get("/bulk", getUser, async (c) => {
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
})


characterRouter.get("/", getUser, async (c) => {
  const user = c.var.user;

  try {
    const character = await db.character.findFirst({
      where: {
        userId: user.id
      }
    });

    if (!character) {
      return c.json({
        message: "No character found",
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
})



characterRouter.get("/:id", getUser, async (c) => {
  try {
    const { id } = c.req.param();
    const character = await db.character.findUnique({
      where: {
        id: id
      }
    })

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
})


characterRouter.put("/:id", getUser, zValidator("json", updateCharacterSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.var.user;

    const character = await db.character.findUnique({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!character) {
      return c.json({
        message: "Charecter not found",
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
    })

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
})


characterRouter.delete("/:id", getUser, async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.var.user;

    const character = await db.character.findUnique({
      where: {
        id: id,
        userId: user.id
      }
    })

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
    })

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
})

