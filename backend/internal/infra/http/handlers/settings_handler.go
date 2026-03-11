package handlers

import (
	"encoding/json"
	"net/http"

	"compras-modular/backend/internal/core/service"
	"compras-modular/backend/internal/infra/models"
)

type SettingsHandler struct {
	settingsService service.SettingsService
}

func NewSettingsHandler(settingsService service.SettingsService) *SettingsHandler {
	return &SettingsHandler{settingsService: settingsService}
}

func (h *SettingsHandler) GetTheme(w http.ResponseWriter, r *http.Request) {
	themeConfig, err := h.settingsService.GetThemeConfiguration(r.Context())
	if err != nil {
		http.Error(w, "Failed to retrieve theme configuration", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(themeConfig) // datatypes.JSON is essentially []byte, so we can write it directly
}

func (h *SettingsHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.settingsService.GetSettings(r.Context())
	if err != nil {
		http.Error(w, "Failed to retrieve settings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func (h *SettingsHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var input models.SystemSettings
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.settingsService.UpdateSettings(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
