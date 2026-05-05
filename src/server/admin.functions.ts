import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function checkPassword(pw: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD не задан на сервере");
  if (pw !== expected) throw new Error("Неверный пароль");
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data.password);
    return { ok: true };
  });

export const unlockSector = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; password: string }) => d)
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("sectors")
      .select("password")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Сектор не найден");
    if (row.password !== data.password) throw new Error("Неверный пароль");
    return { ok: true };
  });

export const adminGetSectors = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { data: rows, error } = await supabaseAdmin
      .from("sectors")
      .select("*")
      .order("order_index");
    if (error) throw error;
    return rows ?? [];
  });

export const adminUpdateSector = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      password: string;
      id: string;
      title: string;
      briefing: string;
      mission: string;
      sectorPassword: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin
      .from("sectors")
      .update({
        title: data.title,
        briefing: data.briefing,
        mission: data.mission,
        password: data.sectorPassword,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminUpdateAgent = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; display_name: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin
      .from("agents")
      .update({ display_name: data.display_name })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminUpdateSetting = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; key: string; value: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: data.key, value: data.value });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeletePhoto = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { data: photo } = await supabaseAdmin
      .from("photos")
      .select("file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (photo?.file_path) {
      await supabaseAdmin.storage.from("photos").remove([photo.file_path]);
    }
    await supabaseAdmin.from("comments").delete().eq("photo_id", data.id);
    const { error } = await supabaseAdmin.from("photos").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteTask = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin
      .from("additional_tasks")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminAddTask = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; task_text: string; sector_slug?: string | null }) => d)
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin
      .from("additional_tasks")
      .insert({ task_text: data.task_text, user_name: "ШТАБ", sector_slug: data.sector_slug ?? null });
    if (error) throw error;
    return { ok: true };
  });
