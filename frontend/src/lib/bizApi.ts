import axios from 'axios'

const bizApi = axios.create({
  baseURL: import.meta.env.VITE_BIZ_API_URL ?? 'https://api.leymaken.com/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

bizApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('biz_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default bizApi
