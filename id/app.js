(()=>{
'use strict';
const $=id=>document.getElementById(id);
const body=document.body;
const THEME_KEY='voidworks-theme';
let signupMethod='email';
let signupStep=1;
let signupEmail='';

function setTheme(theme){
  const light=theme==='light';
  body.classList.toggle('light',light);
  $('themeBtn').textContent=light?'☀':'◐';
  document.querySelector('meta[name="theme-color"]').setAttribute('content',light?'#eef1f5':'#08090d');
  localStorage.setItem(THEME_KEY,light?'light':'dark');
}
function initTheme(){
  const saved=localStorage.getItem(THEME_KEY);
  setTheme(saved||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));
}
function message(text,type='good'){
  const el=$('message'); el.textContent=text; el.className='message show '+type;
}
function clearMessage(){$('message').className='message';$('message').textContent=''}
function switchMode(mode){
  const login=mode==='login';
  $('loginTab').classList.toggle('active',login); $('signupTab').classList.toggle('active',!login);
  $('loginTab').setAttribute('aria-selected',String(login)); $('signupTab').setAttribute('aria-selected',String(!login));
  $('loginPanel').classList.toggle('active',login); $('signupPanel').classList.toggle('active',!login);
  $('cardTitle').textContent=login?'Welcome back.':'Create your ID.'; clearMessage();
}
function setSignupStep(step){
  signupStep=step;
  [1,2,3].forEach(n=>$('signupStep'+n).classList.toggle('active',n===step));
  document.querySelectorAll('.steps span').forEach((s,i)=>s.classList.toggle('on',i+1<=step));
  clearMessage();
}
function validUsername(v){return /^[A-Za-z0-9_-]{3,24}$/.test(v)}
function simulateMicrosoft(kind){
  signupMethod='microsoft';
  if(kind==='signup'){
    $('passwordLabel').hidden=true; $('signupPassword').required=false; $('accountMethod').textContent='MICROSOFT VERIFIED'; setSignupStep(3);
    message('Microsoft connection is ready in the interface. We will connect the real OAuth backend next.','good');
  }else message('Microsoft sign-in will become live when we connect Supabase + Microsoft Entra.','good');
}
function showPass(btn){const input=$(btn.dataset.for);const show=input.type==='password';input.type=show?'text':'password';btn.textContent=show?'HIDE':'SHOW'}

$('themeBtn').addEventListener('click',()=>setTheme(body.classList.contains('light')?'dark':'light'));
$('loginTab').addEventListener('click',()=>switchMode('login'));
$('signupTab').addEventListener('click',()=>switchMode('signup'));
document.querySelectorAll('.show-pass').forEach(b=>b.addEventListener('click',()=>showPass(b)));
$('microsoftLogin').addEventListener('click',()=>simulateMicrosoft('login'));
$('microsoftSignup').addEventListener('click',()=>simulateMicrosoft('signup'));

$('loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  const ident=$('loginIdentity').value.trim(),pass=$('loginPassword').value;
  if(!ident||!pass){message('Enter your email or username and your password.','bad');return}
  message('Frontend check passed. Real account authentication is the next backend step.','good');
});
$('emailStartForm').addEventListener('submit',e=>{
  e.preventDefault(); const email=$('signupEmail').value.trim();
  if(!$('signupEmail').checkValidity()){message('Enter a valid email address.','bad');return}
  signupMethod='email'; signupEmail=email; $('verifyEmailLabel').textContent=email;
  $('passwordLabel').hidden=false; $('signupPassword').required=true; $('accountMethod').textContent='EMAIL VERIFIED'; setSignupStep(2);
  message('Preview mode: use any 6 digits. Real email delivery will be connected next.','good');
});
$('verifyForm').addEventListener('submit',e=>{
  e.preventDefault(); const code=$('verificationCode').value.trim();
  if(!/^\d{6}$/.test(code)){message('Enter the six-digit verification code.','bad');return}
  setSignupStep(3); message('Email verification flow passed in preview mode.','good');
});
$('profileForm').addEventListener('submit',e=>{
  e.preventDefault(); const username=$('signupUsername').value.trim();
  if(!validUsername(username)){message('Username must be 3–24 characters using letters, numbers, underscores or hyphens.','bad');return}
  if(signupMethod==='email'&&$('signupPassword').value.length<10){message('Use a Voidworks password with at least 10 characters.','bad');return}
  if(!$('termsCheck').checked){message('You need to accept the Terms and sensitive-information warning.','bad');return}
  message(`Preview account flow complete for @${username}. Nothing has been uploaded or stored remotely.`, 'good');
});
$('resendBtn').addEventListener('click',()=>message(`Preview resend requested for ${signupEmail||'your email'}.`,'good'));
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>setSignupStep(Number(b.dataset.back))));

$('forgotBtn').addEventListener('click',()=>{ $('forgotEmail').value=$('loginIdentity').value.includes('@')?$('loginIdentity').value:''; $('forgotDialog').showModal() });
$('forgotForm').addEventListener('submit',e=>{e.preventDefault(); if(!$('forgotEmail').checkValidity())return; $('forgotDialog').close(); message('Preview only: when Supabase is connected, a secure reset email will be sent.','good')});
$('termsBtn').addEventListener('click',()=>$('termsDialog').showModal());
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
[...document.querySelectorAll('dialog')].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));

initTheme(); switchMode('login'); setSignupStep(1);
})();
