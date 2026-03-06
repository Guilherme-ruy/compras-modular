package middlewares

import (
	"context"
	"net/http"
	"strings"

	"compras-modular/backend/pkg/auth"
)

type contextKey string

const UserContextKey contextKey = "user_claims"

func JWTAuthentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		ctx = context.WithValue(ctx, "role_id", claims.RoleID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
