// Package service implements the Batak Toba transliteration engine.
// It converts Latin text into Surat Batak Toba Unicode characters by:
//  1. Applying consonant substitutions for phonemes absent in Batak Toba.
//  2. Splitting words into syllables (KVK / KV / VK / V patterns).
//  3. Mapping onsets to Ina ni Surat (base characters) and vowels to Anak ni Surat (diacritics).
package service

import (
	"strings"
	"unicode"
)

// ── Unicode constants ─────────────────────────────────────────────────────────

// Ina ni Surat — 19 base characters (inherent vowel /a/).
var inaMap = map[string]string{
	"a":   "\u1BC0", // ᯀ
	"h":   "\u1BC2", // ᯂ
	"b":   "\u1BC5", // ᯅ
	"p":   "\u1BC7", // ᯇ
	"n":   "\u1BC9", // ᯉ
	"j":   "\u1BD0", // ᯐ
	"d":   "\u1BD1", // ᯑ
	"r":   "\u1BD2", // ᯒ
	"m":   "\u1BD4", // ᯔ
	"t":   "\u1BD6", // ᯖ
	"s":   "\u1BD8", // ᯘ
	"g":   "\u1BCE", // ᯎ
	"w":   "\u1BDE", // ᯞ
	"y":   "\u1BDB", // ᯛ
	"ng":  "\u1BDD", // ᯝ
	"ny":  "\u1BE0", // ᯠ
	"c":   "\u1BE1", // ᯡ
}

// Standalone vowel characters (used when a vowel begins a word without onset).
var vowelStandaloneMap = map[string]string{
	"i": "\u1BE4", // ᯤ
	"u": "\u1BE5", // ᯥ
	"a": "\u1BC0", // ᯀ (same as 'a' ina)
	"e": "\u1BC0", // ᯀ + hatadingan below
	"o": "\u1BC0", // ᯀ + hatalingan below
}

// Anak ni Surat — diacritics.
const (
	haborotan  = "\u1BEA" // /i/ — above consonant
	sihorhor   = "\u1BEE" // /u/ — below consonant
	hatadingan = "\u1BE9" // /e/ — right of consonant
	hatalingan = "\u1BEB" // /o/ — behind consonant
	pangolat   = "\u1BF2" // virama — kills inherent /a/
	hamisaran  = "\u1BF0" // /ng/ final marker
)

// consonantSubs maps Latin phonemes absent in Batak Toba to their closest equivalent.
var consonantSubs = map[byte]string{
	'k': "h",
	'l': "r",
	'f': "p",
	'v': "b",
	'z': "s",
	'q': "h",
	'x': "s",
}

// ── Public types ──────────────────────────────────────────────────────────────

// SyllableToken is the JSON representation of one parsed syllable.
type SyllableToken struct {
	Syllable   string   `json:"syllable"`
	Glyph      string   `json:"glyph"`
	Components []string `json:"components"`
}

// TransliterationResult is the full API response for POST /transliterate.
type TransliterationResult struct {
	Original string          `json:"original"`
	Result   string          `json:"result"`
	Tokens   []SyllableToken `json:"tokens"`
}

// GlyphInfo describes a single glyph entry for GET /glyphs.
type GlyphInfo struct {
	Type        string `json:"type"`        // "ina" or "anak"
	Latin       string `json:"latin"`
	Glyph       string `json:"glyph"`
	UnicodeHex  string `json:"unicode_hex"`
	Description string `json:"description"`
}

// ── Main entry points ─────────────────────────────────────────────────────────

// Transliterate converts a Latin string to Surat Batak Toba.
func Transliterate(text string) TransliterationResult {
	words := strings.Fields(text)
	var allTokens []SyllableToken
	var resultParts []string

	for _, word := range words {
		tokens := tokenizeWord(word)
		allTokens = append(allTokens, tokens...)
		var glyphs []string
		for _, t := range tokens {
			glyphs = append(glyphs, t.Glyph)
		}
		resultParts = append(resultParts, strings.Join(glyphs, ""))
	}

	return TransliterationResult{
		Original: text,
		Result:   strings.Join(resultParts, " "),
		Tokens:   allTokens,
	}
}

// AllGlyphs returns the full glyph dictionary (Ina ni Surat + Anak ni Surat).
func AllGlyphs() []GlyphInfo {
	return staticGlyphData
}

// ── Tokenization ──────────────────────────────────────────────────────────────

