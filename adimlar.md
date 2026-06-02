# Proje 1 - Geliştirme Adımları (Rapor için)

## Proje: Video Akışı ve İşleme Uygulaması
## Tarih: 2 Haziran 2026
## Ders: Bulut Bilişim Final Projesi

---

## Proje Genel Bakış

Bu proje, gerçek zamanlı video akışı yönetimi ve bulut tabanlı video analizi sağlayan bir web uygulamasıdır. Kullanıcılar video yükleyebilir, RTMP protokolü ile canlı yayın yapabilir ve AWS Rekognition, Azure Video Indexer, Google Cloud Video Intelligence API'leri ile videolarını analiz edebilir.

**Kullanılan Teknolojiler:**
- **Backend:** Node.js + Express.js
- **Veritabanı:** JSON dosya tabanlı (`lib/db.js` - kendi yazdığımız hafif veritabanı)
- **Frontend:** EJS (Embedded JavaScript Templates)
- **Video Akışı:** RTMP (Node-Media-Server)
- **Bulut AI API'leri:** AWS Rekognition, Azure Video Indexer, Google Cloud Video Intelligence
- **Ek araçlar:** Multer (dosya yükleme), UUID (benzersiz ID), Dotenv (ortam değişkenleri)

---

## Adım 1: Proje Klasör Yapısının Oluşturulması

**Yapılanlar:**
- Ana proje klasörü oluşturuldu: `Proje 1 - Video Akışı ve İşleme Uygulaması`
- Alt klasörler oluşturuldu: `models/`, `routes/`, `controllers/`, `services/`, `views/`, `public/`, `uploads/`, `media/`

**Klasör Yapısı:**
```
Proje 1/
├── models/          # MongoDB veri modelleri
├── routes/          # Express route tanımları
├── controllers/     # İş mantığı kontrolcüleri
├── services/        # Harici servis entegrasyonları
├── views/           # EJS şablon dosyaları
├── public/          # Statik dosyalar (CSS, JS)
├── uploads/         # Yüklenen videoların depolandığı klasör
└── media/           # Node-Media-Server medya dosyaları
```

---

## Adım 2: package.json ve Bağımlılıkların Tanımlanması

**Yapılanlar:**
- `package.json` dosyası oluşturuldu
- Proje bağımlılıkları belirlendi ve `npm install` ile yüklendi

**Kullanılan npm Paketleri:**

| Paket | Versiyon | Kullanım Amacı |
|-------|----------|----------------|
| express | ^4.18.2 | Web sunucusu ve REST API framework'ü |
| mongoose | ^7.6.3 | MongoDB ODM (Object Document Mapper) |
| ejs | ^3.1.9 | Sunucu taraflı HTML şablon motoru |
| multer | ^1.4.5 | Çok parçalı form verisi (video dosyası) yükleme |
| node-media-server | ^2.6.2 | RTMP/HTTP-FLV akış sunucusu |
| dotenv | ^16.3.1 | Ortam değişkenleri yönetimi (.env dosyası) |
| uuid | ^9.0.0 | Benzersiz kimlik (UUID) oluşturma |
| fluent-ffmpeg | ^2.1.2 | FFmpeg ile video işleme (opsiyonel) |
| nodemon | ^3.0.1 | Geliştirme sırasında otomatik yeniden başlatma |

---

## Adım 3: Ortam Değişkenleri (.env) Dosyasının Oluşturulması

**Yapılanlar:**
- `.env` dosyası oluşturuldu
- Sunucu portu, veritabanı bağlantısı, bulut API anahtarları için değişkenler tanımlandı

**Tanımlanan Değişkenler:**
- `PORT=3000` - Web sunucu portu
- `MONGODB_URI` - MongoDB bağlantı adresi
- `RTMP_PORT=1935` - RTMP yayın portu
- `HTTP_PORT=8000` - HTTP-FLV akış portu
- AWS, Azure, GCP kimlik bilgileri (opsiyonel)

**Açıklama:** API anahtarları olmadan da uygulama çalışır; mock (örnek) analiz sonuçları döndürülür.

---

## Adım 4: Ana Sunucu Dosyasının (server.js) Oluşturulması

