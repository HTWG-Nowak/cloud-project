import { computed, onMounted, onUnmounted, ref } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/plugins/firebaseConfig";

export const useAuthState = () => {
  const user = ref(null);
  const error = ref(null);

  let unsubscribe: any;

  onMounted(() => {
    unsubscribe = onAuthStateChanged(
      auth,
      (u: any) => (user.value = u),
      (e: any) => (error.value = e)
    );
  });
  const isAuthenticated = computed(() => user.value != null);

  onUnmounted(() => unsubscribe());

  return { user, error, isAuthenticated };
};

export const getUserState = () =>
  new Promise((resolve, reject) =>
    onAuthStateChanged(getAuth(), resolve, reject)
  );
