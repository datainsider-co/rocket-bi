<template>
  <div class="container-fluid h-100">
    <div class="row h-100">
      <div class="col-xl-4 w-100 p-0 left-screen">
        <div class="deco2">
          <img alt="deco2" src="@/assets/icon/ic_deco_2.svg" />
        </div>
        <div class="auth">
          <div class="auth-logo">
            <a href="#" class="main-logo">
              <img src="@/assets/logo/logo.svg" alt="DataInsider-logo" />
            </a>
          </div>
          <div class="auth-form regular-text">
            <div class="lb-forgot-password" v-if="showIconBack">
              <router-link to="/login"><img alt="icon back" src="@/assets/icon/ic_arrow_left.svg"/></router-link>
              <label v-if="isResendEmailRoute">Back to login</label>
              <label v-else>Forgot password</label>
            </div>
            <div class="auth-form-change" v-else>
              <router-link to="/login">Log in</router-link>
              <router-link to="/signup"> Sign up</router-link>
            </div>
            <hr />
            <transition name="slide" mode="out-in">
              <router-view></router-view>
            </transition>
          </div>
        </div>
        <div class="deco1">
          <img alt="deco1" id="deco1" src="@/assets/icon/ic_deco_1.svg" />
        </div>
      </div>
      <div class="col-md-8 w-100 p-0 right-screen d-none d-xl-block">
        <div>
          <div class="deco3">
            <img alt="deco3" src="@/assets/icon/ic_deco_3.svg" />
          </div>
          <div class="deco-ill">
            <img alt="deco illustration" src="@/assets/icon/ic_illustration.svg" />
          </div>
          <div class="deco4">
            <img alt="deco4" src="@/assets/icon/ic_deco_4.svg" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Provide, Vue } from 'vue-property-decorator';
import SignIn from './components/SignIn/SignIn.vue';
import SignUp from './components/SignUp/SignUp.vue';
import { Routers } from '@/shared';

@Component({
  components: {
    SignIn,
    SignUp
  }
})
export default class Login extends Vue {
  get showIconBack(): boolean {
    const currentRoute = this.$router.currentRoute.name;
    switch (currentRoute) {
      case Routers.ForgotPassword:
      case Routers.PasswordRecovery:
      case Routers.ResendEmail:
        return true;
      default:
        return false;
    }
  }

  get isResendEmailRoute(): boolean {
    return this.$router.currentRoute.name === Routers.ResendEmail;
  }
}
</script>

<style lang="scss">
.deco2 {
  position: absolute;
  top: 1rem;
  right: 0;
}

.auth-logo {
  .main-logo {
    margin: auto;
    width: 332px;
    height: 42px;
    display: flex;
    text-align: center;
    align-items: center;
    img {
      height: 40px;
      margin-right: 8px;
    }
    &:hover {
      text-decoration: none;
    }
  }
}

.left-screen {
  height: 100%;
  width: 100%;
  background-color: var(--primary);
  position: relative;
  z-index: 0;
}

.right-screen {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--accent);
}

.auth {
  display: flex;
  flex-flow: column;
  position: relative;
  top: 13%;
  z-index: 1;
}

.slide-enter-active,
slide-leave-active {
  transition: opacity 0.5s, transform 1s;
}

.slide-enter,
slide-leave-to {
  opacity: 0;
  transform: translateX(-300%);
}

.auth-logo {
  margin-bottom: 3rem;
}

.auth-form {
  max-width: 332px;
  border-radius: 4px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
  background-color: var(--secondary) !important;
  margin: auto;
}

.auth-form-change {
  display: flex;
  justify-items: start;
}

.auth-form-change a {
  text-decoration: none;
  font-size: 15px;
  color: var(--text-color);
  padding: 24px 16px 11px;
  letter-spacing: 0.1px;
}

.router-link-exact-active {
  border-bottom: solid 4px var(--accent);
  padding-bottom: 11px;
  margin-bottom: 0;
  z-index: 1;
}

.lb-forgot-password {
  text-align: left;
}

.lb-forgot-password label {
  transform: translateY(11%);
}

.lb-forgot-password img {
  transform: translateY(-2%);
}

hr {
  height: 1px;
  transform: translateY(-25%);
  opacity: 0.3;
  background-color: #000000;
  border: none;
  display: block;
  margin: 0 !important;
  padding: 0 !important;
}

.deco1 {
  position: absolute;
  bottom: 1%;
  left: 40%;
  z-index: -1;
}

//right screen
.deco3 {
  position: absolute;
  right: 0;
}

.deco4 {
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
}

.deco-ill {
  position: absolute;
  left: 20%;
  top: 16%;
  right: 20%;
}

body,
html {
  height: 100% !important;
  width: 100% !important;
}

#app {
  height: 100% !important;
}

@media screen and (max-width: 768px) {
  .auth {
    top: 9%;
  }
  .auth-logo {
    margin-bottom: 2.8rem;
  }
}

@media screen and (max-width: 425px) {
  .auth {
    top: 6.5%;
  }

  .auth-logo {
    margin-bottom: 2.65rem;
  }

  .deco1 {
    bottom: 0.5%;
    width: 76px;
  }
}

@media screen and (max-width: 375px) {
  .auth {
    top: 6%;
  }

  .auth-form {
    width: 100%;
  }

  .auth-logo {
    margin-bottom: 2.55rem;
  }
}

@media screen and (max-width: 320px) {
  .auth {
    top: 6%;
  }

  .auth-form {
    width: 100%;
  }

  .auth-logo {
    margin-bottom: 2.5rem;
  }
}
</style>
