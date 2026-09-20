
const $ = id => document.getElementById(id);
const editor = $("editor");
const consoleEl = $("console");
const canvas = $("turtleCanvas");
const ctx = canvas.getContext("2d");

const DEFAULT_CODE = `# Welcome to Voidworks Python

name = "Voidworks"
print(f"Hello from {name}!")

for i in range(1, 6):
    print(i * i)
`;

const EXAMPLES = {
  basic: DEFAULT_CODE,
  sleep: `import time
import random

print("Rolling five numbers...")

for i in range(5):
    number = random.randint(1, 100)
    print(f"{i + 1}: {number}", flush=True)
    time.sleep(1)

print("Done.")
`,
  turtle: `import turtle

t = turtle.Turtle()
t.speed(0)
t.pensize(3)

colors = ["#111827", "#7c3aed", "#0891b2", "#059669"]

for i in range(72):
    t.pencolor(colors[i % len(colors)])
    t.forward(i * 2)
    t.right(91)

t.hideturtle()
turtle.done()
`
};

let worker = null;
let ready = false;
let running = false;
let saveTimer = null;
let installedPackages = [];
let turtleCommands = [];
let cursorState = {x:0,y:0,heading:0,visible:false};

function makeWorker(){
  if(worker) worker.terminate();
  ready = false;
  running = false;
  setRuntime("loading", "Starting Python…");
  $("runBtn").disabled = true;
  $("stopBtn").disabled = true;

  worker = new Worker("python-worker.js");
  worker.onmessage = onWorkerMessage;
  worker.onerror = (e) => {
    setRuntime("error", "Runtime error");
    appendConsole(`Runtime error: ${e.message}\n`, "error");
  };
}

function onWorkerMessage(e){
  const m = e.data || {};
  if(typeof e.data === "string" && e.data.startsWith("__VW_TURTLE__")){
    try { handleTurtle(JSON.parse(e.data.slice(13))); } catch {}
    return;
  }

  switch(m.type){
    case "bootStatus":
      setRuntime("loading", m.message || "Starting Python…");
      break;
    case "ready":
      ready = true;
      setRuntime("ready", "Python ready");
      $("runBtn").disabled = false;
      appendConsole("Python runtime ready.\n", "system", true);
      break;
    case "bootError":
      setRuntime("error", "Python runtime unavailable");
      consoleEl.innerHTML = "";
      appendConsole(
        "Python runtime could not start.\n\n" +
        m.message +
        "\n\nTry refreshing once. If it still fails, the browser or network may be blocking the CDN.",
        "error"
      );
      break;
    case "stdout": appendConsole(m.text); break;
    case "stderr": appendConsole(m.text, "error"); break;
    case "result": appendConsole(m.text + "\n", "success"); break;
    case "pythonError": appendConsole(cleanTraceback(m.message) + "\n", "error"); break;
    case "runStart":
      running = true;
      $("runBtn").disabled = true;
      $("stopBtn").disabled = false;
      setRuntime("ready", "Running…");
      break;
    case "runDone":
      running = false;
      $("runBtn").disabled = !ready;
      $("stopBtn").disabled = true;
      setRuntime("ready", "Python ready");
      break;
    case "packageStatus":
      handlePackageStatus(m);
      break;
  }
}

function setRuntime(state, text){
  const dot = $("runtimeDot");
  dot.className = "runtime-dot" + (state === "loading" ? " loading" : state === "error" ? " error" : "");
  $("runtimeText").textContent = text;
}

function appendConsole(text, type="", replacePlaceholder=false){
  if(replacePlaceholder && consoleEl.querySelector(".muted")) consoleEl.innerHTML = "";
  else if(consoleEl.querySelector(".muted")) consoleEl.innerHTML = "";
  const span = document.createElement("span");
  if(type) span.className = type;
  span.textContent = text;
  consoleEl.appendChild(span);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function cleanTraceback(text){
  return String(text)
    .replace(/^PythonError:\s*/,"")
    .replace(/File "<exec>",/g,'File "main.py",');
}

function updateLines(){
  const lines = editor.value.split("\n").length;
  $("lineNumbers").textContent = Array.from({length:lines},(_,i)=>i+1).join("\n");
  syncLineScroll();
}

function syncLineScroll(){
  $("lineNumbers").scrollTop = editor.scrollTop;
}

function updateCursor(){
  const pos = editor.selectionStart;
  const before = editor.value.slice(0,pos);
  const line = before.split("\n").length;
  const col = pos - before.lastIndexOf("\n");
  $("cursorInfo").textContent = `Ln ${line}, Col ${col}`;
}

function scheduleSave(){
  $("saveState").textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    localStorage.setItem("voidworks-python-code", editor.value);
    localStorage.setItem("voidworks-python-file", $("fileName").value || "main.py");
    $("saveState").textContent = "Saved";
  },350);
}

