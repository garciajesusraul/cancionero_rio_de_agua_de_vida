// "Memoria entre compus": guarda cada charla (SOLO texto) en docs/sesiones/
// para que viaje por GitHub a la otra PC.
// Liviano a propósito: solo quién dijo qué. Sin archivos, sin salidas técnicas.
// Así otra PC/pestaña puede leer el historial sin trabarse.
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { execFileSync } from "node:child_process"

const CARPETA = "docs/sesiones"
const ESTADO = path.join(os.homedir(), ".config", "opencode", ".sesiones-vistas.json")

function leerEstado() {
  try {
    return JSON.parse(fs.readFileSync(ESTADO, "utf8"))
  } catch {
    return {}
  }
}

function guardarEstado(estado) {
  try {
    fs.mkdirSync(path.dirname(ESTADO), { recursive: true })
    fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 2))
  } catch {
    // Si no se puede guardar el estado, no pasa nada: solo repetirá un aviso.
  }
}

function slug(texto) {
  return (texto || "charla")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "charla"
}

function fechaCorta() {
  const f = new Date()
  const p = (n) => String(n).padStart(2, "0")
  return `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}_${p(f.getHours())}-${p(f.getMinutes())}`
}

// Extrae SOLO el texto. Ignora archivos, herramientas y datos pesados.
function soloTexto(respuesta) {
  const lista = respuesta?.data ?? respuesta ?? []
  const lineas = []
  for (const m of lista) {
    const rol = m?.info?.role === "user" ? "VOS" : "OPENCODE"
    for (const parte of m?.parts ?? []) {
      if (parte?.type === "text" && parte?.text && parte.text.trim()) {
        lineas.push(`## ${rol}\n\n${parte.text.trim()}\n`)
      }
    }
  }
  return lineas.join("\n")
}

function actualizarIndice(carpeta, archivos) {
  const lineas = [
    "# Índice de charlas del proyecto",
    "",
    "Cada archivo es una charla guardada solo en texto. Sirven para retomar el trabajo en otra PC sin tener que explicar todo de nuevo.",
    "",
  ]
  for (const a of archivos) lineas.push(`- ${a}`)
  lineas.push("")
  try {
    fs.writeFileSync(path.join(carpeta, "INDICE.md"), lineas.join("\n"))
  } catch {
    // No crítico.
  }
}

