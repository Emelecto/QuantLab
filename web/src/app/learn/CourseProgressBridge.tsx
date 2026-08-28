"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ProgressState } from "@/lib/types";

// Puente de progreso del curso entre el iframe (Ruta Aprendiz) y Supabase.
// El iframe no tiene la sesión; nosotros sí (mismo origen). Escuchamos sus
// mensajes postMessage, leemos/escribimos course_progress con RLS (auth.uid())
// y devolvemos el estado para que el curso refleje el progreso guardado.
//
// Si el usuario NO está logueado, simplemente no respondemos: el iframe usa su
// copia local en localStorage. Así el curso funciona también para visitantes.

type HostMsg =
  | { source: "ruta-aprendiz"; type: "load" }
  | { source: "ruta-aprendiz"; type: "save"; payload: ProgressState };

export function CourseProgressBridge() {
  useEffect(() => {
    function postState(state: ProgressState | null) {
      const frame = document.querySelector<HTMLIFrameElement>(
        'iframe[title="Ruta Aprendiz — QuantLab"]',
      );
      frame?.contentWindow?.postMessage({ source: "quantlab-host", type: "state", payload: state }, "*");
    }

    async function handleLoad() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return; // visitante: el iframe usa localStorage
      const { data } = await supabase
        .from("course_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        postState({
          completedModules: data.completed_modules ?? [],
          xp: data.xp ?? 0,
          streakDays: data.streak ?? 0,
          lastActiveDate: data.last_active_date ?? "",
          badgeEarned: data.badge_earned ?? false,
          favoriteDatasetId: data.favorite_dataset_id ?? null,
          savedStrategy: data.saved_strategy ?? null,
          tournamentsEntered: data.entered_tournament_id ? [data.entered_tournament_id] : [],
        });
      }
    }

    async function handleSave(payload: ProgressState) {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return; // visitante: el iframe ya guardó en localStorage
      const { error } = await supabase.from("course_progress").upsert(
        {
          user_id: user.id,
          completed_modules: payload.completedModules,
          xp: payload.xp,
          streak: payload.streakDays,
          last_active_date: payload.lastActiveDate || null,
          favorite_dataset_id: payload.favoriteDatasetId,
          saved_strategy: payload.savedStrategy,
          entered_tournament_id: payload.tournamentsEntered?.[0] ?? null,
          badge_earned: payload.badgeEarned,
        },
        { onConflict: "user_id" },
      );
      if (error) {
        // No tumbamos la UI del curso: el localStorage del iframe ya tiene el valor.
        console.warn("course_progress upsert falló:", error.message);
      }
    }

    function onMessage(e: MessageEvent<HostMsg>) {
      const msg = e.data;
      if (!msg || msg.source !== "ruta-aprendiz") return;
      if (msg.type === "load") void handleLoad();
      else if (msg.type === "save") void handleSave(msg.payload);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
