/* Résumé download. The PDF also travels inside the page (filled in by build.py), so the button
   works wherever the page is opened: on the live site, from a saved copy, or in a viewer that
   only lets pages hand over files through its own save prompt. */
(function(){
  var links=document.querySelectorAll('a[data-resume]');
  var B64='__RESUME_PDF_BASE64__';
  if(!links.length||B64.charAt(0)==='_')return;
  var NAME='Pranay-Reddy-Resume.pdf',blob=null,url=null,saver=null;
  function getBlob(){
    if(!blob){var bin=atob(B64),n=bin.length,bytes=new Uint8Array(n);for(var i=0;i<n;i++)bytes[i]=bin.charCodeAt(i);blob=new Blob([bytes],{type:'application/pdf'});}
    return blob;
  }
  /* inside a Claude viewer, files are handed over through its save prompt; elsewhere this is null */
  try{if(window.claude&&typeof window.claude.use==='function')window.claude.use('downloads').then(function(d){saver=d;},function(){});}catch(e){}
  Array.prototype.forEach.call(links,function(a){
    a.addEventListener('click',function(e){
      if(saver){e.preventDefault();saver.save({filename:NAME,data:getBlob()}).catch(function(){});return;}
      if(!url)url=URL.createObjectURL(getBlob());
      a.href=url;/* the browser follows the link after this handler, so it downloads the embedded copy */
    });
  });
})();