// tokenizeWord splits a single word into Batak Toba syllable tokens.
func tokenizeWord(word string) []SyllableToken {
	word = strings.ToLower(word)
	word = applySubstitutions(word)

	var tokens []SyllableToken
	i := 0
	n := len(word)

	for i < n {
		// Skip non-alphabetic characters.
		if !unicode.IsLetter(rune(word[i])) {
			i++
			continue
		}

		var onset, vowel, coda string

		// ── 1. Consume onset consonant ──────────────────────────────────────
		if i+1 < n && isMultiConsonant(word[i:i+2]) {
			onset = word[i : i+2]
			i += 2
		} else if isConsonant(word[i]) {
			onset = word[i : i+1]
			i++
		}

		// ── 2. Consume vowel ────────────────────────────────────────────────
		if i < n && isVowel(word[i]) {
			vowel = word[i : i+1]
			i++
		} else {
			// Consonant cluster without following vowel — skip lone consonant.
			if onset == "" {
				i++
			}
			continue
		}

		// ── 3. Consume coda (only if NOT followed by another vowel) ─────────
		if i+1 < n && isMultiConsonant(word[i:i+2]) {
			// Multi-char coda (ng/ny) at end of word or before consonant.
			if i+2 >= n || !isVowel(word[i+2]) {
				coda = word[i : i+2]
				i += 2
			}
		} else if i < n && isConsonant(word[i]) {
			// Single coda only if the next character is NOT a vowel.
			if i+1 >= n || !isVowel(word[i+1]) {
				coda = word[i : i+1]
				i++
			}
		}

		syllableStr := onset + vowel + coda
		glyph, components := buildGlyph(onset, vowel, coda)
		tokens = append(tokens, SyllableToken{
			Syllable:   syllableStr,
			Glyph:      glyph,
			Components: components,
		})
	}

	return tokens
}

// applySubstitutions replaces unsupported Latin consonants before tokenization,
// preserving multi-char consonants (ng, ny) intact.
func applySubstitutions(word string) string {
	var sb strings.Builder
	i := 0
	for i < len(word) {
		// Preserve multi-char consonants.
		if i+1 < len(word) && isMultiConsonant(word[i:i+2]) {
			sb.WriteByte(word[i])
			sb.WriteByte(word[i+1])
			i += 2
			continue
		}
		if sub, ok := consonantSubs[word[i]]; ok {
			sb.WriteString(sub)
		} else {
			sb.WriteByte(word[i])
		}
		i++
	}
	return sb.String()
}

// ── Glyph builder ─────────────────────────────────────────────────────────────

// buildGlyph assembles the Unicode glyph string and component list for a syllable.
func buildGlyph(onset, vowel, coda string) (string, []string) {
	var glyph strings.Builder
	var components []string

	if onset == "" {
		// Pure vowel syllable.
		base := vowelStandaloneMap[vowel]
		glyph.WriteString(base)
		components = append(components, vowel+"-mandiri")
		if vowel == "e" {
			glyph.WriteString(hatadingan)
			components = append(components, "hatadingan")
		} else if vowel == "o" {
			glyph.WriteString(hatalingan)
			components = append(components, "hatalingan")
		}
	} else {
		// Consonant onset.
		base, ok := inaMap[onset]
		if !ok {
			base = inaMap["h"] // fallback for unknown consonants
		}
		glyph.WriteString(base)
		components = append(components, onset+"a")

		// Vowel diacritic (inherent /a/ needs no diacritic).
		if d, name := diacritic(vowel); d != "" {
			glyph.WriteString(d)
			components = append(components, name)
		}
	}

	// Coda.
	switch {
	case coda == "ng":
		glyph.WriteString(hamisaran)
		components = append(components, "hamisaran")
	case coda != "":
		codaBase, ok := inaMap[coda]
		if !ok {
			codaBase = inaMap["h"]
		}
		glyph.WriteString(codaBase)
		glyph.WriteString(pangolat)
		components = append(components, coda+"a", "pangolat")
	}

	return glyph.String(), components
}

// diacritic returns the Unicode diacritic character and its name for a given vowel.
func diacritic(vowel string) (string, string) {
	switch vowel {
	case "i":
		return haborotan, "haborotan"
	case "u":
		return sihorhor, "sihorhor"
	case "e":
		return hatadingan, "hatadingan"
	case "o":
		return hatalingan, "hatalingan"
	}
	return "", ""
}

// ── Character class helpers ───────────────────────────────────────────────────

func isVowel(b byte) bool {
	return b == 'a' || b == 'e' || b == 'i' || b == 'o' || b == 'u'
}

func isMultiConsonant(s string) bool {
	return s == "ng" || s == "ny"
}