**Yapılanlar:**
- `server.js` ana giriş dosyası oluşturuldu
- Express.js sunucusu yapılandırıldı
- MongoDB bağlantısı kuruldu
- EJS template engine ayarlandı
- Node-Media-Server RTMP sunucusu entegre edildi
- Route'lar bağlandı

**Mimari Bileşenler:**

```
server.js
├── Express App (Port 3000)
│   ├── Statik dosya sunumu (/uploads, /public)
│   ├── EJS view engine
│   ├── JSON body parser
│   └── Route bağlantıları
├── MongoDB Bağlantısı
└── Node-Media-Server
    ├── RTMP Server (Port 1935)
    └── HTTP Server (Port 8000)
```

**Kod Açıklaması:**
- `express.static()` ile yüklenen videolar tarayıcıdan erişilebilir hale getirildi
- `mongoose.connect()` ile MongoDB'ye bağlanıldı
- `NodeMediaServer` RTMP yayınlarını almak ve HTTP-FLV olarak dağıtmak için yapılandırıldı
- Üç ana route grubu bağlandı: video, stream, analysis

---

## Adım 5: Veritabanı Katmanının Oluşturulması (`lib/db.js`)

**Önemli Not:** Projede MongoDB yerine kendi yazdığımız JSON dosya tabanlı hafif bir veritabanı kullanılmıştır. Bu sayede harici bir veritabanı kurulumuna gerek kalmaz. Veriler `data/` klasöründe JSON dosyaları olarak saklanır.

**`lib/db.js` Özellikleri:**
- Mongoose benzeri API (`.find()`, `.findById()`, `.create()`, `.save()`, `.findByIdAndDelete()`)
- Veriler otomatik olarak `data/Video.json` ve `data/Analysis.json` dosyalarına kaydedilir
- `.sort()`, `.limit()` zincirleme sorgu desteği
- `.save()` metodu ile doküman güncelleme desteği

### 5.1 Video Modeli (`models/Video.js`)

**Alanlar:**
| Alan | Tip | Açıklama |
|------|-----|----------|
| title | String | Video başlığı (zorunlu) |
| description | String | Video açıklaması |
| filename | String | Dosya adı (UUID + uzantı) |
| originalName | String | Orijinal dosya adı |
| mimeType | String | MIME tipi (video/mp4 vb.) |
| size | Number | Dosya boyutu (byte) |
| duration | Number | Video süresi (saniye) |
| resolution | String | Çözünürlük (1920x1080) |
| thumbnailPath | String | Küçük resim yolu |
| streamKey | String | Canlı yayın anahtarı (UUID) |
| status | Enum | Durum: uploading, ready, processing, completed, failed |
| cloudProvider | Enum | Bulut sağlayıcı: aws, azure, gcp, local |

### 5.2 Analiz Modeli (`models/Analysis.js`)

**Alanlar:**
| Alan | Tip | Açıklama |
|------|-----|----------|
| videoId | ObjectId | Referans video ID |
| provider | Enum | AI sağlayıcı: aws, azure, gcp |
| status | Enum | Durum: pending, processing, completed, failed |
| labels | Array | Tespit edilen etiketler (isim, güven, zaman) |
| faces | Array | Yüz tespitleri (yaş, cinsiyet, duygu) |
| objects | Array | Nesne tespitleri |
| textDetections | Array | OCR metin tespitleri |
| moderation | Array | İçerik moderasyon sonuçları |
| transcription | Array | Ses transkripsiyonu |
| processingTimeMs | Number | İşlem süresi (milisaniye) |

---

## Adım 6: Route Tanımlarının Oluşturulması

### 6.1 Video Route'ları (`routes/videoRoutes.js`)

| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | /api/videos/upload | Video yükleme sayfası |
| GET | /api/videos/dashboard | Video listesi sayfası |
| GET | /api/videos/watch/:id | Video izleme sayfası |
| POST | /api/videos/upload | Video yükleme (form) |
| GET | /api/videos | Tüm videolar (JSON API) |
| GET | /api/videos/:id | Tek video (JSON API) |
| DELETE | /api/videos/:id | Video silme |
| POST | /api/videos | Video yükleme (JSON API) |

**Multer Yapılandırması:**
- Dosyalar `uploads/` klasörüne UUID ile kaydedilir
- Maksimum dosya boyutu: 500MB
- Kabul edilen formatlar: mp4, webm, avi, mov

