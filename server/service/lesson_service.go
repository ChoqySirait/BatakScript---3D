package service

import (
	"batakscript-server/model"
	"log"

	"gorm.io/gorm"
)

// inaLessons defines the 19 Ina ni Surat seed data.
var inaLessons = []model.Lesson{
	{Level: 1, Title: "Karakter A (ᯀ)", Description: "Vokal murni A — karakter vokal mandiri dalam Surat Batak Toba.", TargetGlyph: "\u1BC0", UnicodeHex: "U+1BC0", LatinSound: "a", Reference: "[]"},
	{Level: 1, Title: "Karakter HA (ᯂ)", Description: "Karakter induk HA dengan vokal inheren /a/.", TargetGlyph: "\u1BC2", UnicodeHex: "U+1BC2", LatinSound: "ha", Reference: "[]"},
	{Level: 1, Title: "Karakter BA (ᯅ)", Description: "Karakter induk BA dengan vokal inheren /a/.", TargetGlyph: "\u1BC5", UnicodeHex: "U+1BC5", LatinSound: "ba", Reference: "[]"},
	{Level: 1, Title: "Karakter PA (ᯇ)", Description: "Karakter induk PA dengan vokal inheren /a/.", TargetGlyph: "\u1BC7", UnicodeHex: "U+1BC7", LatinSound: "pa", Reference: "[]"},
	{Level: 1, Title: "Karakter NA (ᯉ)", Description: "Karakter induk NA dengan vokal inheren /a/.", TargetGlyph: "\u1BC9", UnicodeHex: "U+1BC9", LatinSound: "na", Reference: "[]"},
	{Level: 1, Title: "Karakter GA (ᯎ)", Description: "Karakter induk GA dengan vokal inheren /a/.", TargetGlyph: "\u1BCE", UnicodeHex: "U+1BCE", LatinSound: "ga", Reference: "[]"},
	{Level: 1, Title: "Karakter JA (ᯐ)", Description: "Karakter induk JA dengan vokal inheren /a/.", TargetGlyph: "\u1BD0", UnicodeHex: "U+1BD0", LatinSound: "ja", Reference: "[]"},
	{Level: 1, Title: "Karakter DA (ᯑ)", Description: "Karakter induk DA dengan vokal inheren /a/.", TargetGlyph: "\u1BD1", UnicodeHex: "U+1BD1", LatinSound: "da", Reference: "[]"},
	{Level: 1, Title: "Karakter RA (ᯒ)", Description: "Karakter induk RA dengan vokal inheren /a/.", TargetGlyph: "\u1BD2", UnicodeHex: "U+1BD2", LatinSound: "ra", Reference: "[]"},
	{Level: 1, Title: "Karakter MA (ᯔ)", Description: "Karakter induk MA dengan vokal inheren /a/.", TargetGlyph: "\u1BD4", UnicodeHex: "U+1BD4", LatinSound: "ma", Reference: "[]"},
	{Level: 1, Title: "Karakter TA (ᯖ)", Description: "Karakter induk TA dengan vokal inheren /a/.", TargetGlyph: "\u1BD6", UnicodeHex: "U+1BD6", LatinSound: "ta", Reference: "[]"},
	{Level: 1, Title: "Karakter SA (ᯘ)", Description: "Karakter induk SA dengan vokal inheren /a/.", TargetGlyph: "\u1BD8", UnicodeHex: "U+1BD8", LatinSound: "sa", Reference: "[]"},
	{Level: 1, Title: "Karakter YA (ᯛ)", Description: "Karakter induk YA dengan vokal inheren /a/.", TargetGlyph: "\u1BDB", UnicodeHex: "U+1BDB", LatinSound: "ya", Reference: "[]"},
	{Level: 1, Title: "Karakter NGA (ᯝ)", Description: "Karakter induk NGA (konsonan sengau velar).", TargetGlyph: "\u1BDD", UnicodeHex: "U+1BDD", LatinSound: "nga", Reference: "[]"},
	{Level: 1, Title: "Karakter NYA (ᯠ)", Description: "Karakter induk NYA (konsonan sengau palatal).", TargetGlyph: "\u1BE0", UnicodeHex: "U+1BE0", LatinSound: "nya", Reference: "[]"},
	{Level: 1, Title: "Karakter CA (ᯡ)", Description: "Karakter induk CA dengan vokal inheren /a/.", TargetGlyph: "\u1BE1", UnicodeHex: "U+1BE1", LatinSound: "ca", Reference: "[]"},
	{Level: 1, Title: "Karakter WA (ᯞ)", Description: "Karakter induk WA dengan vokal inheren /a/.", TargetGlyph: "\u1BDE", UnicodeHex: "U+1BDE", LatinSound: "wa", Reference: "[]"},
	{Level: 1, Title: "Vokal Mandiri I (ᯤ)", Description: "Karakter vokal mandiri I — digunakan di awal kata.", TargetGlyph: "\u1BE4", UnicodeHex: "U+1BE4", LatinSound: "i", Reference: "[]"},
	{Level: 1, Title: "Vokal Mandiri U (ᯥ)", Description: "Karakter vokal mandiri U — digunakan di awal kata.", TargetGlyph: "\u1BE5", UnicodeHex: "U+1BE5", LatinSound: "u", Reference: "[]"},
}

// SeedLessons populates the lessons table with the 19 Ina ni Surat if it is empty.
func SeedLessons(db *gorm.DB) {
	var count int64
	db.Model(&model.Lesson{}).Count(&count)
	if count > 0 {
		log.Println("[seeder] lessons table already seeded, skipping.")
		return
	}

	if result := db.Create(&inaLessons); result.Error != nil {
		log.Printf("[seeder] ERROR seeding lessons: %v\n", result.Error)
		return
	}
	log.Printf("[seeder] seeded %d Ina ni Surat lessons.\n", len(inaLessons))
}

// GetAllLessons retrieves all lessons ordered by level and ID.
func GetAllLessons(db *gorm.DB) ([]model.Lesson, error) {
	var lessons []model.Lesson
	result := db.Order("level ASC, id ASC").Find(&lessons)
	return lessons, result.Error
}

// SaveProgress upserts a UserProgress record and returns whether the next lesson
// should be unlocked (accuracy >= 75%).
func SaveProgress(db *gorm.DB, sessionID string, lessonID uint, accuracy float64) (bool, error) {
	var prog model.UserProgress
	db.Where("session_id = ? AND lesson_id = ?", sessionID, lessonID).First(&prog)

	prog.SessionID = sessionID
	prog.LessonID = lessonID
	prog.Accuracy = accuracy
	prog.Completed = accuracy >= 75.0

	result := db.Save(&prog)
	return prog.Completed, result.Error
}