editor.addEventListener("input",()=>{updateLines();updateCursor();scheduleSave()});
editor.addEventListener("scroll",syncLineScroll);
editor.addEventListener("click",updateCursor);
editor.addEventListener("keyup",updateCursor);
$("fileName").addEventListener("input",scheduleSave);

editor.addEventListener("keydown",e=>{
  if(e.key === "Tab"){
    e.preventDefault();
    insertText("    ");
  }
  if((e.ctrlKey || e.metaKey) && e.key === "Enter"){
    e.preventDefault(); runCode();
  }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s"){
    e.preventDefault(); downloadCode();
  }
});

document.querySelectorAll(".mobile-codebar button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    if(btn.dataset.pair){
      const pair=btn.dataset.pair;
      const start=editor.selectionStart,end=editor.selectionEnd;
      const selected=editor.value.slice(start,end);
      editor.setRangeText(pair[0]+selected+pair[1],start,end,"end");
      editor.selectionStart=editor.selectionEnd=start+1+selected.length;
      editor.focus(); editor.dispatchEvent(new Event("input"));
    }else insertText(btn.dataset.insert || "");
  });
});

function insertText(text){
  const start=editor.selectionStart,end=editor.selectionEnd;
  editor.setRangeText(text,start,end,"end");
  editor.focus();
  editor.dispatchEvent(new Event("input"));
}

function runCode(){
  if(!ready || running) return;
  consoleEl.innerHTML = "";
  clearTurtle();
  turtleCommands = [];
  $("turtleEmpty").style.display = "";
  worker.postMessage({type:"run",code:editor.value,stdin:$("stdin").value});
}

function stopCode(){
  if(!running) return;
  appendConsole("\n[Execution stopped]\n","error");
  makeWorker();
}

$("runBtn").onclick=runCode;
$("stopBtn").onclick=stopCode;
$("clearBtn").onclick=()=>consoleEl.innerHTML='<span class="muted">Output cleared.</span>';
$("clearTurtleBtn").onclick=clearTurtle;
$("inputBtn").onclick=()=>{$("stdinBox").hidden=!$("stdinBox").hidden};

function downloadCode(){
  let name=$("fileName").value.trim() || "main.py";
  if(!name.toLowerCase().endsWith(".py")) name += ".py";
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([editor.value],{type:"text/x-python"}));
  a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
$("downloadBtn").onclick=downloadCode;

$("newBtn").onclick=()=>{
  if(confirm("Start a new file? Your current code is already saved locally.")){
    editor.value="";
    $("fileName").value="main.py";
    updateLines();scheduleSave();editor.focus();
  }
};

$("openBtn").onclick=()=>$("filePicker").click();
$("filePicker").addEventListener("change",async e=>{
  const f=e.target.files[0]; if(!f)return;
  editor.value=await f.text(); $("fileName").value=f.name;
  updateLines();scheduleSave();
  e.target.value="";
});

function showModal(id){$(id).hidden=false}
function hideModal(id){$(id).hidden=true}
$("packagesBtn").onclick=()=>showModal("packagesModal");
$("moreBtn").onclick=()=>showModal("menuModal");
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>hideModal(b.dataset.close));
document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.hidden=true}));

$("packageForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("packageName").value.trim();
  if(!name || !ready)return;
  $("installBtn").disabled=true;
  worker.postMessage({type:"install",name});
});

function handlePackageStatus(m){
  const el=$("packageStatus");
  el.textContent=m.message;
  el.style.color = m.status==="ok" ? "var(--accent)" : m.status==="error" ? "var(--red)" : "var(--muted)";
  if(m.status!=="working") $("installBtn").disabled=false;
  if(m.status==="ok" && m.name && !installedPackages.includes(m.name)){
    installedPackages.push(m.name); renderPackages();
  }
}

