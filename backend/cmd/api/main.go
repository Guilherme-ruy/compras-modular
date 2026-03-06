package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"compras-modular/backend/internal/core/service"
	"compras-modular/backend/internal/infra/database"
	"compras-modular/backend/internal/infra/http/handlers"
	"compras-modular/backend/internal/infra/http/middlewares"
	"compras-modular/backend/internal/infra/repository"
)

func main() {
	_ = godotenv.Load()

	// 1. Initialize DB
	database.Connect()
	database.AutoMigrate()

	// 2. Setup Repositories
	userRepo := repository.NewUserRepository(database.DB)
	roleRepo := repository.NewRoleRepository(database.DB)
	settingsRepo := repository.NewSystemSettingsRepository(database.DB)
	purchaseRepo := repository.NewPurchaseRepository(database.DB)
	workflowRepo := repository.NewWorkflowRepository(database.DB)

	// 3. Setup Services
	authSvc := service.NewAuthService(userRepo, roleRepo)
	settingsSvc := service.NewSettingsService(settingsRepo)
	purchaseSvc := service.NewPurchaseService(purchaseRepo, userRepo)
	workflowSvc := service.NewWorkflowService(database.DB, purchaseRepo, workflowRepo)

	// 4. Setup Handlers
	authHandler := handlers.NewAuthHandler(authSvc)
	settingsHandler := handlers.NewSettingsHandler(settingsSvc)
	purchaseHandler := handlers.NewPurchaseHandler(purchaseSvc)
	workflowHandler := handlers.NewWorkflowHandler(workflowSvc)

	// 5. Setup Router
	r := chi.NewRouter()

	// 6. Base Middlewares
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// 7. Setup Routes
	r.Route("/api/v1", func(r chi.Router) {
		// Public routes
		r.Post("/auth/login", authHandler.Login)
		r.Get("/settings/theme", settingsHandler.GetTheme)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middlewares.JWTAuthentication)

			r.Post("/purchases", purchaseHandler.Create)
			r.Get("/purchases", purchaseHandler.List)
			r.Get("/purchases/{id}", purchaseHandler.Get)

			// Workflow Actions
			r.Post("/purchases/{id}/submit", workflowHandler.Submit)
			r.Post("/purchases/{id}/approve", workflowHandler.Approve)
			r.Post("/purchases/{id}/reject", workflowHandler.Reject)
		})
	})

	log.Println("Starting server on :8080")
	err := http.ListenAndServe(":8080", r)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
