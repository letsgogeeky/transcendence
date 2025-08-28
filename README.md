#

# <p align="center">**ft_transcendence**</p>

# <p align="center"> 🕹️ A realtime web-based pong game, _as our graduation project at [42](https://www.42network.org) 🎓_ </p>

### 👥 Team members & collaboration: 
- 🛠️ [Ramy](https://github.com/letsgogeeky): Team & Project Management, Devops, containerization & overall infrastructure 
- 🔐 [Bori](https://github.com/pisakbori): User Management, authentication (2FA & remote), database & microservices for the backend
- 🎮 [Alex](https://github.com/aoprea42): Game component with 3D graphics & AI opponent
- 🎨 [Mary Kate](https://github.com/MaryKateEvan): front-end and overall design across the website
- 💬 [Timo](https://github.com/TimoKillinger): live-chat component (tournament & private chat)

#

## 📝 Description


## 👀 Preview:


## 🎯 Main Components of the project:


## ⚙️ Installation

1. Clone the repository:

```bash
git clone https://github.com/letsgogeeky/transcendence
```

2. Navigate to the project's directory:

```bash
cd transcendence
```
[❕ _Make sure you have <img src="https://skillicons.dev/icons?i=docker" alt="Docker" height="12"> [*Docker*](https://www.docker.com) installed, so that you can move on to..._]


3. Boot everything up with the help of our magic [`Makefile`](Makefile):

```bash
make up
```

4. Here I should explain the situation with the .env creation

## 🚀 Usage

You can access the **main platform-website** from any browser of yours at: **`https://localhost`** — and from there on we'd like to believe the navigation is pretty straightforward! _(Check the components of the website more analytically above so that you know what to expect and look for. )_

### ➕ Additional available links in the platform:
- `http://localhost:3001`: access to Grafana
- `http://localhost:9090`: access to Prometheus
- `http://localhost:9100/metrics`: node Exporter
- `http://localhost:9113/metrics`:nginx Exporter 
- `https://localhost/chat/docs`: chat API docs
- `https://localhost/match/docs`: match API docs

### 🔍 More specific **Makefile commands** available:
- `make down`: stops the platform
- `make restart`: restarts the platform
- `make logs`: shows the docker logs
- `make generate-certs`: generates the necessary certificates
- `make clean`: stops the platform and removes the containers


## 🙌 &nbsp;Acknowledgements