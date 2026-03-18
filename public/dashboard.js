// Dashboard functionality
async function loadDashboardData() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        // Update stats
        document.getElementById('sunucuSayisi').textContent = data.sunucuSayisi || 0;
        document.getElementById('toplamOyuncu').textContent = data.toplamOyuncu || 0;
        document.getElementById('toplamKelime').textContent = data.toplamKelime || 0;
        document.getElementById('aktifOyuncular').textContent = data.aktifOyuncular || 0;
        
        // Update game status
        const statusBadge = document.getElementById('status-badge');
        const oyunDetay = document.getElementById('oyun-detay');
        
        if (data.oyunAktif) {
            statusBadge.className = 'status-badge status-active';
            statusBadge.textContent = '● AKTİF';
            
            let detayHTML = `
                <div style="margin-top: 0.75rem;">
                    <p style="margin-bottom: 0.75rem; font-size: 0.95rem;"><strong>Son Kelime:</strong> ${data.sonKelime || 'Yok'}</p>
                    <div style="display: grid; grid-template-columns: auto 1fr; gap: 1.5rem; align-items: center;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.15rem;">
                            <strong style="font-size: 0.8rem; opacity: 0.8;">Devam Harfi</strong>
                            <span id="currentHarf" style="font-size: 2.5rem; font-weight: bold; color: var(--pico-primary); line-height: 1;">${(data.sonHarf || '').toUpperCase()}</span>
                        </div>
                        <div style="display: flex; gap: 0.6rem; align-items: stretch;">
                            <input 
                                type="text" 
                                id="harfInput" 
                                maxlength="1" 
                                placeholder="Yeni harf"
                                style="width: 75px; text-align: center; font-size: 1.3rem; text-transform: uppercase; padding: 0.7rem; margin: 0; height: 48px; line-height: 1; box-sizing: border-box;"
                                aria-label="Yeni harf"
                            />
                            <button onclick="updateHarf()" class="contrast" style="margin: 0; padding: 0.7rem 1.2rem; height: 48px; line-height: 1; box-sizing: border-box; font-size: 0.95rem;">Değiştir</button>
                        </div>
                    </div>
                    <div id="harfMessage" style="margin-top: 0.6rem; font-size: 0.8rem; text-align: center;"></div>
                </div>
            `;
            
            if (data.anlikSkorlar && data.anlikSkorlar.length > 0) {
                detayHTML += `
                    <div style="margin-top: 1rem;">
                        <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">📊 Anlık Skorlar</h3>
                        ${data.anlikSkorlar.map(s => `
                            <div class="leader-item">
                                <span></span>
                                <span style="font-weight: 500; font-size: 0.9rem;">${s.kullaniciAdi}</span>
                                <span></span>
                                <span style="font-weight: bold; font-size: 0.9rem;">${s.kelimeSayisi} kelime</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            oyunDetay.innerHTML = detayHTML;
            
            // Attach Enter key event to harf input
            const harfInput = document.getElementById('harfInput');
            if (harfInput) {
                harfInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        updateHarf();
                    }
                });
            }
        } else {
            statusBadge.className = 'status-badge status-inactive';
            statusBadge.textContent = '● PASİF';
            oyunDetay.innerHTML = '<p style="margin-top: 0.75rem; opacity: 0.8; font-size: 0.9rem;">Oyun başlatılmayı bekliyor...</p>';
        }
        
        // Update leaders
        const liderlerListesi = document.getElementById('liderler-listesi');
        if (data.liderler && data.liderler.length > 0) {
            liderlerListesi.innerHTML = data.liderler.map((lider, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
                return `
                    <div class="leader-item">
                        <span class="leader-rank">${medal}</span>
                        <span style="font-weight: 500; font-size: 0.9rem;">${lider.kullaniciAdi}</span>
                        <small style="text-align: right; opacity: 0.8; font-size: 0.75rem;">
                            ${lider.kazanilanOyunlar} zafer · ${lider.toplamKelime || 0} kelime
                        </small>
                        <span class="leader-score">${lider.toplamPuan}</span>
                    </div>
                `;
            }).join('');
        } else {
            liderlerListesi.innerHTML = '<p style="text-align: center; padding: 1.5rem; opacity: 0.6; font-size: 0.9rem;">Henüz oyuncu verisi yok</p>';
        }
        
        // Update timestamp
        document.getElementById('last-update').textContent = `Son güncelleme: ${new Date().toLocaleString('tr-TR')}`;
        
    } catch (error) {
        console.error('Dashboard yükleme hatası:', error);
    }
}

// Update harf
async function updateHarf() {
    const input = document.getElementById('harfInput');
    const message = document.getElementById('harfMessage');
    const harf = input.value.trim();
    
    if (!harf) {
        message.innerHTML = '<span style="color: #ef4444;">❌ Lütfen bir harf girin!</span>';
        return;
    }
    
    try {
        const response = await fetch('/api/update-harf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ harf })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('currentHarf').textContent = data.newHarf.toUpperCase();
            message.innerHTML = '<span style="color: #10b981;">✅ ' + data.message + '</span>';
            input.value = '';
            
            // 2 saniye sonra mesajı temizle
            setTimeout(() => {
                message.innerHTML = '';
            }, 2000);
        } else {
            message.innerHTML = '<span style="color: #ef4444;">❌ ' + data.message + '</span>';
        }
    } catch (error) {
        message.innerHTML = '<span style="color: #ef4444;">❌ Bir hata oluştu!</span>';
        console.error('Harf güncelleme hatası:', error);
    }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    
    // Auto reload every 30 seconds
    setInterval(loadDashboardData, 30000);
});
