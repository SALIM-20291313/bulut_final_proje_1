# Proje 1: Video Akışı ve İşleme Uygulaması

## Bulut Bilişim Final Projesi

---

## İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Mimari Genel Bakış](#mimari-genel-bakış)
3. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
4. [Sistem Mimarisi](#sistem-mimarisi)
5. [Klasör Yapısı](#klasör-yapısı)
6. [Bileşenler](#bileşenler)
7. [API Tasarımı](#api-tasarımı)
8. [Veritabanı Tasarımı](#veritabanı-tasarımı)
9. [Bulut Entegrasyonu](#bulut-entegrasyonu)
10. [Kurulum](#kurulum)
11. [Çıktılar ve Başarı Kriterleri](#çıktılar-ve-başarı-kriterleri)

---

## Proje Özeti

Bu proje, **gerçek zamanlı video akışı yönetimi** ve **bulut tabanlı video analizi** sağlayan bir platformdur. Kullanıcılar video yükleyebilir, canlı yayın yapabilir ve yapay zeka destekli video analiz hizmetlerinden faydalanabilir.

### Hedefler

- RTMP/WebRTC protokolleri ile canlı video akışı yönetimi
- AWS Rekognition, Azure Video Indexer ve Google Cloud Video Intelligence API ile otomatik video analizi
- Nesne tanıma, yüz tanıma, etiketleme, metin çıkarma
- Bulut depolama ve işleme çözümleri ile ölçeklenebilir altyapı

---

## Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Web Browser  │  │ Mobile App   │  │ OBS/Stream   │                  │
│  │ (React.js)   │  │ (PWA)        │  │ Software     │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
└─────────┼─────────────────┼─────────────────┼──────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│                    (Express.js + JWT Auth)                               │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  STREAMING      │   │  CORE BACKEND   │   │  VIDEO PROCESSOR│
│  SERVER         │   │  (Node.js)      │   │  (Worker)       │
│                 │   │                 │   │                 │
│ • RTMP Server   │   │ • User Mgmt     │   │ • Frame Extract │
│ • WebRTC SFU    │   │ • Video CRUD    │   │ • Cloud API Call│
│ • HLS Transcoder│   │ • Stream Mgmt   │   │ • Result Store  │
│                 │   │ • WebSocket     │   │ • Thumbnail Gen │
└────────┬────────┘   └───────┬─────────┘   └────────┬────────┘
         │                    │                      │
         ▼                    ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
│  ┌──────────────┐   ┌──────────────┐                                   │
│  │   MongoDB    │   │ Cloud Storage │                                   │
│  │ (Metadata)   │   │ (S3/Blob/GCS)│                                   │
│  └──────────────┘   └──────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLOUD AI SERVICES                                 │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐      │
│  │ AWS Rekognition│ │Azure Video     │ │Google Cloud Video      │      │
│  │ • Object Detect│ │Indexer         │ │Intelligence            │      │
│  │ • Face Analysis│ │ • Face Detect  │ │ • Label Detection      │      │
│  │ • Text Extract │ │ • Transcription│ │ • Shot Change          │      │
│  │ • Moderation   │ │ • OCR          │ │ • Explicit Content     │      │
│  └────────────────┘ └────────────────┘ └────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Veri Akışı

```
[Kullanıcı] → [Video Yükleme/Canlı Yayın] → [Streaming Server]
                                                  │
                    ┌─────────────────────────────┤
                    ▼                             ▼
           [Cloud Storage]              [Core Backend API]
                    │                             │
                    ▼                             ▼
           [Video Processor]            [MongoDB]
                    │
                    ▼
           [Cloud AI API]
                    │
                    ▼
           [Analiz Sonuçları DB] ←→ [Frontend Gösterimi]
```

---

## Kullanılan Teknolojiler

### Backend
| Teknoloji       | Kullanım Alanı                          |
|-----------------|-----------------------------------------|
| Node.js         | Ana backend API sunucusu                |
| Express.js      | REST API framework                      |
| Socket.IO       | Gerçek zamanlı bildirimler & WebSocket   |
| JWT             | Kimlik doğrulama                        |
| Multer          | Dosya yükleme yönetimi                  |

### Video Akışı
| Teknoloji       | Kullanım Alanı                          |
|-----------------|-----------------------------------------|
| Node-Media-Server | RTMP/HTTP-FLV/WebSocket-FLV sunucusu  |
| FFmpeg          | Video transcoding, frame çıkarma        |
| WebRTC          | Tarayıcı tabanlı canlı yayın            |
| HLS.js          | HTTP Live Streaming oynatıcı            |

### Video İşleme & AI
| Teknoloji                        | Kullanım Alanı             |
|----------------------------------|----------------------------|
| AWS Rekognition                  | Nesne/yüz/metin tanıma     |
| Azure Video Indexer              | Video transkripsiyon, OCR  |
| Google Cloud Video Intelligence  | Etiketleme, sahne analizi  |

### Veritabanı
| Teknoloji    | Kullanım Alanı                        |
|--------------|---------------------------------------|
| MongoDB      | Video metadata, analiz sonuçları      |

### Bulut Platformları
| Platform      | Hizmetler                                        |
|---------------|--------------------------------------------------|
| AWS           | S3 (depolama), Kinesis Video Streams, Rekognition|
| Azure         | Blob Storage, Media Services, Video Indexer      |
| Google Cloud  | Cloud Storage, Video Intelligence API            |

### Frontend
| Teknoloji  | Kullanım Alanı            |
|------------|---------------------------|
| React.js   | Web arayüzü               |
| Video.js   | Video oynatıcı            |
| Tailwind CSS | Stil framework          |

---

## Sistem Mimarisi

### 1. Frontend (React.js)
- Kullanıcı kaydı ve girişi
- Video yükleme arayüzü
- Canlı yayın izleme sayfası (HLS/WebRTC)
- Analiz sonuçlarının görselleştirilmesi
- Dashboard (yüklenen videolar, analiz geçmişi)

### 2. Core Backend (Node.js + Express)
- RESTful API endpoint'leri
- Kullanıcı yönetimi (JWT authentication)
- Video CRUD işlemleri
- Streaming oturum yönetimi
- Analiz işlemi tetikleme ve sonuç sorgulama
- WebSocket ile gerçek zamanlı durum bildirimleri

### 3. Streaming Server (Node-Media-Server)
- RTMP ingestion (OBS, FFmpeg'den yayın alma)
- HTTP-FLV ve WebSocket-FLV dağıtımı
- HLS transcoding (`.m3u8` segmentleri)
- WebRTC sinyalizasyonu

### 4. Video Processor (Worker Service)
- Video dosyasını frame'lere ayırma (FFmpeg)
- Bulut AI API'lerine frame gönderimi
- Analiz sonuçlarını toplama ve MongoDB'ye kaydetme
- Thumbnail oluşturma
- Asenkron iş kuyruğu ile yönetim (Bull/BullMQ + Redis)

---

## Klasör Yapısı

```
Proje 1 - Video Akışı ve İşleme Uygulaması/
├── server.js                    # Ana sunucu giriş noktası
├── package.json                 # Bağımlılıklar ve script'ler
├── .env                         # Ortam değişkenleri
├── README.md                    # Proje dokümantasyonu
├── adimlar.md                   # Geliştirme adımları
├── config/
│   └── db.js                    # MongoDB bağlantı konfigürasyonu
├── models/
│   ├── Video.js                 # Video veri modeli
│   └── Analysis.js              # Analiz veri modeli
├── routes/
│   ├── videoRoutes.js           # Video route'ları
│   ├── streamRoutes.js          # Canlı yayın route'ları
│   └── analysisRoutes.js        # Analiz route'ları
├── controllers/
│   ├── videoController.js       # Video iş mantığı
│   ├── streamController.js      # Yayın iş mantığı
│   └── analysisController.js    # Analiz iş mantığı
├── services/
│   └── aiService.js             # Bulut AI entegrasyon katmanı
├── views/                       # EJS şablonları
├── uploads/                     # Yüklenen videolar
├── media/                       # RTMP medya dosyaları
└── node_modules/                # npm paketleri
```

---

## API Tasarımı

### Kimlik Doğrulama

| Method | Endpoint             | Açıklama               |
|--------|----------------------|------------------------|
| POST   | /api/auth/register   | Kullanıcı kaydı        |
| POST   | /api/auth/login      | Kullanıcı girişi       |
| POST   | /api/auth/refresh    | Token yenileme         |

### Video Yönetimi

| Method | Endpoint                    | Açıklama                    |
|--------|-----------------------------|-----------------------------|
| POST   | /api/videos/upload          | Video yükleme               |
| GET    | /api/videos                 | Kullanıcının videoları      |
| GET    | /api/videos/:id             | Video detayı                |
| DELETE | /api/videos/:id             | Video silme                 |
| GET    | /api/videos/:id/stream      | Video oynatma (HLS)         |

### Canlı Yayın

| Method | Endpoint                    | Açıklama                    |
|--------|-----------------------------|-----------------------------|
| POST   | /api/streams/create         | Yayın başlatma              |
| GET    | /api/streams/:id            | Yayın durumu                |
| DELETE | /api/streams/:id            | Yayını sonlandırma          |
| GET    | /api/streams/:id/watch      | İzleme bağlantısı           |

### Video Analizi

| Method | Endpoint                       | Açıklama                     |
|--------|--------------------------------|------------------------------|
| POST   | /api/analysis/:videoId/start   | Analiz başlatma              |
| GET    | /api/analysis/:videoId/status  | Analiz durumu                |
| GET    | /api/analysis/:videoId/results | Analiz sonuçları             |

---

## Veritabanı Tasarımı

### MongoDB (Video Metadata & Analiz)

```javascript
// Video dokümanı
{
  _id: ObjectId,
  userId: UUID,
  title: String,
  description: String,
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,           // byte
  duration: Number,       // saniye
  resolution: String,     // "1920x1080"
  cloudProvider: String,  // "aws" | "azure" | "gcp"
  cloudUrl: String,       // Bulut depolama URL'i
  thumbnailUrl: String,
  status: String,         // "uploading" | "processing" | "ready" | "failed"
  createdAt: Date,
  updatedAt: Date
}

// Analiz sonucu dokümanı
{
  _id: ObjectId,
  videoId: ObjectId,
  provider: String,        // "aws" | "azure" | "gcp"
  status: String,          // "pending" | "processing" | "completed" | "failed"
  results: {
    labels: [{
      name: String,
      confidence: Number,
      timestamp: Number    // videodaki saniye
    }],
    faces: [{
      position: { x: Number, y: Number, w: Number, h: Number },
      confidence: Number,
      emotions: [String],
      ageRange: { low: Number, high: Number },
      timestamp: Number
    }],
    textDetections: [{
      text: String,
      confidence: Number,
      timestamp: Number
    }],
    objects: [{
      name: String,
      confidence: Number,
      boundingBox: Object,
      timestamp: Number
    }],
    moderation: [{
      category: String,
      confidence: Number,
      timestamp: Number
    }],
    transcriptions: [{
      text: String,
      language: String,
      timestamp: Number
    }]
  },
  processingTime: Number,  // ms
  createdAt: Date
}
```

---

## Bulut Entegrasyonu

### Strateji Tasarım Deseni (Strategy Pattern)

Her bulut sağlayıcısı için ortak bir arayüz tanımlanır, arka planda ilgili SDK çağrılır:

```
AIService Interface
├── analyzeVideo(videoUrl, options)
├── detectLabels(frame)
├── detectFaces(frame)
├── detectText(frame)
├── moderateContent(frame)
└── getResults(jobId)

Uygulamalar:
├── AWSRekognitionService
├── AzureVideoIndexerService
└── GoogleVideoIntelligenceService
```

### AWS Rekognition

```javascript
// Örnek: Etiket tespiti
const params = {
  Image: { S3Object: { Bucket: 'video-frames', Name: 'frame_001.jpg' } },
  MaxLabels: 20,
  MinConfidence: 70
};
const result = await rekognition.detectLabels(params).promise();
```

### Azure Video Indexer

```javascript
// Örnek: Video analizi başlatma
const result = await videoIndexer.uploadVideo({
  videoUrl: 'https://storage.blob.core.windows.net/video.mp4',
  name: 'analiz-video',
  language: 'tr-TR',
  privacy: 'private'
});
```

### Google Cloud Video Intelligence

```javascript
// Örnek: Etiket tespiti
const [operation] = await videoIntelligence.annotateVideo({
  inputUri: 'gs://bucket/video.mp4',
  features: ['LABEL_DETECTION', 'FACE_DETECTION', 'SHOT_CHANGE_DETECTION']
});
```

---

## Kurulum

### Ön Gereksinimler

- Node.js 18+
- MongoDB 7+
- FFmpeg

### Ortam Değişkenleri (.env)

```env
# Sunucu
PORT=3000
NODE_ENV=development

# Veritabanı
MONGODB_URI=mongodb://localhost:27017/video_streaming
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# AWS
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=video-streaming-bucket

# Azure
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_VIDEO_INDEXER_KEY=your_vi_key

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json
GCP_PROJECT_ID=your_project_id
GCS_BUCKET=video-streaming-bucket

# Streaming
RTMP_PORT=1935
HTTP_PORT=8000
HLS_PORT=8080
```

### Docker ile Başlatma

```bash
# Tüm servisleri başlat
docker-compose up -d

# Servis durumlarını kontrol et
docker-compose ps

# Logları izle
docker-compose logs -f
```

### Manuel Başlatma

```bash
# Backend
cd backend && npm install && npm run dev

# Streaming Server
cd streaming-server && npm install && npm start

# Video Processor
cd video-processor && npm install && npm run worker

# Frontend
cd frontend && npm install && npm run dev
```

---

## Çıktılar ve Başarı Kriterleri

| # | Çıktı                               | Açıklama                                      |
|---|-------------------------------------|-----------------------------------------------|
| 1 | Gerçek zamanlı video akışı yönetimi | RTMP/WebRTC ile canlı yayın altyapısı         |
| 2 | Video üzerinden nesne tanıma        | AWS Rekognition ile obje/nesne tespiti        |
| 3 | Video üzerinden etiketleme          | Google Video Intelligence ile otomatik etiket |
| 4 | Yüz tanıma ve duygu analizi         | AWS Rekognition + Azure Face API              |
| 5 | Metin çıkarma (OCR)                 | Azure Video Indexer ile video içi OCR         |
| 6 | Bulut tabanlı depolama              | S3 / Azure Blob / GCS entegrasyonu            |
| 7 | İçerik moderasyonu                  | AWS Rekognition + Google SafeSearch           |
| 8 | Çoklu bulut sağlayıcı desteği       | AWS, Azure ve GCP entegrasyonu                |
| 9 | RESTful API                         | Video yönetimi ve analiz endpoint'leri         |
| 10| Web arayüzü                         | React.js tabanlı kullanıcı dashboard'u        |

---

## Proje Zaman Çizelgesi

| Hafta | Aşama                                         |
|-------|-----------------------------------------------|
| 1     | Proje kurulumu, Docker yapılandırması         |
| 2     | Backend API geliştirme (auth, CRUD)           |
| 3     | Streaming server entegrasyonu (RTMP/WebRTC)   |
| 4     | Frontend geliştirme (React.js)                |
| 5     | AWS Rekognition entegrasyonu                  |
| 6     | Azure Video Indexer entegrasyonu              |
| 7     | Google Cloud Video Intelligence entegrasyonu  |
| 8     | Test, optimizasyon, dokümantasyon             |

---

## Lisans

Bu proje **Bulut Bilişim Final Projesi** kapsamında geliştirilmiştir.
