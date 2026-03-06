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
	var adminRole, approverRole, requesterRole models.Role

	if count == 0 {
		adminRole = models.Role{Name: "SUPERADMIN", Permissions: datatypes.JSON([]byte(`["all"]`))}
		approverRole = models.Role{Name: "APPROVER", Permissions: datatypes.JSON([]byte(`["approve_purchases"]`))}
		requesterRole = models.Role{Name: "REQUESTER", Permissions: datatypes.JSON([]byte(`["create_purchases", "view_own_purchases"]`))}

		db.Create(&adminRole)
		db.Create(&approverRole)
		db.Create(&requesterRole)
		log.Println("Created Roles")
	} else {
		db.Where("name = ?", "SUPERADMIN").First(&adminRole)
		db.Where("name = ?", "APPROVER").First(&approverRole)
		db.Where("name = ?", "REQUESTER").First(&requesterRole)
	}

	// 3. Departments
	db.Model(&models.Department{}).Count(&count)
	var deptTI models.Department
	if count == 0 {
		deptTI = models.Department{Name: "Tecnologia da Informação (TI)"}
		db.Create(&deptTI)

		deptObras := models.Department{Name: "Obras"}
		db.Create(&deptObras)
		log.Println("Created Departments")
	} else {
		db.Where("name = ?", "Tecnologia da Informação (TI)").First(&deptTI)
	}

	// 4. Users
	db.Model(&models.User{}).Count(&count)
	if count == 0 {
		hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)

		admin := models.User{
			Name:         "Administrador do Sistema",
			Email:        "admin@empresa.com",
			PasswordHash: string(hash),
			RoleID:       adminRole.ID,
			IsActive:     true,
		}

		requester := models.User{
			Name:         "João (Solicitante da TI)",
			Email:        "joao@empresa.com",
			PasswordHash: string(hash),
			RoleID:       requesterRole.ID,
			DepartmentID: &deptTI.ID,
			IsActive:     true,
		}

		approver := models.User{
			Name:         "Maria (Aprovadora da TI)",
			Email:        "maria@empresa.com",
			PasswordHash: string(hash),
			RoleID:       approverRole.ID,
			DepartmentID: &deptTI.ID,
			IsActive:     true,
		}

		db.Create(&admin)
		db.Create(&requester)
		db.Create(&approver)
		log.Println("Created Users (Password: 123456)")

		// 5. Workflows
		workflow := models.ApprovalWorkflow{
			DepartmentID: deptTI.ID,
			MinAmount:    0,
		}
		db.Create(&workflow)

		step1 := models.WorkflowStep{
			WorkflowID:     workflow.ID,
			StepOrder:      1,
			ApproverRoleID: &approverRole.ID,
		}
		step2 := models.WorkflowStep{
			WorkflowID:     workflow.ID,
			StepOrder:      2,
			ApproverUserID: &admin.ID,
		}
		db.Create(&step1)
		db.Create(&step2)
		log.Println("Created Workflows for TI Department (Approver -> Admin)")
	}

	log.Println("Seed completed successfully!")
}
