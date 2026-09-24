(()=>{
'use strict';
const $=id=>document.getElementById(id),cfg=window.VOIDWORKS_AUTH_CONFIG||{};
const client=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,detectSessionInUrl:true}});
function applyTheme(){const light=localStorage.getItem('voidworks-theme')==='light';document.body.classList.toggle('light',light);$('themeBtn').textContent=light?'☾':'☀'}
function msg(t,bad=false){const e=$('message');e.textContent=t;e.className='message show'+(bad?' error':' success')}
function strong(v){return v.length>=8&&/[A-Za-z]/.test(v)&&/[0-9]/.test(v)}
applyTheme();$('themeBtn').onclick=()=>{const l=!document.body.classList.contains('light');document.body.classList.toggle('light',l);localStorage.setItem('voidworks-theme',l?'light':'dark');$('themeBtn').textContent=l?'☾':'☀'};
document.querySelectorAll('.show-pass').forEach(b=>b.onclick=()=>{const i=$(b.dataset.for),r=i.type==='password';i.type=r?'text':'password';b.textContent=r?'HIDE':'SHOW'});
$('resetForm').onsubmit=async e=>{e.preventDefault();const p=$('newPassword').value,c=$('confirmPassword').value;if(p!==c){msg('Passwords do not match.',true);return}if(!strong(p)){msg('Use at least 8 characters with a letter and a number.',true);return}const btn=e.submitter;btn.disabled=true;btn.textContent='UPDATING…';try{const {error}=await client.auth.updateUser({password:p});if(error)throw error;msg('Password updated. You can now sign in with your new password.');setTimeout(()=>location.href='../',1300)}catch(err){msg(err.message||'Could not update password.',true)}finally{btn.disabled=false;btn.textContent='UPDATE PASSWORD →'}};
client.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')msg('Recovery link accepted. Choose your new password.')});
})();
