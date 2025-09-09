# 🛠️ Services Configuration

## 🎯 Core Application Services

### 1. Auth Service
- **Location**: `./backend/auth`
- **Port**: 8081
- **Protocol**: HTTP
- **Database**: SQLite at `/app/db/auth.db`

### 2. Match Service
- **Location**: `./backend/match`
- **Port**: 8082
- **Protocol**: HTTP
- **Database**: SQLite at `/app/db/match.db`

### 3. Chat Service
- **Location**: `./backend/chat`
- **Port**: 8083
- **Protocol**: HTTP
- **Database**: SQLite at `/app/db/chat.db`

### 4. Frontend Service
- **Location**: `./frontend`
- **Port**: 3000
- **Protocol**: HTTP

## ⚙️ Infrastructure Services

### 1. Nginx
- **Location**: `./infra/nginx`
- **Ports**:
  - 80 (HTTP)
  - 443 (HTTPS)
- **Protocol**: HTTP/HTTPS

### 2. Nginx Exporter
- **Image**: `nginx/nginx-prometheus-exporter`
- **Port**: 9113
- **Protocol**: HTTP

### 3. Node Exporter
- **Image**: `prom/node-exporter`
- **Port**: 9100
- **Protocol**: HTTP

### 4. Prometheus
- **Image**: `prom/prometheus`
- **Port**: 9090
- **Protocol**: HTTP

### 5. Grafana
- **Image**: `grafana/grafana`
- **Port**: 3001
- **Protocol**: HTTP

## 🛜 Network Configuration
All services are connected through a bridge network named `app-network`

## 💾 Volume Mounts
Common volumes shared across services:
- `./certs` (SSL certificates)
- `./uploads` (file storage)
- `./db` (database files)

Each service has its own source code mounted from its respective directory