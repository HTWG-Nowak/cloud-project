<template>
  <v-container fluid class="admin">
    <h1>Admin Page</h1>

    <!-- loading alert (waiting on confirmation if user is a admin) -->
    <v-container fluid v-if="loading">
      <v-row class="fill-heigh" align-content="center" justify="center">
        <v-col class="text-center" cols="12">
          <v-alert type="info">Loading...</v-alert>
        </v-col>
        <v-col cols="12" v-if="loading">
          <v-progress-linear
            color="primary"
            rounded
            height="6"
            indeterminate
          ></v-progress-linear>
        </v-col>
      </v-row>
    </v-container>

    <template v-else>
      <v-tabs v-model="tab" color="primary" class="mb-3" stacked>
        <v-tab value="user-management" @click.prevent="path('')">
          <v-icon>mdi-account</v-icon>
          User Management
        </v-tab>
        <v-tab value="customization" @click.prevent="path('customization')">
          <v-icon>mdi-shape-outline</v-icon>
          Customization
        </v-tab>
      </v-tabs>
      <v-window v-model="tab">
        <v-window-item value="user-management">
          <user-management />
        </v-window-item>
        <v-window-item value="customization">
          <customization />
        </v-window-item>
      </v-window>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import router from "@/router";
import { getAuth } from "firebase/auth";
import { ref } from "vue";
import UserManagement from "@/components/UserManagement.vue";
import Customization from "@/components/Customization.vue";
import { onBeforeMount } from "vue";
const tab = ref(window.location.hash.replace("#", ""));

const loading = ref(true);
const role = ref("");

onBeforeMount(async () => {
  await getAuth()
    .currentUser?.getIdTokenResult(true)
    .then((res) => {
      role.value = "" + res.claims.role;
    });
  // check if user is admin and if not redirect to home page
  if (role.value !== "Admin" || role.value === undefined) {
    router.push({ name: "Home" });
  } else {
    loading.value = false;
  }
});

function path(path: string) {
  window.location.hash = path;
}
</script>

<style lang="scss"></style>
