(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cfg=window.VOIDWORKS_AUTH_CONFIG||{};
const configured=cfg.supabaseUrl&&cfg.publishableKey&& !cfg.publishableKey.includes('PASTE_YOUR');
const client=configured?window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
let pendingEmail='';
let signupMethod='email';
let currentUser=null;

function setMessage(text,type='info'){
  const el=$('message');
  el.textContent=text||'';
  el.className='message'+(text?' show':'')+(type==='error'?' error':'')+(type==='success'?' success':'');
}
function busy(button,on,label){
  if(!button)return;
  if(on){button.dataset.old=button.textContent;button.disabled=true;button.textContent=label||'WORKING…'}
  else{button.disabled=false;if(button.dataset.old)button.textContent=button.dataset.old}
}
function validUsername(v){return /^[A-Za-z0-9_-]{3,24}$/.test(v)}
function strongPassword(v){return v.length>=8&&/[A-Za-z]/.test(v)&&/[0-9]/.test(v)}
function safeError(error,fallback='Something went wrong.'){
  if(!error)return fallback;
  const msg=String(error.message||error).replace(/supabase/ig,'service');
  if(/invalid login credentials/i.test(msg))return 'Incorrect email or password.';
  if(/user already registered/i.test(msg))return 'That email is already registered. Try signing in instead.';
  if(/rate limit|too many/i.test(msg))return 'Too many attempts. Please wait a little and try again.';
  if(/token has expired|otp.*expired/i.test(msg))return 'That code has expired. Request a new one.';
  if(/token.*invalid|invalid.*otp/i.test(msg))return 'That verification code is not valid.';
  return msg||fallback;
}

function applyTheme(){
  const saved=localStorage.getItem('voidworks-theme');
  const light=saved==='light';
  document.body.classList.toggle('light',light);
  document.documentElement.style.colorScheme=light?'light':'dark';
  $('themeBtn').textContent=light?'☾':'☀';
}
function toggleTheme(){
  const light=!document.body.classList.contains('light');
  document.body.classList.toggle('light',light);
  localStorage.setItem('voidworks-theme',light?'light':'dark');
  document.documentElement.style.colorScheme=light?'light':'dark';
  $('themeBtn').textContent=light?'☾':'☀';
}

function showMode(mode){
  const login=mode==='login',signup=mode==='signup';
  $('loginPanel').classList.toggle('active',login);
  $('signupPanel').classList.toggle('active',signup);
  $('accountPanel').classList.remove('active');
  $('loginTab').classList.toggle('active',login);
  $('signupTab').classList.toggle('active',signup);
  $('loginTab').setAttribute('aria-selected',String(login));
  $('signupTab').setAttribute('aria-selected',String(signup));
  $('cardTitle').textContent=login?'Welcome back.':'Create your ID.';
  setMessage('');
}
function showStep(n){
  [1,2,3].forEach(i=>$('signupStep'+i).classList.toggle('active',i===n));
  document.querySelectorAll('.steps span').forEach((s,i)=>s.classList.toggle('on',i<n));
}
function showAccount(user,username=''){
  currentUser=user;
  $('loginPanel').classList.remove('active');
  $('signupPanel').classList.remove('active');
  $('accountPanel').classList.add('active');
  $('loginTab').classList.remove('active');
  $('signupTab').classList.remove('active');
  $('cardTitle').textContent='Signed in.';
  $('welcomeName').textContent=username?`@${username}`:'Your Voidworks ID';
  $('accountEmail').textContent=user?.email||'';
}

async function getProfile(userId){
  const {data,error}=await client.from('profiles').select('username').eq('id',userId).maybeSingle();
  if(error)throw error;
  return data;
}
async function checkAccountStatus(userId){
  const {data,error}=await client.from('account_controls').select('status,suspended_until').eq('user_id',userId).maybeSingle();
  if(error)throw error;
  if(!data)return 'active';
  if(data.status==='banned')return 'banned';
  if(data.status==='suspended'){
    if(data.suspended_until&&new Date(data.suspended_until)<=new Date())return 'active';
    return 'suspended';
  }
  return 'active';
}
async function handleSignedIn(user){
  if(!user)return;
  try{
    const status=await checkAccountStatus(user.id);
    if(status==='banned'||status==='suspended'){
      await client.auth.signOut();
      setMessage(status==='banned'?'This Voidworks account is banned.':'This Voidworks account is currently suspended.','error');
      showMode('login');
      return;
    }
    const profile=await getProfile(user.id);
    if(!profile){
      signupMethod=user.app_metadata?.provider==='google'?'google':'email';
      showMode('signup');
      showStep(3);
      $('accountMethod').textContent=signupMethod==='google'?'GOOGLE VERIFIED':'EMAIL VERIFIED';
      $('passwordLabel').hidden=signupMethod==='google';
      $('signupPassword').required=signupMethod!=='google';
      currentUser=user;
      setMessage('Choose your Voidworks username to finish setting up your account.');
      return;
    }
    showAccount(user,profile.username);
  }catch(e){setMessage(safeError(e),'error')}
}

async function sendOtp(email){
  if(!client)throw Error('Voidworks ID is not connected yet. Add the Supabase publishable key to config.js.');
  const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
  if(error)throw error;
}

async function startGoogle(){
  if(!client){setMessage('Add your Supabase publishable key to config.js first.','error');return}
  const redirectTo=(cfg.siteBase||location.origin+location.pathname.replace(/\/id\/.*/,''))+'/id/';
  const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo}});
  if(error)setMessage(safeError(error),'error');
}

