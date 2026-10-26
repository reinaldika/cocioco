import {useState,type ChangeEvent} from 'react';
import {FilePlus} from 'lucide-react';
import {uploadToBucket,command,readableError} from '../lib/backend';
import {useStore} from '../store';
import {useToast} from './Toast';
export default function AdminTaskAsset({id}:{id:string}){
 const [busy,setBusy]=useState(false);const {refresh}=useStore();const toast=useToast();
 async function upload(e:ChangeEvent<HTMLInputElement>){const f=e.target.files?.[0];if(!f)return;setBusy(true);
  try{const path=await uploadToBucket('cocioco-task-assets',id,f,20971520);
    await command('attachTaskAsset',{id,path,name:f.name});await refresh?.();toast('Private brief asset uploaded and attached.');}
  catch(error){toast(readableError(error),true);}finally{setBusy(false);e.target.value='';}}
 return <label className="cx-btn-outline cx-asset-attach" title="Add private brief asset"><FilePlus size={16}/>{busy?'Uploading...':'Add asset'}<input hidden type="file" disabled={busy} onChange={upload}/></label>;
}
