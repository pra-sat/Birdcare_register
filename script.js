const liffId = '2007421084-6bzYVymA';
let userId = '';

async function initLIFF() {
    try {
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
        } else {
            const profile = await liff.getProfile();
            userId = profile.userId || 'no-userId';
            document.getElementById('userId').value = userId;
        }
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ LINE ได้', 'error');
    }
}

window.addEventListener('load', initLIFF);

document.addEventListener('DOMContentLoaded', () => {
    const phone = document.getElementById('phone');
    const name = document.getElementById('name');
    const brand = document.getElementById('brand');
    const model = document.getElementById('model');
    const year = document.getElementById('year');

    // Populate brand list
    for (const brandName in carData) {
        const opt = document.createElement('option');
        opt.value = brandName;
        document.getElementById('brandList').appendChild(opt);
    }

    // Update models when brand changes
    brand.addEventListener('input', () => {
        model.value = '';
        year.value = '';
        document.getElementById('modelList').innerHTML = '';
        document.getElementById('yearList').innerHTML = '';
        if (carData[brand.value]) {
            for (const modelName in carData[brand.value].models) {
                const opt = document.createElement('option');
                opt.value = modelName;
                document.getElementById('modelList').appendChild(opt);
            }
        }
    });

    // Update years when model changes
    model.addEventListener('input', () => {
        year.value = '';
        document.getElementById('yearList').innerHTML = '';
        const selected = carData[brand.value]?.models[model.value];
        if (selected) {
            selected.years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                document.getElementById('yearList').appendChild(opt);
            });
        }
    });

    // Form submission
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!/^\d{10}$/.test(phone.value)) {
            Swal.fire('ข้อผิดพลาด', 'เบอร์โทรไม่ถูกต้อง', 'warning');
            return;
        }

        if (!userId || userId === 'no-userId') {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถดึง UserID จาก LINE ได้', 'error');
            return;
        }

        const data = {
            userId,
            phone: phone.value,
            name: name.value,
            brand: brand.value,
            model: model.value,
            year: year.value
        };

        const response = await fetch('https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success').then(() => {
                document.getElementById('registerForm').reset();
                liff.closeWindow();
            });
        } else {
            Swal.fire('ผิดพลาด', 'สมัครไม่สำเร็จ กรุณาลองใหม่', 'error');
        }
    });
});
