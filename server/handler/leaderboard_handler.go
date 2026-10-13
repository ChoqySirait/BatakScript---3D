package handler

import (
	"net/http"
	"time"

	"batakscript-server/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type leaderboardRequest struct {
	PlayerName string  `json:"player_name" binding:"required,min=2,max=30"`
	Score      int     `json:"score"       binding:"required,min=0"`
	Accuracy   float64 `json:"accuracy"    binding:"required,min=0,max=100"`
	MaxStreak  int     `json:"max_streak"  binding:"required,min=0"`
}

// SeedLeaderboard seeds initial entries if table is empty
func SeedLeaderboard(db *gorm.DB) {
	var count int64
	db.Model(&model.LeaderboardEntry{}).Count(&count)
	if count == 0 {
		initial := []model.LeaderboardEntry{
			{PlayerName: "Datu Bolon Guru", Score: 2650, Accuracy: 98.4, MaxStreak: 10, CreatedAt: time.Now()},
			{PlayerName: "Pangurason Silalahi", Score: 2320, Accuracy: 94.2, MaxStreak: 8, CreatedAt: time.Now()},
			{PlayerName: "Ompu Raja Batak", Score: 2050, Accuracy: 89.0, MaxStreak: 7, CreatedAt: time.Now()},
			{PlayerName: "Situmorang Parhata", Score: 1840, Accuracy: 85.5, MaxStreak: 6, CreatedAt: time.Now()},
			{PlayerName: "Cendekia Toba", Score: 1620, Accuracy: 81.0, MaxStreak: 5, CreatedAt: time.Now()},
		}
		db.Create(&initial)
	}
}

// GetLeaderboard handles GET /api/v1/leaderboard
func GetLeaderboard(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var entries []model.LeaderboardEntry
		if err := db.Order("score DESC, accuracy DESC").Limit(20).Find(&entries).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve leaderboard"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"count":   len(entries),
			"entries": entries,
		})
	}
}

// SubmitLeaderboard handles POST /api/v1/leaderboard
func SubmitLeaderboard(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req leaderboardRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		entry := model.LeaderboardEntry{
			PlayerName: req.PlayerName,
			Score:      req.Score,
			Accuracy:   req.Accuracy,
			MaxStreak:  req.MaxStreak,
			CreatedAt:  time.Now(),
		}

		if err := db.Create(&entry).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save leaderboard score"})
			return
		}

		// Find rank
		var rank int64
		db.Model(&model.LeaderboardEntry{}).Where("score > ?", entry.Score).Count(&rank)

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"rank":    rank + 1,
			"entry":   entry,
			"message": "Skor berhasil tercatat di Papan Peringkat!",
		})
	}
}

