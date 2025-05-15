// script.js

const webhookURL = 'https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec';

let userId = '';

// Initialize LIFF to get userId (replace '<YOUR-LIFF-ID>' with actual LIFF ID)
liff.init({ liffId: '2007421084-6bzYVymA' })
  .then(() => {
    if (!liff.isLoggedIn()) {
      liff.login();
    } else {
      liff.getProfile().then(profile => {
        document.getElementById('userId').value = profile.userId;
      }).catch(err => {
        console.error('Error getting profile: ', err);
      });
    }
  })
  .catch(err => {
    console.error('LIFF Initialization failed ', err);
  });

// Assuming all_car_model.js defines an object like:
// const carData = { "Toyota": ["Camry", "Corolla", ...], "Honda": ["City", ...], ... };
// or nested: { "Toyota": { "Camry": [years], ... }, ... }
const carData = window.carData || window.all_car_models || {}; 

// Populate brand list on page load
window.addEventListener('DOMContentLoaded', () => {
  const brandList = document.getElementById('brandList');
  if (carData) {
    for (const brand in carData) {
      const option = document.createElement('option');
      option.value = brand;
      brandList.appendChild(option);
    }
  }
  // Populate year list (e.g., from 1980 to current year)
  const yearList = document.getElementById('yearList');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1980; y--) {
    const option = document.createElement('option');
    option.value = y;
    yearList.appendChild(option);
  }
});

// Handle brand selection to enable models
document.getElementById('brand').addEventListener('input', function() {
  const brandVal = this.value;
  const modelInput = document.getElementById('model');
  const modelList = document.getElementById('modelList');
  modelList.innerHTML = '';
  modelInput.value = '';
  modelInput.disabled = true;

  if (carData && carData[brandVal]) {
    // If data structure is brand -> array of models
    const models = Array.isArray(carData[brandVal]) 
      ? carData[brandVal] 
      : Object.keys(carData[brandVal]);
    models.forEach(m => {
      const option = document.createElement('option');
      option.value = m;
      modelList.appendChild(option);
    });
    modelInput.disabled = false;
  }
});

// Form submission
document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const userId = document.getElementById('userId').value;
  const phone = document.getElementById('phone').value.trim();
  const name = document.getElementById('name').value.trim();
  const brand = document.getElementById('brand').value.trim();
  const model = document.getElementById('model').value.trim();
  const year = document.getElementById('year').value.trim();

  // Basic validation
  if (!userId || !phone || !name || !brand || !model || !year) {
    Swal.fire('กรุณากรอกข้อมูลให้ครบ', '', 'warning');
    return;
  }

  // Confirm submission
  Swal.fire({
    title: 'ยืนยันการสมัคร',
    text: 'คุณต้องการสมัครสมาชิกใช่หรือไม่?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ใช่',
    cancelButtonText: 'ไม่'
  }).then((result) => {
    if (result.isConfirmed) {
      // Send data to Google Apps Script (assumes google.script.run is available)
      google.script.run
        .withSuccessHandler(handleResponse)
        .withFailureHandler(err => {
          console.error('Error:', err);
          Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
        })
        .addCustomerData({
          userId: userId,
          phone: phone,
          name: name,
          brand: brand,
          model: model,
          year: year,
          channel: 'LINE',    // Adjust if needed
          category: ''        // Adjust if needed
        });
    }
  });
});

// Handle response from server
function handleResponse(response) {
  if (response.status === 'duplicate') {
    Swal.fire({
      title: 'ข้อมูลซ้ำ',
      text: 'คุณได้ลงทะเบียนข้อมูลนี้แล้ว',
      icon: 'warning',
      confirmButtonText: 'ตกลง'
    }).then(() => {
      liff.closeWindow();
    });
  } else {
    Swal.fire({
      title: 'สมัครสมาชิกสำเร็จ',
      text: 'คุณได้ลงทะเบียนเรียบร้อยแล้ว',
      icon: 'success',
      confirmButtonText: 'ตกลง'
    }).then(() => {
      liff.closeWindow();
    });
  }
}