// Copia tus reglas de hablar simple a la memoria principal de la nueva compu, solo la primera vez.
// No lo hace en cada push/pull: si ya están, no toca nada.
function instalarReglasUnaVez(raiz) {
  try {
    const plantilla = path.join(raiz, ".opencode", "config-plantilla", "AGENTS.md")
    if (!fs.existsSync(plantilla)) return
    const textoPlantilla = fs.readFileSync(plantilla, "utf8")
    if (!textoPlantilla.trim()) return

    const destino = path.join(os.homedir(), ".config", "opencode", "AGENTS.md")
    let necesitaCopiar = false
    if (!fs.existsSync(destino)) {
      necesitaCopiar = true
    } else {
      const actual = fs.readFileSync(destino, "utf8")
      // Si ya contiene tu marca y es igual, no tocar. Si no la tiene, copiar.
      if (actual.trim() === textoPlantilla.trim()) {
        necesitaCopiar = false
      } else if (!actual.includes("El usuario NO es programador")) {
        necesitaCopiar = true
      } else {
        // Ya está instalado, aunque con otro contenido levemente distinto: no pisar.
        necesitaCopiar = false
      }
    }
    if (necesitaCopiar) {
      fs.mkdirSync(path.dirname(destino), { recursive: true })
      fs.writeFileSync(destino, textoPlantilla)
    }

    // Asegurar que el config global apunte a AGENTS.md (solo si falta)
    const cfgJsonc = path.join(os.homedir(), ".config", "opencode", "opencode.jsonc")
    const cfgJson = path.join(os.homedir(), ".config", "opencode", "opencode.json")
    let cfgPath = null
    if (fs.existsSync(cfgJsonc)) cfgPath = cfgJsonc
    else if (fs.existsSync(cfgJson)) cfgPath = cfgJson
    if (!cfgPath) return
    let raw = fs.readFileSync(cfgPath, "utf8")
    if (raw.includes("AGENTS.md")) return
    // Insertar instructions si no existe
    if (raw.includes('"instructions"')) {
      // ya tiene instructions pero sin AGENTS.md, añadirlo
      raw = raw.replace(/"instructions"\s*:\s*\[/, '"instructions": ["AGENTS.md", ')
      fs.writeFileSync(cfgPath, raw)
    } else {
      // Usar función para evitar que $ en "$schema" se interprete como variable especial
      if (raw.includes('"$schema"')) {
        raw = raw.replace('"$schema"', () => '"instructions": ["AGENTS.md"],\n  "$schema"')
      }
      // fallback si no hay $schema
      if (!raw.includes('"instructions"')) {
        raw = raw.replace("{", () => '{\n  "instructions": ["AGENTS.md"],')
      }
      fs.writeFileSync(cfgPath, raw)
    }
  } catch {
    // Nunca debe romper el inicio del proyecto.
  }
}

export const MemoriaEntreCompus = async ({ client, directory }) => {
  const raiz = directory

  async function guardar(idSesion) {
    try {
      const mensajes = await client.session.messages({ path: { id: idSesion } })
      const texto = soloTexto(mensajes)
      if (!texto.trim()) return

      let titulo = "charla"
      try {
        const s = await client.session.get({ path: { id: idSesion } })
        titulo = s?.data?.title ?? s?.title ?? "charla"
      } catch {
        // Sin título, igual se guarda.
      }

      const carpeta = path.join(raiz, CARPETA)
      fs.mkdirSync(carpeta, { recursive: true })

      // Si esta sesión ya tiene archivo, se actualiza (no se duplica).
      const corto = String(idSesion).slice(-6)
      const existentes = fs.readdirSync(carpeta).filter((f) => f.endsWith(`_${corto}.md`))
      const nombre = existentes[0] ?? `${fechaCorta()}_${slug(titulo)}_${corto}.md`
      const ruta = path.join(carpeta, nombre)

      const contenido =
        `# Charla del proyecto (guardado automático)\n\n` +
        `- Fecha: ${new Date().toLocaleString("es-UY")}\n` +
        `- Sesión: ${idSesion}\n\n---\n\n${texto}`

      const anterior = fs.existsSync(ruta) ? fs.readFileSync(ruta, "utf8") : ""
      if (anterior !== contenido) {
        fs.writeFileSync(ruta, contenido)
        const archivos = fs
          .readdirSync(carpeta)
          .filter((f) => f.endsWith(".md") && f !== "LEEME.md" && f !== "INDICE.md")
          .sort()
        actualizarIndice(carpeta, archivos)
        // Se deja listo para el próximo commit/push, así viaja a la otra PC.
        try {
          execFileSync("git", ["add", CARPETA], { cwd: raiz, stdio: "ignore" })
        } catch {
          // Si git falla, el archivo igual queda guardado.
        }
        const estado = leerEstado()
        if (!estado[raiz]) estado[raiz] = {}
        estado[raiz][nombre] = true
        guardarEstado(estado)
        try {
          await client.tui.showToast({
            body: { message: "Memoria entre compus: charla guardada. Con el próximo push viaja a la otra PC.", variant: "success" },
          })
        } catch {
          // El toast es solo un aviso visual, no es crítico.
        }
      }
    } catch (e) {
      try {
        await client.app.log({
          body: { service: "memoria-entre-compus", level: "warn", message: "No pude guardar la charla: " + String(e?.message ?? e) },
        })
      } catch {
        // Silencio total: nunca debe molestar ni romper la sesión.
      }
    }
  }

  async function avisarNuevas() {
    try {
      const carpeta = path.join(raiz, CARPETA)
      if (!fs.existsSync(carpeta)) return
      const archivos = fs
        .readdirSync(carpeta)
        .filter((f) => f.endsWith(".md") && f !== "LEEME.md" && f !== "INDICE.md")
        .sort()
      const vistos = leerEstado()[raiz] ?? {}
      const nuevos = archivos.filter((f) => !vistos[f])
      if (nuevos.length > 0) {
        try {
          await client.tui.showToast({
            body: {
              message: `Memoria entre compus: bajaron ${nuevos.length} charla(s) de GitHub. Escribime "ponete al día" y las leo.`,
              variant: "info",
            },
          })
        } catch {
          // Aviso visual opcional.
        }
      }
    } catch {
      // Nunca romper el arranque.
    }
  }

  return {
    event: async ({ event }) => {
      try {
        // Cada vez que la sesión descansa, se guarda la charla (solo texto).
        if (event.type === "session.idle") {
          const p = event.properties ?? {}
          let id = p.sessionID ?? p.sessionId ?? p.session_id ?? p.id
          if (!id) {
            try {
              const lista = await client.session.list()
              const sesiones = lista?.data ?? lista ?? []
              if (sesiones.length > 0) id = sesiones[0]?.id
            } catch {
              // Sin id no se puede guardar esta vez; ya será en la próxima.
            }
          }
          if (id) await guardar(String(id))
        }
        // Al abrir el proyecto, instala tus reglas solo la primera vez y avisa si bajaron charlas nuevas.
        if (event.type === "server.connected") {
          instalarReglasUnaVez(raiz)
          await avisarNuevas()
        }
      } catch {
        // El plugin nunca debe interrumpir tu trabajo.
      }
    },
  }
}