function renderPackages(){
  $("installedCount").textContent=installedPackages.length;
  $("installedList").innerHTML=installedPackages.length
    ? installedPackages.map(x=>`<span class="chip">${escapeHTML(x)}</span>`).join("")
    : '<span class="muted">Nothing added yet.</span>';
}
function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

$("exampleBasic").onclick=()=>loadExample("basic");
$("exampleSleep").onclick=()=>loadExample("sleep");
$("exampleTurtle").onclick=()=>loadExample("turtle");
function loadExample(name){
  editor.value=EXAMPLES[name]; updateLines();scheduleSave();hideModal("menuModal");editor.focus();
}
$("resetRuntime").onclick=()=>{hideModal("menuModal");appendConsole("\n[Restarting runtime]\n","system");makeWorker()};
$("themeBtn").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("voidworks-python-theme",document.body.classList.contains("light")?"light":"dark")};
if(localStorage.getItem("voidworks-python-theme")==="light")document.body.classList.add("light");

function resizeCanvas(){
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(rect.width*dpr) || canvas.height!==Math.round(rect.height*dpr)){
    canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(rect.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    redrawTurtle();
  }
}
new ResizeObserver(resizeCanvas).observe(canvas);

function clearTurtle(){
  turtleCommands=[];
  cursorState={x:0,y:0,heading:0,visible:false};
  const rect=canvas.getBoundingClientRect();
  ctx.clearRect(0,0,rect.width,rect.height);
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,rect.width,rect.height);
  $("turtleEmpty").style.display="";
}

function handleTurtle(cmd){
  $("turtleEmpty").style.display="none";
  if(cmd.cmd==="clear"){clearTurtle();$("turtleEmpty").style.display="none";return}
  if(cmd.cmd==="cursor"){cursorState={x:cmd.x,y:cmd.y,heading:cmd.heading,visible:cmd.visible}; redrawTurtle();return}
  turtleCommands.push(cmd);
  redrawTurtle();
}

function mapPoint(x,y,w,h){return [w/2+x,h/2-y]}

function redrawTurtle(){
  const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;
  if(!w||!h)return;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);

  for(const c of turtleCommands){
    if(c.cmd==="bgcolor"){ctx.fillStyle=c.color;ctx.fillRect(0,0,w,h)}
    if(c.cmd==="line"){
      const a=mapPoint(c.x1,c.y1,w,h),b=mapPoint(c.x2,c.y2,w,h);
      ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=c.color||"#111";ctx.lineWidth=c.width||2;ctx.lineCap="round";ctx.stroke();
    }
    if(c.cmd==="fill"){
      if(!c.points?.length)continue;
      ctx.beginPath();
      const p0=mapPoint(c.points[0][0],c.points[0][1],w,h);ctx.moveTo(...p0);
      for(const p of c.points.slice(1))ctx.lineTo(...mapPoint(p[0],p[1],w,h));
      ctx.closePath();ctx.fillStyle=c.color||"#111";ctx.fill();
    }
    if(c.cmd==="dot"){
      const p=mapPoint(c.x,c.y,w,h);ctx.beginPath();ctx.arc(p[0],p[1],(c.size||8)/2,0,Math.PI*2);ctx.fillStyle=c.color||"#111";ctx.fill();
    }
    if(c.cmd==="text"){
      const p=mapPoint(c.x,c.y,w,h);ctx.fillStyle=c.color||"#111";ctx.font=`${c.size||10}px system-ui`;ctx.textAlign=c.align==="center"?"center":c.align==="right"?"right":"left";ctx.fillText(c.text,p[0],p[1]);
    }
  }

  if(cursorState.visible){
    const [x,y]=mapPoint(cursorState.x,cursorState.y,w,h);
    const a=-cursorState.heading*Math.PI/180;
    ctx.save();ctx.translate(x,y);ctx.rotate(a);
    ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,-6);ctx.lineTo(-4,0);ctx.lineTo(-7,6);ctx.closePath();
    ctx.fillStyle="#111827";ctx.fill();ctx.restore();
  }
}

const saved=localStorage.getItem("voidworks-python-code");
editor.value=saved!==null?saved:DEFAULT_CODE;
$("fileName").value=localStorage.getItem("voidworks-python-file")||"main.py";
updateLines();updateCursor();resizeCanvas();
makeWorker();
