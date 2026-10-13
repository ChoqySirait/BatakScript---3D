package main

import (
	"log"
	"time"

	"batakscript-server/handler"
	"batakscript-server/model"
	"batakscript-server/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// ── Database ──────────────────────────────────────────────────────────────
	db, err := gorm.Open(sqlite.Open("batakscript.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("[db] failed to connect: %v", err)
	}
	log.Println("[db] connected to batakscript.db")

	// Auto-migrate models.
	if err := db.AutoMigrate(
		&model.Lesson{},
		&model.UserProgress{},
		&model.QuestProgress{},
		&model.LeaderboardEntry{},
	); err != nil {
		log.Fatalf("[db] migration error: %v", err)
	}
	log.Println("[db] migration complete")

	// Seed initial lesson and leaderboard data.
	service.SeedLessons(db)
	handler.SeedLeaderboard(db)

	// ── Gin router ────────────────────────────────────────────────────────────
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS — allow requests from the Next.js dev server.
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ── Routes ────────────────────────────────────────────────────────────────
	api := r.Group("/api/v1")
	{
		api.GET("/health",       handler.HealthCheck)
		api.GET("/glyphs",       handler.GetGlyphs)
		api.GET("/lessons",      handler.GetLessons(db))
		api.POST("/transliterate", handler.Transliterate)
		api.POST("/progress",    handler.SubmitProgress(db))
		api.GET("/progress/:session_id", handler.GetUserProgress(db))

		// Quest Mode endpoints
		api.POST("/quest/progress", handler.SubmitQuestProgress(db))
		api.GET("/quest/progress/:session_id", handler.GetQuestProgress(db))

		// Leaderboard endpoints
		api.GET("/leaderboard", handler.GetLeaderboard(db))
		api.POST("/leaderboard", handler.SubmitLeaderboard(db))
	}

	// ── Swagger UI Documentation ──────────────────────────────────────────────
	r.GET("/swagger", handler.SwaggerUI)
	r.GET("/swagger/doc.json", handler.SwaggerDoc)

	// ── Start ─────────────────────────────────────────────────────────────────
	log.Println("[server] BatakScript API running on http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("[server] failed to start: %v", err)
	}
}

