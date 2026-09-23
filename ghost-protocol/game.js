'use strict';

// GHOST//PROTOCOL is a standalone, entirely fictional puzzle game.
// All network names, commands, addresses, and terminal output are simulated locally.
const MISSIONS = [
  {name:'THE HANDSHAKE', brief:'Recover the missing transmission.', sector:'SECTOR 01', nodes:[
    {name:'ENTRY GATEWAY', glyph:'◇', x:13,y:52, security:'NONE', note:'Your entry into the network. Select the next connected node.'},
    {name:'RELAY PROXY', glyph:'⌁', x:49,y:28, security:'LEVEL 01', note:'An exposed relay. Its fragmented handshake contains the next access key.'},
    {name:'DATA VAULT', glyph:'⬡', x:82,y:60, security:'LEVEL 02', note:'The transmission is stored here. Reassemble the key, then extract it.'}
  ]},
  {name:'DEAD FREQUENCY', brief:'Locate and extract the silent broadcast.', sector:'SECTOR 07', nodes:[
    {name:'ENTRY GATEWAY',glyph:'◇',x:12,y:56,security:'NONE',note:'Connected to the outer edge of sector seven.'},
    {name:'SIGNAL ROUTER',glyph:'⌁',x:38,y:27,security:'LEVEL 02',note:'A damaged router is repeating fragments of a lost signal.'},
    {name:'FIREWALL',glyph:'▣',x:64,y:53,security:'LEVEL 03',note:'Rebuild the authentication frame to pass this simulated firewall.'},
    {name:'ARCHIVE',glyph:'⬡',x:86,y:24,security:'LEVEL 04',note:'Access the archive and recover the silent broadcast.'}
  ]},
  {name:'BLACKOUT', brief:'Retrieve the final ghost protocol.', sector:'SECTOR 13', nodes:[
    {name:'ENTRY GATEWAY',glyph:'◇',x:10,y:51,security:'NONE',note:'The last route begins here.'},
    {name:'SHADOW RELAY',glyph:'⌁',x:29,y:27,security:'LEVEL 03',note:'The relay is encrypted with a rolling access key.'},
    {name:'AUTH NODE',glyph:'▣',x:50,y:60,security:'LEVEL 04',note:'Reassemble the scrambled authorization packets.'},
    {name:'CORE LINK',glyph:'✣',x:70,y:30,security:'LEVEL 05',note:'The core link is heavily monitored. Avoid repeated failed keys.'},
    {name:'GHOST VAULT',glyph:'⬡',x:90,y:59,security:'LEVEL 06',note:'The final protocol is stored here. Extract it before detection.'}
  ]}
];
const $=id=>document.getElementById(id);
const symbols='23456789ABCDEF';
let missionIndex=0, mission=null, nodes=[],selected=0,trace=0,finished=false,unlocked=0,logs=0;
let currentKey='';
try{unlocked=Math.max(0,Math.min(2,Number(localStorage.getItem('gp-unlocked'))||0));}catch{}
function choose(arr){return arr[Math.floor(Math.random()*arr.length)]}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr}
function createKey(){return Array.from({length:4},()=>choose(symbols)).join('')}
function dialogOpen(id){const dlg=$(id);if(!dlg.open)dlg.showModal()}
function dialogClose(id){const dlg=$(id);if(dlg.open)dlg.close()}
function log(text,kind='system'){
  const line=document.createElement('div');line.className='log '+kind;
  const stamp=document.createElement('span');stamp.className='stamp';stamp.textContent=`[${String(++logs).padStart(3,'0')}]`;
  line.append(stamp,document.createTextNode(text));$('terminalLog').append(line);
  if($('terminalLog').children.length>80)$('terminalLog').firstChild.remove();
  $('terminalLog').scrollTop=$('terminalLog').scrollHeight;
}
function isReachable(i){return nodes[i].state==='discovered'}
function isVault(i){return i===nodes.length-1}
function initMission(i,showIntro=false){
  if(i>unlocked)return;
  missionIndex=i;mission=MISSIONS[i];selected=0;trace=0;finished=false;logs=0;
  nodes=mission.nodes.map((n,index)=>({...n,state:index===0?'accessed':index===1?'discovered':'unknown',scanned:false,key:index===0?'':createKey()}));
  $('terminalLog').replaceChildren();$('missionName').textContent=`0${i+1} / ${mission.name}`;
  $('missionBrief').textContent=mission.brief;$('chapterLabel').textContent=`// 00${i+1}`;
  $('sectorLabel').textContent=mission.sector;
  log('GHOST//PROTOCOL boot sequence complete.','good');
  log(`OPERATION ${String(i+1).padStart(2,'0')}: ${mission.name}`);
  log('Virtual network detected. No real connections are used.');
  log('Select a discovered node. Type HELP to list commands.','good');
  update();
  dialogClose('endDialog');dialogClose('missionsDialog');dialogClose('puzzleDialog');
  if(showIntro)dialogOpen('infoDialog');
}
function updateTrace(amount){
 if(finished)return;
 trace=Math.max(0,Math.min(100,trace+amount));
 if(trace>=100){finished=true;log('TRACE LOCK ACHIEVED. SESSION TERMINATED.','bad');dialogClose('puzzleDialog');update();showEnd(false);}
 else updateStatus();
}
function updateStatus(){
  const accessed=nodes.filter(n=>n.state==='accessed').length;
  $('progress').textContent=`${String(accessed).padStart(2,'0')} / ${String(nodes.length).padStart(2,'0')}`;
  $('operation').innerHTML=finished?(nodes.every(n=>n.state==='accessed')?'COMPLETED':'TERMINATED'):'ACTIVE <span class="blink">●</span>';
  const threat=trace<35?'LOW':trace<70?'ELEVATED':'CRITICAL';
  $('threatLabel').textContent=threat;$('threatLabel').style.color=trace>=70?'var(--red)':trace>=35?'var(--amber)':'var(--mint)';
  $('traceValue').textContent=trace+'%';$('traceValue').style.color=trace>=70?'var(--red)':trace>=35?'var(--amber)':'var(--mint)';
  $('traceFill').style.width=trace+'%';$('traceFill').style.background=trace>=70?'var(--red)':trace>=35?'var(--amber)':'var(--mint)';
  $('traceTrack').setAttribute('aria-valuenow',String(trace));
  $('netStatus').innerHTML=finished?'<i></i> SESSION ENDED':'<i></i> CONNECTED';
}
function updateMap(){
  const svg=$('linksSvg');svg.replaceChildren();
  nodes.slice(0,-1).forEach((n,i)=>{
    const next=nodes[i+1];const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',`M ${n.x*6} ${n.y*3.7} L ${next.x*6} ${next.y*3.7}`);
    if(n.state==='accessed'&&next.state==='accessed')path.setAttribute('class','active');
    if(next.state==='unknown')path.style.opacity='.25';svg.append(path);
  });
  const layer=$('nodesLayer');layer.replaceChildren();
  nodes.forEach((n,i)=>{
    const b=document.createElement('button');b.type='button';b.className=`node ${n.state}${selected===i?' selected':''}`;
    b.style.left=n.x+'%';b.style.top=n.y+'%';b.setAttribute('aria-pressed',String(selected===i));
    b.setAttribute('aria-label',`${n.state==='unknown'?'Unknown node':n.name}, ${n.state}`);
    const glyph=document.createElement('span');glyph.className='node-glyph';glyph.textContent=n.state==='unknown'?'?':n.glyph;
    const name=document.createElement('span');name.className='node-tag';name.textContent=n.state==='unknown'?'UNKNOWN NODE':n.name;
    const id=document.createElement('span');id.className='node-id';id.textContent=`NODE ${String(i+1).padStart(2,'0')}`;
    b.append(glyph,name,id);b.addEventListener('click',()=>selectNode(i));layer.append(b);
  });
}
function selectNode(i){selected=i;update();if(nodes[i].state==='unknown')log('NODE UNAVAILABLE. Unlock the preceding relay first.','warn');else log(`TARGET SELECTED: ${nodes[i].name}`)}
function updateInspector(){
  const n=nodes[selected],unknown=n.state==='unknown';
  $('nodeBadge').textContent=n.state==='accessed'?'ACCESS GRANTED':unknown?'UNREACHABLE':'ENCRYPTED';
  $('targetGlyph').textContent=unknown?'?':n.glyph;$('targetName').textContent=unknown?'UNKNOWN NODE':n.name;
  $('targetIp').textContent=`NODE ${String(selected+1).padStart(2,'0')} // ${mission.sector}`;
  $('targetStatus').textContent=unknown?'HIDDEN':n.state==='accessed'?'CONNECTED':n.scanned?'SCANNED':'DISCOVERED';
  $('targetSecurity').textContent=unknown?'UNKNOWN':n.security;
  $('targetPackets').textContent=n.state==='accessed'?'DECODED':unknown?'—':n.scanned?'CAPTURED':'ENCRYPTED';
  $('targetNote').textContent=unknown?'Reach and access the preceding node to discover this target.':n.note;
  $('scanBtn').disabled=finished||!isReachable(selected)||n.scanned;
  $('breachBtn').disabled=finished||!isReachable(selected)||!n.scanned;
  $('breachBtn').hidden=isVault(selected)&&n.state==='accessed';
  $('scanBtn').hidden=isVault(selected)&&n.state==='accessed';
  $('extractBtn').hidden=!(isVault(selected)&&n.state==='accessed');
  $('extractBtn').disabled=finished;
}
function update(){updateStatus();updateMap();updateInspector()}
function scan(){if(finished)return;const n=nodes[selected];if(!isReachable(selected)){log('SCAN DENIED. Select a discovered, unaccessed node.','warn');return}
  if(n.scanned){log('PACKETS ALREADY CAPTURED. Press DECODE ACCESS.');return}
  n.scanned=true;log(`SCAN COMPLETE: ${n.name}. Packet fragments captured.`,'good');log('Warning: probe activity increased trace by 6%.','warn');updateTrace(6);update();
}
function breach(){if(finished)return;const n=nodes[selected];if(!isReachable(selected)||!n.scanned){log('DECODE UNAVAILABLE. Scan a discovered node first.','warn');return}
 currentKey=n.key;const packetGrid=$('packetGrid');packetGrid.replaceChildren();
 const packets=Array.from(n.key,(char,i)=>({index:i+1,char,decoy:false}));
 if(missionIndex>0)packets.push({index:0,char:choose(symbols),decoy:true});shuffle(packets);
 packets.forEach(p=>{const div=document.createElement('div');div.className='packet'+(p.decoy?' decoy':'');
   const label=document.createElement('small');label.textContent=p.decoy?'NOISE / IGNORE':`SEQ ${String(p.index).padStart(2,'0')}`;
   const symbol=document.createElement('strong');symbol.textContent=p.char;div.append(label,symbol);packetGrid.append(div);
 });
 $('keyInput').value='';$('puzzleFeedback').textContent='';dialogOpen('puzzleDialog');$('keyInput').focus();
}
function verifyKey(e){e.preventDefault();if(finished)return;const guess=$('keyInput').value.trim().toUpperCase();if(guess.length!==4){$('puzzleFeedback').textContent='Enter all four characters.';return}
 if(guess!==currentKey){$('puzzleFeedback').textContent='INVALID KEY — trace increased by 17%.';log(`AUTHENTICATION FAILED on ${nodes[selected].name}.`,'bad');updateTrace(17);$('keyInput').select();return;}
 const n=nodes[selected];n.state='accessed';if(nodes[selected+1]&&nodes[selected+1].state==='unknown')nodes[selected+1].state='discovered';
 dialogClose('puzzleDialog');log(`ACCESS GRANTED: ${n.name}`,'good');if(isVault(selected))log('VAULT OPEN. Select EXTRACT DATA to complete the operation.','good');else log(`NEW NODE DISCOVERED: ${nodes[selected+1].name}`,'good');update();
}
function extract(){if(finished)return;if(!isVault(selected)||nodes[selected].state!=='accessed'){log('EXTRACTION DENIED: vault access required.','warn');return}finished=true;log('PAYLOAD SECURED. EXTRACTION SUCCESSFUL.','good');
 if(missionIndex<2&&unlocked<missionIndex+1){unlocked=missionIndex+1;try{localStorage.setItem('gp-unlocked',String(unlocked))}catch{}}
 update();showEnd(true);
}
function showEnd(success){$('endGlyph').textContent=success?'◇':'×';$('endGlyph').style.color=success?'var(--mint)':'var(--red)';$('endTitle').textContent=success?'MISSION COMPLETE.':'TRACE DETECTED.';
 $('endText').textContent=success?`${mission.name}: payload recovered. Your route remains secure.`:'Your trace reached 100%. The simulated connection was terminated.';
 $('endTrace').textContent=trace+'%';$('endNodes').textContent=`${nodes.filter(n=>n.state==='accessed').length} / ${nodes.length}`;
 $('nextBtn').textContent=success&&missionIndex<2?'NEXT MISSION ↗':success?'VIEW MISSIONS ↗':'RETRY MISSION ↗';dialogOpen('endDialog')}
