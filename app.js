const form = document.getElementById('entryForm');
const msg  = document.getElementById('msg');

/* फोटो को Base64 में बदलना */
function fileToBase64(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload = ()=>res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  msg.textContent = '⏳ भेजा जा रहा है…';

  const fd = new FormData(form);
  const photo = fd.get('photo');

  /* क्लाइंट‑साइड फ़ाइल‑साइज़ चेक (5 MB) */
  if(photo.size > 5*1024*1024){
    msg.textContent = '❌ फ़ाइल 5 MB से बड़ी है।';
    return;
  }

  const safeName = fd.get('name').trim().replace(/\s+/g,'_').toLowerCase();
  const ext = photo.name.split('.').pop();
  const filePath = `photos/${safeName}_${Date.now()}.${ext}`;

  const base64 = await fileToBase64(photo);

  const payload = {
    name:    fd.get('name'),
    email:   fd.get('email'),
    comment: fd.get('comment'),
    photoPath: filePath,
    photoData: base64,
    ts:      new Date().toISOString()
  };

  try{
    const res = await fetch('https://api.github.com/repos/<OWNER>/<REPO>/dispatches',{
      method:'POST',
      headers:{
        'Accept':'application/vnd.github+json',
        'Content-Type':'application/json',
        'Authorization':'Bearer ghp_<PUBLIC_TRIGGER_TOKEN>'
      },
      body:JSON.stringify({
        event_type:'new_form_entry',
        client_payload:payload
      })
    });

    if(!res.ok) throw new Error(await res.text());
    msg.textContent='✅ सेव हो गया! धन्यवाद।';
    form.reset();
  }catch(err){
    console.error(err);
    msg.textContent='❌ त्रुटि! बाद में प्रयास करें।';
  }
});
