import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    // Add timeout to prevent hanging requests
    timeout: 10000,
});

// Track if we're currently refreshing the token
let isRefreshing = false;
// Store pending requests while refreshing
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle network errors and timeouts
        if (!error.response) {
            toast.error("Problème de connexion. Veuillez vérifier votre connexion internet.");
            return Promise.reject(error);
        }

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If we're already refreshing, add this request to the queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
                    refresh: refreshToken
                });

                const { access } = response.data;
                localStorage.setItem('access_token', access);

                // Process all queued requests
                processQueue(null, access);
                
                // Retry the original request
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                
                // Only clear tokens and redirect if it's a real authentication error
                if (refreshError.response?.status === 401 || refreshError.response?.status === 500) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    
                    if (refreshError.response?.status === 500) {
                        toast.error("Votre session a expiré. Veuillez vous reconnecter.");
                    } else {
                        toast.error("Erreur d'authentification. Veuillez vous reconnecter.");
                    }
                    
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                } else if (!refreshError.response) {
                    toast.error("Problème de connexion lors de la mise à jour de la session.");
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle other errors
        if (error.response?.status === 403) {
            toast.error("Vous n'avez pas les permissions nécessaires pour effectuer cette action.");
            console.error('Access forbidden:', error.response.data);
        } else if (error.response?.status === 500) {
            toast.error("Une erreur est survenue. Veuillez réessayer plus tard.");
            console.error('Server error:', error.response.data);
        } else if (error.code === 'ECONNABORTED') {
            toast.error("La requête a pris trop de temps. Veuillez réessayer.");
        }

        return Promise.reject(error);
    }
);

export default api; 