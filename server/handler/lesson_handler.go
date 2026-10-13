package handler

import (
	"net/http"

	"batakscript-server/model"
	"batakscript-server/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetLessons handles GET /api/v1/lessons
func GetLessons(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		lessons, err := service.GetAllLessons(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch lessons"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"count":   len(lessons),
			"lessons": lessons,
		})
	}
}

// GetUserProgress handles GET /api/v1/progress/:session_id
func GetUserProgress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := c.Param("session_id")
		var progressList []model.UserProgress
		if err := db.Where("session_id = ?", sessionID).Find(&progressList).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch progress"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"session_id": sessionID,
			"progress":   progressList,
		})
	}
}
