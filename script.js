// LIFF initialization (แทนที่ YOUR_LIFF_ID ด้วย LIFF ID ของคุณ)
window.addEventListener('load', () => {
  liff.init({ liffId: "YOUR_LIFF_ID" }).then(() => {
    if (!liff.isLoggedIn()) {
      liff.login();
    } else {
      liff.getProfile().then(profile => {
        document.getElementById('userId').value = profile.userId;
      }).catch(err => console.error(err));
    }
  }).catch(err => console.error('LIFF init failed', err));

  // เตรียมเติม dropdown ยี่ห้อ
  const brandList = document.getElementById('brandList');
  for (let brand in carData) {
    let opt = document.createElement('option');
    opt.value = brand;
    brandList.appendChild(opt);
  }

  // เมื่อเลือกยี่ห้อ ให้เติมรุ่น
  document.getElementById('brand').addEventListener('input', function() {
    const models = carData[this.value] || {};
    const modelList = document.getElementById('modelList');
    modelList.innerHTML = '';
    document.getElementById('model').value = '';
    document.getElementById('year').value = '';
    for (let model in models) {
      let opt = document.createElement('option');
      opt.value = model;
      modelList.appendChild(opt);
    }
  });

  // เมื่อเลือกรุ่น ให้เติมปี
  document.getElementById('model').addEventListener('input', function() {
    const brand = document.getElementById('brand').value;
    const years = (carData[brand] || {})[this.value] || [];
    const yearList = document.getElementById('yearList');
    yearList.innerHTML = '';
    document.getElementById('year').value = '';
    for (let yr of years) {
      let opt = document.createElement('option');
      opt.value = yr;
      yearList.appendChild(opt);
    }
  });

  // Submit form
  document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userId = document.getElementById('userId').value;
    const phone = document.getElementById('phone').value.trim();
    const name = document.getElementById('name').value.trim();
    const brand = document.getElementById('brand').value.trim();
    const model = document.getElementById('model').value.trim();
    const year = document.getElementById('year').value.trim();

    // Validation
    if (name === '') {
      Swal.fire({ icon: 'error', title: 'กรุณากรอกชื่อ' });
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      Swal.fire({ icon: 'error', title: 'เบอร์โทรไม่ถูกต้อง', text: 'กรุณากรอก 10 หลัก' });
      return;
    }
    if (!brand || !model || !year) {
      Swal.fire({ icon: 'error', title: 'กรุณาเลือกรายการให้ครบถ้วน' });
      return;
    }

    // เตรียมข้อมูลส่งไป Google Apps Script
    const data = { userId, phone, name, brand, model, year };
    // ตัวอย่างการกำหนดค่าเพิ่มเติม (Category, Channel, Points) สามารถทำบน server ได้
    fetch('https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.text())
    .then(resText => {
      // สมมติว่าถ้าสคริปต์พบข้อมูลซ้ำ จะส่งกลับข้อความ 'DUPLICATE'
      if (resText.includes('DUPLICATE')) {
        Swal.fire({ icon: 'error', title: 'ข้อมูลซ้ำ', text: 'ท่านได้ลงทะเบียนไว้แล้ว' });
        liff.closeWindow();
      } else {
        // สมัครสำเร็จ
        Swal.fire({ icon: 'success', title: 'สมัครสมาชิกสำเร็จ 🎉', showConfirmButton: false, timer: 2000 });
        setTimeout(() => { liff.closeWindow(); }, 2200);
      }
    })
    .catch(err => {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถบันทึกข้อมูลได้' });
    });
  });
});
