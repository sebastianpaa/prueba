function mostrarInicio() {
  document.getElementById("contenidoPrincipal").innerHTML = `
    <h2>Inicio</h2>
    <p>Bienvenido a la página de inicio.</p>
  `;
}

function mostrarEncriptador() {
  document.getElementById("contenidoPrincipal").innerHTML = `
    <h2>Encriptador AES-GCM (Base64)</h2>

    <label for="clave">Clave secreta:</label>
    <input type="password" id="clave" placeholder="Escribe una clave..." />

    <label for="texto">Texto (original o encriptado):</label>
    <textarea
    id="texto"
    placeholder="Texto para encriptar o desencriptar..."
    ></textarea>

    <button onclick="encriptarAES()">Encriptar</button>
    <button onclick="desencriptarAES()">Desencriptar</button>

    <div id="resultado"></div>
  `;
}

function mostrarAcercaDe() {
  document.getElementById("contenidoPrincipal").innerHTML = `
    <h2>Acerca de</h2>
    <p>Esta es una pagina de prueba creada por Cristian Pino</p>
  `;
}

//  aqui esta el codigo del encriptador ***************************
function base64Encode(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let byte of uint8Array) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64Decode(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getKeyFromPassword(password) {
  const encoder = new TextEncoder();
  const salt = encoder.encode("sal-secreta");
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encriptarAES() {
  const texto = document.getElementById("texto").value;
  const clave = document.getElementById("clave").value;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPassword(clave);
  const encoded = new TextEncoder().encode(texto);

  const cifrado = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // Unir IV + cifrado para enviarlo todo junto
  const combinado = new Uint8Array(iv.length + cifrado.byteLength);
  combinado.set(iv, 0);
  combinado.set(new Uint8Array(cifrado), iv.length);

  const base64 = base64Encode(combinado.buffer);

  document.getElementById("resultado").innerHTML =
    "🔐 Encriptado (Base64):<br>" + base64;
}

async function desencriptarAES() {
  const base64 = document.getElementById("texto").value;
  const clave = document.getElementById("clave").value;

  try {
    const combinado = base64Decode(base64);
    const iv = combinado.slice(0, 12); // primeros 12 bytes: IV
    const datosCifrados = combinado.slice(12); // resto: datos cifrados

    const key = await getKeyFromPassword(clave);
    const descifrado = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      datosCifrados
    );

    const textoPlano = new TextDecoder().decode(descifrado);
    document.getElementById("resultado").innerHTML =
      "🔓 Desencriptado:<br>" + textoPlano;
  } catch (e) {
    document.getElementById("resultado").innerHTML =
      "❌ Error al desencriptar. Verifica la clave o el texto.";
  }
}
