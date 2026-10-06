# aer0knight0.github.io

Aer0Knight geliştirici ana sayfası: https://aer0knight0.github.io

Instagram bio'sundaki link buraya gelir. DoseDial ve ileride çıkacak diğer uygulamalar burada
listelenir. Tek dosyalık statik sayfa: `index.html` ve `assets/`. Derleme adımı yok.

Kaynak bu repo. `main`'e push edilen her şey GitHub Pages'te birkaç dakika içinde yayına girer.
(Eskiden `Aer0Knight0/DoseDial` reposunda `marketing/homepage/` altında duruyordu, oradan buraya taşındı.)

## Sık güncellenenler (index.html'deki ayar bloğu)

| Ayar | Ne zaman |
|---|---|
| `instagram` | Şu an `https://www.instagram.com/aer0knight/`. Boşken Instagram butonları gizli, yerine "çok yakında" rozeti görünür. |
| `COUNTER_URL` | Railway'deki sayaç servisinin adresi (aşağıya bak). Boşken sayım yapılmaz, footer'daki sayaç gizli kalır. |
| `dosedialPlay` | DoseDial Play'de yayına çıkınca. Dolunca rozet "Hemen indir" olur, "Kapalı testte" etiketi kalkar. Aynı linki `dosedial/index.html`'deki `PLAY` ayarına da yaz. |

## Ziyaretçi sayacı (`counter/`)

Footer'daki "👁 1.234 ziyaret" satırı Railway'de çalışan küçük bir Node servisinden gelir.
Bağımlılığı yok, sadece `server.js`. Sayı volume'daki `count.json` içinde durur, IP diske yazılmaz.

- `POST /hit`: sayıyı 1 artırır. Sadece `ALLOWED_ORIGINS`'teki sitelerden kabul edilir, IP başına dakikada 20 sınırı var.
- `GET /count`: sayıyı okur.
- `GET /health`: Railway sağlık kontrolü.

