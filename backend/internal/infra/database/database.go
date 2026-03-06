package database

import (
	"fmt"
	"log"
	"os"

	"compras-modular/backend/internal/infra/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}

	user := os.Getenv("DB_USER")
	if user == "" {
		user = "compras_user"
	}

	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "compras_password"
	}

	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "compras_db"
	}

	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		host, user, password, dbname, port)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connection established")
}

func AutoMigrate() {
	DB.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)

	err := DB.AutoMigrate(
		&models.SystemSettings{},
		&models.Department{},
		&models.Role{},
		&models.User{},
		&models.Purchase{},
		&models.PurchaseItem{},
		&models.ApprovalWorkflow{},
		&models.WorkflowStep{},
		&models.PurchaseApproval{},
	)
	if err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
	}
	log.Println("Database migration completed")
}
