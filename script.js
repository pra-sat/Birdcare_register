// ตรวจสอบการโหลด LIFF SDK


let userId = '';
const liffId = '2007421084-0VKG7anQ';
const webhookURL = 'https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec';
const confirmText = 'ตกลง';

function main(){
    // 1.liff init
    // 2.get profile
    liff.init({liffId: liffId});
    liff.ready.then(() => {
        if(!liff.isLoggedIn()){
            liff.login();
        }        
        liff.getProfile().then((profile) => {            
            userId = profile.userId;
            console.log(profile);
        });
    });    
}

main()


