// Composables
import { createRouter, createWebHistory } from "vue-router";
import Layout from "@/views/Layout/index.vue";
import NotFoundPage from "@/views/NotFoundPage/index.vue";
import Impressum from "@/views/Impressum/index.vue";
import Home from "@/views/Home/index.vue";
import Login from "@/views/Login/index.vue";
import Profile from "@/views/Profile/index.vue";
import Register from "@/views/Register/index.vue";
import Redirect from "@/views/StravaRedirect/index.vue";
import Dashboard from "@/views/Dashboard/index.vue";
import ReportView from "@/views/ReportView/index.vue";
import CreateReport from "@/views/CreateReport/index.vue";
import Admin from "@/views/Admin/index.vue";
import { getUserState } from "@/store/authStore";

const routes = [
  {
    path: "/:pathMatch(.*)*",
    component: NotFoundPage,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { requiresNoAuth: true },
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
    meta: { requiresNoAuth: true },
  },
  {
    path: "/",
    name: "Home",
    redirect: "/home",
    component: Layout,
    children: [
      {
        path: "home",
        name: "Startpage",
        component: Home,
        meta: { requiresNoAuth: true },
      },
      {
        path: "impressum",
        name: "Impressum",
        component: Impressum,
        meta: { requiresNoAuth: true },
      },
      {
        path: "profile",
        name: "Profile",
        component: Profile,
      },
      {
        path: "redirect",
        name: "Redirect",
        component: Redirect,
      },
      {
        path: "dashboard",
        name: "Dashboard",
        component: Dashboard,
      },
      {
        path: "report/:id",
        name: "Report",
        component: ReportView,
      },
      {
        path: "create",
        name: "Create",
        component: CreateReport,
      },
      {
        path: "admin",
        name: "Admin",
        component: Admin,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return {
        savedPosition,
        behavior: "smooth",
      };
    } else {
      return {
        top: 0,
        behavior: "smooth",
      };
    }
  },
});

router.beforeEach(async (to, from, next) => {
  const isAuth = await getUserState();
  const requiresNoAuth = to.matched.some(
    (record) => record.meta.requiresNoAuth
  );

  if ((to.name === "Login" || to.name === "Register") && isAuth) {
    next("/home");
  } else if (requiresNoAuth) {
    next();
  } else if (!isAuth) {
    next("/login");
  } else {
    next();
  }
});

export default router;