### 6.2 Stream Route'ları (`routes/streamRoutes.js`)

| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| POST | /api/streams/create | Yeni canlı yayın oluştur |
| GET | /api/streams/watch/:id | Canlı yayın izleme sayfası |
| DELETE | /api/streams/:id | Yayını sonlandır |
| GET | /api/streams | Tüm yayınlar (JSON) |

### 6.3 Analiz Route'ları (`routes/analysisRoutes.js`)

| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | /api/analysis/:videoId | Analiz sayfası |
| POST | /api/analysis/:videoId/start | Analiz başlat |
| GET | /api/analysis/:videoId/results | Analiz sonuçları (JSON) |
| GET | /api/analysis/:videoId/status | Analiz durumu (JSON) |

---

## Adım 7: Controller (İş Mantığı) Katmanının Oluşturulması

### 7.1 Video Controller (`controllers/videoController.js`)

**Fonksiyonlar:**
- `uploadPage()` - Yükleme sayfasını render eder
- `watchPage()` - Video izleme sayfasını render eder
- `dashboard()` - Video listesi sayfasını render eder
- `upload()` - Dosya yükleme işlemini gerçekleştirir, MongoDB'ye kaydeder
- `getAll()` - Tüm videoları JSON formatında döndürür
- `getOne()` - Tek video detayını döndürür
- `delete()` - Videoyu veritabanından ve diskten siler
- `apiUpload()` - API üzerinden video yükleme (JSON yanıt)

### 7.2 Stream Controller (`controllers/streamController.js`)

**Fonksiyonlar:**
- `createStream()` - UUID ile benzersiz stream key oluşturur, RTMP URL döndürür
- `watchStream()` - Canlı yayın izleme sayfasını render eder
- `stopStream()` - Yayını sonlandırır, durumu 'completed' yapar
- `listStreams()` - Aktif yayınları listeler

### 7.3 Analiz Controller (`controllers/analysisController.js`)

**Fonksiyonlar:**
- `analyzePage()` - Analiz sayfasını ve geçmiş analizleri render eder
- `startAnalysis()` - AI analizini başlatır, sonuçları MongoDB'ye kaydeder
- `getResults()` - Analiz sonuçlarını JSON döndürür
- `getAnalysisStatus()` - Analiz durumunu sorgular

---

## Adım 8: Bulut AI Servis Katmanının Oluşturulması (`services/aiService.js`)

**Strateji Tasarım Deseni (Strategy Pattern) uygulandı:**

```
analyzeVideo(videoPath, provider)
├── provider = 'aws'   → analyzeWithAWS()
├── provider = 'azure' → analyzeWithAzure()
└── provider = 'gcp'   → analyzeWithGCP()
```

**Her sağlayıcı için iki çalışma modu:**
1. **Gerçek API Modu:** Eğer `.env` dosyasında API anahtarları tanımlanmışsa, gerçek bulut API'leri çağrılır
2. **Mock (Örnek) Modu:** API anahtarı yoksa, demo amaçlı örnek analiz sonuçları döndürülür

### AWS Rekognition Entegrasyonu
- `aws-sdk` paketi ile Rekognition servisi kullanılır
- `detectLabels()` metodu ile etiket tespiti yapılır
- Dönen etiketler normalize edilerek ortak formata dönüştürülür

### Azure Video Indexer Entegrasyonu
- REST API üzerinden Azure Video Indexer'a istek atılır
- `Ocp-Apim-Subscription-Key` header'ı ile kimlik doğrulama
- Video analizi, OCR ve transkripsiyon özellikleri

### Google Cloud Video Intelligence Entegrasyonu
- `@google-cloud/video-intelligence` paketi kullanılır
- `annotateVideo()` metodu ile etiket, yüz ve nesne tespiti
- Long-running operation (uzun süren işlem) desteği

### Mock Veri (Demo Modu)
Her sağlayıcı için örnek analiz sonuçları:
- **AWS:** İnsan, araba, bina, ağaç etiketleri; yüz analizi; OCR metin
- **Azure:** Kişi, araç, doğa etiketleri; transkripsiyon
- **GCP:** İngilizce etiketler; sahne değişim tespiti

---

## Adım 9: Frontend Arayüzünün Oluşturulması (EJS Templates)

### Oluşturulan Sayfalar:

