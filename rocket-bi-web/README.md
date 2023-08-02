### 😍 Rocket.BI project

- Documents and project standard in [here](./docs)

### ✈ Getting started

#### 🛠️ Project setup requirements

- [Node 12](https://nodejs.org/en/download/)
- [Vue 2 CLI](https://cli.vuejs.org/guide/installation.html)
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [Optional][docker](https://docs.docker.com/get-docker/)
- [Optional][docker-compose](https://docs.docker.com/compose/install/)

#### 🚀 Start project in local

```sh
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

### 🐛 Troubleshooting

#### import `scss` error in **intelliJ** 😭

**Resolve**

- Step 1: Make sure to specify a path to `node_modules\@vue\cli-service\webpack.config.js` in **Settings | Languages &
  Frameworks | JavaScript | Webpack**
- Step 2:

  - Using **~@** instead of **src** in import scss file
  - Using **~** instead of **node_modules** in import scss file

```scss
// bad 👎
@import 'src/themes/app.scss';
@import 'node_modules/bootstrap/scss/alert.scss';

// good 👍
@import '~@/themes/app.scss';
@import '~bootstrap/scss/alert.scss';
```

#### Modify localhost to datainsider.local

You need to modify localhost to datainsider.local for verify login with google, recaptcha, ...

Edit file `/etc/hosts` and append `local.datainsider.co` to localhost

```bash
127.0.0.1       localhost # << append here
# to
127.0.0.1       localhost datainsider.local
```
