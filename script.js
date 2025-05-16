src="https://static.line-scdn.net/liff/edge/2/sdk.js";
src="https://cdn.jsdelivr.net/npm/sweetalert2@11";
    
const webhookURL = 'https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec';
let userId = '';
const liffId = '2007421084-6bzYVymA';

// สคริปต์จัดการ UI และ LIFF
window.addEventListener('DOMContentLoaded', () => {
    // เริ่ม LIFF application
    liff.init({liffId: liffId});
        .then(() => {
            if (liff.isLoggedIn()) {
                liff.getProfile().then(profile => {
                    userId = profile.userId;
                    document.getElementById('userId').value = userId;
                }).catch(err => {
                    console.error('Error getting profile:', err);
                });
            }
        })
        .catch(err => {
            console.error('LIFF Initialization failed', err);
        });

    const brandInput = document.getElementById('brandInput');
    const modelInput = document.getElementById('modelInput');
    const yearInput = document.getElementById('yearInput');
    const modelList = document.getElementById('modelList');
    const yearList = document.getElementById('yearList');
    let selectedCategory = '';

    // เมื่อเลือกยี่ห้อ เปลี่ยนรุ่นใน datalist
    brandInput.addEventListener('change', () => {
        const brand = brandInput.value;
        // เคลียร์ datalist รุ่นและปี
        modelList.innerHTML = '';
        yearList.innerHTML = '';
        yearInput.value = '';
        selectedCategory = '';

        if (carData[brand]) {
            // เพิ่ม option ให้รุ่นต่างๆ ในแบรนด์นี้
            const models = Object.keys(carData[brand]);
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                modelList.appendChild(option);
            });
        }
    });

    // เมื่อเลือกหรือกรอกรุ่น เปลี่ยนปีใน datalist และเก็บหมวดหมู่
    modelInput.addEventListener('change', () => {
        const brand = brandInput.value;
        const model = modelInput.value;
        yearList.innerHTML = '';
        yearInput.value = '';
        selectedCategory = '';

        if (carData[brand] && carData[brand][model]) {
            const years = carData[brand][model].years;
            years.forEach(y => {
                const option = document.createElement('option');
                option.value = y;
                yearList.appendChild(option);
            });
            // เก็บประเภทจากข้อมูลรุ่นรถ
            selectedCategory = carData[brand][model].category;
        }
    });

    // เมื่อคลิกสมัครสมาชิก
    document.getElementById('registerBtn').addEventListener('click', () => {
        const userId = document.getElementById('userId').value.trim();
        const name = document.getElementById('nameInput').value.trim();
        const phone = document.getElementById('phoneInput').value.trim();
        const brand = brandInput.value.trim();
        const model = modelInput.value.trim();
        const year = yearInput.value.trim();

        // ตรวจสอบข้อมูลที่กรอก
        if (!userId || !name || !phone || !brand || !model || !year) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณากรอกข้อมูลให้ครบถ้วน'
            });
            return;
        }

        // ส่งข้อมูลไปที่ Google Apps Script
        const url = 'https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec';
        const params = new URLSearchParams({
            userId: userId,
            name: name,
            phone: phone,
            brand: brand,
            model: model,
            year: year,
            category: selectedCategory
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
