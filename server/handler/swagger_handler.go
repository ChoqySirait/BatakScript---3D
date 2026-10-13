package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SwaggerDocJSON contains OpenAPI 3.0 specification for BatakScript 3D backend.
const SwaggerDocJSON = `{
  "openapi": "3.0.0",
  "info": {
    "title": "BatakScript 3D API",
    "version": "1.0.0",
    "description": "API RESTful untuk pembelajaran interaktif Surat Batak Toba, kaligrafi tracing, transliterasi otomatis, dan manajemen progres."
  },
  "servers": [
    {
      "url": "http://localhost:8080/api/v1",
      "description": "Local Development Server"
    }
  ],
  "paths": {
    "/health": {
      "get": {
        "summary": "Health check service",
        "responses": {
          "200": {
            "description": "Service running status",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string", "example": "ok" },
                    "service": { "type": "string", "example": "batakscript-backend" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/glyphs": {
      "get": {
        "summary": "Daftar seluruh glyph (Ina & Anak ni Surat)",
        "responses": {
          "200": {
            "description": "Kamus lengkap glyph Batak Toba"
          }
        }
      }
    },
    "/lessons": {
      "get": {
        "summary": "Daftar materi kurikulum 19 Ina ni Surat",
        "responses": {
          "200": {
            "description": "Daftar lesson dengan target glyph dan metadata"
          }
        }
      }
    },
    "/transliterate": {
      "post": {
        "summary": "Transliterasi Latin ke Surat Batak Toba",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["text"],
                "properties": {
                  "text": { "type": "string", "example": "horas batak toba" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Hasil transliterasi Unicode dan tokenisasi silabel"
          }
        }
      }
    },
    "/progress": {
      "post": {
        "summary": "Simpan akurasi tracing dan cek kelayakan modul berikutnya",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["session_id", "lesson_id", "accuracy"],
                "properties": {
                  "session_id": { "type": "string", "example": "session-uuid" },
                  "lesson_id": { "type": "integer", "example": 1 },
                  "accuracy": { "type": "number", "example": 88.5 }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Hasil evaluasi dan status unlock lesson selanjutnya"
          }
        }
      }
    },
    "/progress/{session_id}": {
      "get": {
        "summary": "Ambil rekam jejak progres berdasarkan session ID",
        "parameters": [
          {
            "name": "session_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Daftar progress pengguna"
          }
        }
      }
    }
  }
}`

const swaggerUIHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BatakScript 3D - API Documentation (Swagger UI)</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0D0D0E; font-family: sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .information-container { padding: 20px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/swagger/doc.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`

// SwaggerUI serves the HTML page at /swagger
func SwaggerUI(c *gin.Context) {
	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, swaggerUIHTML)
}

// SwaggerDoc serves the OpenAPI 3.0 JSON spec at /swagger/doc.json
func SwaggerDoc(c *gin.Context) {
	c.Header("Content-Type", "application/json; charset=utf-8")
	c.String(http.StatusOK, SwaggerDocJSON)
}
