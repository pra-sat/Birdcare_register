// ตรวจสอบการโหลด LIFF SDK
(function() {
    const liffScript = document.createElement('script');
    liffScript.src = 'https://static.line-scdn.net/liff/edge/2.3/sdk.js';
    liffScript.onload = () => {
        console.log('LIFF SDK loaded successfully'); // ยังคงไว้ใน console
        initLIFF();
    };
    liffScript.onerror = () => {
        Swal.fire({
            icon: 'error',
            title: '❗️เกิดปัญหาการเชื่อต่อ LIFF SDK--1',
            text: 'กรุณาลองใหม่อีกครั้งหรือติดต่อ Admin',
            confirmButtonText: 'ตกลง'
        });
    };
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
        console.log('Starting LIFF initialization with liffId:', liffId);
        await liff.init({ liffId });
        console.log('LIFF initialized successfully');

        if (!liff.isInClient()) {
            showSwal({
                icon: 'error',
                title: '❗️ข้อผิดพลาด-0',
                text: 'กรุณาเปิดหน้านี้ในแอป LINE เท่านั้น',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        console.log('Checking login status...');
        if (liff.isLoggedIn()) {
            console.log('User is logged in');
            const profile = await liff.getProfile();
            userId = profile.userId;
            console.log('Profile retrieved:', profile);
            const userIdInput = document.getElementById('userId');
            if (userIdInput) {
                userIdInput.value = userId || 'no-userId';
                console.log('userId set to:', userIdInput.value);
            } else {
                console.error('userId input element not found');
            }
            if (!userId || userId === 'no-userId') {
                showSwal({
                    icon: 'error',
                    title: '❗️ข้อผิดพลาด-1',
                    text: 'ไม่สามารถดึง UserID จาก LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
                    confirmButtonText: 'ตกลง'
                });
            }
        } else {
            console.log('User not logged in, redirecting to login...');
            liff.login({ redirectUri: window.location.href });
        }
    } catch (err) {
        console.error('LIFF Init Error:', err);
        showSwal({
            icon: 'error',
            title: '❗️เกิดปัญหาการเชื่อต่อ LIFF SDK-2',
            text: 'กรุณาลองใหม่อีกครั้งหรือติดต่อ Admin',
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

    if (!brand || !model || !year || !category) {
        console.error('Required form elements not found');
        return;
    }

    if (typeof carData === 'undefined') {
        console.error('carData is not defined. Ensure all_car_model.js is loaded.');
        showSwal({
            icon: 'error',
            title: '❗️ข้อผิดพลาด-3',
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

    // Update model list based on brand (รองรับพิมพ์ฟรี)
    brand.addEventListener('input', () => {
        model.value = '';
        year.value = '';
        category.value = 'Unknown';
        document.getElementById('modelList').innerHTML = '';
        document.getElementById('yearList').innerHTML = '';
        const brandVal = brand.value.trim();
        console.log('Selected Brand:', brandVal);
        if (carData[brandVal]) {
            Object.keys(carData[brandVal].models).forEach(modelName => {
                const opt = document.createElement('option');
                opt.value = modelName;
                document.getElementById('modelList').appendChild(opt);
            });
        } else {
            console.warn(`No models found for brand: ${brandVal}. Proceeding with manual input.`);
        }
    });

    // Update year list and category based on model (รองรับพิมพ์ฟรี)
    model.addEventListener('input', () => {
        year.value = '';
        category.value = 'Unknown';
        document.getElementById('yearList').innerHTML = '';
        const brandVal = brand.value.trim();
        const modelVal = model.value.trim();
        console.log('Selected Model:', modelVal);
        if (carData[brandVal]?.models[modelVal]) {
            carData[brandVal].models[modelVal].years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                document.getElementById('yearList').appendChild(opt);
            });
            category.value = carData[brandVal].models[modelVal].category;
        } else {
            console.warn(`No years found for brand: ${brandVal}, model: ${modelVal}. Proceeding with manual input.`);
        }
    });

    // เมื่อคลิกสมัครสมาชิก
    document.getElementById('registerForm').addEventListener('submit', async e => {
        e.preventDefault();

        if (!/^\d{10}$/.test(phone.value)) {
            showSwal({
                icon: 'error',
                title: '❗️เบอร์โทรไม่ถูกต้อง',
                text: 'กรุณากรอกเบอร์โทร 10 หลัก',
                confirmButtonText: 'ตกลง'
            });
            return;
        }
        if (!userId || userId === 'no-userId') {
            showSwal({
                icon: 'error',
                title: '❗️ข้อผิดพลาด-4',
                text: 'ไม่สามารถดึง UserID จาก LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        const url = webhookURL;
        const data = {
            userId: userId,
            phone: phone.value,
            name: name.value,
            brand: brand.value,
            model: model.value,
            year: year.value,
            category: category.value || 'Unknown'
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const text = await response.text();
            console.log('Server Response:', text);
            console.log('Data to Send:', data);
            if (text.includes('OK')) {
                showSwal({
                    icon: 'success',
                    title: '✅ สมัครสมาชิกสำเร็จ'
                }).then(() => {
                    document.getElementById('registerForm').reset();
                    liff.closeWindow();
                });
            } else if (text.includes('Duplicate')) {
                showSwal({
                    icon: 'error',
                    title: '❌ มีข้อมูลอยู่แล้วในระบบ'
                }).then(() => {
                    liff.closeWindow();
                });
            } else if (text.includes('ERROR')) {
                showSwal({
                    icon: 'error',
                    title: '❗️เกิดข้อผิดพลาด-5',
                    text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่หรือติดต่อ Admin',
                    confirmButtonText: 'ตกลง'
                });
            } else {
                showSwal({
                    icon: 'error',
                    title: '❗️เกิดข้อผิดพลาด-6',
                    text: 'การตอบกลับจากเซิร์ฟเวอร์ไม่ถูกต้อง กรุณาลองใหม่',
                    confirmButtonText: 'ตกลง'
                });
            }
        } catch (err) {
            console.error('Fetch Error:', err);
            showSwal({
                icon: 'error',
                title: '❗️เกิดข้อผิดพลาดในการส่งข้อมูล-7',
                text: `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้: ${err.message} กรุณาลองใหม่หรือติดต่อ Admin`,
                confirmButtonText: 'ตกลง'
            });
        }
    });
});
