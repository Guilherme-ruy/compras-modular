package handlers

import (
	"net/http"

	"compras-modular/backend/internal/core/service"
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
