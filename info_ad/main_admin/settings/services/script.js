// ✅ script.js - สำหรับหน้า Service Management (เวอร์ชันปรับปรุงแบบละเอียด)

const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

let userId = "N/A";
let currentAdmin = {}; // เก็บข้อมูล admin หลัง login
let currentService = null; // บริการที่ถูกเลือกปัจจุบัน

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

function openAddPopup() {
  document.getElementById('addPopup').classList.remove('hidden');
}

function closeAddPopup() {
  document.getElementById('addPopup').classList.add('hidden');
}

function closeViewPopup() {
  document.getElementById('viewPopup').classList.add('hidden');
  document.getElementById('saveBtn').classList.add('hidden');
  document.getElementById('editBtn').classList.remove('hidden');
  toggleEditMode(false);
}

function toggleServiceList() {
  document.getElementById('serviceList').classList.toggle('hidden');
}
// เพิ่มช่องค้นหาและปุ่มอันดับยอดนิยม
function setupServiceExtras() {
  const container = document.querySelector('.container');
  const searchBar = document.createElement('input');
  searchBar.type = 'text';
  searchBar.placeholder = '🔍 ค้นหาบริการ...';
  searchBar.classList.add('input-search');
  container.insertBefore(searchBar, document.getElementById('serviceList'));

  searchBar.addEventListener('input', async (e) => {
    const keyword = e.target.value.trim();
    if (keyword.length < 1) return fetchServices();
    const res = await fetch(GAS_ENDPOINT + '?action=service', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'search_service', keyword })
    });
    const result = await res.json();
    renderServiceList(result.results);
  });

  const rankBtn = document.createElement('button');
  rankBtn.className = 'btn outline';
  rankBtn.innerText = '🏆 อันดับบริการยอดนิยม';
  rankBtn.onclick = showTopRankedServices;
  document.querySelector('.button-group').appendChild(rankBtn);
}

async function showTopRankedServices() {
  showLoading();
  try {
    const res = await fetch(GAS_ENDPOINT + '?action=service', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'rank_service' })
    });
    const { ranking } = await res.json();
    const top5 = ranking.slice(0, 5)
      .map((item, idx) => `#${idx + 1}. ${item.serviceId} (จำนวน ${item.usageCount} ครั้ง)`) 
      .join('\n');
    Swal.fire('🏆 อันดับบริการยอดนิยม', top5 || 'ไม่มีข้อมูล', 'info');
  } catch (err) {
    showError('ไม่สามารถโหลดอันดับได้');
  } finally {
    hideLoading();
  }
}

// เพิ่มยืนยันการลบก่อนลบบริการจริง
function confirmDeleteService(serviceId) {
  Swal.fire({
    title: 'ยืนยันการลบบริการ?',
    text: 'คุณแน่ใจหรือไม่ว่าต้องการลบบริการนี้? ไม่สามารถกู้คืนได้!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        showLoading();
        await fetch(GAS_ENDPOINT + '?action=service', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'delete_service',
            serviceId,
            adminName: currentAdmin.name,
            userId,
            device: navigator.userAgent,
            token: await liff.getIDToken()
          })
        });
        await logAdminAction('ลบบริการ', `ID: ${serviceId}`);
        fetchServices();
      } catch (err) {
        showError('ลบไม่สำเร็จ');
      } finally {
        hideLoading();
      }
    }
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
    <div class="card-header">
      <h3>${service.name}</h3>
      <button class="btn btn-delete" data-id="${service.serviceId}" title="ลบบริการนี้">🗑️</button>
    </div>
    <p>ราคา: ${service.price} บาท</p>
    <p>แต้ม: ${service.point}</p>
    <p>รายละเอียด: ${service.detail}</p>
    <label class="toggle-switch">
      <input type="checkbox" ${service.status === 'on' ? 'checked' : ''} data-id="${service.serviceId}">
      <span class="slider"></span>
    </label>
  `;

  // คลิกการ์ด = เปิด popup (ยกเว้นคลิกปุ่มลบ)
  card.addEventListener('click', (e) => {
    if (!e.target.classList.contains('btn-delete')) {
      showServiceDetailPopup(service);
    }
  });

  // คลิกปุ่มลบ = ยืนยันการลบ
  const deleteBtn = card.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    confirmDeleteService(service.serviceId);
  });

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

    await fetch(GAS_ENDPOINT + '?action=service', {
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

function showServiceDetailPopup(service) {
  currentService = service;
  document.getElementById('popupTitle').textContent = `📄 รายละเอียดบริการ`;
  document.getElementById('viewName').value = service.name;
  document.getElementById('viewPrice').value = service.price;
  document.getElementById('viewPoint').value = service.point;
  document.getElementById('viewDetail').value = service.detail;
  document.getElementById('viewStatus').checked = (service.status === 'on');
  document.getElementById('viewPopup').classList.remove('hidden');
}

function toggleEditMode(enable = true) {
  const inputs = ['viewName', 'viewPrice', 'viewPoint', 'viewDetail'];
  inputs.forEach(id => document.getElementById(id).disabled = !enable);
  document.getElementById('editBtn').classList.toggle('hidden', enable);
  document.getElementById('saveBtn').classList.toggle('hidden', !enable);
}

function toggleServiceStatus() {
  const newStatus = document.getElementById('viewStatus').checked ? 'on' : 'off';
  logAdminAction('เปลี่ยนสถานะบริการ', `Service: ${currentService.name}, เป็น: ${newStatus}`);
  // TODO: ส่งไปยัง GAS หากต้องการบันทึกจริง
}

async function saveEditedService() {
  const name = document.getElementById('viewName').value.trim();
  const price = document.getElementById('viewPrice').value.trim();
  const point = document.getElementById('viewPoint').value.trim();
  const detail = document.getElementById('viewDetail').value.trim();

  if (!name || !price || !point) {
    showError('กรุณากรอกข้อมูลให้ครบ');
    return;
  }

  // TODO: ส่งข้อมูลใหม่ไปยัง GAS เพื่ออัปเดต service จริง
  await logAdminAction('แก้ไขบริการ', `Service: ${currentService.name} -> ${name}, ราคา: ${price}, แต้ม: ${point}`);
  toggleEditMode(false);
  closeViewPopup();
  fetchServices();
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
  } catch (err) {
    console.error(err);
    showError('ไม่สามารถโหลดข้อมูลผู้ดูแลได้');
  } finally {
    hideLoading();
  }

  const addBtn = document.getElementById('addServiceBtn');
  const listBtn = document.getElementById('showAllBtn');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (addBtn) addBtn.addEventListener('click', openAddPopup);
  if (listBtn) listBtn.addEventListener('click', fetchServices);
  if (backBtn) backBtn.addEventListener('click', () => location.href = '../index.html');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  setupServiceExtras();
  
});
