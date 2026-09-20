
const grid = document.getElementById("projectGrid");
const search = document.getElementById("search");
const count = document.getElementById("projectCount");
const empty = document.getElementById("emptyState");
const buttons = [...document.querySelectorAll(".nav")];
let filter = "all";

function render(){
  const q = search.value.trim().toLowerCase();
  const items = PROJECTS.filter(p => {
    const categoryOK = filter === "all" || p.category === filter;
    const text = `${p.name} ${p.description} ${p.category} ${p.tag}`.toLowerCase();
    return categoryOK && text.includes(q);
  });

  grid.innerHTML = items.map(p => `
    <a class="project-card ${p.placeholder ? "placeholder" : ""}" href="${p.url}" style="--glow:${p.glow}">
      <div class="card-top">
        <div class="icon">${p.icon}</div>
        <span class="badge ${p.status}">${p.status === "live" ? "Live" : "WIP"}</span>
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="card-footer">
          <span>${p.tag}</span>
          <strong>${p.placeholder ? "Reserved" : "Open →"}</strong>
        </div>
      </div>
    </a>
  `).join("");

  count.textContent = `${items.length} project${items.length === 1 ? "" : "s"}`;
  empty.hidden = items.length !== 0;
}

buttons.forEach(btn => btn.addEventListener("click", () => {
  buttons.forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  filter = btn.dataset.filter;
  render();
}));

search.addEventListener("input", render);

document.getElementById("browseBtn").addEventListener("click", () => {
  document.getElementById("projects").scrollIntoView({behavior:"smooth"});
});

document.getElementById("randomBtn").addEventListener("click", () => {
  const live = PROJECTS.filter(p => !p.placeholder && p.url !== "#");
  if(live.length) location.href = live[Math.floor(Math.random() * live.length)].url;
  else document.getElementById("projects").scrollIntoView({behavior:"smooth"});
});

document.getElementById("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("voidworks-theme", document.body.classList.contains("light") ? "light" : "dark");
});

if(localStorage.getItem("voidworks-theme") === "light") document.body.classList.add("light");

document.getElementById("year").textContent = new Date().getFullYear();
render();
