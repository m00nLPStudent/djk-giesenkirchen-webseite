import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { synchronizeMediaAssignment } from "@/components/admin/media-library/media.service";
import { canChangePublished, isDownloadUuid, isEligibleDownloadAsset, sortDownloads, validateDownloadInput } from "./downloads.core.mjs";
import * as repository from "./downloads.repository";

const failure = (message, errors) => ({ ok:false, error:message, errors:errors || null });
const has = (auth, key) => auth.roles?.some((role)=>role.key==="superadmin") || auth.permissions?.includes(key);

export async function loadDownloadsAdmin() {
  const db=createSupabaseAdminClient(); if(!db) return failure("Download-Service ist nicht konfiguriert.");
  const [downloads,categories]=await Promise.all([repository.listDownloads(db),repository.listDownloadCategories(db)]);
  if(downloads.error || categories.error) return failure("Downloads konnten nicht geladen werden.");
  const data=(downloads.data||[]).map((item)=>({...item,category_sort_order:item.download_categories?.sort_order||0}));
  return {ok:true,downloads:sortDownloads(data),categories:categories.data||[]};
}

export async function saveDownload(input, auth) {
  const validation=validateDownloadInput(input); if(!validation.ok) return failure("Bitte die markierten Felder prüfen.",validation.errors);
  const value=validation.value; const db=createSupabaseAdminClient(); if(!db) return failure("Download-Service ist nicht konfiguriert.");
  const previous=value.id ? await repository.getDownload(db,value.id) : {data:null,error:null};
  if(previous.error || (value.id && !previous.data)) return failure("Download nicht gefunden.");
  if(!has(auth,value.id?"downloads.edit":"downloads.create")) return failure("Berechtigung fehlt.");
  if((!value.id && value.isPublished) || canChangePublished(previous.data,value)) if(!has(auth,"downloads.publish")) return failure("Berechtigung zum Veröffentlichen fehlt.");
  const [category,asset]=await Promise.all([repository.getDownloadCategory(db,value.categoryId),repository.getMediaAsset(db,value.mediaAssetId)]);
  const categoryUnchanged=previous.data?.category_id===value.categoryId;
  if(category.error || !category.data || (!category.data.is_active && !categoryUnchanged)) return failure("Die ausgewählte Kategorie ist nicht aktiv.");
  if(asset.error || !isEligibleDownloadAsset(asset.data)) return failure("Die ausgewählte Datei ist kein geeignetes privates Download-PDF.");
  const payload={category_id:value.categoryId,media_asset_id:value.mediaAssetId,title:value.title,description:value.description,is_published:value.isPublished,sort_order:value.sortOrder,updated_by:auth.profile.id};
  if(!value.id) payload.created_by=auth.profile.id;
  const saved=value.id ? await repository.updateDownload(db,value.id,payload) : await repository.insertDownload(db,payload);
  if(saved.error || !saved.data) return failure("Der Download konnte nicht gespeichert werden.");
  const mediaChanged=!previous.data || previous.data.media_asset_id!==value.mediaAssetId;
  if(mediaChanged){
    const usage=await synchronizeMediaAssignment("download",saved.data.id,value.mediaAssetId,"file");
    if(usage.error){
      if(previous.data) await repository.updateDownload(db,saved.data.id,{category_id:previous.data.category_id,media_asset_id:previous.data.media_asset_id,title:previous.data.title,description:previous.data.description,is_published:previous.data.is_published,sort_order:previous.data.sort_order,updated_by:previous.data.updated_by});
      else await repository.deleteDownload(db,saved.data.id);
      return failure("Die Dateiverwendung konnte nicht gespeichert werden.");
    }
  }
  return {ok:true,data:saved.data};
}

export async function toggleDownloadPublished(id, auth) {
  if(!has(auth,"downloads.publish")) return failure("Berechtigung zum Veröffentlichen fehlt.");
  if(!isDownloadUuid(id)) return failure("Download nicht gefunden.");
  const db=createSupabaseAdminClient(); if(!db) return failure("Download-Service ist nicht konfiguriert.");
  const current=await repository.getDownload(db,id); if(current.error||!current.data) return failure("Download nicht gefunden.");
  const result=await repository.updateDownload(db,id,{is_published:!current.data.is_published,updated_by:auth.profile.id});
  return result.error||!result.data ? failure("Der Status konnte nicht geändert werden.") : {ok:true,data:result.data};
}

export async function removeDownload(id, auth) {
  if(!has(auth,"downloads.delete")) return failure("Berechtigung zum Löschen fehlt.");
  if(!isDownloadUuid(id)) return failure("Download nicht gefunden.");
  const db=createSupabaseAdminClient(); if(!db) return failure("Download-Service ist nicht konfiguriert.");
  const result=await repository.deleteDownload(db,id);
  return result.error||!result.data ? failure("Der Download konnte nicht gelöscht werden.") : {ok:true,data:result.data};
}