function showMissions(){const box=$('missionList');box.replaceChildren();MISSIONS.forEach((m,i)=>{
 const btn=document.createElement('button');btn.type='button';btn.className='mission-option';btn.disabled=i>unlocked;
 const left=document.createElement('div'),name=document.createElement('strong'),info=document.createElement('small'),state=document.createElement('span');name.textContent=`0${i+1} / ${m.name}`;info.textContent=m.brief;state.textContent=i>unlocked?'LOCKED':i===missionIndex?'CURRENT':'PLAY ↗';left.append(name,info);btn.append(left,state);btn.addEventListener('click',()=>initMission(i));box.append(btn)
});dialogOpen('missionsDialog')}
function command(raw){const input=raw.trim(),tokens=input.toLowerCase().split(/\s+/),cmd=tokens[0];if(!input)return;log('ghost@void:~$ '+input,'cmd');
 switch(cmd){
 case 'help':log('COMMANDS: help, status, map, nodes, select [number], scan, decode, extract, missions, clear.','good');break;
 case 'status':log(`OP: ${mission.name} | TRACE: ${trace}% | ACCESS: ${nodes.filter(n=>n.state==='accessed').length}/${nodes.length}`);break;
 case 'map':case 'nodes':nodes.forEach((n,i)=>log(`${String(i+1).padStart(2,'0')} // ${n.state==='unknown'?'UNKNOWN NODE':n.name} [${n.state.toUpperCase()}]`));break;
 case 'select':{const n=Number(tokens[1]);if(Number.isInteger(n)&&n>=1&&n<=nodes.length)selectNode(n-1);else log(`SELECT FAILED. Use a node number between 1 and ${nodes.length}.`,'warn');break}
 case 'scan':scan();break;case 'decode':case 'breach':breach();break;case 'extract':extract();break;case 'missions':showMissions();break;
 case 'clear':$('terminalLog').replaceChildren();break;
 default:log('UNKNOWN COMMAND. Type HELP for available simulated commands.','warn');
 }}
