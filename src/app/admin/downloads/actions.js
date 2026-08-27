"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadMediaLibrary, loadMediaAssetForPicker, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { classifyDownloadPickerAsset, isEligibleDownloadAsset } from "@/components/admin/downloads/downloads.core.mjs";
import { removeDownload, saveDownload, toggleDownloadPublished } from "@/components/admin/downloads/downloads.service";

const denied=(auth)=>({ok:false,error:auth.message||"Berechtigung fehlt."});
async function authorize(permission){const auth=await assertAdminActionPermission({requiredPermission:permission}); return auth.ok?auth:null;}
const refresh=()=>revalidatePath("/admin/downloads");

export async function saveDownloadAction(input){const auth=await authorize(input?.id?"downloads.edit":"downloads.create"); if(!auth)return denied({}); const result=await saveDownload(input,auth); if(result.ok)refresh(); return result;}
export async function toggleDownloadPublishedAction(id){const auth=await authorize("downloads.publish"); if(!auth)return denied({}); const result=await toggleDownloadPublished(id,auth); if(result.ok)refresh(); return result;}
export async function deleteDownloadAction(id){const auth=await authorize("downloads.delete"); if(!auth)return denied({}); const result=await removeDownload(id,auth); if(result.ok)refresh(); return result;}

export async function loadDownloadMediaPickerAction(filters={}){
  const auth=await authorize("downloads.create")||await authorize("downloads.edit"); if(!auth)return {ok:false,error:"Berechtigung fehlt.",items:[],total:0};
  const result=await loadMediaLibrary({...filters,kind:"document",mimeType:"application/pdf",archived:"active"});
  if(result.error)return {ok:false,error:"Medien konnten nicht geladen werden.",items:[],total:0};
  const items=(result.data||[]).map((item)=>{const classification=classifyDownloadPickerAsset(item);return {...item,selectable:classification.selectable,selectionHint:classification.reason,usageCount:classification.usageCount};}); return {ok:true,items,total:result.count||0};
}

export async function uploadDownloadMediaAction(formData){
  const createAuth=await authorize("downloads.create"); const editAuth=createAuth||await authorize("downloads.edit"); if(!editAuth)return {ok:false,error:"Berechtigung fehlt."};
  const file=formData.get("file"); if(!file||file.type!=="application/pdf")return {ok:false,error:"Nur PDF-Dateien sind zulässig."};
  const result=await uploadMediaAsset(file,{displayName:formData.get("displayName"),description:"",visibility:"admin",purpose:"download"},editAuth.profile.id);
  if(result.error)return {ok:false,error:result.stage==="validation"?result.error.message:"Die PDF-Datei konnte nicht hochgeladen werden."};
  const resolved=await loadMediaAssetForPicker(result.data.id); if(resolved.error||!isEligibleDownloadAsset(resolved.data))return {ok:false,error:"Das hochgeladene PDF konnte nicht geladen werden."};
  return {ok:true,item:resolved.data};
}
