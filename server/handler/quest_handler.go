package handler

import (
	"net/http"
	"time"

	"batakscript-server/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type questProgressRequest struct {
	SessionID string  `json:"session_id" binding:"required"`
	ChapterID int     `json:"chapter_id" binding:"required,min=1,max=5"`
	Accuracy  float64 `json:"accuracy"   binding:"required,min=0,max=100"`
}

// SubmitQuestProgress handles POST /api/v1/quest/progress
func SubmitQuestProgress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req questProgressRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var qp model.QuestProgress
		db.Where("session_id = ? AND chapter_id = ?", req.SessionID, req.ChapterID).First(&qp)

		qp.SessionID = req.SessionID
		qp.ChapterID = req.ChapterID
		qp.Accuracy = req.Accuracy
		qp.Unlocked = req.Accuracy >= 70.0 // 70% threshold to unlock next chapter
		qp.UpdatedAt = time.Now()

		if err := db.Save(&qp).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save quest progress"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":               true,
			"session_id":            req.SessionID,
			"chapter_id":            req.ChapterID,
			"accuracy":              req.Accuracy,
			"unlocked":              qp.Unlocked,
			"next_chapter_unlocked": qp.Unlocked && req.ChapterID < 5,
			"message": func() string {
				if qp.Unlocked {
					return "Rahasia bab naskah kuno terkuak! Lembaran berikutnya terbuka."
				}
				return "Goresan belum sempurna untuk memecahkan mantra. Coba lagi!"
			}(),
		})
	}
}

// GetQuestProgress handles GET /api/v1/quest/progress/:session_id
func GetQuestProgress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := c.Param("session_id")
		var list []model.QuestProgress
		if err := db.Where("session_id = ?", sessionID).Find(&list).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch quest progress"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"session_id": sessionID,
			"chapters":   list,
		})
	}
}
