import { supabase } from "@/lib/supabase";
import { uploadMediaFile } from "@/lib/storage";

export async function uploadEventImage(file, event = {}) {
  return await uploadMediaFile(file, {
    folder: "events",
    name: `${event.title_de || "event"}-${event.id || Date.now()}`,
    previousUrl: event.image_url,
  });
}

export async function createEvent(event) {
  return await supabase.from("events").insert(event).select("*").single();
}

export async function updateEvent(id, event) {
  return await supabase
    .from("events")
    .update(event)
    .eq("id", id)
    .select("*")
    .single();
}
