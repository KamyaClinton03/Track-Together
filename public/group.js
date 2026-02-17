const API = "http://localhost:3000";

// get groupId from URL
const groupId = Number(new URLSearchParams(window.location.search).get("groupId"));

if (!groupId) {
  document.body.innerHTML = "<h2>Missing ?groupId=1 in URL</h2>";
  throw new Error("No groupId");
}

Promise.all([
  fetch(`${API}/groups`).then(r => r.json()),
  fetch(`${API}/users`).then(r => r.json())
]).then(([groups, users]) => {

  const group = groups.find(g => g.id === groupId);
  if (!group) {
    document.body.innerHTML = "<h2>Group not found</h2>";
    return;
  }

  document.getElementById("groupName").textContent = group.name;

  const members = users.filter(u => group.members.includes(u.id));

  renderProgressBars(members);
  renderControls(members);
});

function renderProgressBars(members) {
  const container = document.getElementById("progressBars");
  container.innerHTML = "";

  members.forEach(m => {
    const percent = Math.round((m.progress / m.goal) * 100);

    container.innerHTML += `
      <strong>${m.username} — ${percent}%</strong>
      <div class="bar-bg">
        <div class="bar" style="width:${percent}%"></div>
      </div>
    `;
  });
}

function renderControls(members) {
  const tbody = document.getElementById("memberControls");
  tbody.innerHTML = "";

  members.forEach(m => {
    const percent = Math.round((m.progress / m.goal) * 100);
    
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${m.username}</td>
      <td>
        <input type="number" value="5" id="inc-${m.id}">
        <button onclick="updateProgress(${m.id}, 1)">+</button>
        <button onclick="updateProgress(${m.id}, -1)">-</button>
      </td>
      <td>
        <input type="number" value="${m.goal}" onchange="updateGoal(${m.id}, this.value)">
      </td>
      <td>${percent}%</td>
    `;

    tbody.appendChild(row);
  });
}

function updateProgress(userId, dir) {
  const inc = Number(document.getElementById(`inc-${userId}`).value);

  fetch(`${API}/users/${userId}`)
    .then(r => r.json())
    .then(user => {
      return fetch(`${API}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress: Math.max(0, user.progress + dir * inc)
        })
      });
    })
    .then(() => location.reload());
}

function updateGoal(userId, goal) {
  fetch(`${API}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal: Number(goal) })
  }).then(() => location.reload());
}
