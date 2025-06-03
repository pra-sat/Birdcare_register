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

async function handleStatusToggleChange(serviceId, newStatus) {
  showLoading();
  try {
    await fetch(GAS_ENDPOINT + '?action=service', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'update_service_status',
        serviceId,
        status: newStatus,
        adminName: currentAdmin.name,
        userId,
        device: navigator.userAgent,
        token: await liff.getIDToken()
      })
    });

    await logAdminAction('เปลี่ยนสถานะบริการ', `ID: ${serviceId}, เป็น: ${newStatus}`);
  } catch (err) {
    showError('อัปเดตสถานะไม่สำเร็จ');
  } finally {
    hideLoading();
  }
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

  // คลิกการ์ด = เปิด popup (ยกเว้นปุ่มลบ)
  card.addEventListener('click', (e) => {
    if (!e.target.classList.contains('btn-delete') && e.target.type !== 'checkbox') {
      showServiceDetailPopup(service);
    }
  });

  // ปุ่มลบ
  const deleteBtn = card.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    confirmDeleteService(service.serviceId);
  });

  // ✅ ฟัง toggle-switch
  const toggle = card.querySelector('input[type="checkbox"]');
  toggle.addEventListener('change', async (e) => {
    e.stopPropagation();
    const newStatus = e.target.checked ? 'on' : 'off';
    await handleStatusToggleChange(service.serviceId, newStatus);
  });

  return card;
}


function renderServiceList(list, filter = 'all') {
  const listEl = document.getElementById('serviceList');
  listEl.innerHTML = '';

  const filtered = filter === 'on' ? list.filter(s => s.status === 'on') : list;

  filtered.forEach(service => {
    const card = createServiceCard(service);
    if (service.status === 'off') {
      card.classList.add('disabled');
    }
    listEl.appendChild(card);
  });

  listEl.classList.remove('hidden');
}


async function fetchServices(filter = 'all') {
  showLoading();
  try {
    const res = await fetch(GAS_ENDPOINT + '?action=service&sub_action=get_service_list');
    const data = await res.json();
    renderServiceList(data.services, filter);
    await logAdminAction('เปิดดูบริการ', `โหลดบริการทั้งหมด (${filter})`);
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

function toggleEditMode() {
  document.getElementById('viewName').disabled = false;
  document.getElementById('viewPrice').disabled = false;
  document.getElementById('viewPoint').disabled = false;
  document.getElementById('viewDetail').disabled = false;

  document.getElementById('editBtn').classList.add('hidden');
  document.getElementById('saveBtn').classList.remove('hidden');
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
  const status = document.getElementById('viewStatus').checked ? 'on' : 'off';
  const serviceId = document.getElementById('viewPopup').dataset.serviceId;

  if (!name || !price || !point) {
    showError('กรุณากรอกข้อมูลให้ครบ');
    return;
  }

  showLoading();
  try {
    await fetch(GAS_ENDPOINT + '?action=service', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'update_service',
        serviceId,
        name,
        price,
        point,
        detail,
        status,
        updatedBy: currentAdmin.name
      })
    });

    await logAdminAction('แก้ไขบริการ', `ชื่อ: ${name}, ราคา: ${price}, แต้ม: ${point}, สถานะ: ${status}`);
    closeViewPopup();
    fetchServices();
  } catch (err) {
    console.error(err);
    showError('ไม่สามารถแก้ไขบริการได้');
  } finally {
    hideLoading();
  }
}

async function deleteService() {
  const serviceId = document.getElementById('viewPopup').dataset.serviceId;

  const confirm = await Swal.fire({
    icon: 'warning',
    title: 'ต้องการลบบริการ?',
    text: 'การลบนี้ไม่สามารถย้อนกลับได้',
    showCancelButton: true,
    confirmButtonText: 'ลบเลย',
    cancelButtonText: 'ยกเลิก'
  });

  if (!confirm.isConfirmed) return;

  showLoading();
  try {
    await fetch(GAS_ENDPOINT + '?action=service', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'delete_service',
        serviceId
      })
    });

    await logAdminAction('ลบบริการ', `ID: ${serviceId}`);
    closeViewPopup();
    fetchServices();
  } catch (err) {
    console.error(err);
    showError('ลบบริการไม่สำเร็จ');
  } finally {
    hideLoading();
  }
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
  
  const filterBtn = document.getElementById('filterActiveBtn');
  if (filterBtn) filterBtn.addEventListener('click', () => fetchServices('on'));

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