Sayfa aynı tarayıcıyı günde bir kez sayar (`localStorage`'daki `visitDay`). Aynı gün tekrar
gelince sadece okur. Yani sayı "günlük tekil ziyaret". Servis cevap vermezse sayaç gizli kalır.

Şu anki kurulum: Railway'de `aer0knight-counter` projesi, `counter` servisi,
adres `https://counter-production-2254.up.railway.app`, volume `/data`.

**Otomatik deploy yok.** Servis repo'ya bağlı (root `counter`) ama Railway'de `main` için deploy
tetikleyicisi kurulu değil, yani push yapınca sayaç kendiliğinden güncellenmez. `counter/` değişince
elle deploy et: Railway → `counter` servisi → **Deployments** → **Deploy** (en son `main` commit'i),
ya da Railway GraphQL API'deki `serviceInstanceDeployV2(serviceId, environmentId, commitSha)` ile.
Sayfadaki değişiklikler zaten sayacı ilgilendirmez.

### Railway'e kurulum (bir kerelik)

Baştan kurmak gerekirse:


1. Railway → **New Project** → **Deploy from GitHub repo** → `Aer0Knight0/aer0knight0.github.io`.
2. Servisin **Settings** sekmesi:
   - **Root Directory**: `counter`
   - **Branch**: `main`
   - **Networking → Generate Domain**: çıkan `https://....up.railway.app` adresi `COUNTER_URL` olur.
   - **Watch Paths** (isteğe bağlı): `counter/**`. Sadece sayfa değişince sayaç boşuna yeniden deploy olmaz.
3. Servise sağ tık → **Attach Volume**, mount path `/data`. Railway `RAILWAY_VOLUME_MOUNT_PATH`'i
   kendisi verir, kod onu kullanır. Volume yoksa her deploy'da sayı sıfırlanır.
4. **Variables** (isteğe bağlı): `ALLOWED_ORIGINS`. Varsayılanı `https://aer0knight0.github.io`.
   Birden fazla adres virgülle ayrılır.
5. Workspace **Usage → Usage Limits**: harcama sınırını $2 yap. Beklenen maliyet ayda ~$0.5–1,
   Hobby planın $5'lık kredisinin içinde kalır.

Kontrol: tarayıcıda `https://<adres>/count` açınca `{"count":0}` görünmeli.

Lokal deneme: `cd counter && ALLOWED_ORIGINS=http://localhost:8000 PORT=8787 node server.js`,
sonra `index.html`'de `COUNTER_URL = 'http://localhost:8787'`.

## Uygulama sayfaları

Her uygulamanın kendi klasörü var; ana sayfadaki kartı oraya açılır. Şimdilik sadece DoseDial:

- `dosedial/index.html`: tanıtım, gizlilik özeti, gizlilik politikası ve kullanım koşulları
  linkleri, SSS (açılır-kapanır sorular) ve destek e-postası. TR/EN aynı ana sayfadaki gibi
  (`data-i18n` + `T.en`). `?lang=en` ile İngilizce açılır.
- `dosedial/gizlilik-politikasi.html`, `kullanim-kosullari.html`, `privacy-policy.html`,
  `terms-of-use.html`: yasal metinler. Eskiden ayrı `dosedial-legal` reposundaydı, buraya taşındı.
  **Güncel kaynak artık bu sayfalar.** DoseDial reposundaki `legal/` klasörü 9 Eylül 2026'da kaldı,
  oradan geri kopyalama. Metni değiştirirken sadece `<article class="card paper">` içine dokun,
  çevresindeki menü ve tema kalsın. Tarih satırı `<p class="meta"><span>…</span><span>…</span></p>`,
  önemli uyarılar `<p class="note warn">`. Metin uygulamanın yaptığıyla birebir aynı olmalı
  (izinler, yedek konumu, paylaşım yolları); uygulama değişirse buraya da yansıt.
- `dosedial/kvkk-aydinlatma-metni.html`, `kvkk-notice.html`: KVKK m.10 aydınlatma metni (TR/EN).
  Gizlilik politikasındaki bilgilere dayanır; politika değişirse bunu da güncelle.
- `dosedial/doc.css`: bu belge sayfalarının ortak teması (sitenin koyu tasarımı).
- `dosedial-legal/*.html`: eski adresler (`/dosedial-legal/...`) için yönlendirme. Uygulamanın
  içinde ve Play Console'da bu adresler kayıtlı, o yüzden silme. `dosedial-legal` reposu
  silinince (ya da onun Pages'i kapatılınca) bu klasör devreye girer ve eski linkler yeni
  sayfalara gider.

## Yeni uygulama eklemek

"Yakında" kartlarından birini (`<article class="card soon">`) açık bir uygulama kartına çevir.
DoseDial kartı (`<article class="card feat">`) örnek alınabilir. Metinler Türkçe olarak HTML'de,
İngilizceleri `T.en` sözlüğünde durur. `data-i18n` anahtarı ikisinde de aynı olmalı. Kendi
sayfası olacaksa `dosedial/` klasörünü kopyalayıp başlangıç olarak kullan.

## Dosyalar

- `assets/logo.webp`: Aer0Knight logosu (devreli kurt kafası, halka ve roket). `favicon.png` (64px) ve
  `apple-touch-icon.png` (180px) aynı görselden üretildi
- `assets/og.jpg`: link paylaşınca çıkan önizleme görseli (1200×630), kaynağı `kaynak/og.html`
- `assets/dosedial-*.webp`: DoseDial reposundaki `marketing/reels/gorseller*` ekranlarından 540 px genişliğe küçültülmüş
- `counter/`: ziyaretçi sayacı servisi (Railway). GitHub Pages bunu da dosya olarak yayınlar, içinde gizli bir şey yok.
- `kaynak/instagram-profil-1080.png`: Instagram profil fotoğrafı (daire kırpmaya uygun)

Yerelde bakmak için: repo kökünde `python3 -m http.server`, sonra
`http://localhost:8000`. Dosyayı çift tıklayıp açınca font yüklenmez.
