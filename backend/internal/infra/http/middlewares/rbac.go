package middlewares

import (
	"net/http"

	"compras-modular/backend/pkg/auth"
)

func RequireRole(allowedRole string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*auth.Claims)
			if !ok {
				http.Error(w, "Unauthorized Context", http.StatusUnauthorized)
				return
			}

			if claims.RoleName != allowedRole {
				http.Error(w, "403 Forbidden: Insufficient Permissions", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
