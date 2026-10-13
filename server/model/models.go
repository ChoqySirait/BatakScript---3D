package model

import "time"

// Lesson represents a single learning module for a Batak Toba glyph.
type Lesson struct {
	ID          uint      `gorm:"primaryKey"          json:"id"`
	Level       int       `gorm:"not null"            json:"level"`        // 1: Ina, 2: Anak, 3: Kata, 4: Umpasa
	Title       string    `gorm:"size:100;not null"   json:"title"`
	Description string    `gorm:"type:text"           json:"description"`
	TargetGlyph string    `gorm:"size:20;not null"    json:"target_glyph"`
	UnicodeHex  string    `gorm:"size:20;not null"    json:"unicode_hex"`
	LatinSound  string    `gorm:"size:50;not null"    json:"latin_sound"`
	Reference   string    `gorm:"type:text"           json:"reference_points"` // JSON array of stroke coordinates
	CreatedAt   time.Time `                           json:"created_at"`
}

// UserProgress records a user session's accuracy for a given lesson.
type UserProgress struct {
	ID        uint      `gorm:"primaryKey"              json:"id"`
	SessionID string    `gorm:"size:64;index;not null"  json:"session_id"`
	LessonID  uint      `gorm:"not null"                json:"lesson_id"`
	Accuracy  float64   `gorm:"not null"                json:"accuracy"`   // 0.0 – 100.0 %
	Completed bool      `gorm:"default:false"           json:"completed"`
	UpdatedAt time.Time `                               json:"updated_at"`
}

// QuestProgress tracks unlocked ancient manuscript chapters in Pustaha Quest Mode.
type QuestProgress struct {
	ID        uint      `gorm:"primaryKey"             json:"id"`
	SessionID string    `gorm:"size:64;index;not null" json:"session_id"`
	ChapterID int       `gorm:"not null"               json:"chapter_id"` // 1 - 5
	Accuracy  float64   `gorm:"not null"               json:"accuracy"`
	Unlocked  bool      `gorm:"default:false"          json:"unlocked"`
	UpdatedAt time.Time `                              json:"updated_at"`
}

// LeaderboardEntry tracks high scores in Speed Recognition Quiz.
type LeaderboardEntry struct {
	ID         uint      `gorm:"primaryKey"             json:"id"`
	PlayerName string    `gorm:"size:50;not null"       json:"player_name"`
	Score      int       `gorm:"index;not null"         json:"score"`
	Accuracy   float64   `gorm:"not null"               json:"accuracy"`
	MaxStreak  int       `gorm:"not null"               json:"max_streak"`
	CreatedAt  time.Time `                              json:"created_at"`
}