// Controls
$('scanBtn').addEventListener('click',scan);$('breachBtn').addEventListener('click',breach);$('extractBtn').addEventListener('click',extract);
$('puzzleForm').addEventListener('submit',verifyKey);$('closePuzzle').addEventListener('click',()=>dialogClose('puzzleDialog'));
$('terminalForm').addEventListener('submit',e=>{e.preventDefault();const val=$('commandInput').value;$('commandInput').value='';command(val)});
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>command(b.dataset.command)));
$('clearLogBtn').addEventListener('click',()=>{$('terminalLog').replaceChildren();log('CONSOLE CLEARED.');});
$('helpBtn').addEventListener('click',()=>dialogOpen('infoDialog'));$('closeInfo').addEventListener('click',()=>dialogClose('infoDialog'));$('gotIt').addEventListener('click',()=>dialogClose('infoDialog'));
$('missionSelectBtn').addEventListener('click',showMissions);$('closeMissions').addEventListener('click',()=>dialogClose('missionsDialog'));
$('replayBtn').addEventListener('click',()=>initMission(missionIndex));$('nextBtn').addEventListener('click',()=>{if(finished&&trace<100&&missionIndex<2)initMission(missionIndex+1);else if(trace>=100)initMission(missionIndex);else{dialogClose('endDialog');showMissions()}});
initMission(0);
