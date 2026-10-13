package handler

import (
	"net/http"

	"batakscript-server/service"

	"github.com/gin-gonic/gin"
)

// GetGlyphs handles GET /api/v1/glyphs
// Returns the full glyph dictionary: all Ina ni Surat + Anak ni Surat with metadata.
func GetGlyphs(c *gin.Context) {
	glyphs := service.AllGlyphs()
	c.JSON(http.StatusOK, gin.H{
		"count":  len(glyphs),
		"glyphs": glyphs,
	})
}

