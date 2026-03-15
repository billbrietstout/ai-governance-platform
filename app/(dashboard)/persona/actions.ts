"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";
import type { PersonaId } from "@/lib/personas/config";

export async function setUserPersona(persona: PersonaId | null) {
  const caller = await createServerCaller();
  return caller.user.setUserPersona({ persona });
}

export async function dismissPersonaModal() {
  const caller = await createServerCaller();
  return caller.user.dismissPersonaModal();
}
