const params = new URLSearchParams(location.search);
const documentId = params.get('id');
const documentName = document.getElementById('documentName');
const documentType = document.getElementById('documentType');
const documentSize = document.getElementById('documentSize');
const documentPreview = document.getElementById('documentPreview');
const backButton = document.getElementById('backButton');
const printButton = document.getElementById('printButton');
const downloadButton = document.getElementById('downloadButton');
const deleteButton = document.getElementById('deleteButton');
const favoriteButton = document.getElementById('favoriteButton');

function size(n){if(!n)return'0 Bytes';const u=['Bytes','KB','MB','GB'];const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),3);return `${+(n/1024**i).toFixed(2)} ${u[i]}`;}
function typeOf(d){const e=(d.file_type||'').toLowerCase();if(['jpg','jpeg','png','gif','webp'].includes(e))return'Image';if(e==='pdf')return'PDF';if(['doc','docx'].includes(e))return'Word Document';if(['xls','xlsx'].includes(e))return'Excel Spreadsheet';if(e==='csv')return'CSV File';if(e==='txt')return'Text File';return'Document';}
function ext(name){return String(name||'').split('.').pop().toLowerCase();}
function error(message){if(documentPreview)documentPreview.innerHTML=`<div class="document-error"><div class="document-error-icon">⚠</div><h3>Unable to open document</h3><p>${escapeHtml(message)}</p><button type="button" onclick="history.back()">Go Back</button></div>`;}
function escapeHtml(text){const d=document.createElement('div');d.textContent=text||'';return d.innerHTML;}
async function renderPreview(doc){
  if(!documentPreview)return;
  const e=ext(doc.original_name);
  try{
    const url=await DocuFirebase.getDownloadUrl(doc.id);
    documentPreview.innerHTML='';
    if(['jpg','jpeg','png','gif','webp'].includes(e)){
      const img=document.createElement('img');img.className='document-image-preview';img.alt=doc.original_name;img.src=url;img.onerror=()=>error('The image could not be loaded.');documentPreview.appendChild(img);return;
    }
    if(e==='pdf'){
      const frame=document.createElement('iframe');frame.className='document-pdf-preview';frame.title=doc.original_name;frame.src=url;documentPreview.appendChild(frame);return;
    }
    documentPreview.innerHTML=`<div class="document-placeholder"><div class="document-placeholder-icon">${e.toUpperCase()}</div><h3>${escapeHtml(typeOf(doc))}</h3><p>${escapeHtml(doc.original_name)}</p><span>This file type cannot be previewed in the browser. Use Download to open it.</span></div>`;
  }catch(e){error(e.message||'Unable to load the file.');}
}
function setDetails(doc){
  const map={infoFileName:doc.original_name||doc.name,infoFileType:typeOf(doc),infoFileSize:size(doc.file_size),detailDocumentName:doc.original_name||doc.name,detailDocumentType:typeOf(doc),detailDocumentSize:size(doc.file_size),detailCategory:doc.category||'Other',detailDescription:doc.description||'No description available.'};
  Object.entries(map).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value;});
  const tags=document.getElementById('detailTags');
  if(tags){tags.innerHTML='';const list=String(doc.tags||'').split(',').map(x=>x.trim()).filter(Boolean);(list.length?list:['No tags']).forEach(tag=>{const span=document.createElement('span');span.className='document-tag';span.textContent=tag;tags.appendChild(span);});}
}
async function load(){
  if(!documentId){error('No document was selected.');return;}
  const session=await requireAuth();if(!session)return;
  try{
    const doc=await DocuFirebase.getDocument(documentId);
    if(doc.is_deleted){error('This document is in Trash. Restore it from the Trash page first.');return;}
    if(documentName)documentName.textContent=doc.original_name||doc.name;
    if(documentType)documentType.textContent=typeOf(doc);
    if(documentSize)documentSize.textContent=size(doc.file_size);
    if(favoriteButton){favoriteButton.textContent=doc.is_favorite?'★':'☆';favoriteButton.classList.toggle('active',!!doc.is_favorite);favoriteButton.title=doc.is_favorite?'Remove from favorites':'Add to favorites';favoriteButton.onclick=toggleFavorite;}
    setDetails(doc); await renderPreview(doc);
    if(downloadButton)downloadButton.onclick=download;
    if(deleteButton)deleteButton.onclick=remove;
    if(printButton)printButton.onclick=()=>window.print();
    if(backButton)backButton.onclick=()=>history.back();
  }catch(e){console.error(e);error(e.message||'Failed to load document.');}
}
async function download(){try{const url=await DocuFirebase.getDownloadUrl(documentId);const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.download='';document.body.appendChild(a);a.click();a.remove();}catch(e){alert(e.message);}}
async function remove(){if(!confirm('Move this document to Trash?'))return;try{await DocuFirebase.moveToTrash(documentId);location.href='dashboard.html';}catch(e){alert(e.message);}}
async function toggleFavorite(){try{const isFavorite=await DocuFirebase.toggleFavorite(documentId);favoriteButton.textContent=isFavorite?'★':'☆';favoriteButton.classList.toggle('active',isFavorite);}catch(e){alert(e.message);}}
load();