| Dosya | Açıklama |
|-------|----------|
| `views/header.ejs` | Tüm sayfalarda ortak üst kısım (nav, CSS stilleri) |
| `views/footer.ejs` | Tüm sayfalarda ortak alt kısım |
| `views/index.ejs` | Ana sayfa - proje tanıtımı, özellikler |
| `views/upload.ejs` | Video yükleme sayfası - sürükle bırak desteği |
| `views/dashboard.ejs` | Video listesi - grid görünüm, durum rozetleri |
| `views/watch.ejs` | Video oynatma sayfası - HTML5 video player |
| `views/stream.ejs` | Canlı yayın sayfası - RTMP bilgileri, OBS yönergesi |
| `views/analysis.ejs` | Analiz sonuçları - etiketler, yüzler, OCR, moderasyon |
| `views/404.ejs` | 404 hata sayfası |
| `views/error.ejs` | Genel hata sayfası |

### Tasarım Özellikleri:
- Koyu tema (dark mode) - `#0f172a` arka plan, `#1e293b` kart rengi
- Mavi vurgu rengi (`#3b82f6`) - butonlar, başlıklar
- Responsive grid düzeni - mobil uyumlu
- Durum rozetleri (badge) - video durumunu renklerle gösterir
- Sürükle-bırak video yükleme alanı
- Bulut sağlayıcı rozetleri (AWS turuncu, Azure mavi, GCP kırmızı/mavi)

### Frontend JavaScript İşlevleri:
- **upload.ejs:** Dosya sürükle-bırak, dosya bilgisi gösterme, yükleme durumu
- **dashboard.ejs:** Fetch API ile video silme, sayfa yenileme
- **watch.ejs:** Fetch API ile video silme, yönlendirme
- **stream.ejs:** Fetch API ile yeni yayın oluşturma, yayın bilgisi gösterme
- **analysis.ejs:** Fetch API ile analiz başlatma, sonuç bekleme, otomatik yenileme

---

## Adım 10: Projenin Çalıştırılması

### Gereksinimler:
- **Sadece Node.js 18+** (başka hiçbir şey gerekmez!)

### Başlatma Adımları:

```bash
# 1. Proje klasörüne gidin
cd "Proje 1 - Video Akışı ve İşleme Uygulaması"

# 2. Bağımlılıkları yükleyin (zaten yapıldı)
npm install

# 3. Uygulamayı başlatın (MongoDB gerekmez!)
npm start
```

### Çalışan Servisler:
| Servis | Adres | Açıklama |
|--------|-------|----------|
| Web Arayüzü | http://localhost:3000 | Ana uygulama |
| RTMP Sunucu | rtmp://localhost:1935/live | OBS yayın adresi |
| HTTP-FLV | http://localhost:8000 | Akış dağıtımı |

---

## Proje Mimarisi Özeti

```
┌──────────────────────────────────────────┐
│            Kullanıcı / Tarayıcı           │
│   (http://localhost:3000)                 │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│         Express.js Sunucusu (Port 3000)   │
│  ┌────────────────────────────────────┐  │
│  │  EJS Templates (Sunucu Render)     │  │
│  │  index | upload | dashboard | etc  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  REST API (JSON)                   │  │
│  │  /api/videos | /api/streams | ...  │  │
│  └────────────────────────────────────┘  │
└──────┬───────────────┬───────────────────┘
       │               │
       ▼               ▼
┌─────────────┐ ┌─────────────────────────┐
│  JSON DB    │ │  Node-Media-Server       │
│  (data/)    │ │  RTMP:1935 HTTP:8000    │
└─────────────┘ └───────────┬─────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  OBS / FFmpeg   │
                   │  (Yayın Kaynağı) │
                   └─────────────────┘

       ┌───────────────────────────────────┐
       │  aiService.js                     │
       │  ┌─────────────────────────────┐  │
       │  │ AWS Rekognition             │  │
       │  │ Azure Video Indexer         │  │
       │  │ Google Cloud Video Intel.   │  │
       │  │ Mock Data (Demo)            │  │
       │  └─────────────────────────────┘  │
       └───────────────────────────────────┘
```

---

## Elde Edilen Çıktılar

