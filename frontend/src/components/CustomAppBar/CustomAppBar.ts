import { useTheme } from "vuetify";
import { useDisplay } from "vuetify";
import { ref } from "vue";
import { getAuth, signOut } from "firebase/auth";
import router from "@/router";

export default {
  name: "customAppBar",
  data() {
    return {
      features: [
        {
          title: "Home",
          route: "Startpage",
          icon: "mdi-home",
        },
        {
          title: "Dashboard",
          route: "Dashboard",
          icon: "mdi-view-dashboard",
        },
      ],
    };
  },
  setup() {
    const theme = useTheme();
    const { xs, lgAndUp } = useDisplay();
    const drawer = ref(lgAndUp.value ? true : false);
    const themeTitle = ref(theme.global.current.value.dark ? "Dark" : "Light");

    const toggleTheme = () => {
      theme.global.name.value = theme.global.current.value.dark
        ? "light"
        : "dark";
      themeTitle.value = theme.global.current.value.dark ? "Dark" : "Light";
    };

    const auth = getAuth();
    const user = auth.currentUser;
    const role = ref("");

    user?.getIdTokenResult(true).then((res) => {
      if (res.claims.role) {
        role.value = "" + res.claims.role;
      }
    });

    const handleLogout = async () => {
      await signOut(auth)
        .then(() => {
          localStorage.removeItem("athleteId");
          router.push("/");
          location.reload();
        })
        .catch((error) => {
          console.log(error.code);
        });
    };

    const goTo = async (route: String) => {
      router.push({ name: "" + route });
    };

    return {
      toggleTheme,
      xs,
      themeTitle,
      drawer,
      user,
      handleLogout,
      goTo,
      role,
    };
  },
};
