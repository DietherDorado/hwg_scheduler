<template>
    <div class="d-flex flex-column min-vh-100 justify-content-center align-items-center bg-light">
      <div class="card shadow-lg p-4 rounded-4" style="width: 100%; max-width: 420px;">
        <!-- Logo & Title -->
        <div class="text-center mb-4">
          <img src="/hwg.svg" alt="HWG Logo" class="logo-spin mb-3" style="width: 90px; height: 90px;" />
          <h1 class="h3 text-primary fw-bold">HWG Scheduler</h1>
          <p class="text-muted mb-0">Login to continue</p>
        </div>
  
        <!-- FORM -->
        <form @submit.prevent="login">
            <!-- Email Input -->
            <div class="form-floating mb-3">
            <input
                v-model="email"
                type="email"
                class="form-control rounded-3"
                id="emailInput"
                placeholder="Enter your email"
                autocomplete="off"
            />
            <label for="emailInput">Email address</label>
            </div>

            <!-- Password Input -->
            <div class="form-floating mb-3">
              <input
                v-model="password"
                type="password"
                class="form-control rounded-3"
                id="passwordInput"
                placeholder="Enter your password"
                autocomplete="off"
              />
              <label for="passwordInput">Password</label>
            </div>

            <!-- Login Button -->
            <button type="submit" class="btn btn-primary w-100 rounded-pill py-2" :disabled="isLoggingIn">
              🚪 Login
            </button>
        </form>
  
        <!-- Error Message -->
        <p v-if="error" class="mt-3 text-danger text-center">{{ error }}</p>
      </div>
  
      <!-- Footer -->
      <footer class="mt-5 text-center text-muted small">
        © 2025 HWG Scheduler created by Diether Dorado. All rights reserved.
      </footer>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  
  const email = ref('')
  const password = ref('')
  const error = ref('')
  const router = useRouter()
  const users = ref([])

  const isLoggingIn = ref(false)
  
  const login = async () => {
    if (isLoggingIn.value) return // Prevent multiple submissions
    isLoggingIn.value = true
    error.value = '' // Reset error message

    const trimmedEmail = email.value.trim().toLowerCase()
    const trimmedPassword = password.value.trim()
    
    try {
      const res = await fetch('https://hwg-backend.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Login failed')
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      router.push('/calendar')
    } catch (err) {
      console.error(err)
      error.value = err.message || 'Something went wrong. Please try again.'
    } finally {
      isLoggingIn.value = false
    }
  }
  </script>
  
  <style scoped>
  .logo-spin {
    animation: spin 8s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  </style>
  