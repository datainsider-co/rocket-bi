### 😍 Datainsider project

- Xem [docs](./docs) trước khi sử dụng

### ✈ Getting started

#### 🔭 Without docker

```sh
yarn
yarn serve
```
Open web with link: http://localhost:8080

#### 🧪 Run your unit tests

```sh
yarn test
```

### 🔌 Deploy production

```sh
chmod u+x build_docker_image.sh
./build_docker_image.sh
docker-compose up -d
```

Open web with link: http://localhost:5050

### 🐛 Problem

#### import `scss` error in **intelliJ** 😭

##### Resolve

- Step 1: Make sure to specify a path to `node_modules\@vue\cli-service\webpack.config.js` in **Settings | Languages & Frameworks | JavaScript | Webpack**
- Step 2:

Using **~@**

```scss
@import '~@/themes/...';
```

# Chỉnh host về local.datainsider.co

```bash
127.0.0.1       localhost # << append here
# to
127.0.0.1       localhost local.datainsider.co
```
