(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const fileInput=$('fileInput'), dropZone=$('dropZone'), uploadButton=$('uploadButton');
  const selectedFile=$('selectedFile'), fileName=$('fileName'), fileSize=$('fileSize'), fileTypeIcon=$('fileTypeIcon'), removeFile=$('removeFile');
  const errorBox=$('uploadError');
  let successBox=$('uploadSuccess');
  if(!successBox){successBox=document.createElement('div');successBox.id='uploadSuccess';successBox.style.cssText='display:none;margin:16px 0;padding:13px 15px;border-radius:10px;background:#eaf8ef;color:#176b36;border:1px solid #bfe7ca;font-weight:600;';(errorBox||uploadButton).parentNode.insertBefore(successBox,errorBox||uploadButton);}
  let progressBox=document.getElementById('uploadProgress');
  if(!progressBox){progressBox=document.createElement('div');progressBox.id='uploadProgress';progressBox.style.cssText='display:none;margin:12px 0;color:#315efb;font-size:13px;font-weight:600;';(errorBox||uploadButton).parentNode.insertBefore(progressBox,errorBox||uploadButton);}
  const msg=(el,text,show=true)=>{if(el){el.textContent=text;el.style.display=show?'block':'none';}};
  const human=n=>{if(!n)return'0 Bytes';const u=['Bytes','KB','MB','GB'];const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),3);return `${(n/1024**i).toFixed(i?2:0)} ${u[i]}`;};
  function showFile(file){if(!file)return; selectedFile&&(selectedFile.style.display='flex'); fileName&&(fileName.textContent=file.name); fileSize&&(fileSize.textContent=human(file.size)); fileTypeIcon&&(fileTypeIcon.textContent=(file.name.split('.').pop()||'FILE').toUpperCase());}
  function clearFile(){if(fileInput)fileInput.value='';if(selectedFile)selectedFile.style.display='none';if(fileName)fileName.textContent='';if(fileSize)fileSize.textContent='';}
  fileInput?.addEventListener('change',()=>{if(fileInput.files?.length)showFile(fileInput.files[0]);});
  dropZone?.addEventListener('click',e=>{if(e.target.closest('.browse-btn')||e.target.closest('#removeFile'))return;fileInput?.click();});
  ['dragenter','dragover'].forEach(ev=>dropZone?.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add('drag-over');}));
  ['dragleave','drop'].forEach(ev=>dropZone?.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove('drag-over');}));
  dropZone?.addEventListener('drop',e=>{const files=e.dataTransfer.files;if(files.length&&fileInput){try{const dt=new DataTransfer();dt.items.add(files[0]);fileInput.files=dt.files;}catch(_){ }showFile(files[0]);}});
  removeFile?.addEventListener('click',clearFile);
  uploadButton?.addEventListener('click',async()=>{
    msg(errorBox,'',false);msg(successBox,'',false);msg(progressBox,'',false);
    const file=fileInput?.files?.[0];
    const session=await requireAuth();
    if(!session)return;
    if(!file){msg(errorBox,'Please select a document first.');return;}
    if(file.size>100*1024*1024){msg(errorBox,'File is too large. Maximum size is 100 MB.');return;}
    const fields={name:$('documentName')?.value.trim()||'',category:$('category')?.value||'other',description:$('description')?.value.trim()||'',tags:$('tags')?.value.trim()||'',favorite:$('favorite')?.checked};
    const old=uploadButton.innerHTML;uploadButton.disabled=true;uploadButton.innerHTML='Uploading...';
    try{
      const d=await DocuFirebase.uploadDocument(file,fields,p=>msg(progressBox,`Uploading ${Math.round(p)}%`));
      $('documentName')&&($('documentName').value=''); $('category')&&($('category').value=''); $('description')&&($('description').value=''); $('tags')&&($('tags').value=''); $('favorite')&&($('favorite').checked=false); clearFile(); msg(progressBox,'');
      msg(successBox,'✓ Document uploaded successfully!');
      setTimeout(()=>location.href='dashboard.html?upload=success',900);
    }catch(e){console.error(e);msg(errorBox,e.message||'Document upload failed.');}
    finally{uploadButton.disabled=false;uploadButton.innerHTML=old;}
  });
})();
