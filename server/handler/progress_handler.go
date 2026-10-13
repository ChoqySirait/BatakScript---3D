package handler

import (
	"net/http"

	"batakscript-server/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type progressRequest struct {
	SessionID string  `json:"session_id" binding:"required"`
	LessonID  uint    `json:"lesson_id"  binding:"required"`
	Accuracy  float64 `json:"accuracy"   binding:"required,min=0,max=100"`
}

// SubmitProgress returns a Gin handler for POST /api/v1/progress.
// It accepts the DB via closure to keep handlers testable.
func SubmitProgress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req progressRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		unlocked, err := service.SaveProgress(db, req.SessionID, req.LessonID, req.Accuracy)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save progress"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":           true,
			"lesson_id":         req.LessonID,
			"accuracy":          req.Accuracy,
			"completed":         unlocked,
			"next_lesson_unlocked": unlocked,
			"message": func() string {
				if unlocked {
					return "Hebat! Modul berikutnya telah terbuka."
				}
				return "Terus berlatih! Akurasi minimal 75% untuk membuka modul berikutnya."
			}(),
		})
	}
}

