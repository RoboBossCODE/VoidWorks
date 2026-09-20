import { loadPyodide } from "./runtime/pyodide.mjs";

const RUNTIME_BASE = new URL("./runtime/", import.meta.url).href;

let pyodide = null;
let stdinLines = [];
let stdinIndex = 0;

function send(type, data={}) {
  postMessage({type, ...data});
}

async function boot() {
  try {
    send("bootStatus", {message:"Loading local Python runtime…"});

    pyodide = await loadPyodide({
      indexURL: RUNTIME_BASE,
      stdout: (line) => send("stdout", {text: line + "\n"}),
      stderr: (line) => send("stderr", {text: line + "\n"}),
      stdin: () => {
        if (stdinIndex >= stdinLines.length) return "";
        return stdinLines[stdinIndex++];
      }
    });

    await installTurtleShim();
    send("ready");
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    send("bootError", {
      message:
        "The local Python runtime could not start.\n\n" +
        msg +
        "\n\nCheck that python/runtime contains pyodide.mjs, pyodide.asm.mjs, " +
        "pyodide.asm.wasm, python_stdlib.zip and pyodide-lock.json."
    });
  }
}

async function installTurtleShim() {
  const shim = `
import sys, types, math, json
from js import postMessage

def _send(cmd, **data):
    postMessage("__VW_TURTLE__" + json.dumps({"cmd": cmd, **data}))

class _Screen:
    def bgcolor(self, color=None):
        if color is not None: _send("bgcolor", color=str(color))
        return color
    def setup(self, width=None, height=None, **kwargs):
        _send("setup", width=width, height=height)
    def title(self, title):
        pass
    def tracer(self, *args, **kwargs):
        pass
    def update(self):
        pass

class _Turtle:
    def __init__(self):
        self.x = 0.0
        self.y = 0.0
        self.heading_value = 0.0
        self.pen_down = True
        self.pen_color = "black"
        self.fill_color = "black"
        self.width_value = 2
        self.visible = True
        self.fill_points = None
        _send("cursor", x=self.x, y=self.y, heading=self.heading_value, visible=True)

    def _move_to(self, x, y):
        oldx, oldy = self.x, self.y
        self.x, self.y = float(x), float(y)
        if self.pen_down:
            _send("line", x1=oldx, y1=oldy, x2=self.x, y2=self.y,
                  color=self.pen_color, width=self.width_value)
        if self.fill_points is not None:
            self.fill_points.append([self.x, self.y])
        _send("cursor", x=self.x, y=self.y, heading=self.heading_value, visible=self.visible)

    def forward(self, distance):
        r = math.radians(self.heading_value)
        self._move_to(self.x + math.cos(r)*distance, self.y + math.sin(r)*distance)
    fd = forward

    def backward(self, distance):
        self.forward(-distance)
    back = backward
    bk = backward

    def right(self, angle):
        self.heading_value -= float(angle)
        _send("cursor", x=self.x, y=self.y, heading=self.heading_value, visible=self.visible)
    rt = right

    def left(self, angle):
        self.heading_value += float(angle)
        _send("cursor", x=self.x, y=self.y, heading=self.heading_value, visible=self.visible)
    lt = left

    def goto(self, x, y=None):
        if y is None:
            x, y = x
        self._move_to(x, y)
    setpos = goto
    setposition = goto

    def setx(self, x): self._move_to(x, self.y)
    def sety(self, y): self._move_to(self.x, y)

    def setheading(self, angle):
        self.heading_value = float(angle)
        _send("cursor", x=self.x, y=self.y, heading=self.heading_value, visible=self.visible)
    seth = setheading

    def heading(self): return self.heading_value
    def position(self): return (self.x, self.y)
    pos = position
    def xcor(self): return self.x
    def ycor(self): return self.y

    def penup(self): self.pen_down = False
    pu = up = penup
    def pendown(self): self.pen_down = True
    pd = down = pendown
    def isdown(self): return self.pen_down

    def pencolor(self, color=None):
        if color is None: return self.pen_color
        self.pen_color = str(color)
    def fillcolor(self, color=None):
        if color is None: return self.fill_color
        self.fill_color = str(color)
    def color(self, *args):
        if not args: return (self.pen_color, self.fill_color)
        if len(args) == 1:
            self.pen_color = self.fill_color = str(args[0])
        else:
            self.pen_color, self.fill_color = str(args[0]), str(args[1])

    def pensize(self, width=None):
        if width is None: return self.width_value
        self.width_value = float(width)
    width = pensize

    def begin_fill(self):
        self.fill_points = [[self.x, self.y]]
    def end_fill(self):
        if self.fill_points and len(self.fill_points) >= 3:
            _send("fill", points=self.fill_points, color=self.fill_color)
        self.fill_points = None

    def circle(self, radius, extent=None, steps=None):
        extent = 360.0 if extent is None else float(extent)
        steps = int(steps or max(12, min(120, abs(extent) / 6)))
        step_angle = extent / steps
        # Polygonal approximation of turtle circle semantics
        chord = 2 * abs(radius) * math.sin(math.radians(abs(step_angle))/2)
        turn = step_angle if radius >= 0 else -step_angle
        self.left(turn/2)
        for _ in range(steps):
            self.forward(chord if radius >= 0 else -chord)
            self.left(turn)
        self.right(turn/2)

    def dot(self, size=None, color=None):
        _send("dot", x=self.x, y=self.y, size=float(size or 8), color=str(color or self.pen_color))

    def clear(self): _send("clear")
    def reset(self):
        _send("clear"); self.__init__()
    def home(self):
        self.goto(0,0); self.setheading(0)

    def hideturtle(self):
        self.visible = False
        _send("cursor", x=self.x, y=self.y, heading=self.heading_value, visible=False)
    ht = hideturtle
    def showturtle(self):
        self.visible = True
        _send("cursor", x=self.x, y=self.y, heading=self.heading_value, visible=True)
    st = showturtle
    def speed(self, *args): return 0
    def write(self, arg, move=False, align="left", font=("Arial",8,"normal")):
        _send("text", x=self.x, y=self.y, text=str(arg), color=self.pen_color,
              align=str(align), size=int(font[1]) if len(font)>1 else 8)

_default = _Turtle()
_screen = _Screen()

m = types.ModuleType("turtle")
m.Turtle = _Turtle
m.Screen = lambda: _screen
m.done = lambda: None
m.mainloop = lambda: None
m.bye = lambda: None
m.tracer = lambda *a, **k: None
m.update = lambda: None
m.bgcolor = _screen.bgcolor

for name in ["forward","fd","backward","back","bk","right","rt","left","lt",
             "goto","setpos","setposition","setx","sety","setheading","seth",
             "heading","position","pos","xcor","ycor","penup","pu","up",
             "pendown","pd","down","isdown","pencolor","fillcolor","color",
             "pensize","width","begin_fill","end_fill","circle","dot","clear",
             "reset","home","hideturtle","ht","showturtle","st","speed","write"]:
    setattr(m, name, getattr(_default, name))

sys.modules["turtle"] = m
`;
  await pyodide.runPythonAsync(shim);
}

async function runCode(code, stdin) {
  stdinLines = String(stdin || "").split(/\r?\n/);
  if (stdinLines.length === 1 && stdinLines[0] === "") stdinLines = [];
  stdinIndex = 0;
  try {
    send("runStart");
    await pyodide.loadPackagesFromImports(code);
    const result = await pyodide.runPythonAsync(code);
    if (result !== undefined && result !== null) {
      const text = String(result);
      if (text !== "None") send("result", {text});
    }
    if (result && typeof result.destroy === "function") result.destroy();
    send("runDone");
  } catch (err) {
    send("pythonError", {message: String(err && err.stack ? err.stack : err)});
    send("runDone");
  }
}

async function installPackage(name) {
  send("packageStatus", {
    status:"error",
    message:
      "External package installation is not enabled in the self-hosted core build yet. " +
      "The Python standard library and Voidworks Turtle work locally. " +
      "Third-party package mirroring is the next runtime upgrade."
  });
}

onmessage = async (event) => {
  const m = event.data || {};
  if (m.type === "run") await runCode(m.code || "", m.stdin || "");
  if (m.type === "install") await installPackage(String(m.name || "").trim());
};

boot();
