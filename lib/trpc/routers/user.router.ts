/**
 * User persona and profile tRPC router.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PERSONA_CONFIGS, PERSONA_IDS, getPersonaConfig, type PersonaId } from "@/lib/personas/config";

const personaSchema = z.enum([
  "CEO",
  "CFO",
  "COO",
  "CISO",
  "LEGAL",
  "CAIO",
  "DATA_OWNER",
  "DEV_LEAD",
  "PLATFORM_ENG",
  "VENDOR_MGR"
]);

export const userRouter = createTRPCRouter({
  getUserPersona: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { persona: true }
    });
    return {
      data: { persona: user?.persona as PersonaId | null },
      meta: {}
    };
  }),

  setUserPersona: protectedProcedure
    .input(z.object({ persona: personaSchema.nullable() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.user.update({
        where: { id: ctx.userId },
        data: { persona: input.persona }
      });
      const config = getPersonaConfig(input.persona);
      return {
        data: {
          persona: input.persona,
          defaultLandingPage: config?.defaultLandingPage ?? "/"
        },
        meta: {}
      };
    }),

  dismissPersonaModal: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.user.update({
      where: { id: ctx.userId },
      data: { personaModalDismissedAt: new Date() }
    });
    return { data: { ok: true }, meta: {} };
  }),

  getPersonaConfig: protectedProcedure
    .input(z.object({ personaId: z.string() }))
    .query(({ input }) => {
      const config = getPersonaConfig(input.personaId);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Unknown persona: ${input.personaId}`
        });
      }
      return { data: config, meta: {} };
    }),

  listPersonas: protectedProcedure.query(() => {
    const configs = PERSONA_IDS.map((id) => PERSONA_CONFIGS[id]);
    return { data: configs, meta: {} };
  })
});
