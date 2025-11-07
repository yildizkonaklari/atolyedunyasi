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

// Form Elementleri
const etkinlikFormu = document.getElementById('etkinlikFormu');
const katilimciRaporu = document.getElementById('katilimciRaporu');
const formBasligi = document.getElementById('formBasligi');
const formButonu = document.getElementById('formButonu');
const formIptalButonu = document.getElementById('formIptalButonu');
const guncellenenEtkinlikId = document.getElementById('guncellenenEtkinlikId');

// Form Alanları
const etkinlikAdi = document.getElementById('etkinlikAdi');
const etkinlikTarihi = document.getElementById('etkinlikTarihi');
const etkinlikSaati = document.getElementById('etkinlikSaati');
const etkinlikGorsel = document.getElementById('etkinlikGorsel');
const etkinlikAciklama = document.getElementById('etkinlikAciklama');

// 2. ADIM: Formu Sıfırla (Düzenlemeden Yeniye Geçiş)
function formuSifirla() {
    etkinlikFormu.reset();
    formBasligi.textContent = 'Yeni Etkinlik Oluştur';
    formButonu.textContent = 'Etkinliği Yayınla';
    formButonu.style.backgroundColor = '#28a745'; // Yeşil
    guncellenenEtkinlikId.value = '';
    formIptalButonu.style.display = 'none';
}

// İptal butonuna basınca formu sıfırla
formIptalButonu.addEventListener('click', formuSifirla);

// 3. ADIM: Form Gönderme (Yeni Ekleme veya Güncelleme)
etkinlikFormu.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = {
        ad: etkinlikAdi.value,
        tarih: etkinlikTarihi.value,
        saat: etkinlikSaati.value,
        gorselUrl: etkinlikGorsel.value,
        aciklama: etkinlikAciklama.value
    };
    
    const etkinlikId = guncellenenEtkinlikId.value;

    if (etkinlikId) {
        // ID varsa, bu bir GÜNCELLEME işlemidir
        db.collection("etkinlikler").doc(etkinlikId).update(formData)
            .then(() => {
                alert("Etkinlik başarıyla güncellendi!");
                formuSifirla();
            })
            .catch((error) => console.error("Güncelleme hatası: ", error));
    } else {
        // ID yoksa, bu bir YENİ EKLEME işlemidir
        db.collection("etkinlikler").add(formData)
            .then(() => {
                alert("Etkinlik başarıyla yayınlandı!");
                etkinlikFormu.reset();
            })
            .catch((error) => console.error("Ekleme hatası: ", error));
    }
    // Not: onSnapshot sayesinde liste otomatik güncellenecek
});

// 4. ADIM: Katılımcı Raporunu Yükle (Gerçek Zamanlı)
function katilimcilariVeEtkinlikleriYukle() {
    
    // 1. Etkinlikleri dinle
    db.collection("etkinlikler").orderBy("tarih", "desc").onSnapshot(async (etkinliklerSnap) => {
        
        // 2. Kayıtları dinle
        db.collection("kayitlar").orderBy("kayitZamani", "desc").onSnapshot((kayitlarSnap) => {
            
            if (etkinliklerSnap.empty) {
                katilimciRaporu.innerHTML = '<p>Henüz oluşturulmuş bir etkinlik yok.</p>';
                return;
            }

            const tumKayitlar = [];
            kayitlarSnap.forEach(doc => {
                tumKayitlar.push(doc.data());
            });

            let raporHtml = '';

            // 3. Raporu oluştur
            etkinliklerSnap.forEach(etkinlikDoc => {
                const etkinlik = etkinlikDoc.data();
                const etkinlikId = etkinlikDoc.id;

                const buEtkinliginKayitlari = tumKayitlar.filter(kayit => kayit.etkinlikId === etkinlikId);

                raporHtml += `
                    <div class="katilimci-etkinlik-grubu" id="${etkinlikId}">
                        <div class="etkinlik-baslik-konteyner">
                            <h3>${etkinlik.ad} (${buEtkinliginKayitlari.length} Katılımcı)</h3>
                            <div class="etkinlik-butonlar">
                                <button class="btn-ikon btn-duzenle" data-id="${etkinlikId}">Düzenle</button>
                                <button class="btn-ikon btn-sil" data-id="${etkinlikId}">Sil</button>
                            </div>
                        </div>
                `;

                if (buEtkinliginKayitlari.length > 0) {
                    raporHtml += '<ul class="katilimci-listesi">';
                    buEtkinliginKayitlari.forEach(kayit => {
                        raporHtml += `
                            <li>
                                <span><strong>Veli:</strong> ${kayit.veliAdi}, <strong>Öğrenci:</strong> ${kayit.ogrenciAdi}</span>
                                <span class="tel">${kayit.telefon}</span>
                            </li>
                        `;
                    });
                    raporHtml += '</ul>';
                } else {
                    raporHtml += '<p class="katilimci-listesi-bos">Bu etkinlik için henüz kayıt yok.</p>';
                }
                raporHtml += '</div>';
            });

            katilimciRaporu.innerHTML = raporHtml;
        });
    });
}

// 5. ADIM: Düzenle ve Sil Butonları
katilimciRaporu.addEventListener('click', (e) => {
    
    const etkinlikId = e.target.dataset.id;
    if (!etkinlikId) return; // Buton dışına tıklandıysa çık

    // "SİL" Butonu
    if (e.target.classList.contains('btn-sil')) {
        if (confirm("Bu etkinliği silmek istediğinizden emin misiniz?\nBu işlem geri alınamaz!")) {
            // Not: İlgili kayıtları silmek ayrı bir işlem gerektirir,
            // şimdilik sadece etkinliği siliyoruz.
            db.collection("etkinlikler").doc(etkinlikId).delete()
                .then(() => alert("Etkinlik silindi."))
                .catch((error) => console.error("Silme hatası: ", error));
        }
    }
    
    // "DÜZENLE" Butonu
    if (e.target.classList.contains('btn-duzenle')) {
        // Firestore'dan o etkinliğin tam verisini çek
        db.collection("etkinlikler").doc(etkinlikId).get().then((doc) => {
            if (doc.exists) {
                const etkinlik = doc.data();
                
                // Formu doldur
                formBasligi.textContent = `Düzenle: ${etkinlik.ad}`;
                etkinlikAdi.value = etkinlik.ad;
                etkinlikTarihi.value = etkinlik.tarih;
                etkinlikSaati.value = etkinlik.saat;
                etkinlikGorsel.value = etkinlik.gorselUrl;
                etkinlikAciklama.value = etkinlik.aciklama;
                
                // ID'yi gizli alana ekle
                guncellenenEtkinlikId.value = etkinlikId;
                
                // Form butonunu "Güncelle" yap
                formButonu.textContent = 'Değişiklikleri Kaydet';
                formButonu.style.backgroundColor = '#007bff'; // Mavi
                formIptalButonu.style.display = 'block'; // İptal butonunu göster
                
                // Sayfanın başına (forma) git
                window.scrollTo(0, 0); 
                
            } else {
                alert("Hata: Etkinlik bulunamadı.");
            }
        });
    }
});

// Sayfa yüklendiğinde raporu yükle
katilimcilariVeEtkinlikleriYukle();
