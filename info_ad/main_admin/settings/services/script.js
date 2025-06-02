// script.js - หน้าบริการ (Service Management)

const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';
let userId = "N/A";
let currentAdmin = {};

function logout() {
  liff.logout();
  liff.closeWindow();
}

function showLoading() {
  Swal.fire({
    title: 'กำลังโหลดข้อมูล...',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading()
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
  });
}

async function logAdminAction(action, detail) {
  try {
    await fetch(GAS_ENDPOINT + '?action=log_admin', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'log_admin',
        name: currentAdmin.name,
        userId: userId,
        actionTitle: action,
        detail: detail,
        device: navigator.userAgent,
        token: await liff.getIDToken()
      })
    });
  } catch (err) {
    console.warn('Log failed:', err);
  }
}

function createServiceCard(service) {
  const card = document.createElement('div');
  card.className = 'service-card';
  card.innerHTML = `
    <h3>${service.name}</h3>
    <p>ราคา: ${service.price} บาท</p>
    <p>แต้ม: ${service.point}</p>
    <p>รายละเอียด: ${service.detail}</p>
    <label class="toggle-switch">
      <input type="checkbox" ${service.status === 'on' ? 'checked' : ''} data-id="${service.serviceId}">
      <span class="slider"></span>
    </label>
  `;
  card.addEventListener('click', () => showServiceDetailPopup(service));
  return card;
}

function renderServiceList(list) {
  const listEl = document.getElementById('serviceList');
  listEl.innerHTML = '';
  list.forEach(service => listEl.appendChild(createServiceCard(service)));
  listEl.classList.remove('hidden');
}

async function fetchServices() {
  showLoading();
  try {
    const res = await fetch(`${GAS_ENDPOINT}?action=get_service_list`);
    const data = await res.json();
    renderServiceList(data.services);
    await logAdminAction('เปิดดูบริการทั้งหมด', 'เรียกรายการบริการจาก Service_List');
    hideLoading();
  } catch (err) {
    console.error(err);
    hideLoading();
    showError('โหลดรายการบริการไม่สำเร็จ');
  }
}

function showAddServicePopup() {
  Swal.fire({
    title: 'เพิ่มบริการใหม่',
    html:
      '<input id="sName" class="swal2-input" placeholder="ชื่อบริการ">' +
      '<input id="sPrice" type="number" class="swal2-input" placeholder="ราคา">' +
      '<input id="sPoint" type="number" class="swal2-input" placeholder="แต้ม">' +
      '<textarea id="sDetail" class="swal2-textarea" placeholder="รายละเอียด"></textarea>',
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก',
    preConfirm: async () => {
      const name = document.getElementById('sName').value.trim();
      const price = document.getElementById('sPrice').value.trim();
      const point = document.getElementById('sPoint').value.trim();
      const detail = document.getElementById('sDetail').value.trim();

      if (!name || !price || !point) {
        Swal.showValidationMessage('กรุณากรอกชื่อบริการ ราคา และแต้ม');
        return false;
      }

      await fetch(GAS_ENDPOINT + '?action=add_service', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          name, price, point, detail,
          createdBy: currentAdmin.name
        })
      });
      await logAdminAction('เพิ่มบริการ', `ชื่อบริการ: ${name}, ราคา: ${price}, แต้ม: ${point}`);
    }
  }).then(result => {
    if (result.isConfirmed) fetchServices();
  });
}

function showServiceDetailPopup(service) {
  Swal.fire({
    title: `รายละเอียดบริการ: ${service.name}`,
    html:
      `<p><strong>ราคา:</strong> ${service.price} บาท</p>` +
      `<p><strong>แต้ม:</strong> ${service.point}</p>` +
      `<p><strong>รายละเอียด:</strong><br>${service.detail}</p>` +
      `<label class="toggle-switch">
        <input type="checkbox" ${service.status === 'on' ? 'checked' : ''} id="statusToggle">
        <span class="slider"></span>
      </label>`,
    showCancelButton: true,
    cancelButtonText: 'ปิด'
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  try {
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile();
    userId = profile.userId;

    const res = await fetch(`${GAS_ENDPOINT}?action=check_admin&userId=${userId}`);
    const result = await res.json();

    if (!result.isAdmin || result.level < 5) {
      showError('คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้');
      return;
    }

    currentAdmin = result;
    document.getElementById('adminName').textContent = result.name;
    document.getElementById('adminLevel').textContent = result.level;
    document.getElementById('adminRole').textContent = result.role;

    await logAdminAction('เข้าสู่หน้า Services', 'เปิดหน้าเมนูจัดการบริการ');
    hideLoading();
  } catch (err) {
    console.error(err);
    hideLoading();
    showError('ไม่สามารถโหลดข้อมูลผู้ดูแลได้');
  }

  document.getElementById('addServiceBtn').addEventListener('click', showAddServicePopup);
  document.getElementById('showAllBtn').addEventListener('click', fetchServices);
  document.getElementById('backBtn').addEventListener('click', () => location.href = '../index.html');
  document.getElementById('logoutBtn').addEventListener('click', logout);
});

