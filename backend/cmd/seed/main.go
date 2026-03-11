package main

import (
	"log"

	"compras-modular/backend/internal/infra/database"
	"compras-modular/backend/internal/infra/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
)

func main() {
	_ = godotenv.Load()
	database.Connect()
	database.AutoMigrate()
	db := database.DB

	log.Println("Seeding database...")

	// 1. Settings
	var count int64
	db.Model(&models.SystemSettings{}).Count(&count)
	if count == 0 {
		themeJSON := datatypes.JSON([]byte(`{"primary": {"50": "#f0fdf4", "100": "#dcfce7", "200": "#bbf7d0", "300": "#86efac", "400": "#4ade80", "500": "#22c55e", "600": "#16a34a", "700": "#15803d", "800": "#166534", "900": "#14532d"}}`))

		db.Create(&models.SystemSettings{
			ID:          1,
			CompanyName: "Compras Modular (Empresa Teste)",
			Document:    "00.000.000/0001-00",
			ThemeConfig: themeJSON,
		})
		log.Println("Created SystemSettings (Green Theme)")
	}

	// 2. Roles
	db.Model(&models.Role{}).Count(&count)
	var adminRole models.Role

	if count == 0 {
		adminRole = models.Role{Name: "SUPERADMIN", Permissions: datatypes.JSON([]byte(`["all"]`))}
		db.Create(&adminRole)
		log.Println("Created Role: SUPERADMIN")
	} else {
		db.Where("name = ?", "SUPERADMIN").First(&adminRole)
	}

	// 3. Departments (Skipped for fresh setup)

	// 4. Users
	db.Model(&models.User{}).Count(&count)
	if count == 0 {
		hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)

		admin := models.User{
			Name:         "Super Administrador",
			Email:        "admin@empresa.com",
			PasswordHash: string(hash),
			RoleID:       adminRole.ID,
			IsActive:     true,
		}

		db.Create(&admin)
		log.Println("Created User: admin@empresa.com (Password: 123456)")
	}

	log.Println("Seed completed successfully!")
}
