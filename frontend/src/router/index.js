import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import TrackView from "../views/TrackView.vue";
import FarmerView from "../views/FarmerView.vue";
import InspectorView from "../views/InspectorView.vue";
import LogisticsView from "../views/LogisticsView.vue";
import RetailerView from "../views/RetailerView.vue";
import AdminView from "../views/AdminView.vue";
import { useSSRContext } from "vue";
import { useSessionStore } from "../stores/useSessionStore";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: { title: "Trang chủ - AgriChain" },
  },
  {
    path: "/track/:id",
    name: "track",
    component: TrackView,
    props: true,
    meta: { title: "Tra cứu lô hàng - AgriChain" },
  },
  {
    path: "/farmer",
    name: "farmer",
    component: FarmerView,
    meta: { requiresRoles: ["FARMER"], title: "Nông dân - AgriChain" },
  },
  {
    path: "/inspector",
    name: "inspector",
    component: InspectorView,
    meta: { requiresRoles: ["INSPECTOR"], title: "Kiểm định viên - AgriChain" },
  },
  {
    path: "/logistics",
    name: "logistics",
    component: LogisticsView,
    meta: { requiresRoles: ["LOGISTICS"], title: "Vận chuyển - AgriChain" },
  },
  {
    path: "/retailer",
    name: "retailer",
    component: RetailerView,
    meta: { requiresRoles: ["RETAILER"], title: "Nhà bán lẻ - AgriChain" },
  },
  {
    path: "/admin",
    name: "admin",
    component: AdminView,
    meta: { requiresRoles: ["ADMIN"], title: "Quản trị - AgriChain" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Update document title based on route meta
router.afterEach((to) => {
  document.title = to.meta.title || "AgriChain - Blockchain Supply Chain";
});

// router.beforeEach((to, from, next) => {
//   const requiredRoles = to.meta.requiresRoles;
//   const session = useSessionStore();

//   console.log(
//     "[guard] to:",
//     to.name,
//     "| requires:",
//     requiredRoles,
//     "| isConnected:",
//     session.isConnected,
//     "| roles:",
//     session.roles
//   );

//   if (!requiredRoles || requiredRoles.length === 0) {
//     return next();
//   }

//   if (!session.isConnected) {
//     console.log("[guard] not connected -> redirect home");
//     return next({ name: "home" });
//   }

//   const roles = session.roles || {};
//   const hasRole = requiredRoles.some((role) => roles[role]);

//   if (!hasRole) {
//     console.log("[guard] no required role -> redirect home");
//     return next({ name: "home" });
//   }

//   console.log("[guard] access granted to", to.name);
//   return next();
// });

export default router;