func isConsonant(b byte) bool {
	consonants := "hmnrtbpjdgswycaeiou"
	return strings.ContainsRune("hmnrtbpjdgswycaeiou", rune(b)) &&
		!strings.ContainsRune("aeiou", rune(b)) &&
		strings.ContainsRune(consonants, rune(b))
}

// ── Static glyph dictionary ───────────────────────────────────────────────────

var staticGlyphData = []GlyphInfo{
	// Ina ni Surat (base characters)
	{Type: "ina", Latin: "a",   Glyph: "\u1BC0", UnicodeHex: "U+1BC0", Description: "Karakter induk A — vokal murni"},
	{Type: "ina", Latin: "ha",  Glyph: "\u1BC2", UnicodeHex: "U+1BC2", Description: "Karakter induk HA"},
	{Type: "ina", Latin: "ba",  Glyph: "\u1BC5", UnicodeHex: "U+1BC5", Description: "Karakter induk BA"},
	{Type: "ina", Latin: "pa",  Glyph: "\u1BC7", UnicodeHex: "U+1BC7", Description: "Karakter induk PA"},
	{Type: "ina", Latin: "na",  Glyph: "\u1BC9", UnicodeHex: "U+1BC9", Description: "Karakter induk NA"},
	{Type: "ina", Latin: "wa",  Glyph: "\u1BDE", UnicodeHex: "U+1BDE", Description: "Karakter induk WA"},
	{Type: "ina", Latin: "ga",  Glyph: "\u1BCE", UnicodeHex: "U+1BCE", Description: "Karakter induk GA"},
	{Type: "ina", Latin: "ja",  Glyph: "\u1BD0", UnicodeHex: "U+1BD0", Description: "Karakter induk JA"},
	{Type: "ina", Latin: "da",  Glyph: "\u1BD1", UnicodeHex: "U+1BD1", Description: "Karakter induk DA"},
	{Type: "ina", Latin: "ra",  Glyph: "\u1BD2", UnicodeHex: "U+1BD2", Description: "Karakter induk RA"},
	{Type: "ina", Latin: "ma",  Glyph: "\u1BD4", UnicodeHex: "U+1BD4", Description: "Karakter induk MA"},
	{Type: "ina", Latin: "ta",  Glyph: "\u1BD6", UnicodeHex: "U+1BD6", Description: "Karakter induk TA"},
	{Type: "ina", Latin: "sa",  Glyph: "\u1BD8", UnicodeHex: "U+1BD8", Description: "Karakter induk SA"},
	{Type: "ina", Latin: "ya",  Glyph: "\u1BDB", UnicodeHex: "U+1BDB", Description: "Karakter induk YA"},
	{Type: "ina", Latin: "nga", Glyph: "\u1BDD", UnicodeHex: "U+1BDD", Description: "Karakter induk NGA"},
	{Type: "ina", Latin: "nya", Glyph: "\u1BE0", UnicodeHex: "U+1BE0", Description: "Karakter induk NYA"},
	{Type: "ina", Latin: "ca",  Glyph: "\u1BE1", UnicodeHex: "U+1BE1", Description: "Karakter induk CA"},
	{Type: "ina", Latin: "i",   Glyph: "\u1BE4", UnicodeHex: "U+1BE4", Description: "Vokal mandiri I (depan kata)"},
	{Type: "ina", Latin: "u",   Glyph: "\u1BE5", UnicodeHex: "U+1BE5", Description: "Vokal mandiri U (depan kata)"},
	// Anak ni Surat (diacritics)
	{Type: "anak", Latin: "-i",  Glyph: "\u1BEA", UnicodeHex: "U+1BEA", Description: "Haborotan — mengubah vokal menjadi /i/"},
	{Type: "anak", Latin: "-u",  Glyph: "\u1BEE", UnicodeHex: "U+1BEE", Description: "Sihorhor — mengubah vokal menjadi /u/"},
	{Type: "anak", Latin: "-e",  Glyph: "\u1BE9", UnicodeHex: "U+1BE9", Description: "Hatadingan — mengubah vokal menjadi /e/"},
	{Type: "anak", Latin: "-o",  Glyph: "\u1BEB", UnicodeHex: "U+1BEB", Description: "Hatalingan — mengubah vokal menjadi /o/"},
	{Type: "anak", Latin: "∅",   Glyph: "\u1BF2", UnicodeHex: "U+1BF2", Description: "Pangolat — virama, mematikan vokal /a/ inheren"},
	{Type: "anak", Latin: "-ng", Glyph: "\u1BF0", UnicodeHex: "U+1BF0", Description: "Hamisaran — penanda sengau /ng/ di akhir suku kata"},
}

