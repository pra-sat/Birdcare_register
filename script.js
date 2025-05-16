// ตรวจสอบการโหลด LIFF SDK
(function() {
  const liffScript = document.createElement('script');
  liffScript.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
  liffScript.onload = () => initLIFF();
  document.head.appendChild(liffScript);

  const swalScript = document.createElement('script');
  swalScript.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
  document.head.appendChild(swalScript);
})();

let userId = '';
const liffId = '2007421084-6bzYVymA';
const webhookURL = 'https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec';

async function initLIFF() {
  try {
    await liff.init({ liffId });
    if (!liff.isInClient()) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด-0',
        text: 'กรุณาเปิดหน้านี้ในแอป LINE เท่านั้น',
        confirmButtonText: 'ตกลง'
      });
      return;
    }
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      userId = profile.userId;
      console.log('Profile:', profile);
      document.getElementById('userId').value = userId || 'no-userId';
      if (!userId || userId === 'no-userId') {
        Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด-1',
          text: 'ไม่สามารถดึง UserID จาก LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
          confirmButtonText: 'ตกลง'
        });
      }
    } else {
      liff.login({ redirectUri: window.location.href });
    }
  } catch (err) {
    console.error('LIFF Init Error:', err);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด-2',
      text: 'ไม่สามารถเชื่อมต่อกับ LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
      confirmButtonText: 'ตกลง'
    });
  }
}

window.addEventListener('load', () => {
  if (typeof liff === 'undefined') {
    console.error('LIFF SDK not loaded');
  } else {
    initLIFF();
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const phone = document.getElementById('phone');
    const name = document.getElementById('name');
    const brand = document.getElementById('brand');
    const model = document.getElementById('model');
    const year = document.getElementById('year');
    const category = document.getElementById('category');

    if (!brand || !model || !year) {
        console.error('Required form elements not found');
        return;
    }

    // ตรวจสอบว่า carData มีอยู่
    if (typeof carData === 'undefined') {
        console.error('carData is not defined. Ensure all_car_model.js is loaded.');
        Swal.fire({
            icon: 'error',
            title: 'ข้อผิดพลาด-3',
            text: 'ไม่สามารถโหลดข้อมูลยี่ห้อรถได้ กรุณาลองใหม่หรือติดต่อ Admin',
            confirmButtonText: 'ตกลง'
        });
        return;
    }

    // Populate brand list
    for (let brandName in carData) {
        const opt = document.createElement('option');
        opt.value = brandName;
        document.getElementById('brandList').appendChild(opt);
    }

    // Update model list based on brand
    brand.addEventListener('input', () => {
        model.value = '';
        year.value = '';
        category.value = 'Unknown';
        document.getElementById('modelList').innerHTML = '';
        document.getElementById('yearList').innerHTML = '';
        if (carData[brand.value]) {
            Object.keys(carData[brand.value].models).forEach(modelName => {
                const opt = document.createElement('option');
                opt.value = modelName;
                document.getElementById('modelList').appendChild(opt);
            });
        }
    });

    // Update year list and category based on model
    model.addEventListener('input', () => {
        year.value = '';
        category.value = 'Unknown';
        document.getElementById('yearList').innerHTML = '';
        const brandVal = brand.value;
        const modelVal = model.value;
        if (carData[brandVal]?.models[modelVal]) {
            carData[brandVal].models[modelVal].years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                document.getElementById('yearList').appendChild(opt);
            });
            category.value = carData[brandVal].models[modelVal].category;
        }
    });


  // เมื่อคลิกสมัครสมาชิก
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();

    if (!/^\d{10}$/.test(phone.value)) {
      Swal.fire({
        icon: 'error',
        title: 'เบอร์โทรไม่ถูกต้อง',
        text: 'กรุณากรอกเบอร์โทร 10 หลัก',
        confirmButtonText: 'ตกลง'
      });
      return;
    }
    if (!userId || userId === 'no-userId') {
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด-4',
        text: 'ไม่สามารถดึง UserID จาก LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const url = webhookURL;
    const params = new URLSearchParams({
      userId: userId,
      phone: phone.value,
      name: name.value,
      brand: brand.value,
      model: model.value,
      year: year.value,
      category: category.value || 'Unknown'
    });

    fetch(`${url}?${params.toString()}`)
      .then(response => response.text())
      .then(text => {
        if (text.includes('Duplicate')) {
          Swal.fire({
            icon: 'error',
            title: 'มีข้อมูลอยู่แล้วในระบบ'
          }).then(() => {
            liff.closeWindow();
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'สมัครสมาชิกสำเร็จ'
          }).then(() => {
            document.getElementById('registerForm').reset();
            liff.closeWindow();
          });
        }
      })
      .catch(err => {
        console.error(err);
      });
  });
});