| # | Çıktı | Durum |
|---|-------|-------|
| 1 | Video yükleme ve yönetim sistemi | Tamamlandı |
| 2 | RTMP canlı yayın altyapısı | Tamamlandı |
| 3 | AWS Rekognition entegrasyonu | Tamamlandı (mock destekli) |
| 4 | Azure Video Indexer entegrasyonu | Tamamlandı (mock destekli) |
| 5 | Google Cloud Video Intelligence entegrasyonu | Tamamlandı (mock destekli) |
| 6 | Nesne tanıma ve etiketleme | Tamamlandı |
| 7 | Yüz tanıma ve duygu analizi | Tamamlandı |
| 8 | Metin çıkarma (OCR) | Tamamlandı |
| 9 | İçerik moderasyonu | Tamamlandı |
| 10 | Web tabanlı kullanıcı arayüzü | Tamamlandı |

---

## Karşılaşılan Zorluklar ve Çözümler

1. **MongoDB Bağımlılığı:** MongoDB'nin kurulu olmaması projeyi çalıştırmayı zorlaştırıyordu. Çözüm: `lib/db.js` ile kendi JSON dosya tabanlı veritabanımızı yazdık. Veriler `data/` klasöründe saklanır, Mongoose API'si ile uyumlu çalışır.

2. **Büyük Dosya Yükleme:** 500MB'a kadar video yüklemesi desteklenir. Multer limit aşımında hata döndürür.

3. **API Anahtarı Olmaması:** Gerçek bulut API'leri için ücretli hesap gerekir. Çözüm: Mock veri modu ile demo çalışır.

4. **RTMP Port Çakışması:** 1935 portu başka bir uygulama tarafından kullanılıyor olabilir. `.env` dosyasından değiştirilebilir.

---

## Proje Dosya Listesi

```
Proje 1 - Video Akışı ve İşleme Uygulaması/
├── server.js                    # Ana sunucu giriş noktası
├── package.json                 # Bağımlılıklar ve script'ler
├── .env                         # Ortam değişkenleri
├── README.md                    # Proje dokümantasyonu
├── adimlar.md                   # Bu dosya - geliştirme adımları
├── lib/
│   └── db.js                    # JSON dosya tabanlı veritabanı
├── data/                        # Veritabanı JSON dosyaları (otomatik oluşur)
├── models/
│   ├── Video.js                 # Video veri modeli
│   └── Analysis.js              # Analiz veri modeli
├── routes/
│   ├── videoRoutes.js           # Video route'ları + Multer
│   ├── streamRoutes.js          # Canlı yayın route'ları
│   └── analysisRoutes.js        # Analiz route'ları
├── controllers/
│   ├── videoController.js       # Video iş mantığı
│   ├── streamController.js      # Yayın iş mantığı
│   └── analysisController.js    # Analiz iş mantığı
├── services/
│   └── aiService.js             # Bulut AI entegrasyon katmanı
├── views/
│   ├── header.ejs               # Ortak üst kısım
│   ├── footer.ejs               # Ortak alt kısım
│   ├── index.ejs                # Ana sayfa
│   ├── upload.ejs               # Video yükleme sayfası
│   ├── dashboard.ejs            # Video listesi
│   ├── watch.ejs                # Video izleme
│   ├── stream.ejs               # Canlı yayın
│   ├── analysis.ejs             # Analiz sonuçları
│   ├── 404.ejs                  # 404 sayfası
│   └── error.ejs                # Hata sayfası
├── uploads/                     # Yüklenen videolar
├── media/                       # RTMP medya dosyaları
└── node_modules/                # npm paketleri
```

---

## Adım 11: AWS Rekognition Frame-by-Frame Analiz (S3 Alternatifi)

**Yapılanlar:**
- S3 + Rekognition Video API erişim sorunu nedeniyle alternatif yönteme geçildi
- `@ffmpeg-installer/ffmpeg` ile videodan 6 kare çıkarılıyor (eşit aralıklarla)
- Her kare AWS Rekognition Image API'ye gönderiliyor (`detectLabels`, `detectFaces`, `detectText`, `detectModerationLabels`)
- S3 kullanmaz, direkt `Bytes` parametresi ile çalışır
- Zaman damgaları kare pozisyonundan hesaplanır
- MinConfidence %75 filtresi aktif

**Kazanım:** S3 izni olmadan da Rekognition çalışır.

---

