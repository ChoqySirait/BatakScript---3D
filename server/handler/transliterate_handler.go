package handler

import (
	"net/http"
	"strings"

	"batakscript-server/service"

	"github.com/gin-gonic/gin"
)

type transliterateRequest struct {
	Text string `json:"text" binding:"required"`
}

// Transliterate handles POST /api/v1/transliterate
// Body: {"text": "horas batak toba"}
func Transliterate(c *gin.Context) {
	var req transliterateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "field 'text' is required"})
		return
	}

	text := strings.TrimSpace(req.Text)
	if text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "text must not be empty"})
		return
	}

	result := service.Transliterate(text)
	c.JSON(http.StatusOK, result)
}