function bind(){
  $('themeBtn').onclick=toggleTheme;
  $('loginTab').onclick=()=>showMode('login');
  $('signupTab').onclick=()=>{showMode('signup');showStep(1)};
  document.querySelectorAll('.show-pass').forEach(b=>b.onclick=()=>{const i=$(b.dataset.for);const reveal=i.type==='password';i.type=reveal?'text':'password';b.textContent=reveal?'HIDE':'SHOW'});
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  $('termsBtn').onclick=()=>$('termsDialog').showModal();
  $('forgotBtn').onclick=()=>$('forgotDialog').showModal();
  $('googleLogin').onclick=startGoogle;
  $('googleSignup').onclick=startGoogle;

  $('loginForm').onsubmit=async e=>{
    e.preventDefault();
    if(!client){setMessage('Add the Supabase publishable key to config.js first.','error');return}
    const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
    const btn=e.submitter;busy(btn,true,'SIGNING IN…');setMessage('');
    try{
      const {data,error}=await client.auth.signInWithPassword({email,password});
      if(error)throw error;
      await handleSignedIn(data.user);
    }catch(err){setMessage(safeError(err),'error')}finally{busy(btn,false)}
  };

  $('emailStartForm').onsubmit=async e=>{
    e.preventDefault();
    const email=$('signupEmail').value.trim().toLowerCase();
    if(!email){setMessage('Enter your email address.','error');return}
    const btn=e.submitter;busy(btn,true,'SENDING CODE…');setMessage('');
    try{
      await sendOtp(email);
      pendingEmail=email;
      signupMethod='email';
      $('verifyEmailLabel').textContent=email;
      showStep(2);
      setMessage('Verification email sent.','success');
    }catch(err){setMessage(safeError(err),'error')}finally{busy(btn,false)}
  };

  $('verifyForm').onsubmit=async e=>{
    e.preventDefault();
    if(!client)return;
    const token=$('verificationCode').value.trim();
    if(!/^\d{6}$/.test(token)){setMessage('Enter the six-digit verification code.','error');return}
    const btn=e.submitter;busy(btn,true,'VERIFYING…');setMessage('');
    try{
      const {data,error}=await client.auth.verifyOtp({email:pendingEmail,token,type:'email'});
      if(error)throw error;
      currentUser=data.user;
      $('accountMethod').textContent='EMAIL VERIFIED';
      $('passwordLabel').hidden=false;
      $('signupPassword').required=true;
      showStep(3);
      setMessage('Email verified. Choose your username and password.','success');
    }catch(err){setMessage(safeError(err),'error')}finally{busy(btn,false)}
  };

  $('resendBtn').onclick=async()=>{
    if(!pendingEmail)return;
    busy($('resendBtn'),true,'SENDING…');
    try{await sendOtp(pendingEmail);setMessage('A new verification email has been sent.','success')}
    catch(err){setMessage(safeError(err),'error')}
    finally{busy($('resendBtn'),false)}
  };

  document.querySelectorAll('[data-back="1"]').forEach(b=>b.onclick=()=>showStep(1));

  $('profileForm').onsubmit=async e=>{
    e.preventDefault();
    if(!client||!currentUser){setMessage('Your verification session is missing. Start signup again.','error');return}
    const username=$('signupUsername').value.trim();
    const password=$('signupPassword').value;
    if(!validUsername(username)){setMessage('Username must be 3–24 characters using letters, numbers, underscores or hyphens.','error');return}
    if(signupMethod!=='google'&&!strongPassword(password)){setMessage('Password must be at least 8 characters and contain a letter and a number.','error');return}
    if(!$('termsCheck').checked){setMessage('You need to accept the Terms of Service to create an account.','error');return}
    const btn=e.submitter;busy(btn,true,'CREATING ID…');setMessage('');
    try{
      if(signupMethod!=='google'){
        const {error:passwordError}=await client.auth.updateUser({password,data:{voidworks_terms_version:'2026-09-24',voidworks_terms_accepted_at:new Date().toISOString()}});
        if(passwordError)throw passwordError;
      }else{
        const {error:metaError}=await client.auth.updateUser({data:{voidworks_terms_version:'2026-09-24',voidworks_terms_accepted_at:new Date().toISOString()}});
        if(metaError)throw metaError;
      }
      const {error:profileError}=await client.from('profiles').insert({id:currentUser.id,username});
      if(profileError){
        if(profileError.code==='23505')throw Error('That username is already taken. Choose another one.');
        throw profileError;
      }
      const {data:{user}}=await client.auth.getUser();
      showAccount(user||currentUser,username);
      setMessage('Voidworks ID created.','success');
    }catch(err){setMessage(safeError(err),'error')}finally{busy(btn,false)}
  };

  $('forgotForm').onsubmit=async e=>{
    e.preventDefault();
    if(!client){setMessage('Add the Supabase publishable key to config.js first.','error');return}
    const email=$('forgotEmail').value.trim();
    const btn=e.submitter;busy(btn,true,'SENDING…');
    try{
      const redirectTo=(cfg.siteBase||location.origin)+'/id/reset-password/';
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});
      if(error)throw error;
      $('forgotDialog').close();
      setMessage('If an account exists for that email, a reset message has been sent.','success');
    }catch(err){setMessage(safeError(err),'error')}finally{busy(btn,false)}
  };

  $('signOutBtn').onclick=async()=>{
    await client?.auth.signOut();
    currentUser=null;showMode('login');setMessage('Signed out.','success');
  };
}

async function init(){
  applyTheme();bind();
  if(!configured){$('statusBadge').textContent='SETUP';$('statusBadge').classList.add('error');setMessage('Almost ready: paste your Supabase publishable key into config.js.');return}
  const {data:{session}}=await client.auth.getSession();
  if(session?.user)await handleSignedIn(session.user);
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_IN'&&session?.user) setTimeout(()=>handleSignedIn(session.user),0);
    if(event==='SIGNED_OUT'){currentUser=null}
  });
}
init();
})();
