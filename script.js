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

            if (userId === 'no-userId') {
                Swal.fire({
                    icon: 'error',
                    title: 'ข้อผิดพลาด',
                    text: 'ไม่สามารถดึง UserID จาก LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
                    confirmButtonText: 'ตกลง'
                });
            }
        }
    } catch (err) {
        console.error('LIFF Init Error:', err);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถเชื่อมต่อกับ LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
            confirmButtonText: 'ตกลง'
        });
    }
}

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

    // Handle form submission
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
                title: 'ข้อผิดพลาด-2',
                text: 'ไม่สามารถดึง UserID จาก LINE ได้ กรุณาลองใหม่หรือติดต่อ Admin',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        const data = {
            userId: userId,
            phone: phone.value,
            name: name.value,
            brand: brand.value,
            model: model.value,
            year: year.value,
            category: category.value || 'Unknown'
        };

        fetch('https://script.google.com/macros/s/1hCAY1GrDph0iPJOP74wPF-08Zc3ZSxX2R-YGYeTutc4/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'สมัครสมาชิกสำเร็จ!',
                    text: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว',
                    confirmButtonText: 'ตกลง'
                }).then(() => {
                    document.getElementById('registerForm').reset();
                });
            } else {
                throw new Error('สมัครไม่สำเร็จ');
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message,
                confirmButtonText: 'ตกลง'
            });
        });
    });
});
