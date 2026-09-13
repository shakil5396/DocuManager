let docs=[];
const params=new URLSearchParams(location.search);
let wanted=params.get('type')||'all';
function typ(d){const x=(d.file_type||'').toLowerCase();if(['jpg','jpeg','png','gif','webp'].includes(x))return'image';if(x==='pdf')return'pdf';if(['xls','xlsx'].includes(x))return'excel';if(['doc','docx'].includes(x))return'word';if(x==='csv')return'csv';return'other'}
function sz(n){if(!n)return'0 Bytes';const u=['Bytes','KB','MB','GB'],i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),3);return`${+(n/1024**i).toFixed(2)} ${u[i]}`}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(){
  let a=docs;
  if(wanted==='favorites') a=a.filter(d=>d.is_favorite&&!d.is_deleted);
  else if(wanted==='trash') a=a.filter(d=>d.is_deleted);
  else a=a.filter(d=>!d.is_deleted&&(wanted==='all'||typ(d)===wanted));
  const q=(document.getElementById('documentSearch')?.value||'').toLowerCase();
  const t=document.getElementById('typeFilter')?.value||'all';
  const c=document.getElementById('categoryFilter')?.value||'all';
  const s=document.getElementById('sortSelect')?.value||'newest';
  a=a.filter(d=>(!q||(d.original_name||d.name).toLowerCase().includes(q))&&(t==='all'||typ(d)===t)&&(c==='all'||(d.category||'other')===c));
  a.sort((x,y)=>s==='name'?String(x.original_name).localeCompare(String(y.original_name)):s==='size'?y.file_size-x.file_size:s==='oldest'?new Date(x.created_at)-new Date(y.created_at):new Date(y.created_at)-new Date(x.created_at));
  const el=document.getElementById('documentList');
  el.innerHTML=a.length?a.map(d=>{
    const type=typ(d);
    const actions=wanted==='trash'
      ? `<button onclick="restoreDocument('${d.id}')">↩</button><button onclick="permanentDelete('${d.id}')">🗑</button>`
      : `<button onclick="viewDocument('${d.id}')">👁</button><button onclick="downloadDocument('${d.id}')">↓</button><button onclick="deleteDocument('${d.id}')">🗑</button>`;
    return `<div class="document-table-row"><div class="table-file"><div class="file-icon ${type}-icon">${type.toUpperCase()}</div><div class="table-file-info"><strong>${esc(d.original_name||d.name)}</strong><span>${type.toUpperCase()}</span></div></div><div class="table-category"><span class="category-badge">${esc(d.category||'Other')}</span></div><div class="table-size">${sz(d.file_size)}</div><div class="table-date">${new Date(d.created_at).toLocaleDateString()}</div><div class="table-action">${actions}</div></div>`;
  }).join(''):`<div class="empty-state"><h3>${docs.length?'No matching documents':'No documents yet'}</h3><p>${docs.length?'Change your filters.':'Upload a document to get started.'}</p></div>`;
}
function viewDocument(id){location.href=`view.html?id=${encodeURIComponent(id)}`}
async function downloadDocument(id){try{const url=await DocuFirebase.getDownloadUrl(id);window.open(url,'_blank','noopener');}catch(e){alert(e.message)}}
async function deleteDocument(id){if(!confirm('Move this document to Trash?'))return;try{await DocuFirebase.moveToTrash(id);await load()}catch(e){alert(e.message)}}
async function restoreDocument(id){try{await DocuFirebase.restoreDocument(id);await load()}catch(e){alert(e.message)}}
async function permanentDelete(id){if(!confirm('Permanently delete this document and its stored file? This cannot be undone.'))return;try{await DocuFirebase.permanentlyDelete(id);await load()}catch(e){alert(e.message)}}
async function load(){const session=await requireAuth();if(!session)return;const profile=session.profile;document.getElementById('userName').textContent=profile.name||session.user.email;document.getElementById('userRole').textContent=profile.role||'User';document.getElementById('userAvatar').textContent=(profile.name||'U')[0].toUpperCase();docs=await DocuFirebase.getDocuments();render()}
document.getElementById('logoutLink')?.addEventListener('click',e=>{e.preventDefault();logout()});
['documentSearch','globalSearch'].forEach(id=>document.getElementById(id)?.addEventListener('input',e=>{if(id==='globalSearch'&&document.getElementById('documentSearch'))document.getElementById('documentSearch').value=e.target.value;render()}));
['typeFilter','categoryFilter','sortSelect'].forEach(id=>document.getElementById(id)?.addEventListener('change',render));
document.getElementById('mobileMenu')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('mobile-open'));
load().catch(e=>{console.error(e);alert(e.message||'Failed to load documents.');});
