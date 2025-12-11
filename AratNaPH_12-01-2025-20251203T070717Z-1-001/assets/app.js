// Small shared helpers and demo storage functions

// HTML escape
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Session requirement helpers
function requireUser() {
  if (!localStorage.getItem('user')) {
    window.location.href = 'Sign%20In.html';
  }
}

function requireAdmin() {
  if (localStorage.getItem('isAdmin') !== 'true') {
    window.location.href = 'admin-signin.html';
  }
}

// Demo users helpers
function getDemoUsers() {
  return JSON.parse(localStorage.getItem('demo_users') || '[]');
}
function saveDemoUsers(users) {
  localStorage.setItem('demo_users', JSON.stringify(users));
}
function updateUserProfile(email, updates) {
  const users = getDemoUsers();
  const idx = users.findIndex(u => u.email === email);
  if (idx !== -1) {
    users[idx] = Object.assign({}, users[idx], updates);
    saveDemoUsers(users);
  }
}

// Demo orders (per-user)
function getDemoOrders() {
  return JSON.parse(localStorage.getItem('demo_orders') || '[]');
}
function saveDemoOrders(orders) {
  localStorage.setItem('demo_orders', JSON.stringify(orders));
}
function addDemoOrder({ email, item, qty }) {
  const orders = getDemoOrders();
  orders.push({ id: generateId(), email, item, qty, created: new Date().toISOString() });
  saveDemoOrders(orders);
}
function deleteDemoOrder(id) {
  const orders = getDemoOrders().filter(o => o.id !== id);
  saveDemoOrders(orders);
}
function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// Demo support messages (stored locally)
function getSupportMessages() {
  return JSON.parse(localStorage.getItem('demo_support') || '[]');
}
function sendSupportMessage(msg) {
  const arr = getSupportMessages();
  arr.push(Object.assign({ id: generateId(), created: new Date().toISOString() }, msg));
  localStorage.setItem('demo_support', JSON.stringify(arr));
}

// Expose some functions for pages using them in script tags (if needed)
window.getDemoUsers = getDemoUsers;
window.updateUserProfile = updateUserProfile;
window.getDemoOrders = getDemoOrders;
window.addDemoOrder = addDemoOrder;
window.deleteDemoOrder = deleteDemoOrder;
window.getSupportMessages = getSupportMessages;
window.sendSupportMessage = sendSupportMessage;
window.escapeHtml = escapeHtml;
window.requireUser = requireUser;
window.requireAdmin = requireAdmin;
