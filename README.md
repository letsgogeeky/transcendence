#

# <p align="center">**ft_transcendence**</p>

## <p align="center"> 🕹️ A realtime web-based pong game, _as our graduation project at [42](https://www.42network.org) 🎓_ </p>

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
<!-- [❕ _Make sure you have <img src="https://skillicons.dev/icons?i=docker" alt="Docker" height="12"> [*Docker*](https://www.docker.com) installed, so that you can move on to..._] -->

<div align="center">

[❕ _Make sure you have <img src="https://skillicons.dev/icons?i=docker" alt="Docker" height="12"> [*Docker*](https://www.docker.com) installed, so that you can move on to..._]

</div>

3. Boot everything up with the help of our magic [`Makefile`](Makefile):

```bash
make up
```

> 🏁 _And if everything boots correctly you should see this terminal output at the end:_
![makeup_succesful_output](readme_assets/makeup_success_output.png)

## 🚀 Usage

Now you can go to any broswer and access the website by simply typing:

![broswer_image](readme_assets/localhost_broswer.png)

which should serve you the following main page:

![main_page_video](readme_assets/main_page.gif)

❗️ At this point though, you would only be able to see the main pages _(Welcome, Log In & Sign Up pages)_ without being able to actually sign up & access the game.

💁‍♀️ Let's clarify now **WHY**'s that and what you can do to fully browse the website... 💪

### 🔑 The importance of the missing SECRETS in the .env file

When you first first do `make up` you get some certificates generated (`server.crt`, `server.csr`, `server.key`) among with the following **`.env`** file:

![env_file](readme_assets/envfile.png)




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