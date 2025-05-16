src="https://static.line-scdn.net/liff/edge/2/sdk.js";
src="https://cdn.jsdelivr.net/npm/sweetalert2@11";
    
const webhookURL = 'https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec';
let userId = '';
const liffId = '2007421084-6bzYVymA';

async function initLIFF() {
  try {
    await liff.init({liffId: liffId});
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
            userId = profile.userId;
            console.log(profile);
            document.getElementById('userId').value = userId;
      if (userId !== 'no-userId') {
        document.getElementById('userId').value = userId;
      }
      if (userId === 'no-userId') {
        Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด-1',
          text: 'ไม่สามารถดึง UserID จาก LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
          confirmButtonText: 'ตกลง'
        });
      }
    } else {
      liff.login();
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



// เรียก initLIFF เมื่อหน้าเว็บโหลด
window.addEventListener('load', initLIFF);



document.addEventListener('DOMContentLoaded', () => {
  const phone = document.getElementById('phone');
  const name = document.getElementById('name');
  const brand = document.getElementById('brand');
  const model = document.getElementById('model');
  const year = document.getElementById('year');
  const category = document.getElementById('category');

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
    // ตรวจสอบว่า userId มีค่าหรือไม่
    if (!userId || userId === 'no-userId') {
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด-3',
        text: 'ไม่สามารถดึง UserID จาก LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

        // ส่งข้อมูลไปที่ Google Apps Script
        const url = 'https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec';
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
                        // รีเซ็ตฟอร์ม
                        document.getElementById('regForm').reset();
                        liff.closeWindow();
                    });
                }
            })
            .catch(err => {
                console.error(err);
            });
    });
});
