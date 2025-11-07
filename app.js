// 1. ADIM: Firebase config kodlarınızı BURAYA YAPIŞTIRIN
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Gerekli DOM elementlerini seç
const etkinlikListesi = document.getElementById('etkinlikListesi');
const modal = document.getElementById('kayitModal');
const modalKapat = document.querySelector('.kapat');
const kayitFormu = document.getElementById('kayitFormu');
const modalEtkinlikAdi = document.getElementById('modalEtkinlikAdi');
const modalEtkinlikId = document.getElementById('modalEtkinlikId');

// 2. ADIM: Etkinlikleri Firestore'dan Yükle
// onSnapshot: Veritabanı her değiştiğinde (yeni etkinlik eklendiğinde)
// sayfayı yenilemeye gerek kalmadan listeyi günceller.
db.collection("etkinlikler").orderBy("tarih", "asc")
    .onSnapshot((querySnapshot) => {
        
        if (querySnapshot.empty) {
             etkinlikListesi.innerHTML = '<p>Şu anda planlanmış bir etkinlik bulunmuyor.</p>';
             return;
        }
        
        etkinlikListesi.innerHTML = ''; // Listeyi temizle
        querySnapshot.forEach((doc) => {
            const etkinlik = doc.data();
            const etkinlikId = doc.id; // Firebase'in verdiği belge ID'si

            const tarih = new Date(etkinlik.tarih + 'T' + etkinlik.saat);
            const formatliTarih = tarih.toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
            });
            const formatliSaat = tarih.toLocaleTimeString('tr-TR', {
                hour: '2-digit', minute: '2-digit'
            });

            const kartHtml = `
                <div class="etkinlik-karti">
                    <img src="${etkinlik.gorselUrl}" alt="${etkinlik.ad}" class="etkinlik-gorsel">
                    <div class="etkinlik-bilgi">
                        <h3>${etkinlik.ad}</h3>
                        <p class="etkinlik-tarih">📅 ${formatliTarih} - ${formatliSaat}</p>
                        <p>${etkinlik.aciklama}</p>
                        <button class="btn btn-katil" data-etkinlik-id="${etkinlikId}" data-etkinlik-adi="${etkinlik.ad}">
                            Hemen Katıl!
                        </button>
                    </div>
                </div>
            `;
            etkinlikListesi.innerHTML += kartHtml;
        });
    });

// 3. ADIM: "Hemen Katıl" Butonlarına Tıklama Olayı
etkinlikListesi.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-katil')) {
        const id = e.target.dataset.etkinlikId;
        const ad = e.target.dataset.etkinlikAdi;
        
        modal.style.display = 'flex';
        modalEtkinlikAdi.textContent = ad;
        modalEtkinlikId.value = id;
    }
});

// 4. ADIM: Modal Kapatma
modalKapat.onclick = () => {
    modal.style.display = 'none';
}
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// 5. ADIM: Kayıt Formunu Gönderme
kayitFormu.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const veliAdi = document.getElementById('veliAdi').value;
    const ogrenciAdi = document.getElementById('ogrenciAdi').value;
    const telefon = document.getElementById('telefon').value;
    const etkinlikId = modalEtkinlikId.value;
    const etkinlikAdi = modalEtkinlikAdi.textContent;

    // Veriyi "kayitlar" koleksiyonuna kaydet
    db.collection("kayitlar").add({
        veliAdi: veliAdi,
        ogrenciAdi: ogrenciAdi,
        telefon: telefon,
        etkinlikId: etkinlikId,
        etkinlikAdi: etkinlikAdi,
        kayitZamani: new Date()
    })
    .then(() => {
        alert("Kaydınız başarıyla alındı! Teşekkür ederiz.");
        modal.style.display = 'none';
        kayitFormu.reset();
    })
    .catch((error) => {
        console.error("Kayıt sırasında hata: ", error);
        alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    });
});