## Adım 12: Arayüz İyileştirmeleri

**Yapılanlar:**
- Dashboard ve Analizler sayfası: Her video için **"Canlı Yayın Başlat"** butonu eklendi
- Analizler sayfası: Her video için **"Sil"** butonu eklendi
- Canlı yayın izleme: **"Yayını Durdur"** butonu eklendi
- Nav bar: **"Canlı Yayın"** sekmesi eklendi
- Dashboard: Sadece yüklenen videolar gösteriliyor (stream'ler filtrelendi)
- Ana sayfa: Azure ve GCP referansları kaldırıldı, sadece AWS kaldı
- Tüm analiz kartlarına **silme butonu** eklendi

---

## Adım 13: Canlı Kamera + Gerçek Zamanlı AWS Rekognition Analizi

**Kullanılan Teknolojiler:**
- **WebRTC / getUserMedia:** Tarayıcıdan web kamerası erişimi
- **Socket.IO:** Tarayıcı → backend gerçek zamanlı veri akışı
- **FFmpeg (pipe):** Web kamerası görüntüsünü RTMP'ye çevirme
- **AWS Rekognition (Image API):** Her 3 saniyede bir kare analizi

**Mimari:**
```
Web Kamerası (tarayıcı)
    │
    ├─► getUserMedia → <video> → <canvas> → toDataURL()
    │       │
    │       └─► MediaRecorder → socket.io → backend FFmpeg stdin → RTMP
    │
    └─► setInterval(3s):
            canvas.toDataURL() → POST /api/live/analyze → AWS Rekognition
            → JSON yanıt → DOM güncelle (sayfa yenilenmez)
```

**Yeni API Endpoint'i:**
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/live/analyze | Base64 frame al, Rekognition'a gönder, sonuç döndür |

**Socket.IO Olayları:**
| Olay | Yön | Açıklama |
|------|-----|----------|
| live:start | Client → Server | Yayını başlat, FFmpeg pipe oluştur |
| live:data | Client → Server | MediaRecorder veri parçası |
| live:ready | Server → Client | FFmpeg pipe hazır |
| live:stop | Client → Server | Yayını durdur |

**Yeni Servis Fonksiyonu (`aiService.js`):**
```js
analyzeFrame(imageBuffer) → { labels, faces, texts, moderation }
```
Tek bir kareyi Rekognition'a gönderir, S3 kullanmaz.

**Frontend Arayüzü:**
- Sol panel: Kamera önizlemesi + kontrol butonları
- Sağ panel: Canlı analiz sonuçları (her 3 saniyede bir güncellenir)
- Etiketler, yüz tespitleri, metinler anlık akar

---

## Adım 14: GitHub'a Yükleme

**Yapılanlar:**
- `git init` ile repo başlatıldı
- `.gitignore` ile `.env`, `node_modules/`, `data/`, `uploads/` korundu
- 28+ dosya commit edildi
- `https://github.com/SALIM-20291313/bulut_final_proje_1.git` adresine push edildi

**Güvenlik:** `.env` dosyası (AWS key'ler) GitHub'a YÜKLENMEDİ.

---

## Güncel Çıktı Listesi

| # | Çıktı | Durum |
|---|-------|-------|
| 1 | Video yükleme ve yönetim sistemi | Tamamlandı |
| 2 | RTMP canlı yayın altyapısı | Tamamlandı |
| 3 | Web kamerası → RTMP canlı yayın | Tamamlandı |
| 4 | AWS Rekognition frame analizi | Tamamlandı |
| 5 | Canlı kamera + Rekognition (3 saniyede bir) | Tamamlandı |
| 6 | Nesne tanıma ve etiketleme | Tamamlandı |
| 7 | Yüz tanıma, yaş/cinsiyet/duygu analizi | Tamamlandı |
| 8 | Metin çıkarma (OCR) | Tamamlandı |
| 9 | İçerik moderasyonu | Tamamlandı |
| 10 | Zaman damgalı analiz sonuçları | Tamamlandı |
| 11 | Bounding box koordinatları | Tamamlandı |
| 12 | Analiz geçmişi ve silme | Tamamlandı |
| 13 | Web tabanlı kullanıcı arayüzü | Tamamlandı |
| 14 | GitHub'a güvenli yükleme | Tamamlandı |
