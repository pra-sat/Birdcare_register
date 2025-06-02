// ✅ script.js (หน้า services)
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

let currentUser = { userId: '', name: '' };

function logout() {
  liff.logout();
  liff.closeWindow();
}

function showLoading() {
  Swal.fire({
    title: 'กำลังโหลด...',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });
}

function hideLoading() {
  Swal.close();
}

function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'เกิดข้อผิดพลาด',
    text: message,
    confirmButtonText: 'ปิด'
  }).then(() => liff.closeWindow());
}

async function init() {
  showLoading();
  try {
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile();
    currentUser.userId = profile.userId;
    currentUser.name = profile.displayName;

    const res = await fetch(`${GAS_ENDPOINT}?action=check_admin&userId=${currentUser.userId}`);
    const result = await res.json();

    if (!result.isAdmin || result.level < 5) {
      showError('คุณไม่มีสิทธิ์เข้าถึงเมนูนี้');
      return;
    }

    hideLoading();
    loadServiceList();

  } catch (err) {
    console.error(err);
    hideLoading();
    showError('ไม่สามารถโหลดข้อมูลได้');
  }
}

document.addEventListener('DOMContentLoaded', init);

async function loadServiceList() {
  const res = await fetch(`${GAS_ENDPOINT}?action=get_services`);
  const services = await res.json();

  const list = document.getElementById('serviceList');
  list.innerHTML = '';

  services.forEach(service => {
    const row = document.createElement('div');
    row.className = 'service-row';

    row.innerHTML = `
      <div class="info">
        <h4>${service.name}</h4>
        <p>ราคา: ${service.price} บาท | แต้ม: ${service.point}</p>
      </div>
      <label class="switch">
        <input type="checkbox" ${service.active === 'TRUE' ? 'checked' : ''} onchange="toggleServiceStatus('${service.id}', this.checked, '${service.name}')">
        <span class="slider round"></span>
      </label>
    `;
    list.appendChild(row);
  });
}

async function toggleServiceStatus(id, status, name) {
  await fetch(`${GAS_ENDPOINT}?action=toggle_service`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: status ? 'TRUE' : 'FALSE' })
  });

  const detail = `เปลี่ยนสถานะบริการ | ${name} | ${status ? 'เปิด' : 'ปิด'}`;

  await fetch(`${GAS_ENDPOINT}?action=log_admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'log_admin',
      name: currentUser.name,
      userId: currentUser.userId,
      actionTitle: 'แก้ไขบริการ',
      detail,
      device: navigator.userAgent,
      token: await liff.getIDToken()
    })
  });
}
