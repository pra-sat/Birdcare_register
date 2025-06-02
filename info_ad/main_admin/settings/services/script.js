// ✅ script.js - สำหรับหน้า Service Management (เวอร์ชันปรับปรุงแบบละเอียด)

const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

let userId = "N/A";
let currentAdmin = {}; // เก็บข้อมูล admin หลัง login

// ฟังก์ชัน: ออกจากระบบ
function logout() {
  liff.logout();
  liff.closeWindow();
}

// แสดง popup โหลดข้อมูล
function showLoading() {
  Swal.fire({
    title: 'กำลังโหลดข้อมูล...',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading()
  });
}

// ปิด popup โหลดข้อมูล
function hideLoading() {
  Swal.close();
}

// แสดง error ด้วย sweetalert
function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'เกิดข้อผิดพลาด',
    text: message,
    confirmButtonText: 'ปิด'
  });
}

// เปิด popup เพิ่มบริการ
function openAddPopup() {
  document.getElementById('addPopup').classList.remove('hidden');
}

// ปิด popup เพิ่มบริการ
function closeAddPopup() {
  document.getElementById('addPopup').classList.add('hidden');
}

// แสดง/ซ่อน รายการบริการ
function toggleServiceList() {
  document.getElementById('serviceList').classList.toggle('hidden');
}

// log การกระทำของ admin ไปที่ Admin_Log
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

// สร้าง card สำหรับแต่ละบริการ
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

// แสดงรายการบริการทั้งหมด
function renderServiceList(list) {
  const listEl = document.getElementById('serviceList');
  listEl.innerHTML = '';
  list.forEach(service => listEl.appendChild(createServiceCard(service)));
  listEl.classList.remove('hidden');
}

// โหลดข้อมูลบริการทั้งหมดจาก GAS
async function fetchServices() {
  showLoading();
  try {
    const res = await fetch(GAS_ENDPOINT + '?action=service&sub_action=get_service_list');
    const data = await res.json();
    renderServiceList(data.services);
    await logAdminAction('เปิดดูบริการทั้งหมด', 'โหลดข้อมูลจาก Service_List');
  } catch (err) {
    console.error(err);
    showError('โหลดรายการบริการไม่สำเร็จ');
  } finally {
    hideLoading();
  }
}

// บันทึกบริการใหม่
async function submitAddService() {
  const name = document.getElementById('addName').value.trim();
  const price = document.getElementById('addPrice').value.trim();
  const point = document.getElementById('addPoint').value.trim();
  const detail = document.getElementById('addDetail').value.trim();

  if (!name || !price || !point) {
    showError('กรุณากรอกข้อมูลให้ครบ');
    return;
  }

  showLoading();
  try {
    const payload = {
      action: 'add_service',
      name,
      price,
      point,
      detail,
      createdBy: currentAdmin.name
    };

    await fetch(GAS_ENDPOINT + '?action=add_service', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    await logAdminAction('เพิ่มบริการ', `ชื่อ: ${name}, ราคา: ${price}, แต้ม: ${point}`);

    closeAddPopup();
    fetchServices();
  } catch (err) {
    console.error(err);
    showError('ไม่สามารถเพิ่มบริการได้');
  } finally {
    hideLoading();
  }
}

// แสดง popup รายละเอียดบริการ (ยังไม่รองรับแก้ไข)
function showServiceDetailPopup(service) {
  Swal.fire({
    title: `รายละเอียดบริการ: ${service.name}`,
    html: `
      <p><strong>ราคา:</strong> ${service.price} บาท</p>
      <p><strong>แต้ม:</strong> ${service.point}</p>
      <p><strong>รายละเอียด:</strong><br>${service.detail}</p>
      <label class="toggle-switch">
        <input type="checkbox" ${service.status === 'on' ? 'checked' : ''} id="statusToggle">
        <span class="slider"></span>
      </label>
    `,
    showCancelButton: true,
    cancelButtonText: 'ปิด'
  });
}

// เริ่มต้น: ตรวจสอบสิทธิ์ admin และผูกปุ่มต่าง ๆ

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
  } catch (err) {
    console.error(err);
    showError('ไม่สามารถโหลดข้อมูลผู้ดูแลได้');
  } finally {
    hideLoading();
  }

  // ✅ ตรวจสอบปุ่มมีอยู่จริงก่อนผูก event
  const addBtn = document.getElementById('addServiceBtn');
  const listBtn = document.getElementById('showAllBtn');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (addBtn) addBtn.addEventListener('click', openAddPopup);
  if (listBtn) listBtn.addEventListener('click', fetchServices);
  if (backBtn) backBtn.addEventListener('click', () => location.href = '../index.html');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

